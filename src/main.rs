use std::{
    collections::HashMap,
    env,
    net::{IpAddr, SocketAddr},
    path::Path,
    sync::Arc,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use axum::{
    body::Body,
    extract::{ConnectInfo, Path as AxumPath, Request, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, FromRow, SqlitePool};
use tokio::signal;
use tower_http::{
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::{info, warn};

const BUILD_SHA: &str = match option_env!("BUILD_SHA") {
    Some(value) => value,
    None => "dev",
};
const FREE_CAPACITY: i64 = 10;
const PAID_CAPACITY: i64 = 30;
const ROOM_TTL_SECONDS: i64 = 24 * 60 * 60;
const DEMO_TTL_SECONDS: i64 = 2 * 60 * 60;
// The factory deployment attaches this one user-assigned identity to every product container.
// Client IDs are public identifiers, not credentials; the platform issues the actual short-lived token.
const FACTORY_RUNTIME_IDENTITY_CLIENT_ID: &str = "ba10d5bc-6375-4325-8892-4c7a5be500ca";

#[derive(Clone)]
struct AppState {
    store: Store,
    rate: Arc<tokio::sync::Mutex<HashMap<String, RateWindow>>>,
    billing_base: String,
}

#[derive(Clone)]
enum Store {
    Sqlite(SqlitePool),
    Blob(BlobStore),
}

#[derive(Clone)]
struct BlobStore {
    client: reqwest::Client,
    base_url: String,
    container: String,
    identity_endpoint: String,
    identity_header: String,
    access_token: Arc<tokio::sync::Mutex<Option<BlobAccessToken>>>,
}

#[derive(Clone)]
struct BlobAccessToken {
    value: String,
    expires_at: i64,
}

#[derive(Deserialize)]
struct ManagedIdentityResponse {
    access_token: String,
    expires_on: String,
}

struct RateWindow {
    started: Instant,
    count: u32,
}

#[derive(Debug, Serialize)]
struct ApiError {
    error: &'static str,
    message: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = match self.error {
            "not_found" => StatusCode::NOT_FOUND,
            "room_full" => StatusCode::CONFLICT,
            "forbidden" => StatusCode::FORBIDDEN,
            "expired" => StatusCode::GONE,
            "server_error" => StatusCode::INTERNAL_SERVER_ERROR,
            _ => StatusCode::BAD_REQUEST,
        };
        (status, Json(self)).into_response()
    }
}

fn api_error(error: &'static str, message: impl Into<String>) -> ApiError {
    ApiError {
        error,
        message: message.into(),
    }
}

#[derive(Deserialize)]
struct CreateRoom {
    title: String,
    instructions: String,
    html: String,
    css: String,
    javascript: String,
    license: Option<String>,
}

#[derive(Serialize)]
struct CreatedRoom {
    room: PublicRoom,
    teacher_token: String,
    paid_capacity: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
struct PublicRoom {
    id: String,
    title: String,
    instructions: String,
    html: String,
    css: String,
    javascript: String,
    capacity: i64,
    is_demo: bool,
    expires_at: i64,
}

#[derive(Deserialize)]
struct JoinRoom {
    name: String,
}

#[derive(Serialize)]
struct JoinedRoom {
    participant: Participant,
    learner_token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
struct Participant {
    id: String,
    name: String,
    status: String,
    joined_at: i64,
    updated_at: i64,
}

#[derive(Deserialize)]
struct ProgressUpdate {
    learner_token: String,
    status: String,
}

#[derive(Serialize)]
struct ProgressResponse {
    participants: Vec<TeacherParticipant>,
    counts: ProgressCounts,
}

#[derive(Serialize)]
struct TeacherParticipant {
    name: String,
    status: String,
}

#[derive(Serialize)]
struct ProgressCounts {
    joined: usize,
    ran: usize,
    done: usize,
}

#[derive(Serialize)]
struct DemoRoom {
    room: PublicRoom,
    teacher_token: String,
}

#[derive(Clone, Serialize, Deserialize)]
struct StoredRoom {
    #[serde(flatten)]
    room: PublicRoom,
    teacher_token: String,
}

#[derive(Clone, Serialize, Deserialize)]
struct StoredParticipant {
    #[serde(flatten)]
    participant: Participant,
    learner_token: String,
}

#[derive(Deserialize)]
struct LicenseVerdict {
    valid: bool,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("lesson_code_room=info".parse().unwrap()),
        )
        .init();

    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(8080);
    let static_dir = env::var("STATIC_DIR").unwrap_or_else(|_| "dist".to_string());
    let billing_base =
        env::var("BILLING_BASE_URL").unwrap_or_else(|_| "https://api.sociobot.in".to_string());

    let (store, storage_config) = connect_store().await;
    purge_expired(&store).await;
    let cleanup_store = store.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(15 * 60));
        loop {
            interval.tick().await;
            purge_expired(&cleanup_store).await;
        }
    });
    let state = AppState {
        store,
        rate: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
        billing_base,
    };
    let app = build_app(state, &static_dir);
    let address = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(address)
        .await
        .expect("bind server");

    info!(
        port,
        build_sha = BUILD_SHA,
        storage_config,
        "lesson-code-room started"
    );
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .expect("serve app");
}

