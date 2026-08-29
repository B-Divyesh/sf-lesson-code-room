FROM node:22-alpine AS web-builder
WORKDIR /source
COPY package.json package-lock.json ./
RUN npm ci
COPY frontend ./frontend
RUN npm run build

FROM rust:1-slim AS rust-builder
ARG BUILD_SHA=dev
ENV BUILD_SHA=${BUILD_SHA}
WORKDIR /source
COPY Cargo.toml Cargo.lock ./
COPY migrations ./migrations
COPY src ./src
RUN cargo build --locked --release

FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app app \
    && mkdir -p /app /data \
    && chown -R app:app /app /data
WORKDIR /app
COPY --from=rust-builder /source/target/release/lesson-code-room /app/lesson-code-room
COPY --from=web-builder /source/dist /app/dist
ENV PORT=8080
ENV STATIC_DIR=/app/dist
USER app
EXPOSE 8080
ENTRYPOINT ["/app/lesson-code-room"]
