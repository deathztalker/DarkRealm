# Usa una versión ligera de Node
FROM node:18-slim

# Crea el directorio de la app
WORKDIR /app

# Copia solo los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala solo dependencias de producción
RUN npm install --omit=dev

# Copia solo el archivo del servidor
COPY index.js ./

# Puerto que usa la app
EXPOSE 3000

# Comando para arrancar
CMD ["node", "index.js"]
