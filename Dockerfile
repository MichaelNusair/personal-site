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

# White-label: set per deployment (see lib/site-profile.ts, lib/site-config.ts)
ARG NEXT_PUBLIC_SITE_PROFILE=personal
ARG NEXT_PUBLIC_SITE_URL=https://michaelnusair.tech
ARG NEXT_PUBLIC_CHAT_API_BASE=https://chatapi.michaelnusair.tech/
ARG NEXT_PUBLIC_GETVL_START_IDEA_URL=
ARG NEXT_PUBLIC_GETVL_UPLOAD_RFQ_URL=
ENV NEXT_PUBLIC_SITE_PROFILE=$NEXT_PUBLIC_SITE_PROFILE
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_CHAT_API_BASE=$NEXT_PUBLIC_CHAT_API_BASE
ENV NEXT_PUBLIC_GETVL_START_IDEA_URL=$NEXT_PUBLIC_GETVL_START_IDEA_URL
ENV NEXT_PUBLIC_GETVL_UPLOAD_RFQ_URL=$NEXT_PUBLIC_GETVL_UPLOAD_RFQ_URL

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
