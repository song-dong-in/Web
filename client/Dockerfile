# client/Dockerfile 내용
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts # <--- 이 부분에 임의의 주석이나 --ignore-scripts를 추가하여 캐시를 깨트립니다.

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]