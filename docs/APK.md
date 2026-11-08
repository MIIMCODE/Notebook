# ساخت و نصب APK (یادچه)

APK روی این دستگاه ساخته **نمی‌شود** (جاوا/Gradle محلی نداریم)؛ ساخت کامل در
GitHub Actions انجام می‌شود.

## ۱) ساخت سریع (دستی)

1. در مخزن GitHub به سربرگ **Actions** برو.
2. از لیست سمت چپ روی **Build Android APK** بزن.
3. دکمه‌ی **Run workflow** را بزن (روی شاخه‌ی `main`) و صبر کن تا سبز شود
   (معمولاً ۵ تا ۱۰ دقیقه).
4. در پایین صفحه‌ی همان اجرا، بخش **Artifacts** را باز کن.
5. فایل **`yadche-apk`** را دانلود کن (zip است) و داخلش `yadche-vX.Y.Z.apk`
   (یا `…-debug.apk`) را از حافظه دربیاور.

> با هر push به هر شاخه، فقط CI (lint/typecheck/test/build) اجرا می‌شود.
> ساخت APK با push به تگ `v*` یا دکمه‌ی دستیِ بالا شروع می‌شود.

## ۲) نصب روی گوشی

1. فایل APK را به گوشی منتقل کن (کابل/USB یا هر پیام‌رسانی).
2. روی فایل بزن؛ اگر پیام **«نصب از منابع ناشناس»** آمد، گزینه را فعال کن
   (مسیر معمول: Settings → Apps → Special access → Install unknown apps).
3. **Install** را بزن و اپ را باز کن.

## ۳) امضای انتشار (Release) با Secrets

بدون Secrets، خروجی با کلید **debug** امضا می‌شود (برای تست عالی است).
برای نسخه‌ی منتشرشدنی:

1. ساخت کلید (یک بار، محلی — نتیجه را نگه دار):

   ```bash
   keytool -genkey -v -keystore yadche-release.keystore \
     -alias yadche -keyalg RSA -keysize 2048 -validity 10000
   ```

2. در **GitHub → Settings → Secrets and variables → Actions** این چهار Secret را بساز:

   | Secret                     | مقدار                                |
   | -------------------------- | ------------------------------------ |
   | `YADCHE_KEYSTORE_BASE64`   | `base64 -w0 yadche-release.keystore` |
   | `YADCHE_KEYSTORE_PASSWORD` | رمزِ keystore                        |
   | `YADCHE_KEY_ALIAS`         | مثلاً `yadche`                       |
   | `YADCHE_KEY_PASSWORD`      | رمز کلید                             |

3. دوباره **Run workflow** بزن — حالا خروجی `yadche-vX.Y.Z.apk` با امضای
   انتشار ساخته می‌شود.

## ۴) نام‌گذاری و نسخه

- نام فایل: `yadche-v{VERSION}.apk` از `package.json → version`.
- `versionCode` با شماره‌ی همان اجرا+۱۰۰۰ بالا می‌رود تا نصبِ ارتقا همیشه ممکن باشد.

## ۵) عیب‌یابی

| مشکل                     | راه‌حل                                                            |
| ------------------------ | ----------------------------------------------------------------- |
| Artifact خالی است        | لاگ مرحله‌ی `Collect APK` را ببین                                 |
| `SDK location not found` | روی runner رسمی `ubuntu-latest` نباید بیاید؛ دوباره Run کن        |
| نصب، «برنامه نصب نشد»    | `versionCode` پایین‌تر از نسخه‌ی قبلی است؛ یا نسخه قبلی را حذف کن |
| امضای انتشار اعمال نشد   | چهار Secret را چک کن و Workflow را دوباره اجرا کن                 |
