# Dockerfile for Express + Prisma + AWS SDK
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Prisma generate (optional, if using migrations)
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "index.js"]
