# تشغيل الواجهة على Render (Web Service)

هذا الدليل يوضح تشغيل واجهة HTML/JS بسيطة، ومعها Backend منفصل للملفات والتحكم بالبوتات وواتساب.

## إعداد متغيرات البيئة
في Render، أضف المتغيرات التالية للواجهة:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `API_BASE_URL` (رابط الـ Backend مثل `https://your-backend.onrender.com`)

## إعداد متغيرات البيئة للـ Backend (مهم)
أضف المتغيرات التالية في خدمة الـ Backend:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (اختياري، مثال: `openai/gpt-4o-mini`)
- `OPENROUTER_SITE_URL` (اختياري)
- `OPENROUTER_APP_NAME` (اختياري)
- `ENCRYPTION_KEY`
- `ALLOWED_ORIGINS` (مثال: `https://your-frontend.onrender.com`)
- `FILES_ROOT` (مثال: `D:\\NPAI` محليًا أو مسار مناسب على السيرفر)

## إعداد Render (Web Service) للواجهة
1. ادخل إلى https://render.com واضغط **New +** ثم **Web Service**
2. اختر المستودع من GitHub
3. **Root Directory:** `frontend`
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. اضغط **Create Web Service**

## إعداد Render (Web Service) للـ Backend
1. ادخل إلى https://render.com واضغط **New +** ثم **Web Service**
2. اختر المستودع من GitHub
3. **Root Directory:** `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. اضبط متغيرات البيئة المذكورة أعلاه

## ملاحظة مهمة لـ WPPConnect (Chrome)
- أضف متغير البيئة: `PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer`
- سيقوم السكربت `postinstall` بتنزيل Chrome تلقائيًا عند البناء.

## تشغيل محلي
```bash
cd frontend
npm install
npm start
```

## تشغيل محلي للـ Backend
```bash
cd backend
npm install
npm start
```

## ملاحظات
- لا يوجد Vite أو React في هذه النسخة.
- في التطوير المحلي يمكنك تعديل `frontend/config.js` مباشرةً.
- لتغيير نموذج الذكاء الاصطناعي استخدم `OPENROUTER_MODEL`.
