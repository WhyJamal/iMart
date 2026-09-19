import { Geist, Geist_Mono, Inter, Manrope, Poppins } from "next/font/google";

// FAQAT layout.tsx (Server Component) import qiladi. MUHIM: next/font
// build vaqtida chaqiriladigan shriftlarnigina yuklay oladi —
// foydalanuvchi "istalgan" shriftni yoza olmaydi, shuning uchun bu
// yerda ham rang presetlaridagi kabi CHEKLANGAN ro'yxat bilan
// ishlaymiz. Yangi shrift qo'shish: shu yerga bitta qator + pastdagi
// `.join`ga qo'shish + font-presets.ts'dagi uchta joyga kiritish.
//
// DIQQAT: "geist"ning o'zgaruvchisi ATAYLAB "--font-geist-sans" (font-presets.ts
// bilan bir xil) — chunki globals.css'da --font-mono va --font-heading
// ham shunga bog'langan.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
}); // faqat --font-mono uchun, tanlov ro'yxatida emas
const inter = Inter({ subsets: ["latin"], variable: "--font-preset-inter" });
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-preset-manrope",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-preset-poppins",
});

// Har bir shriftning `.variable` klassini <html>ga BIR MARTA, hammasini
// birdaniga qo'shamiz — shunda faqat foydalanuvchi tanlagan shrift
// `--font-sans` orqali FOYDALANILADI (css.ts), qolganlari shunchaki
// "hozircha ishlatilmayapti" holida yuklangan bo'ladi.
export const FONT_VARIABLE_CLASSNAMES = [
  geist.variable,
  geistMono.variable,
  inter.variable,
  manrope.variable,
  poppins.variable,
].join(" ");
