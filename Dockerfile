# Stage 1: compilar
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
# Si tuviéramos go.sum: COPY go.sum ./
RUN go mod download
COPY . .
RUN go build -ldflags="-s -w" -o server ./main.go

# Stage 2: imagen final mínima
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
