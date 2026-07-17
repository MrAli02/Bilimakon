# 🛡️ BilimMakon — Admin Qo'llanmasi

## 1-QADAM: DEPLOY QILISH

### Supabase sozlash (5 daqiqa)
1. https://supabase.com → Sign Up → New Project
   - Nom: `bilimmakon`
   - Parol: kuchli parol yozing (eslab qoling)
   - Region: `Frankfurt (eu-central-1)`

2. Project tayyor bo'lgach (1-2 daqiqa kutish):
   - Chap menyu → **SQL Editor** → **New query**
   - `supabase/schema.sql` faylini to'liq nusxalab SQL Editorga joylashtiring
   - **Run** tugmasi bosing → "Success" ko'rinadi

3. Yana **New query** → `supabase/schema_v2.sql` ni joylashtiring → **Run**

4. Yana **New query** → `supabase/seed.sql` ni joylashtiring → **Run** (namuna ma'lumotlar)

5. **Settings** → **API** → Quyidagilarni nusxalab oling:
   ```
   Project URL        → NEXT_PUBLIC_SUPABASE_URL
   anon public key    → NEXT_PUBLIC_SUPABASE_ANON_KEY
   service_role key   → SUPABASE_SERVICE_ROLE_KEY
   ```

---

### GitHub (3 daqiqa)
1. https://github.com → Sign in → New repository
   - Nom: `bilimmakon`
   - Private ✅ → Create

2. ZIP ni oching, papkani terminalda:
   ```bash
   cd bilimmakon
   git init
   git add .
   git commit -m "BilimMakon v1"
   git remote add origin https://github.com/SIZNING_USERNAME/bilimmakon.git
   git push -u origin main
   ```

---

### Vercel deploy (3 daqiqa)
1. https://vercel.com → New Project → GitHub → `bilimmakon` ni import

2. **Environment Variables** bo'limiga bosing, quyidagilarni bittama-bitta qo'shing:

| Variable nomi | Qiymat |
|---------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dan olgan URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dan olgan anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dan olgan service_role key |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com dan oling |
| `TELEGRAM_BOT_TOKEN` | @BotFather dan oling |
| `TELEGRAM_ADMIN_CHAT_ID` | @userinfobot dan oling |
| `TELEGRAM_WEBHOOK_SECRET` | `bilimmakon2024secret` (o'zingiz yozing) |
| `NEXT_PUBLIC_APP_URL` | `https://bilimmakon.vercel.app` (deploy bo'lgach URL) |
| `NEXT_PUBLIC_ADMIN_TELEGRAM` | Sizning Telegram username (@ belgisisiz) |
| `ADMIN_SECRET_KEY` | Kuchli kalit: `Admin@Bilim2024!` (eslab qoling!) |

3. **Deploy** → 2-3 daqiqa kuting → ✅ Tayyor!

---

## 2-QADAM: ADMIN HISOBINI YARATISH

1. Vercel URL ingizga o'ting (masalan `https://bilimmakon.vercel.app`)
2. `/register` sahifasiga o'ting
3. **O'zingiz uchun hisob yarating**:
   - To'liq ism: Admin Adminov
   - Email: `admin@bilimmakon.uz` (yoki istalgan email)
   - Parol: Kuchli parol

4. Supabase ga qayting → **SQL Editor** → **New query**:
   ```sql
   UPDATE profiles 
   SET role = 'admin', is_blocked = false 
   WHERE email = 'admin@bilimmakon.uz';
   ```
   **Run** bosing → ✅ Siz endi admin!

---

## 3-QADAM: ADMIN PANELGA KIRISH

1. Brauzerda: `https://sizning-url.vercel.app/admin-login`
2. Email: `admin@bilimmakon.uz`
3. Parol: ro'yxatda kiritgan parol
4. **"+ Maxfiy kalit"** tugmasini bosing → `Admin@Bilim2024!` kiriting
5. **"Admin sifatida kirish"** → ✅ Admin panelga tushdingiz!

---

## 4-QADAM: ADMIN PANELDA NIMA QILA OLASIZ

### 👥 Foydalanuvchilar (`/admin/users`)
- Barcha foydalanuvchilarni ko'rish
- **Bloklash/Blokni ochish** tugmasi
- **Kalit berish** (🔑 belgisi) — foydalanuvchiga kalit yaratish
- **Qurilmalar** (📱 belgisi) — kim qaysi qurilmadan kirganini ko'rish
- Sessiyalarni bekor qilish

### 🔑 Kirish Kalitlari (`/admin/keys`)
- Yangi kalit yaratish → **"Kalit yaratish"** tugmasi
- Bir vaqtda 50 tagacha kalit yaratish (ommaviy)
- Har bir kalit uchun: max qurilma soni (1-3), amal qilish muddati
- Kalitni nusxalash → foydalanuvchiga Telegramda yuborish
- Kalit formati: `ABCD-EFGH-1234`

### 📚 Kurslar (`/admin/courses`)
- Yangi kurs qo'shish → **"Kurs qo'shish"** tugmasi
- Kurs ichiga kirish uchun **🔷 Layers belgisi** → Modullar
- Modul ichida **→** belgisi → Darslar
- Har bir darsga YouTube video ID qo'shish
- Nashr qilish/yashirish

### 📄 Materiallar (`/admin/materials`)
- PDF, havola, fayl qo'shish
- Har bir materialni kurs/modul/darsga bog'lash
- Google Drive PDF havolasi qo'shish mumkin

### ❓ Savollar Banki (`/admin/questions`)
- Yangi savol qo'shish
- 4 ta variant, to'g'ri javobni belgilash
- Tushuntirish qo'shish
- Fan, qiyinlik darajasi tanlash

### 💳 To'lovlar (`/admin/payments`)
- Kutilayotgan to'lovlarni ko'rish
- **"Tasdiqlash"** → Foydalanuvchiga simulyator ochiladi
- **"Rad etish"** → Rad etish

### 📊 Statistika (`/admin/analytics`)
- Jami foydalanuvchilar, daromad, kurslar
- So'nggi ro'yxatdan o'tganlar

### 📢 E'lonlar (`/admin/announcements`)
- Yangi e'lon qo'shish
- Barcha foydalanuvchilarga Telegram orqali yuborish

### 🗒️ Audit Loglari (`/admin/audit`)
- Kim qachon kirganini ko'rish
- Bloklash/kalit amallarini kuzatish

### ⚙️ Sozlamalar (`/admin/settings`)
- Simulyator narxini o'zgartirish
- Simulyatorni yoqish/o'chirish
- Savollar soni, vaqt, o'tish bali

---

## 5-QADAM: BIRINCHI FOYDALANUVCHINI QO'SHISH

1. Foydalanuvchi `/register` da ro'yxatdan o'tadi
2. Siz `/admin-login` → `/admin/keys` ga kirasiz
3. **"Kalit yaratish"** → Foydalanuvchi uchun izoh yozing
4. Kalitni nusxalab (📋) Telegramda yuboresiz
5. Foydalanuvchi `/activate` ga kirib kalitni kiritadi → ✅ Dashboard ochiladi

---

## MUHIM LINKLAR

| Sahifa | URL |
|--------|-----|
| Bosh sahifa | `https://sizning-url.vercel.app/` |
| Foydalanuvchi kirish | `https://sizning-url.vercel.app/login` |
| Ro'yxat | `https://sizning-url.vercel.app/register` |
| Kalit faollashtirish | `https://sizning-url.vercel.app/activate` |
| **Admin kirish** | `https://sizning-url.vercel.app/admin-login` |
| **Admin panel** | `https://sizning-url.vercel.app/admin` |

---

## TELEGRAM BOT SOZLASH

1. Telegramda **@BotFather** ga yozing
2. `/newbot` → nom: `BilimMakon Bot` → username: `bilimmakon_uz_bot`
3. Token nusxalab → `TELEGRAM_BOT_TOKEN` ga kiriting
4. Webhook qo'shish (deploy bo'lgach):
   ```
   https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://sizning-url.vercel.app/api/webhook/telegram&secret_token=bilimmakon2024secret
   ```

---

## XATO BO'LSA NIMA QILISH

**"relation does not exist" xatosi** → schema.sql ni qayta ishga tushiring

**Admin panelga kirib bo'lmayapti** → SQL da role='admin' ekanligini tekshiring:
```sql
SELECT email, role FROM profiles WHERE email = 'admin@bilimmakon.uz';
```

**Kalit ishlamayapti** → access_keys jadvalida is_active=true ekanligini tekshiring:
```sql
SELECT key, is_active, used_by FROM access_keys ORDER BY created_at DESC LIMIT 5;
```
