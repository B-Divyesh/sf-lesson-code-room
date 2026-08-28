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
    extract::{ConnectInfo, Path as AxumPath, Query, Request, State},
    http::{header, HeaderValue, StatusCode},
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

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
    rate: Arc<tokio::sync::Mutex<HashMap<String, RateWindow>>>,
    billing_base: String,
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

#[derive(Debug, Clone, Serialize, FromRow)]
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

#[derive(Debug, Clone, Serialize, FromRow)]
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

#[derive(Deserialize)]
struct TeacherQuery {
    teacher_token: String,
}

#[derive(Serialize)]
struct ProgressResponse {
    participants: Vec<Participant>,
    counts: ProgressCounts,
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
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://data/lesson-code-room.db".to_string());
    let static_dir = env::var("STATIC_DIR").unwrap_or_else(|_| "dist".to_string());
    let billing_base =
        env::var("BILLING_BASE_URL").unwrap_or_else(|_| "https://api.sociobot.in".to_string());

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
        .connect(&database_url)
        .await
        .expect("connect sqlite");
    sqlx::migrate!()
        .run(&db)
        .await
        .expect("run database migrations");
    let state = AppState {
        db,
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
        database_config = if env::var("DATABASE_URL").is_ok() {
            "supplied"
        } else {
            "generated default"
        },
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
    purge_expired(&state.db).await;
    let licensed = match input.license.as_deref() {
        Some(token) if !token.trim().is_empty() => verify_license(&state, token.trim()).await,
        _ => false,
    };
    let room = insert_room(&state.db, input, licensed, false).await?;
    let teacher_token = get_teacher_token(&state.db, &room.id).await?;
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
    Ok(Json(find_room(&state.db, &normalize_room_id(&id)).await?))
}

async fn join_room(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<String>,
    Json(input): Json<JoinRoom>,
) -> Result<Json<JoinedRoom>, ApiError> {
    let room_id = normalize_room_id(&id);
    let room = find_room(&state.db, &room_id).await?;
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
    let inserted = sqlx::query("INSERT INTO participants (id, room_id, learner_token, name, status, joined_at, updated_at) SELECT ?, ?, ?, ?, 'joined', ?, ? WHERE (SELECT COUNT(*) FROM participants WHERE room_id = ?) < ?")
        .bind(&id).bind(&room_id).bind(&learner_token).bind(name).bind(now).bind(now).bind(&room_id).bind(room.capacity)
        .execute(&state.db).await.map_err(db_error)?;
    if inserted.rows_affected() == 0 {
        return Err(api_error(
            "room_full",
            "This room is full. Ask the teacher to open another room.",
        ));
    }
    let participant = Participant {
        id,
        name: name.to_string(),
        status: "joined".to_string(),
        joined_at: now,
        updated_at: now,
    };
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
    find_room(&state.db, &room_id).await?;
    if !matches!(input.status.as_str(), "ran" | "done") {
        return Err(api_error(
            "invalid_status",
            "Progress must be Ran code or Done.",
        ));
    }
    let now = unix_time();
    let result = sqlx::query("UPDATE participants SET status = ?, updated_at = ? WHERE room_id = ? AND learner_token = ?")
        .bind(&input.status).bind(now).bind(&room_id).bind(&input.learner_token)
        .execute(&state.db).await.map_err(db_error)?;
    if result.rows_affected() == 0 {
        return Err(api_error(
            "forbidden",
            "This learner link is no longer active. Join the room again.",
        ));
    }
    let participant = sqlx::query_as::<_, Participant>("SELECT id, name, status, joined_at, updated_at FROM participants WHERE room_id = ? AND learner_token = ?")
        .bind(&room_id).bind(&input.learner_token).fetch_one(&state.db).await.map_err(db_error)?;
    Ok(Json(participant))
}

async fn get_progress(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<String>,
    Query(query): Query<TeacherQuery>,
) -> Result<Json<ProgressResponse>, ApiError> {
    let room_id = normalize_room_id(&id);
    let expected = get_teacher_token(&state.db, &room_id).await?;
    if !constant_time_eq(expected.as_bytes(), query.teacher_token.as_bytes()) {
        return Err(api_error(
            "forbidden",
            "The teacher link is not valid for this room.",
        ));
    }
    let participants = sqlx::query_as::<_, Participant>("SELECT id, name, status, joined_at, updated_at FROM participants WHERE room_id = ? ORDER BY joined_at ASC")
        .bind(&room_id).fetch_all(&state.db).await.map_err(db_error)?;
    let counts = ProgressCounts {
        joined: participants.iter().filter(|p| p.status == "joined").count(),
        ran: participants.iter().filter(|p| p.status == "ran").count(),
        done: participants.iter().filter(|p| p.status == "done").count(),
    };
    Ok(Json(ProgressResponse {
        participants,
        counts,
    }))
}

async fn create_demo(State(state): State<AppState>) -> Result<Json<DemoRoom>, ApiError> {
    purge_expired(&state.db).await;
    let input = CreateRoom {
        title: "Make the night sky respond".to_string(),
        instructions: "Change the button label and add one more star. Run the page, then mark yourself done when it looks right.".to_string(),
        html: "<main class=\"sky-card\">\n  <p class=\"eyebrow\">Tonight's signal</p>\n  <h1>Good evening, coders.</h1>\n  <div id=\"stars\" aria-label=\"Three stars\">✦ ✦ ✦</div>\n  <button id=\"signal\">Send a signal</button>\n  <p id=\"reply\" aria-live=\"polite\"></p>\n</main>".to_string(),
        css: "body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07151f; color: #f7efd9; font: 18px system-ui; }\n.sky-card { width: min(32rem, 80vw); padding: 3rem; border: 1px solid #31576b; background: #102936; box-shadow: 0 24px 80px #0008; }\n.eyebrow { color: #8cdcb3; text-transform: uppercase; letter-spacing: .12em; }\n#stars { color: #ffc857; font-size: 2.5rem; letter-spacing: .35em; }\nbutton { min-height: 44px; margin-top: 1rem; padding: .6rem 1rem; border: 0; background: #ffc857; color: #201503; font-weight: 700; cursor: pointer; }".to_string(),
        javascript: "const button = document.querySelector('#signal');\nbutton.addEventListener('click', () => {\n  document.querySelector('#reply').textContent = 'Signal received.';\n});".to_string(),
        license: None,
    };
    let room = insert_room(&state.db, input, false, true).await?;
    let teacher_token = get_teacher_token(&state.db, &room.id).await?;
    let now = unix_time();
    for (index, (name, status)) in [
        ("Moss Finch", "done"),
        ("Blue Comet", "ran"),
        ("Quiet Fox", "joined"),
    ]
    .iter()
    .enumerate()
    {
        sqlx::query("INSERT INTO participants (id, room_id, learner_token, name, status, joined_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(random_token(9)).bind(&room.id).bind(random_token(24)).bind(name).bind(status).bind(now - 180 + index as i64 * 30).bind(now)
            .execute(&state.db).await.map_err(db_error)?;
    }
    Ok(Json(DemoRoom {
        room,
        teacher_token,
    }))
}

async fn insert_room(
    db: &SqlitePool,
    input: CreateRoom,
    licensed: bool,
    demo: bool,
) -> Result<PublicRoom, ApiError> {
    let id = unique_room_id(db).await?;
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

async fn find_room(db: &SqlitePool, id: &str) -> Result<PublicRoom, ApiError> {
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

async fn get_teacher_token(db: &SqlitePool, id: &str) -> Result<String, ApiError> {
    sqlx::query_scalar("SELECT teacher_token FROM rooms WHERE id = ? AND expires_at > ?")
        .bind(id)
        .bind(unix_time())
        .fetch_optional(db)
        .await
        .map_err(db_error)?
        .ok_or_else(|| api_error("not_found", "This room does not exist or has expired."))
}

async fn unique_room_id(db: &SqlitePool) -> Result<String, ApiError> {
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

async fn purge_expired(db: &SqlitePool) {
    if let Err(error) = sqlx::query(
        "DELETE FROM participants WHERE room_id IN (SELECT id FROM rooms WHERE expires_at <= ?)",
    )
    .bind(unix_time())
    .execute(db)
    .await
    {
        warn!(%error, "could not purge participants from expired rooms");
    }
    if let Err(error) = sqlx::query("DELETE FROM rooms WHERE expires_at <= ?")
        .bind(unix_time())
        .execute(db)
        .await
    {
        warn!(%error, "could not purge expired rooms");
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
    headers.insert("content-security-policy", HeaderValue::from_static(if is_sandbox {
        "default-src 'none'; script-src 'self' blob:; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; media-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'"
    } else {
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://api.sociobot.in; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://api.sociobot.in; frame-ancestors 'none'"
    }));
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
