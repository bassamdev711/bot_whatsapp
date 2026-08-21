# مراجع تكامل Neon وVercel

توضح وثائق Neon الرسمية أن `@neondatabase/serverless` هو الخيار الموصى به لتطبيقات Next.js، وأنه يستخدم سلسلة اتصال من متغير البيئة ويعمل عبر HTTP، ما يلائم Route Handlers الخادمية.

توضح وثائق تكامل Neon مع Vercel أن التكامل يحقن `DATABASE_URL` و`DATABASE_URL_UNPOOLED` ومتغيرات `PG*` في البيئات المنشورة. يمكن اختيار `DATABASE_URL` للاتصال المجمّع في الاستخدام العادي، ويُستخدم `DATABASE_URL_UNPOOLED` لأدوات تحتاج اتصالًا مباشرًا.

| موضوع | المصدر الرسمي |
|---|---|
| Next.js مع Neon والمشغل الموصى به | [Neon: Connect a Next.js application](https://neon.com/docs/guides/nextjs) |
| متغيرات Vercel وتكامل Neon | [Neon-Managed Vercel Integration](https://neon.com/docs/guides/neon-managed-vercel-integration) |
