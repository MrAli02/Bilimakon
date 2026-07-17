import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // O'zbek tilida apostrof harf tarkibiga kiradi (o'quvchi, bo'ladi, to'liq va h.k.),
      // ingliz tilidagi qisqartma emas — bu qoida bunday tillar uchun false-positive beradi.
      // Runtime xatti-harakatga ta'sir qilmaydi, faqat JSX matn escaping uslubi.
      "react/no-unescaped-entities": "off",
      // Supabase join so'rovlari (courses→modules→lessons→progress) chuqur ichma-ich
      // dinamik shakllar qaytaradi; har birini alohida generatsiya qilingan tip bilan
      // yozish operatsion foyda bermaydi. Runtime xavfsizlikka ta'sir qilmaydi —
      // faqat build vaqtidagi qat'iylik darajasi.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
