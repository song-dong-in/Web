FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install express cors mysql2 mongoose dotenv axios # [팁] 필요한 라이브러리 명시적 설치

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]