async fn connect_store() -> (Store, &'static str) {
    if let Ok(database_url) = env::var("DATABASE_URL") {
        let db = connect_sqlite(&database_url).await;
        return (Store::Sqlite(db), "supplied SQLite URL (local/test)");
    }
    match (env::var("IDENTITY_ENDPOINT"), env::var("IDENTITY_HEADER")) {
        (Ok(identity_endpoint), Ok(identity_header)) => {
            let store = BlobStore::new(identity_endpoint, identity_header)
                .await
                .expect("connect shared Azure Blob storage");
            (
                Store::Blob(store),
                "managed-identity Azure Blob storage (shared)",
            )
        }
        _ => {
            // A developer running the binary outside Azure still gets a useful local room.
            let db = connect_sqlite("sqlite://data/lesson-code-room.db").await;
            (
                Store::Sqlite(db),
                "local SQLite fallback (no managed identity)",
            )
        }
    }
}

async fn connect_sqlite(database_url: &str) -> SqlitePool {
    if let Some(path) = database_url.strip_prefix("sqlite://") {
        if let Some(parent) = Path::new(path).parent() {
            std::fs::create_dir_all(parent).expect("create database directory");
        }
        if !Path::new(path).exists() {
            std::fs::File::create(path).expect("create sqlite database");
        }
    }
    let db = SqlitePoolOptions::new()
        .max_connections(8)
        .connect(database_url)
        .await
        .expect("connect sqlite");
    sqlx::migrate!()
        .run(&db)
        .await
        .expect("run database migrations");
    db
}

impl BlobStore {
    async fn new(identity_endpoint: String, identity_header: String) -> Result<Self, ApiError> {
        let store = Self {
            client: reqwest::Client::new(),
            base_url: "https://sociobotblob.blob.core.windows.net".to_string(),
            container: "lesson-code-room".to_string(),
            identity_endpoint,
            identity_header,
            access_token: Arc::new(tokio::sync::Mutex::new(None)),
        };
        store.ensure_container().await?;
        Ok(store)
    }

    async fn token(&self) -> Result<String, ApiError> {
        if let Some(token) = self.access_token.lock().await.clone() {
            if token.expires_at > unix_time() + 60 {
                return Ok(token.value);
            }
        }
        let response = self
            .client
            .get(&self.identity_endpoint)
            .query(&[
                ("api-version", "2019-08-01"),
                ("resource", "https://storage.azure.com/"),
                ("client_id", FACTORY_RUNTIME_IDENTITY_CLIENT_ID),
            ])
            .header("X-IDENTITY-HEADER", &self.identity_header)
            .send()
            .await
            .map_err(blob_error)?;
        if !response.status().is_success() {
            warn!(status = %response.status(), "managed identity token request failed");
            return Err(api_error(
                "server_error",
                "Shared room storage is unavailable. Try again.",
            ));
        }
        let token = response
            .json::<ManagedIdentityResponse>()
            .await
            .map_err(blob_error)?;
        let expires_at = token
            .expires_on
            .parse::<i64>()
            .unwrap_or_else(|_| unix_time() + 300);
        *self.access_token.lock().await = Some(BlobAccessToken {
            value: token.access_token.clone(),
            expires_at,
        });
        Ok(token.access_token)
    }

    fn url(&self, path: &str) -> String {
        format!("{}/{}/{}", self.base_url, self.container, path)
    }

    async fn request(
        &self,
        method: reqwest::Method,
        path: &str,
        query: &[(&str, &str)],
    ) -> Result<reqwest::RequestBuilder, ApiError> {
        let token = self.token().await?;
        Ok(self
            .client
            .request(method, self.url(path))
            .query(query)
            .header("authorization", format!("Bearer {token}"))
            .header("x-ms-date", httpdate::fmt_http_date(SystemTime::now()))
            .header("x-ms-version", "2023-11-03"))
    }

    async fn ensure_container(&self) -> Result<(), ApiError> {
        let response = self
            .request(reqwest::Method::PUT, "", &[("restype", "container")])
            .await?
            .header(header::CONTENT_LENGTH, "0")
            .body(Vec::new())
            .send()
            .await
            .map_err(blob_error)?;
        if response.status().is_success() || response.status() == reqwest::StatusCode::CONFLICT {
            Ok(())
        } else {
            warn!(status = %response.status(), "could not create shared room container");
            Err(api_error(
                "server_error",
                "Shared room storage is unavailable. Try again.",
            ))
        }
    }

