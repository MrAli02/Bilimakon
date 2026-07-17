-- ============================================
-- BILIMMAKON — SAMPLE TEST DATA
-- Bu faylni Supabase SQL Editor da ishga tushiring
-- (schema.sql dan KEYIN)
-- ============================================

-- NOTE: Admin user qo'shish uchun avval bilimmakon.vercel.app da
-- ro'yxatdan o'ting, keyin bu query ni ishlatib admin qiling:
-- UPDATE profiles SET role = 'admin' WHERE email = 'sizning@email.com';

-- ============================================
-- SAMPLE COURSE
-- ============================================
INSERT INTO courses (id, title, slug, description, subject, is_published, order_index)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Informatika: Attestatsiyaga Tayyorlanish',
  'informatika-attestatsiya',
  'O''zbekiston o''qituvchilari uchun Informatika fanidan attestatsiyaga professional tayyorlanish kursi. Algoritmlar, dasturlash asoslari, ma''lumotlar tuzilmalari va boshqa muhim mavzular.',
  'Informatika',
  true,
  1
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SAMPLE MODULES
-- ============================================
INSERT INTO modules (id, course_id, title, description, order_index, passing_score, is_published)
VALUES
  (
    '00000001-0000-0000-0000-000000000001',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '1-Modul: Algoritmlar va Dasturlash Asoslari',
    'Algoritm tushunchasi, turlari, dasturlash tillari va asosiy tuzilmalar',
    1, 70, true
  ),
  (
    '00000002-0000-0000-0000-000000000002',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '2-Modul: Ma''lumotlar Tuzilmalari',
    'Massivlar, ro''yxatlar, stek, navbat, daraxt va graflar',
    2, 70, true
  ),
  (
    '00000003-0000-0000-0000-000000000003',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '3-Modul: Kompyuter Tarmoqlari',
    'Internet, protokollar, xavfsizlik asoslari',
    3, 70, true
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE LESSONS
-- ============================================
INSERT INTO lessons (module_id, title, description, youtube_video_id, order_index, is_published)
VALUES
  (
    '00000001-0000-0000-0000-000000000001',
    'Algoritm nima?',
    'Algoritm tushunchasi, xossalari va turlari bilan tanishamiz',
    'dQw4w9WgXcQ',
    1, true
  ),
  (
    '00000001-0000-0000-0000-000000000001',
    'Bloq-sxema va psevdokod',
    'Algoritmlarni tasvirlash usullari',
    'dQw4w9WgXcQ',
    2, true
  ),
  (
    '00000001-0000-0000-0000-000000000001',
    'Dasturlash tillari tarixi',
    'Dasturlash tillari va ularning rivojlanishi',
    'dQw4w9WgXcQ',
    3, true
  ),
  (
    '00000002-0000-0000-0000-000000000002',
    'Massivlar va ularning turlari',
    'Bir o''lchamli va ko''p o''lchamli massivlar',
    'dQw4w9WgXcQ',
    1, true
  ),
  (
    '00000002-0000-0000-0000-000000000002',
    'Stek va Navbat',
    'LIFO va FIFO tuzilmalari',
    'dQw4w9WgXcQ',
    2, true
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE QUESTIONS (Informatika)
-- ============================================
INSERT INTO questions (subject, text, options, correct_option_id, explanation, difficulty)
VALUES
  (
    'Informatika',
    'Quyidagilardan qaysi biri algoritmning asosiy xossasi hisoblanadi?',
    '[
      {"id": "q1a", "text": "Cheksizlik"},
      {"id": "q1b", "text": "Aniqlik"},
      {"id": "q1c", "text": "Murakkablik"},
      {"id": "q1d", "text": "Uzunlik"}
    ]'::jsonb,
    'q1b',
    'Algoritm aniq (deterministic) bo''lishi kerak — har bir qadam aniq va bir ma''noli bo''lishi shart.',
    'easy'
  ),
  (
    'Informatika',
    'Binary (ikkilik) sanoq sistemasida 1010 soni o''nlik sanoq sistemasida qanday ifodalanadi?',
    '[
      {"id": "q2a", "text": "8"},
      {"id": "q2b", "text": "12"},
      {"id": "q2c", "text": "10"},
      {"id": "q2d", "text": "14"}
    ]'::jsonb,
    'q2c',
    '1010 (ikkilik) = 1×2³ + 0×2² + 1×2¹ + 0×2⁰ = 8 + 0 + 2 + 0 = 10',
    'medium'
  ),
  (
    'Informatika',
    'Internet tarmog''ida ma''lumot uzatishning asosiy protokoli qaysi?',
    '[
      {"id": "q3a", "text": "HTTP"},
      {"id": "q3b", "text": "FTP"},
      {"id": "q3c", "text": "TCP/IP"},
      {"id": "q3d", "text": "SMTP"}
    ]'::jsonb,
    'q3c',
    'TCP/IP (Transmission Control Protocol/Internet Protocol) — Internetdagi ma''lumot uzatishning asosiy protokollar to''plami.',
    'easy'
  ),
  (
    'Informatika',
    'Stek (Stack) ma''lumotlar tuzilmasida qaysi tamoyil qo''llaniladi?',
    '[
      {"id": "q4a", "text": "FIFO (First In, First Out)"},
      {"id": "q4b", "text": "LIFO (Last In, First Out)"},
      {"id": "q4c", "text": "FILO (First In, Last Out)"},
      {"id": "q4d", "text": "Random Access"}
    ]'::jsonb,
    'q4b',
    'Stack LIFO tamoyilida ishlaydi: oxirgi kirgan element birinchi chiqadi. Kitoblar uyumi kabi tasavvur qiling.',
    'medium'
  ),
  (
    'Informatika',
    'Python dasturlash tilida ro''yxat (list) elementini qo''shish uchun qaysi metod ishlatiladi?',
    '[
      {"id": "q5a", "text": "add()"},
      {"id": "q5b", "text": "insert()"},
      {"id": "q5c", "text": "append()"},
      {"id": "q5d", "text": "push()"}
    ]'::jsonb,
    'q5c',
    'Python listiga oxiriga element qo''shish uchun append() metodi ishlatiladi: my_list.append(element)',
    'easy'
  ),
  (
    'Informatika',
    'Quyidagi saralash algoritmlaridan qaysi birining o''rtacha vaqt murakkabligi O(n log n)?',
    '[
      {"id": "q6a", "text": "Bubble Sort"},
      {"id": "q6b", "text": "Selection Sort"},
      {"id": "q6c", "text": "Merge Sort"},
      {"id": "q6d", "text": "Insertion Sort"}
    ]'::jsonb,
    'q6c',
    'Merge Sort bo''lib-birlashtirish usulida ishlaydi va barcha holatlarda O(n log n) murakkablikka ega.',
    'hard'
  ),
  (
    'Informatika',
    'HTML teglari ichida sarlavha (heading) uchun qaysi teg ishlatiladi?',
    '[
      {"id": "q7a", "text": "<header>"},
      {"id": "q7b", "text": "<h1>"},
      {"id": "q7c", "text": "<title>"},
      {"id": "q7d", "text": "<head>"}
    ]'::jsonb,
    'q7b',
    '<h1> dan <h6> gacha bo''lgan teglar sarlavha uchun ishlatiladi. <h1> eng katta, <h6> eng kichik sarlavha.',
    'easy'
  ),
  (
    'Informatika',
    'Relyatsion ma''lumotlar bazasida jadvallar o''rtasidagi bog''lanishni qaysi kalit ta''minlaydi?',
    '[
      {"id": "q8a", "text": "Primary Key"},
      {"id": "q8b", "text": "Foreign Key"},
      {"id": "q8c", "text": "Index"},
      {"id": "q8d", "text": "Unique Key"}
    ]'::jsonb,
    'q8b',
    'Foreign Key (tashqi kalit) — bir jadvalning ustuni boshqa jadvalning asosiy kalitiga (Primary Key) murojaat qiladi va jadvallar o''rtasidagi bog''lanishni ta''minlaydi.',
    'medium'
  ),
  (
    'Informatika',
    'Quyidagi ifodani hisoblang: 2^8 = ?',
    '[
      {"id": "q9a", "text": "128"},
      {"id": "q9b", "text": "512"},
      {"id": "q9c", "text": "256"},
      {"id": "q9d", "text": "64"}
    ]'::jsonb,
    'q9c',
    '2^8 = 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = 256. Kompyuterda 1 bayt = 8 bit va 256 ta qiymat ifodalay oladi.',
    'medium'
  ),
  (
    'Informatika',
    'OOP (Object Oriented Programming) da inkapsulyatsiya (encapsulation) nima?',
    '[
      {"id": "q10a", "text": "Bir sinfning boshqasidan meros olishi"},
      {"id": "q10b", "text": "Bir metodning turli xil shaklda ishlashi"},
      {"id": "q10c", "text": "Ma''lumotlar va metodlarni bir joyda jamlash va tashqi kiruvni cheklash"},
      {"id": "q10d", "text": "Abstrakt sinf yaratish"}
    ]'::jsonb,
    'q10c',
    'Inkapsulyatsiya — ob''ektning ichki holatini yashirish va faqat kerakli interfeys orqali kiruvga ruxsat berish. Bu ma''lumotlarni himoya qiladi.',
    'medium'
  ),
  (
    'Informatika',
    'CSS da elementni markazlashtirish uchun qaysi usul eng zamonaviy hisoblanadi?',
    '[
      {"id": "q11a", "text": "margin: 0 auto"},
      {"id": "q11b", "text": "text-align: center"},
      {"id": "q11c", "text": "display: flex; justify-content: center; align-items: center"},
      {"id": "q11d", "text": "position: absolute; top: 50%"}
    ]'::jsonb,
    'q11c',
    'Flexbox yordamida gorizontal va vertikal markazlashtirish eng qulay va zamonaviy usul hisoblanadi.',
    'medium'
  ),
  (
    'Informatika',
    'Quyidagi mantiqiy ifodaning qiymati qanday: TRUE AND (FALSE OR TRUE)?',
    '[
      {"id": "q12a", "text": "FALSE"},
      {"id": "q12b", "text": "TRUE"},
      {"id": "q12c", "text": "NULL"},
      {"id": "q12d", "text": "ERROR"}
    ]'::jsonb,
    'q12b',
    'Avval qavsni hisoblaymiz: FALSE OR TRUE = TRUE. Keyin: TRUE AND TRUE = TRUE.',
    'easy'
  )
ON CONFLICT DO NOTHING;

-- Announce complete setup
SELECT 
  (SELECT COUNT(*) FROM courses) as courses_count,
  (SELECT COUNT(*) FROM modules) as modules_count,
  (SELECT COUNT(*) FROM lessons) as lessons_count,
  (SELECT COUNT(*) FROM questions) as questions_count;