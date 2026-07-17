# 🚀 BilimMakon — Internetga Chiqarish Qo'llanmasi

Bu qo'llanma orqali platformangizni **15-20 daqiqada**, xatosiz internetga chiqarasiz.

---

## ✅ OLDINDAN TAYYORLASH KERAK BO'LGANLAR

Boshlashdan oldin quyidagilarga ega bo'ling:
- Email manzil (Supabase va Vercel uchun)
- Telegram akkaunt (bot yaratish uchun)
- Anthropic hisobi (AI Mentor uchun) — https://console.anthropic.com

---

## 1-QADAM: SUPABASE (Ma'lumotlar bazasi) — 5 daqiqa

1. https://supabase.com → **Start your project** → GitHub bilan kiring
2. **New Project** tugmasini bosing:
   - **Name:** `bilimmakon`
   - **Database Password:** kuchli parol yarating va **saqlab qo'ying** (keyinroq kerak emas, lekin yo'qotmang)
   - **Region:** `Frankfurt (eu-central-1)` — O'zbekistonga eng yaqin
3. **Create new project** — 2 daqiqa kutasiz (loyiha tayyorlanmoqda)

### SQL kodlarni ishga tushirish (ANIQ TARTIBDA):

Chap menyudan **SQL Editor** → **New query** ni bosing.

**1-fayl:** `supabase/schema.sql` faylini oching, **butun tarkibini** nusxalab SQL Editorga joylashtiring → **Run** (yoki Ctrl+Enter) → "Success. No rows returned" ko'rinishi kerak.

**2-fayl:** Yana **New query** → `supabase/schema_v2.sql` ni joylashtiring → **Run**

