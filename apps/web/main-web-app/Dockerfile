FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm nx
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .

# Next.js dev server
CMD ["npx", "nx", "dev", "main-web-app", "-H 0.0.0.0", "-p ${WEB_PORT}"]

# --- EXISTING BUILDER STAGE ---
FROM deps AS builder
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npx nx build main-web-app --prod --skipNxCache --verbose

# --- EXISTING RUNNER STAGE ---
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/web/main-web-app/.next/standalone ./
COPY --from=builder /app/apps/web/main-web-app/.next/static ./apps/web/main-web-app/.next/static
COPY --from=builder /app/apps/web/main-web-app/public ./apps/web/main-web-app/public

ENV PORT=$WEB_PORT
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/main-web-app/server.js"]