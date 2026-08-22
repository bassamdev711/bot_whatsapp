# وصلة — عامل واتساب مستقل لـ Northflank. لا يشغّل واجهة Next.js.
FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . ./
RUN pnpm run build:worker

ENV NODE_ENV=production

CMD ["node", "dist/worker/index.mjs"]