**3-fayl:** Yana **New query** → `supabase/seed.sql` ni joylashtiring → **Run** (bu namuna kurs, modul, dars va test savollarini qo'shadi — sinov uchun foydali)

> ⚠️ Agar xatolik chiqsa: fayllarni **aynan shu tartibda** (schema.sql → schema_v2.sql → seed.sql) ishga tushirganingizga ishonch hosil qiling.

### API kalitlarini olish:

Chap menyudan **Settings** (⚙️) → **API** bo'limiga o'ting, quyidagilarni nusxalab, biror joyga vaqtincha saqlang:

| Supabase'dagi nom | Sizga kerak bo'ladigan nom |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` kalit | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` kalit (⚠️ maxfiy!) | `SUPABASE_SERVICE_ROLE_KEY` |

---

## 2-QADAM: TELEGRAM BOT — 3 daqiqa

1. Telegram'da **@BotFather** ni toping va yozing
2. `/newbot` buyrug'ini yuboring
3. Bot nomi: `BilimMakon Bot` (yoki xohlagan nom)
4. Bot username: `bilimmakon_uz_bot` (noyob bo'lishi kerak, `_bot` bilan tugashi shart)
5. BotFather sizga **Token** beradi (masalan: `123456789:ABCdefGHIjklmNOPqrs`) — buni saqlang: `TELEGRAM_BOT_TOKEN`

### O'z Telegram Chat ID'ingizni olish:
1. **@userinfobot** ni toping va `/start` bosing
2. U sizga ID raqamingizni beradi (masalan: `987654321`) — bu: `TELEGRAM_ADMIN_CHAT_ID`

### O'z Telegram username'ingiz:
- Telegram → Settings → Username qismidagi nom (masalan: `john_smith`, `@` belgisisiz) — bu: `NEXT_PUBLIC_ADMIN_TELEGRAM`
- Foydalanuvchilar ro'yxatdan o'tgach, aynan shu username'ga murojaat qilishadi

---

## 3-QADAM: ANTHROPIC API KEY — 2 daqiqa

1. https://console.anthropic.com → Sign up / Login
2. **API Keys** → **Create Key**
3. Nomlang (masalan `bilimmakon-prod`) → **Create Key**
4. Ko'rsatilgan kalitni nusxalang (faqat bir marta ko'rsatiladi!) — bu: `ANTHROPIC_API_KEY`

> 💰 Billing bo'limida balans to'ldirishni unutmang, aks holda AI Mentor ishlamaydi.

---

## 4-QADAM: GITHUB'GA YUKLASH — 3 daqiqa

1. https://github.com → **New repository**
   - Nomi: `bilimmakon`
   - **Private** ✅ (tavsiya etiladi — kodlaringiz maxfiy qoladi)
   - **Create repository**

2. ZIP faylni kompyuteringizga yuklab oching, keyin terminal/kommand-line orqali:

```bash
cd bilimmakon
git init
git add .
git commit -m "BilimMakon production release"
git branch -M main
git remote add origin https://github.com/SIZNING_USERNAME/bilimmakon.git
git push -u origin main
```

> Agar terminal bilan ishlash qiyin bo'lsa: GitHub Desktop dasturini o'rnating (https://desktop.github.com) — u orqali sichqoncha bilan yuklash mumkin.

---

## 5-QADAM: VERCEL'GA DEPLOY — 5 daqiqa

1. https://vercel.com → **Sign up** → GitHub bilan kiring
2. **Add New** → **Project**
3. GitHub repolaringiz ro'yxatidan `bilimmakon` ni toping → **Import**

4. **Environment Variables** bo'limini oching (Deploy tugmasidan OLDIN!) va quyidagi **10 ta** o'zgaruvchini birma-bir qo'shing:

| Key (nom) | Value (qiymat) | Qayerdan olinadi |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | 1-qadam |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | 1-qadam |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | 1-qadam |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | 3-qadam |
| `TELEGRAM_BOT_TOKEN` | `123456789:ABC...` | 2-qadam |
| `TELEGRAM_ADMIN_CHAT_ID` | `987654321` | 2-qadam |
| `TELEGRAM_WEBHOOK_SECRET` | `bilimmakon_secret_2024` (o'zingiz o'ylab toping) | — |
| `NEXT_PUBLIC_APP_URL` | `https://bilimmakon.vercel.app` (keyinroq to'g'rilanadi) | — |
| `NEXT_PUBLIC_ADMIN_TELEGRAM` | `john_smith` (sizning Telegram usernameingiz, @siz) | 2-qadam |
| `ADMIN_SECRET_KEY` | `MyStr0ngSecret!2024` (o'zingiz o'ylab toping, kuchli bo'lsin) | — |

5. **Deploy** tugmasini bosing → 2-3 daqiqa kutasiz

6. Deploy tugagach, Vercel sizga haqiqiy URL beradi (masalan `bilimmakon-xyz123.vercel.app`). Bu URL'ni nusxalab:
   - Vercel → Settings → Environment Variables → `NEXT_PUBLIC_APP_URL` ni **shu haqiqiy URL** bilan yangilang
   - **Deployments** → so'nggi deploy yonidagi **⋯** → **Redeploy** (o'zgarishlar kuchga kirishi uchun)

---

## 6-QADAM: TELEGRAM WEBHOOK'NI ULASH — 1 daqiqa

Brauzer manzil qatoriga (TOKEN va URL'ni o'zingiznikiga almashtirib) kiriting:

```
https://api.telegram.org/botTOKEN_BU_YERGA/setWebhook?url=https://SIZNING-URL.vercel.app/api/webhook/telegram&secret_token=bilimmakon_secret_2024
```

Muvaffaqiyatli bo'lsa, quyidagicha javob ko'rasiz:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

## 7-QADAM: ADMIN HISOBINGIZNI YARATISH — 2 daqiqa

1. `https://sizning-url.vercel.app/register` ga o'ting
2. **O'zingiz uchun** oddiy hisob yarating (masalan: ismingiz, `admin@sizning-email.uz`, kuchli parol)
3. Supabase'ga qayting → **SQL Editor** → **New query**:

```sql
UPDATE profiles SET role = 'admin', is_blocked = false WHERE email = 'admin@sizning-email.uz';
```

→ **Run** bosing (email'ni o'zingiznikiga almashtiring!)

4. Endi `https://sizning-url.vercel.app/admin-login` ga o'ting:
   - Email va parolingizni kiriting
   - **"+ Maxfiy kalit"** tugmasini bosib, `ADMIN_SECRET_KEY` da yozgan qiymatingizni kiriting
   - **Admin sifatida kirish**

✅ Tabriklaymiz — siz endi to'liq boshqaruvga egasiz!

---

## 🎯 BIRINCHI FOYDALANUVCHINI QO'SHISH

1. Foydalanuvchi `/register` da ro'yxatdan o'tadi
2. U "Adminga Telegram orqali yozish" tugmasini bosadi → sizning Telegram'ingizga xabar keladi
3. Siz `/admin/keys` ga kirib **"Kalit yaratish"** bosasiz
4. Yaratilgan kalitni (masalan `ABCD-EFGH-1234`) nusxalab, Telegram orqali foydalanuvchiga yuborasiz
5. Foydalanuvchi `/activate` sahifasida kalitni kiritadi → shaxsiy kabinetiga kiradi

---

## 📚 KONTENT QO'SHISH (kurslar, video, testlar)

`/admin/courses` → **Kurs qo'shish** → kurs ichida **Modul qo'shish** → modul ichida **Dars qo'shish** (YouTube video ID bilan) → **Nashr qilish**

`/admin/questions` → test savollarini qo'shing (4 variant, to'g'ri javob, tushuntirish)

`/admin/materials` → PDF va boshqa materiallarni qo'shing

---

## ❗ TEZKOR MUAMMOLARNI HAL QILISH

**"relation does not exist" xatosi** → SQL fayllarni to'g'ri tartibda (schema → schema_v2 → seed) qayta ishga tushiring

**Admin panelga kira olmayapman** → SQL orqali tekshiring:
```sql
SELECT email, role, is_blocked FROM profiles WHERE email = 'sizning@email.uz';
```
`role` ustuni `admin` bo'lishi, `is_blocked` esa `false` bo'lishi kerak.

**Foydalanuvchi kalitni kirita olmayapti** → SQL orqali tekshiring:
```sql
SELECT key, is_active, used_by FROM access_keys ORDER BY created_at DESC LIMIT 5;
```
`is_active` — `true`, `used_by` — bo'sh bo'lishi kerak (hali ishlatilmagan).

**AI Mentor javob bermayapti** → Anthropic hisobingizda balans borligini tekshiring (console.anthropic.com → Billing)

**Telegram xabarlar kelmayapti** → 6-qadamdagi webhook havolasini qaytadan oching, `"ok":true` chiqishi kerak

**Build xatosi Vercel'da** → Environment Variables to'liq va to'g'ri kiritilganini tekshiring (10 ta o'zgaruvchi ham bo'lishi shart)

---

## 🗺️ SAHIFALAR XARITASI

| Sahifa | URL | Kim uchun |
|---|---|---|
| Bosh sahifa | `/` | Hamma |
| Ro'yxatdan o'tish | `/register` | Yangi foydalanuvchilar |
| Kirish | `/login` | Faollashtirilgan foydalanuvchilar |
| Kalit faollashtirish | `/activate` | Kalit olgan foydalanuvchilar |
| Shaxsiy kabinet | `/dashboard` | O'qituvchilar |
| Kurslar | `/courses` | O'qituvchilar |
| Testlar | `/tests` | O'qituvchilar |
| AI Mentor | `/ai-mentor` | O'qituvchilar (kuniga 10 savol) |
| Progress | `/progress` | O'qituvchilar |
| Profil | `/profile` | O'qituvchilar |
| **Admin kirish** | `/admin-login` | **Faqat siz** |
| Admin panel | `/admin` | Faqat admin |

---

## ✅ XAVFSIZLIK — QISQACHA

- Admin kirish maxsus `/admin-login` sahifasida, 3 marta xato → 15 daqiqa blok
- Har bir foydalanuvchi kaliti faqat belgilangan sondagi qurilmadan ishlaydi (standart: 1 ta)
- Limitdan oshgan urinish → avtomatik blok, faqat siz ochishingiz mumkin
- Barcha muhim amallar `/admin/audit` da qayd etiladi

Omad tilaymiz! 🎉
