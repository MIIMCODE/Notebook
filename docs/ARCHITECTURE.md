# معماری یادچه

## نمای کلی

```
┌────────────────────────────  Client (PWA / Android)  ───────────────────────────┐
│                                                                                 │
│  UI (React + Tailwind + Framer Motion)                                          │
│      │                                                                          │
│      ▼                                                                          │
│  Stores (Zustand)  ←── وضعیت UI عمومی (تم، زبان، قفل، جستجو)                    │
│      │                                                                          │
│      ▼                                                                          │
│  Feature Repositories (src/db)  ←── تنها لایه‌ی دسترسی به داده                   │
│      │                                                                          │
│      ├──► IndexedDB / Dexie  (منبع حقیقت آفلاین — همیشه در دسترس)               │
│      │                                                                          │
│      └──► Sync Engine (src/sync) ── push/pull ──► Supabase (Postgres + RLS)      │
│                                                   │                             │
│                                                   └── Realtime (تغییرات زنده)   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## اصول

1. **Local-first:** UI همیشه از Dexie می‌خواند؛ بدون شبکه هم کامل کار می‌کند.
2. **منبع حقیقت کلاینت:** نوشتن/ویرایش فقط در Dexie انجام می‌شود؛ سینک در پس‌زمینه
   تغییرات را به Supabase فشار می‌آورد و تغییرات دوردست را می‌کشد.
3. **LWW (Last-Write-Wins):** بر اساس `updated_at` که روی **سرور** ست می‌شود
   (تریگر `set_updated_at`). تعارض‌ها ساده و قابل پیش‌بینی‌اند.
4. **همه‌چیز با `user_id`:** جدول‌های سرور آینه‌ی جدول‌های کلاینت‌اند؛ RLS تضمین
   می‌کند هر کاربر فقط داده‌ی خودش را ببیند.
5. **حذف نرم (soft delete):** ستون‌های `is_deleted` + `deleted_at` تا سینک بتواند
   حذف‌ها را به دستگاه‌های دیگر هم برساند؛ پاک‌سازی کامل بعد از ۳۰ روز.

## جدول‌های Dexie (v1)

| جدول                   | کلید                                                                                          | توضیح                              |
| ---------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `notes`                | `id, updatedAt, folderId, isPinned, isDeleted, isArchived, type, [folderId+isDeleted], title` | یادداشت‌ها                         |
| `folders`              | `id, parentId, updatedAt, deletedAt`                                                          | پوشه‌ها (تو در تو)                 |
| `tags`                 | `id, name, updatedAt`                                                                         | تگ‌ها                              |
| `noteTags`             | `[noteId+tagId], noteId, tagId`                                                               | ارتباط‌ها                          |
| `noteVersions`         | `id, noteId, createdAt`                                                                       | تاریخچه نسخه‌ها                    |
| `attachments`          | `id, noteId, createdAt`                                                                       | پیوست‌ها (dataURL/Storage)         |
| `tasks`                | `id, updatedAt, done, dueAt, listName`                                                        | لیست کارها                         |
| `boards/columns/cards` | ...                                                                                           | کانبان                             |
| `habits/entries`       | ...                                                                                           | ردیاب عادت                         |
| `journalDays`          | `id, day, updatedAt`                                                                          | خاطره روز + حال‌وهوا               |
| `expenses`             | `id, paidAt, updatedAt`                                                                       | هزینه‌ها                           |
| `pomodoros`            | `id, startedAt`                                                                               | جلسات پومودورو                     |
| `settings`             | `'key'`                                                                                       | تنظیمات محلی (تم، زبان، قفل، سینک) |

## پروتکل سینک

```
هر N ثانیه یا بعد از هر تغییر (debounce 1.5s) + هنگام باز شدن اپ:

PUSH:  rows با updatedAt > lastPushAt  → upsert در Supabase
PULL:  rows با server.updated_at > lastPullAt → upsert در Dexie
       با مقایسه‌ی version: اگر دوردست جدیدتر بود، بازنویسی + ذخیره نسخه
SYNC_STATE در settings: { lastPushAt, lastPullAt, status, deviceId }
```

- `deviceId` هر نصب یکتا است تا اکوی خودی هنگام Realtime نادیده گرفته شود.
- خطاها در UI با توست نشان داده می‌شوند؛ سینک در حالت offline بی‌صدا retry می‌شود.

## لایه‌ی دسترسی (src/db)

```ts
// هر ماژول یک repository دارد؛ UI فقط با این‌ها کار می‌کند:
notesRepo.create / update / trash / restore / purge / versions
foldersRepo.*  tagsRepo.*  tasksRepo.*  habitsRepo.*  ...
// هر نوشتن: Dexie.put + ثبت در outbox (برای سینک بعدی)
```

## احراز هویت

- Supabase Auth با ایمیل/رمز عبور (+ ورود مهمان برای تست سریع).
- JWT در حافظه‌ی نگه‌داشته‌شده‌ی supabase-js؛ سینک بعد از login/restore فعال می‌شود.
- بدون لاگین: اپ کاملاً آفلاین کار می‌کند (دیتای مهمان در Dexie)؛ با لاگین،
  دیتای مهمان با `merge` به حساب منتقل می‌شود.

## پوشه‌های کلیدی

- `src/db` — اسکیمای Dexie + repository ها
- `src/sync` — کلاینت Supabase + موتور سینک + Realtime
- `src/features/*` — ماژول‌های UI (notes, tasks, kanban, habits, journal,
  calendar, pomodoro, expenses, search, settings, auth, lock)
- `src/lib` — ابزار خالص (jalali, ids, export, reminders)
- `supabase/migrations` — اسکیمای سرور (منبع حقیقت DB)