    async fn get<T: for<'de> Deserialize<'de>>(&self, path: &str) -> Result<Option<T>, ApiError> {
        let response = self
            .request(reqwest::Method::GET, path, &[])
            .await?
            .send()
            .await
            .map_err(blob_error)?;
        if response.status() == reqwest::StatusCode::NOT_FOUND {
            return Ok(None);
        }
        if !response.status().is_success() {
            return Err(blob_status_error(response.status()));
        }
        response.json::<T>().await.map(Some).map_err(blob_error)
    }

    async fn put<T: Serialize>(
        &self,
        path: &str,
        value: &T,
        only_if_new: bool,
    ) -> Result<bool, ApiError> {
        let bytes = serde_json::to_vec(value)
            .map_err(|_| api_error("server_error", "The room could not be updated. Try again."))?;
        let mut request = self
            .request(reqwest::Method::PUT, path, &[])
            .await?
            .header("x-ms-blob-type", "BlockBlob")
            .header(header::CONTENT_TYPE, "application/json")
            .body(bytes);
        if only_if_new {
            request = request.header("if-none-match", "*");
        }
        let response = request.send().await.map_err(blob_error)?;
        if response.status().is_success() {
            Ok(true)
        } else if response.status() == reqwest::StatusCode::PRECONDITION_FAILED {
            Ok(false)
        } else {
            Err(blob_status_error(response.status()))
        }
    }

    async fn list(&self, prefix: &str) -> Result<Vec<String>, ApiError> {
        let response = self
            .request(
                reqwest::Method::GET,
                "",
                &[
                    ("restype", "container"),
                    ("comp", "list"),
                    ("prefix", prefix),
                ],
            )
            .await?
            .send()
            .await
            .map_err(blob_error)?;
        if !response.status().is_success() {
            return Err(blob_status_error(response.status()));
        }
        let body = response.text().await.map_err(blob_error)?;
        Ok(extract_blob_names(&body))
    }

    async fn delete(&self, path: &str) -> Result<(), ApiError> {
        let response = self
            .request(reqwest::Method::DELETE, path, &[])
            .await?
            .send()
            .await
            .map_err(blob_error)?;
        if response.status().is_success() || response.status() == reqwest::StatusCode::NOT_FOUND {
            Ok(())
        } else {
            Err(blob_status_error(response.status()))
        }
    }

    async fn acquire_room_lease(&self, room_id: &str) -> Result<String, ApiError> {
        for attempt in 0..30 {
            let response = self
                .request(
                    reqwest::Method::PUT,
                    &room_blob_path(room_id),
                    &[("comp", "lease")],
                )
                .await?
                .header("x-ms-lease-action", "acquire")
                .header("x-ms-lease-duration", "15")
                .header(header::CONTENT_LENGTH, "0")
                .body(Vec::new())
                .send()
                .await
                .map_err(blob_error)?;
            if response.status().is_success() {
                return response
                    .headers()
                    .get("x-ms-lease-id")
                    .and_then(|value| value.to_str().ok())
                    .map(str::to_string)
                    .ok_or_else(|| {
                        api_error("server_error", "The room could not be updated. Try again.")
                    });
            }
            if response.status() != reqwest::StatusCode::CONFLICT {
                return Err(blob_status_error(response.status()));
            }
            tokio::time::sleep(Duration::from_millis(100 + attempt * 25)).await;
        }
        Err(api_error("server_error", "The room is busy. Try again."))
    }

    async fn release_room_lease(&self, room_id: &str, lease_id: &str) {
        if let Ok(request) = self
            .request(
                reqwest::Method::PUT,
                &room_blob_path(room_id),
                &[("comp", "lease")],
            )
            .await
        {
            if let Err(error) = request
                .header("x-ms-lease-action", "release")
                .header("x-ms-lease-id", lease_id)
                .header(header::CONTENT_LENGTH, "0")
                .body(Vec::new())
                .send()
                .await
            {
                warn!(%error, "could not release room lease");
            }
        }
    }
}

fn room_blob_path(room_id: &str) -> String {
    format!("rooms/{room_id}.json")
}

fn participant_blob_path(room_id: &str, participant_id: &str) -> String {
    format!("rooms/{room_id}/participants/{participant_id}.json")
}

fn extract_blob_names(xml: &str) -> Vec<String> {
    xml.match_indices("<Name>")
        .filter_map(|(start, _)| {
            let value_start = start + "<Name>".len();
            xml[value_start..]
                .find("</Name>")
                .map(|end| xml[value_start..value_start + end].to_string())
        })
        .collect()
}

fn blob_error(error: reqwest::Error) -> ApiError {
    warn!(%error, "shared blob storage request failed");
    api_error(
        "server_error",
        "Shared room storage is unavailable. Try again.",
    )
}

