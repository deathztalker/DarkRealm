FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY index.js ./
CMD ["node", "index.js"]
