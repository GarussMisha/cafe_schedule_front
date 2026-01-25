# Этап сборки приложения
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


# Финальный слой: запуск сервера
FROM node:20-alpine

WORKDIR /app

COPY --from=0 /app/package*.json ./

RUN npm ci --only=production

COPY --from=0 /app/dist ./dist

COPY --from=0 /app/server.js ./server.js

EXPOSE 8080

CMD ["npm", "run", "serve"]