fn blob_status_error(status: reqwest::StatusCode) -> ApiError {
    warn!(%status, "shared blob storage returned an error");
    api_error("server_error", "The room could not be updated. Try again.")
}

fn build_app(state: AppState, static_dir: &str) -> Router {
    let api = Router::new()
        .route("/rooms", post(create_room))
        .route("/rooms/{id}", get(get_room))
        .route("/rooms/{id}/join", post(join_room))
        .route(
            "/rooms/{id}/progress",
            get(get_progress).post(update_progress),
        )
        .route("/demo", post(create_demo))
        .route_layer(middleware::from_fn_with_state(state.clone(), rate_limit));

    let index_file = format!("{static_dir}/index.html");
    let fallback = ServeDir::new(static_dir).not_found_service(ServeFile::new(&index_file));
    Router::new()
        .route("/health", get(health))
        .nest("/api", api)
        .route_service("/demo", ServeFile::new(&index_file))
        .route_service("/privacy", ServeFile::new(&index_file))
        .route_service("/terms", ServeFile::new(&index_file))
        .route_service("/room/{id}", ServeFile::new(&index_file))
        .route_service("/teach/{id}", ServeFile::new(&index_file))
        .fallback_service(fallback)
        .layer(middleware::from_fn(security_headers))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({"ok": true, "build_sha": BUILD_SHA}))
}

async fn create_room(
    State(state): State<AppState>,
    Json(input): Json<CreateRoom>,
) -> Result<Json<CreatedRoom>, ApiError> {
    validate_room(&input)?;
    purge_expired(&state.store).await;
    let licensed = match input.license.as_deref() {
        Some(token) if !token.trim().is_empty() => verify_license(&state, token.trim()).await,
        _ => false,
    };
    let room = insert_room(&state.store, input, licensed, false).await?;
    let teacher_token = get_teacher_token(&state.store, &room.id).await?;
    Ok(Json(CreatedRoom {
        room,
        teacher_token,
        paid_capacity: licensed,
    }))
}

async fn get_room(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<String>,
) -> Result<Json<PublicRoom>, ApiError> {
    Ok(Json(
        find_room(&state.store, &normalize_room_id(&id)).await?,
    ))
}

async fn join_room(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<String>,
    Json(input): Json<JoinRoom>,
) -> Result<Json<JoinedRoom>, ApiError> {
    let room_id = normalize_room_id(&id);
    let room = find_room(&state.store, &room_id).await?;
    let name = input.name.trim();
    if name.is_empty() || name.chars().count() > 24 {
        return Err(api_error(
            "invalid_name",
            "Use a screen name from 1 to 24 characters.",
        ));
    }
    let id = random_token(9);
    let learner_token = random_token(24);
    let now = unix_time();
    let participant = Participant {
        id,
        name: name.to_string(),
        status: "joined".to_string(),
        joined_at: now,
        updated_at: now,
    };
    add_participant(
        &state.store,
        &room,
        participant.clone(),
        learner_token.clone(),
    )
    .await?;
    Ok(Json(JoinedRoom {
        participant,
        learner_token,
    }))
}

async fn update_progress(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<String>,
    Json(input): Json<ProgressUpdate>,
) -> Result<Json<Participant>, ApiError> {
    let room_id = normalize_room_id(&id);
    find_room(&state.store, &room_id).await?;
    if !matches!(input.status.as_str(), "ran" | "done") {
        return Err(api_error(
            "invalid_status",
            "Progress must be Ran code or Done.",
        ));
    }
    let now = unix_time();
    let participant = update_participant(
        &state.store,
        &room_id,
        &input.learner_token,
        &input.status,
        now,
    )
    .await?;
    Ok(Json(participant))
}

async fn get_progress(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<String>,
    headers: HeaderMap,
) -> Result<Json<ProgressResponse>, ApiError> {
    let room_id = normalize_room_id(&id);
    let expected = get_teacher_token(&state.store, &room_id).await?;
    let supplied = headers
        .get("x-teacher-token")
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default();
    if !constant_time_eq(expected.as_bytes(), supplied.as_bytes()) {
        return Err(api_error(
            "forbidden",
            "The teacher link is not valid for this room.",
        ));
    }
    let participants = list_participants(&state.store, &room_id).await?;
    let counts = ProgressCounts {
        joined: participants.iter().filter(|p| p.status == "joined").count(),
        ran: participants.iter().filter(|p| p.status == "ran").count(),
        done: participants.iter().filter(|p| p.status == "done").count(),
    };
    let participants = participants
        .into_iter()
        .map(|participant| TeacherParticipant {
            name: participant.name,
            status: participant.status,
        })
        .collect();
    Ok(Json(ProgressResponse {
        participants,
        counts,
    }))
}

