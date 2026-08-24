FROM oven/bun:1.3-alpine
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --production
COPY . .
EXPOSE 3004
CMD ["bun", "index.ts"]
