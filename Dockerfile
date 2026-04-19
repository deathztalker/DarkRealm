FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY index.js ./
EXPOSE 3000
CMD ["node", "index.js"]