async fn create_demo(State(state): State<AppState>) -> Result<Json<DemoRoom>, ApiError> {
    purge_expired(&state.store).await;
    let input = CreateRoom {
        title: "Make the night sky respond".to_string(),
        instructions: "Change the button label and add one more star. Run the page, then mark yourself done when it looks right.".to_string(),
        html: "<main class=\"sky-card\">\n  <p class=\"eyebrow\">Tonight's signal</p>\n  <h1>Good evening, coders.</h1>\n  <div id=\"stars\" aria-label=\"Three stars\">✦ ✦ ✦</div>\n  <button id=\"signal\">Send a signal</button>\n  <p id=\"reply\" aria-live=\"polite\"></p>\n</main>".to_string(),
        css: "body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07151f; color: #f7efd9; font: 18px system-ui; }\n.sky-card { width: min(32rem, 80vw); padding: 3rem; border: 1px solid #31576b; background: #102936; box-shadow: 0 24px 80px #0008; }\n.eyebrow { color: #8cdcb3; text-transform: uppercase; letter-spacing: .12em; }\n#stars { color: #ffc857; font-size: 2.5rem; letter-spacing: .35em; }\nbutton { min-height: 44px; margin-top: 1rem; padding: .6rem 1rem; border: 0; background: #ffc857; color: #201503; font-weight: 700; cursor: pointer; }".to_string(),
        javascript: "const button = document.querySelector('#signal');\nbutton.addEventListener('click', () => {\n  document.querySelector('#reply').textContent = 'Signal received.';\n});".to_string(),
        license: None,
    };
    let room = insert_room(&state.store, input, false, true).await?;
    let teacher_token = get_teacher_token(&state.store, &room.id).await?;
    let now = unix_time();
    for (index, (name, status)) in [
        ("Moss Finch", "done"),
        ("Blue Comet", "ran"),
        ("Quiet Fox", "joined"),
    ]
    .iter()
    .enumerate()
    {
        let participant = Participant {
            id: random_token(9),
            name: (*name).to_string(),
            status: (*status).to_string(),
            joined_at: now - 180 + index as i64 * 30,
            updated_at: now,
        };
        add_demo_participant(&state.store, &room.id, participant, random_token(24)).await?;
    }
    Ok(Json(DemoRoom {
        room,
        teacher_token,
    }))
}

async fn insert_room(
    store: &Store,
    input: CreateRoom,
    licensed: bool,
    demo: bool,
) -> Result<PublicRoom, ApiError> {
    match store {
        Store::Sqlite(db) => insert_room_sqlite(db, input, licensed, demo).await,
        Store::Blob(blob) => {
            let id = unique_room_id_blob(blob).await?;
            let now = unix_time();
            let room = PublicRoom {
                id: id.clone(),
                title: input.title.trim().to_string(),
                instructions: input.instructions.trim().to_string(),
                html: input.html,
                css: input.css,
                javascript: input.javascript,
                capacity: if licensed {
                    PAID_CAPACITY
                } else {
                    FREE_CAPACITY
                },
                is_demo: demo,
                expires_at: now
                    + if demo {
                        DEMO_TTL_SECONDS
                    } else {
                        ROOM_TTL_SECONDS
                    },
            };
            let stored = StoredRoom {
                room: room.clone(),
                teacher_token: random_token(32),
            };
            if blob.put(&room_blob_path(&id), &stored, true).await? {
                Ok(room)
            } else {
                Err(api_error(
                    "server_error",
                    "A room code could not be created. Try again.",
                ))
            }
        }
    }
}

async fn find_room(store: &Store, id: &str) -> Result<PublicRoom, ApiError> {
    match store {
        Store::Sqlite(db) => find_room_sqlite(db, id).await,
        Store::Blob(blob) => {
            let room = blob
                .get::<StoredRoom>(&room_blob_path(id))
                .await?
                .ok_or_else(|| {
                    api_error(
                        "not_found",
                        "This room does not exist. Check the six-letter room code.",
                    )
                })?;
            if room.room.expires_at <= unix_time() {
                return Err(api_error(
                    "expired",
                    "This room has expired. Ask the teacher to create a new room.",
                ));
            }
            Ok(room.room)
        }
    }
}

async fn get_teacher_token(store: &Store, id: &str) -> Result<String, ApiError> {
    match store {
        Store::Sqlite(db) => get_teacher_token_sqlite(db, id).await,
        Store::Blob(blob) => {
            let room = blob
                .get::<StoredRoom>(&room_blob_path(id))
                .await?
                .ok_or_else(|| {
                    api_error("not_found", "This room does not exist or has expired.")
                })?;
            if room.room.expires_at <= unix_time() {
                return Err(api_error(
                    "not_found",
                    "This room does not exist or has expired.",
                ));
            }
            Ok(room.teacher_token)
        }
    }
}

