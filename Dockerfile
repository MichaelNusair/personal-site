# Build stage
FROM public.ecr.aws/docker/library/node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY packages/database/prisma ./packages/database/prisma
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

COPY . .

ENV AUTH_TRUST_HOST=true
RUN npm run build

RUN test -d /app/.next/standalone

# Production stage
FROM public.ecr.aws/docker/library/node:20-slim AS runner

RUN apt-get update && apt-get install -y openssl libssl-dev ffmpeg ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Lambda Web Adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV AWS_LWA_INVOKE_MODE=buffered

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

RUN test -f /app/server.js

EXPOSE 8080

CMD ["./start.sh"]
