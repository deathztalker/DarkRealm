# Stage 1: compilar
FROM golang:1.22-alpine AS builder
WORKDIR /app

# Copiamos todos los archivos primero
COPY . .

# Generamos el archivo go.sum y descargamos dependencias
RUN go mod tidy
RUN go mod download

# Compilamos el binario
RUN go build -ldflags="-s -w" -o server ./main.go

# Stage 2: imagen final mínima
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