async fn unique_room_id_blob(blob: &BlobStore) -> Result<String, ApiError> {
    const LETTERS: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ";
    for _ in 0..8 {
        let mut bytes = [0u8; 6];
        rand::rng().fill_bytes(&mut bytes);
        let id: String = bytes
            .iter()
            .map(|value| LETTERS[*value as usize % LETTERS.len()] as char)
            .collect();
        if blob
            .get::<StoredRoom>(&room_blob_path(&id))
            .await?
            .is_none()
        {
            return Ok(id);
        }
    }
    Err(api_error(
        "server_error",
        "A room code could not be created. Try again.",
    ))
}

async fn list_participants(store: &Store, room_id: &str) -> Result<Vec<Participant>, ApiError> {
    match store {
        Store::Sqlite(db) => sqlx::query_as::<_, Participant>("SELECT id, name, status, joined_at, updated_at FROM participants WHERE room_id = ? ORDER BY joined_at ASC")
            .bind(room_id).fetch_all(db).await.map_err(db_error),
        Store::Blob(blob) => {
            let mut participants = Vec::new();
            for path in blob.list(&format!("rooms/{room_id}/participants/")).await? {
                if let Some(stored) = blob.get::<StoredParticipant>(&path).await? {
                    participants.push(stored.participant);
                }
            }
            participants.sort_by_key(|participant| participant.joined_at);
            Ok(participants)
        }
    }
}

async fn add_participant(
    store: &Store,
    room: &PublicRoom,
    participant: Participant,
    learner_token: String,
) -> Result<(), ApiError> {
    match store {
        Store::Sqlite(db) => {
            let inserted = sqlx::query("INSERT INTO participants (id, room_id, learner_token, name, status, joined_at, updated_at) SELECT ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM participants WHERE room_id = ?) < ?")
                .bind(&participant.id).bind(&room.id).bind(learner_token).bind(&participant.name).bind(&participant.status).bind(participant.joined_at).bind(participant.updated_at).bind(&room.id).bind(room.capacity)
                .execute(db).await.map_err(db_error)?;
            if inserted.rows_affected() == 0 {
                Err(api_error(
                    "room_full",
                    "This room is full. Ask the teacher to open another room.",
                ))
            } else {
                Ok(())
            }
        }
        Store::Blob(blob) => {
            let lease = blob.acquire_room_lease(&room.id).await?;
            let outcome = async {
                if list_participants(store, &room.id).await?.len() as i64 >= room.capacity {
                    return Err(api_error(
                        "room_full",
                        "This room is full. Ask the teacher to open another room.",
                    ));
                }
                let stored = StoredParticipant {
                    participant,
                    learner_token,
                };
                if blob
                    .put(
                        &participant_blob_path(&room.id, &stored.participant.id),
                        &stored,
                        true,
                    )
                    .await?
                {
                    Ok(())
                } else {
                    Err(api_error(
                        "server_error",
                        "The room could not be updated. Try again.",
                    ))
                }
            }
            .await;
            blob.release_room_lease(&room.id, &lease).await;
            outcome
        }
    }
}

