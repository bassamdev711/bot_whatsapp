FROM node:22-alpine AS builder

WORKDIR /app

# نسخ ملفات الحزم الجذرية
COPY package.json package-lock.json* ./

# نسخ ملفات الحزم للتطبيقات
COPY apps/api/package.json apps/api/package-lock.json* ./apps/api/
COPY apps/worker/package.json apps/worker/package-lock.json* ./apps/worker/

# نسخ ملفات الحزم للحزم المشتركة
COPY packages/shared/package.json packages/shared/package.json ./packages/shared/
COPY packages/database/package.json packages/database/package.json ./packages/database/
COPY packages/whatsapp/package.json packages/whatsapp/package.json ./packages/whatsapp/
COPY packages/ai/package.json packages/ai/package.json ./packages/ai/
COPY packages/auth/package.json packages/auth/package.json ./packages/auth/
COPY packages/logger/package.json packages/logger/package.json ./packages/logger/
COPY packages/common/package.json packages/common/package.json ./packages/common/

# تثبيت الحزم
RUN npm install --legacy-peer-deps

# نسخ باقي الكود
COPY . .

# بناء التطبيقين (API و Worker)
RUN npm run build -- --filter=@sasabot/api
RUN npm run build -- --filter=@sasabot/worker

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# نسخ الملفات المبنية
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/worker/package.json ./apps/worker/

EXPOSE 3000

# تشغيل الـ Worker أو الـ API بناءً على المتغير
CMD if [ "$APP_ROLE" = "worker" ]; then cd apps/worker && node dist/main.js; else cd apps/api && node dist/main.js; fi
