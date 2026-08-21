# مراجع تكامل Gemini

يستخدم المشروع استدعاءً خادميًا فقط إلى واجهة `generateContent`، مع مفتاح من متغير البيئة `GIMINIAPI`. لا يظهر المفتاح في مكوّنات العميل ولا يدخل إلى مستودع Git.

| القرار | المصدر الرسمي |
|---|---|
| `generateContent` يقبل المحتوى وتعليمات النظام | [مرجع Generate Content](https://ai.google.dev/api/generate-content) |
| مفاتيح Gemini يجب أن تبقى في متغيرات البيئة ولا تُكشف للعميل | [إدارة مفاتيح Gemini](https://ai.google.dev/gemini-api/docs/api-key) |
| تعليمات النظام وتاريخ المحادثة مدعومان لتوجيه سلوك المساعد | [توليد النص](https://ai.google.dev/gemini-api/docs/text-generation) |
