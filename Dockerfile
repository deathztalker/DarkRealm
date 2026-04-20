FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
# No fijamos puerto aquí para dejar que Railway lo inyecte
CMD ["node", "index.js"]
