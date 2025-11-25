# Node.js 이미지를 기반으로 합니다.
FROM node:18-alpine

# 작업 디렉토리를 설정합니다.
WORKDIR /app

# package.json과 package-lock.json을 복사합니다.
COPY package*.json ./

# 의존성을 설치합니다.
RUN npm install

# 소스 코드를 복사합니다.
COPY . .

# 포트를 노출합니다.
EXPOSE 3000

# 애플리케이션을 실행합니다.
CMD ["npm", "start"]