<div dir="rtl">

# یادچه — دفترچه یادداشت حرفه‌ای

<p align="center">
  <img src="public/og.png" alt="یادچه — هر چیزی که باید بماند، اینجاست." width="100%" />
</p>

<p align="center">
  <b>هر چیزی که باید بماند، اینجاست.</b><br/>
  یادداشت، چک‌لیست، جدول، کد، تصویر، صدا و نقاشی — آفلاین، همگام و پرانیمیشن.
</p>

---

یادچه یک اپ **دفترچه یادداشت** مدرن است: نسخه وب (PWA) که با GitHub Actions به
**APK اندروید** تبدیل می‌شود. ذخیره‌ی کامل آفلاین با IndexedDB (Dexie)، همگام‌سازی
خودکار و امن با Supabase، ویرایشگر غنی TipTap، ماژول‌های کار و زندگی، و انیمیشن‌های
۶۰fps با احترام به `prefers-reduced-motion`.

## ✨ امکانات

- **انواع یادداشت:** متن، چک‌لیست، جدول، کد، تصویر، ضبط صدا، نقاشی دستی
- **سازمان‌دهی:** پوشه، تگ، پین، رنگ‌بندی، آرشیو، سطل زباله، تاریخچه نسخه‌ها
- **جستجو:** جستجوی سریع و فیلتر پیشرفته (عنوان، متن، تگ، پوشه، نوع، تاریخ)
- **ماژول‌ها:** لیست کارها، کانبان، ردیاب عادت، خاطرات روزانه و حال‌وهوا، تقویم
  شمسی، پومودورو، ثبت هزینه‌ها
- **قفل امنیتی:** پین و اثر انگشت (Capacitor Biometrics)
- **قالب‌ها:** قالب‌های آماده‌ی یادداشت + خروجی PDF/Markdown + پشتیبان‌گیری JSON
- **چندزبانه:** فارسی/انگلیسی با RTL کامل و تقویم شمسی
- **تم:** چند تم رنگی + دارک‌مود + گلس‌مورفیزم
- **یادآور:** نوتیفیکیشن محلی (Capacitor Local Notifications)
- **PWA:** نصب روی دسکتاپ و موبایل، کار کاملاً آفلاین

## 🛠 استک فنی

| لایه       | فناوری                                                  |
| ---------- | ------------------------------------------------------- |
| Frontend   | Vite + React 18 + TypeScript (strict) + Tailwind CSS v4 |
| انیمیشن    | Framer Motion                                           |
| ویرایشگر   | TipTap (Rich Text + Markdown + چک‌لیست + جدول + کد)     |
| ذخیره‌سازی | IndexedDB با Dexie                                      |
| Backend    | Supabase (Auth + Postgres + Storage + Realtime) با RSL  |
| PWA        | vite-plugin-pwa (Service Worker)                        |
| اندروید    | Capacitor 7 + Gradle                                    |
| تست        | Vitest + Testing Library + Playwright                   |
| کیفیت      | ESLint 9 + Prettier + `tsc --noEmit`                    |

## 🚀 اجرا

```bash
npm install
cp .env.example .env        # کلیدهای Supabase را اینجا بگذار (هرگز در کد)
npm run dev                 # http://localhost:5173
```

### دستورات کلیدی

| دستور                    | کار                                       |
| ------------------------ | ----------------------------------------- |
| `npm run dev`            | سرور توسعه                                |
| `npm run build`          | بیلد کامل (typecheck + vite build)        |
| `npm run lint`           | بررسی ESLint                              |
| `npm run typecheck`      | بررسی تایپ                                |
| `npm test`               | تست‌های واحد (Vitest)                     |
| `npm run test:e2e`       | تست E2E (Playwright)                      |
| `npm run format`         | قالب‌بندی با Prettier                     |
| `npm run android:assets` | بازتولید همه‌ی آیکون‌ها و Splash          |
| `npm run apk:debug`      | ساخت APK دیباگ محلی (نیاز به Android SDK) |

## 📦 دریافت و نصب APK

> راهنمای کامل و تصویری: [docs/APK.md](docs/APK.md)

1. به بخش **Actions** این مخزن برو.
2. ورک‌فلوی **`Build Android APK`** را انتخاب کن و آخرین اجرای موفق را باز کن.
3. از بخش **Artifacts** فایل `yadche-vX.Y.Z.apk` را دانلود کن.
4. فایل را به گوشی انتقال بده و نصب کن:
   - در صفحه‌ی نصب، گزینه‌ی **«نصب از منبع ناشناس»** را برای مرورگر/فایل‌منیجر
     بده (Android 8+).
   - پس از نصب، آیکون **یادچه** در لانچر ظاهر می‌شود.

برای نصب سریع‌تر از طریق QR هم می‌توانی لینک Artifact را در Actions بگیری.

## ☁️ Supabase

1. یک پروژه در [supabase.com](https://supabase.com) بساز.
2. اسکیما را با migration موجود اعمال کن:
   `supabase/migrations/0001_init.sql` (از SQL Editor یا CLI)
3. کلیدها را **فقط** در `.env` محلی و GitHub Secrets بگذار:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. RLS فعال است: هر کاربر فقط ردیف‌های خودش را می‌بیند.

## 📱 ساختار مخزن

```
├── assets/            # SVG وکتور برند + خروجی‌های PNG
├── docs/              # مستندات (برند، APK، معماری)
├── public/            # favicon، آیکون‌های PWA، manifest، OG
├── scripts/           # اسکریپت‌های تولید گرافیک
├── src/
│   ├── components/    # کامپوننت‌های عمومی UI
│   ├── features/      # ماژول‌های کارکردی (یادداشت، کارها، ...)
│   ├── db/            # اسکیمای Dexie و لایه‌ی دسترسی
│   ├── sync/          # موتور همگام‌سازی Supabase
│   ├── i18n/          # دیکشنری fa/en
│   ├── lib/           # ابزارها (تقویم شمسی، قالب‌ها، ...)
│   └── stores/        # state عمومی (Zustand)
├── supabase/migrations/  # اسکیما + RSL
├── e2e/               # تست‌های Playwright
└── android/           # پروژه‌ی Capacitor/Gradle (تولیدشده)
```

## 🧪 کیفیت

- هر push: `lint + typecheck + test` (ورک‌فلوی `CI`)
- با هر push: CI (lint/typecheck/test/build)؛ ساخت APK با تگ `v*` یا Run دستی → Artifact `yadche-apk`
- Error Boundary سراسری، مدیریت حالت آفلاین/خطای شبکه

## 📄 لایسنس

MIT

</div>
