FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
RUN npm install -g pnpm nx
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

CMD ["npx", "nx", "serve", "${APP_NAME}", "--host=0.0.0.0"]

FROM deps AS builder
COPY . .
ARG APP_NAME
RUN npx nx build ${APP_NAME} --prod

FROM node:20-alpine AS runner
WORKDIR /app
ARG APP_NAME
COPY --from=builder /app/apps/services/${APP_NAME}/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]