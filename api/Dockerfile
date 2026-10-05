FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

EXPOSE 8080

# aplica as migrations, popula o usuário demo (só na primeira vez) e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node index.js"]
