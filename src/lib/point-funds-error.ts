"use client";

import { toast } from "sonner";

/** Faqat kerakli metod — useRouter() natijasi ham shunga mos keladi */
interface PushableRouter {
  push: (url: string) => void;
}

/**
 * Point (foyda markazi) balansi yetarli bo'lmagani sababli chiqim
 * bloklanganda, server action xato matnini shu ko'rinishda qaytaradi:
 *
 *   "POINT_FUNDS::<pointId>::<needed>::<inson o'qiy oladigan xabar>"
 *
 * Bu funksiya shu belgini aniqlaydi va foydalanuvchiga bitta bosishda
 * "Kassa" sahifasidagi "Nuqtalar orasida o'tkazish" oynasini, kerakli
 * nuqta va summa oldindan to'ldirilgan holda ochib beradigan tugmali
 * toast ko'rsatadi. Oddiy xatolarda esa umumiy toast chiqadi.
 */
export function showPointFundsAwareError(
  error: string,
  router: PushableRouter
) {
  if (!error.startsWith("POINT_FUNDS::")) {
    toast.error(error);
    return;
  }

  const [, pointId, needed, ...rest] = error.split("::");
  const message = rest.join("::");

  toast.error(message, {
    action: {
      label: "O'tkazish",
      onClick: () =>
        router.push(`/cash?transfer=1&toPoint=${pointId}&amount=${needed}`),
    },
  });
}
