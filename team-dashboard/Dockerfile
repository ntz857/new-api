# Stage 1: build frontend
FROM --platform=$BUILDPLATFORM oven/bun:1 AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install --frozen-lockfile
COPY frontend/ .
RUN bun run build

# Stage 2: build backend
FROM --platform=$BUILDPLATFORM golang:1.25-alpine AS backend-builder
WORKDIR /backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o team-dashboard .

# Stage 3: final image
FROM --platform=linux/amd64 alpine:3.21
RUN adduser -D -u 1001 appuser
WORKDIR /app
COPY --from=backend-builder /backend/team-dashboard .
COPY --from=frontend-builder /frontend/dist ./frontend/dist
RUN chown -R appuser /app
USER appuser
EXPOSE 8080
CMD ["./team-dashboard"]