async fn add_demo_participant(
    store: &Store,
    room_id: &str,
    participant: Participant,
    learner_token: String,
) -> Result<(), ApiError> {
    match store {
        Store::Sqlite(db) => {
            sqlx::query("INSERT INTO participants (id, room_id, learner_token, name, status, joined_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
                .bind(&participant.id).bind(room_id).bind(learner_token).bind(&participant.name).bind(&participant.status).bind(participant.joined_at).bind(participant.updated_at)
                .execute(db).await.map_err(db_error)?;
            Ok(())
        }
        Store::Blob(blob) => {
            let stored = StoredParticipant {
                participant,
                learner_token,
            };
            blob.put(
                &participant_blob_path(room_id, &stored.participant.id),
                &stored,
                true,
            )
            .await?;
            Ok(())
        }
    }
}

async fn update_participant(
    store: &Store,
    room_id: &str,
    learner_token: &str,
    status: &str,
    now: i64,
) -> Result<Participant, ApiError> {
    match store {
        Store::Sqlite(db) => {
            let result = sqlx::query("UPDATE participants SET status = ?, updated_at = ? WHERE room_id = ? AND learner_token = ?")
                .bind(status).bind(now).bind(room_id).bind(learner_token).execute(db).await.map_err(db_error)?;
            if result.rows_affected() == 0 {
                return Err(api_error(
                    "forbidden",
                    "This learner link is no longer active. Join the room again.",
                ));
            }
            sqlx::query_as::<_, Participant>("SELECT id, name, status, joined_at, updated_at FROM participants WHERE room_id = ? AND learner_token = ?")
                .bind(room_id).bind(learner_token).fetch_one(db).await.map_err(db_error)
        }
        Store::Blob(blob) => {
            for path in blob.list(&format!("rooms/{room_id}/participants/")).await? {
                if let Some(mut stored) = blob.get::<StoredParticipant>(&path).await? {
                    if constant_time_eq(stored.learner_token.as_bytes(), learner_token.as_bytes()) {
                        stored.participant.status = status.to_string();
                        stored.participant.updated_at = now;
                        blob.put(&path, &stored, false).await?;
                        return Ok(stored.participant);
                    }
                }
            }
            Err(api_error(
                "forbidden",
                "This learner link is no longer active. Join the room again.",
            ))
        }
    }
}

async fn insert_room_sqlite(
    db: &SqlitePool,
    input: CreateRoom,
    licensed: bool,
    demo: bool,
) -> Result<PublicRoom, ApiError> {
    let id = unique_room_id_sqlite(db).await?;
    let teacher_token = random_token(32);
    let now = unix_time();
    let ttl = if demo {
        DEMO_TTL_SECONDS
    } else {
        ROOM_TTL_SECONDS
    };
    let expires_at = now + ttl;
    let capacity = if licensed {
        PAID_CAPACITY
    } else {
        FREE_CAPACITY
    };
    sqlx::query("INSERT INTO rooms (id, teacher_token, title, instructions, html, css, javascript, capacity, is_demo, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(&id).bind(&teacher_token).bind(input.title.trim()).bind(input.instructions.trim()).bind(&input.html).bind(&input.css).bind(&input.javascript)
        .bind(capacity).bind(demo).bind(now).bind(expires_at).execute(db).await.map_err(db_error)?;
    Ok(PublicRoom {
        id,
        title: input.title.trim().to_string(),
        instructions: input.instructions.trim().to_string(),
        html: input.html,
        css: input.css,
        javascript: input.javascript,
        capacity,
        is_demo: demo,
        expires_at,
    })
}

async fn find_room_sqlite(db: &SqlitePool, id: &str) -> Result<PublicRoom, ApiError> {
    let room = sqlx::query_as::<_, PublicRoom>("SELECT id, title, instructions, html, css, javascript, capacity, is_demo, expires_at FROM rooms WHERE id = ?")
        .bind(id).fetch_optional(db).await.map_err(db_error)?
        .ok_or_else(|| api_error("not_found", "This room does not exist. Check the six-letter room code."))?;
    if room.expires_at <= unix_time() {
        return Err(api_error(
            "expired",
            "This room has expired. Ask the teacher to create a new room.",
        ));
    }
    Ok(room)
}

async fn get_teacher_token_sqlite(db: &SqlitePool, id: &str) -> Result<String, ApiError> {
    sqlx::query_scalar("SELECT teacher_token FROM rooms WHERE id = ? AND expires_at > ?")
        .bind(id)
        .bind(unix_time())
        .fetch_optional(db)
        .await
        .map_err(db_error)?
        .ok_or_else(|| api_error("not_found", "This room does not exist or has expired."))
}

async fn unique_room_id_sqlite(db: &SqlitePool) -> Result<String, ApiError> {
    const LETTERS: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ";
    for _ in 0..8 {
        let mut bytes = [0u8; 6];
        rand::rng().fill_bytes(&mut bytes);
        let id: String = bytes
            .iter()
            .map(|value| LETTERS[*value as usize % LETTERS.len()] as char)
            .collect();
        let exists: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM rooms WHERE id = ?")
            .bind(&id)
            .fetch_one(db)
            .await
            .map_err(db_error)?;
        if exists == 0 {
            return Ok(id);
        }
    }
    Err(api_error(
        "server_error",
        "A room code could not be created. Try again.",
    ))
}

async fn verify_license(state: &AppState, token: &str) -> bool {
    let url = format!(
        "{}/api/v1/products/lesson-code-room/verify",
        state.billing_base.trim_end_matches('/')
    );
    match reqwest::Client::new()
        .get(url)
        .query(&[("license", token)])
        .timeout(Duration::from_secs(4))
        .send()
        .await
    {
        Ok(response) if response.status().is_success() => response
            .json::<LicenseVerdict>()
            .await
            .map(|v| v.valid)
            .unwrap_or(false),
        Ok(response) => {
            warn!(status = %response.status(), "license verification failed");
            false
        }
        Err(error) => {
            warn!(%error, "license verification unavailable");
            false
        }
    }
}

fn validate_room(input: &CreateRoom) -> Result<(), ApiError> {
    if input.title.trim().is_empty() || input.title.chars().count() > 80 {
        return Err(api_error(
            "invalid_room",
            "Use an exercise title from 1 to 80 characters.",
        ));
    }
    if input.instructions.trim().is_empty() || input.instructions.chars().count() > 600 {
        return Err(api_error(
            "invalid_room",
            "Add instructions from 1 to 600 characters.",
        ));
    }
    for (label, value) in [
        ("HTML", &input.html),
        ("CSS", &input.css),
        ("JavaScript", &input.javascript),
    ] {
        if value.len() > 50_000 {
            return Err(api_error(
                "invalid_room",
                format!("Keep {label} under 50 KB."),
            ));
        }
    }
    Ok(())
}

async fn purge_expired(store: &Store) {
    match store {
        Store::Sqlite(db) => {
            if let Err(error) = sqlx::query("DELETE FROM participants WHERE room_id IN (SELECT id FROM rooms WHERE expires_at <= ?)")
                .bind(unix_time()).execute(db).await { warn!(%error, "could not purge participants from expired rooms"); }
            if let Err(error) = sqlx::query("DELETE FROM rooms WHERE expires_at <= ?")
                .bind(unix_time())
                .execute(db)
                .await
            {
                warn!(%error, "could not purge expired rooms");
            }
        }
        Store::Blob(blob) => {
            let Ok(rooms) = blob.list("rooms/").await else {
                warn!("could not list shared rooms for expiry cleanup");
                return;
            };
            for path in rooms
                .into_iter()
                .filter(|path| path.ends_with(".json") && !path.contains("/participants/"))
            {
                match blob.get::<StoredRoom>(&path).await {
                    Ok(Some(room)) if room.room.expires_at <= unix_time() => {
                        let room_id = room.room.id;
                        for participant_path in blob
                            .list(&format!("rooms/{room_id}/participants/"))
                            .await
                            .unwrap_or_default()
                        {
                            if let Err(error) = blob.delete(&participant_path).await {
                                warn!(%error.message, "could not purge participant");
                            }
                        }
                        if let Err(error) = blob.delete(&path).await {
                            warn!(%error.message, "could not purge room");
                        }
                    }
                    Ok(_) => {}
                    Err(error) => {
                        warn!(%error.message, "could not read shared room during cleanup")
                    }
                }
            }
        }
    }
}

async fn rate_limit(
    State(state): State<AppState>,
    ConnectInfo(address): ConnectInfo<SocketAddr>,
    request: Request,
    next: Next,
) -> Response {
    let key = request
        .headers()
        .get("x-forwarded-for")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .map(str::trim)
        .filter(|value| value.parse::<IpAddr>().is_ok())
        .map(str::to_string)
        .unwrap_or_else(|| address.ip().to_string());
    let mut windows = state.rate.lock().await;
    let now = Instant::now();
    let window = windows.entry(key).or_insert(RateWindow {
        started: now,
        count: 0,
    });
    if now.duration_since(window.started) >= Duration::from_secs(1) {
        window.started = now;
        window.count = 0;
    }
    window.count += 1;
    if window.count > 40 {
        let mut response = (StatusCode::TOO_MANY_REQUESTS, Json(serde_json::json!({"error":"rate_limited","message":"Too many requests. Wait one second and try again."}))).into_response();
        response
            .headers_mut()
            .insert(header::RETRY_AFTER, HeaderValue::from_static("1"));
        return response;
    }
    drop(windows);
    next.run(request).await
}

async fn security_headers(request: Request<Body>, next: Next) -> Response {
    let is_sandbox = request.uri().path() == "/sandbox.html";
    let is_hashed_asset = request.uri().path().starts_with("/assets/");
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        "referrer-policy",
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    headers.insert(
        "x-frame-options",
        HeaderValue::from_static(if is_sandbox { "SAMEORIGIN" } else { "DENY" }),
    );
    headers.insert(
        "permissions-policy",
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );
    headers.insert(
        "content-security-policy",
        HeaderValue::from_static(if is_sandbox {
            "default-src 'none'; script-src 'self' blob:; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; media-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'"
        } else {
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://api.sociobot.in; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://api.sociobot.in; frame-ancestors 'none'"
        }),
    );
    if is_hashed_asset {
        headers.insert(
            header::CACHE_CONTROL,
            HeaderValue::from_static("public, max-age=31536000, immutable"),
        );
    }
    response
}

fn random_token(size: usize) -> String {
    let mut bytes = vec![0u8; size];
    rand::rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

fn normalize_room_id(id: &str) -> String {
    id.trim().to_ascii_uppercase()
}
fn unix_time() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
fn db_error(error: sqlx::Error) -> ApiError {
    warn!(%error, "database error");
    api_error("server_error", "The room could not be updated. Try again.")
}
fn constant_time_eq(left: &[u8], right: &[u8]) -> bool {
    if left.len() != right.len() {
        return false;
    }
    left.iter()
        .zip(right)
        .fold(0u8, |diff, (a, b)| diff | (a ^ b))
        == 0
}

async fn shutdown_signal() {
    let ctrl_c = async { signal::ctrl_c().await.expect("install Ctrl+C handler") };
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("install signal handler")
            .recv()
            .await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn room_codes_are_case_insensitive() {
        assert_eq!(normalize_room_id(" abcdex "), "ABCDEX");
    }

    #[test]
    fn token_comparison_rejects_different_lengths() {
        assert!(!constant_time_eq(b"teacher", b"teach"));
        assert!(constant_time_eq(b"teacher", b"teacher"));
    }
}
