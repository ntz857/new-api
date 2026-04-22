FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o team-dashboard-backend .

FROM alpine:3.21
RUN adduser -D -u 1001 appuser
WORKDIR /app
COPY --from=builder /app/team-dashboard-backend .
RUN chown appuser /app/team-dashboard-backend
USER appuser
EXPOSE 8080
CMD ["./team-dashboard-backend"]
