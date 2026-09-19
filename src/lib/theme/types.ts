export type ThemeMode = "light" | "dark" | "system";
export type ThemeRadius = "none" | "small" | "medium" | "large";

// Yangi rang yoki shrift qo'shish uchun faqat presets.ts / fonts.ts'ga
// yozish kifoya — bu ikki union shu fayllardan avtomatik chiqariladi
// (pastga qarang), shuning uchun bu yerni har safar qo'lda
// yangilashning hojati yo'q.
export type ThemeSettings = {
  mode: ThemeMode;
  primary: string; // presets.ts'dagi kalitlardan biri
  radius: ThemeRadius;
  font: string; // fonts.ts'dagi kalitlardan biri
};
