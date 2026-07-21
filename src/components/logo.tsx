"use client";

import { motion } from "framer-motion";

const ICON_SLOT = 2;
const ICON_COUNT = 7;
const M_SLOT = 3;                       // "M" logo uchun alohida vaqt
const ICONS_CYCLE = ICON_COUNT * ICON_SLOT; // 16 — barcha iconlar tugaydigan vaqt
const CYCLE = ICONS_CYCLE + M_SLOT;         // 19 — umumiy to'liq sikl

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
    return `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;
}

function circlePath(cx: number, cy: number, r: number) {
    return `M${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy} Z`;
}

// icon: chiziladi -> turadi -> o'chadi, so'ng butun CYCLE tugaguncha kutadi (M ham shu ichida)
const drawIcon = (delay: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: {
        pathLength: [0, 1, 1, 0],
        opacity: [0, 1, 1, 0],
    },
    transition: {
        delay,
        duration: ICON_SLOT,
        times: [0, 0.3, 0.7, 1],
        repeat: Infinity,
        repeatDelay: CYCLE - ICON_SLOT, // <-- endi CYCLE (icons+M), oldin faqat icons edi
        ease: "easeInOut" as const,
    },
});

// "M" logo: faqat ICONS_CYCLE tugagandan keyin (16s dan boshlab) chiqadi
const logoReveal = {
    initial: { opacity: 0 },
    animate: { opacity: [0, 1, 1, 0] },
    transition: {
        delay: ICONS_CYCLE,           // <-- iconlar tugaguncha kutadi
        duration: M_SLOT,
        times: [0, 0.15, 0.85, 1],
        repeat: Infinity,
        repeatDelay: ICONS_CYCLE,     // keyingi safar chiqguncha, iconlar aylanib bo'lguncha kutadi
        ease: "easeInOut" as const,
    },
};

export default function Logo() {
    const iconStroke = {
        fill: "none",
        stroke: "white",
        strokeWidth: 28,
        strokeLinecap: "butt" as const,
        strokeLinejoin: "round" as const,
    };

    const iconStrokeThin = {
        ...iconStroke,
        strokeWidth: 16,
    };

    return (
        <motion.svg width={140} viewBox="0 0 708 677" initial="hidden" animate="show">
            {/* background - o'zgarishsiz qoladi */}
            <path
                d="M708 479C708 588.352 619.352 677 510 677H73V240C73 130.648 161.648 42 271 42H708V479Z"
                fill="#ff4d4f"
            />

            {/* ICON 1: Shopping bag */}
            <g style={{ transformOrigin: "395px 435px" }} transform="scale(1.6)">
                <motion.path
                    d={roundedRect(295, 340, 200, 190, 22)}
                    {...iconStroke}
                    {...drawIcon(0 * ICON_SLOT)}
                />
                <motion.path
                    d="M330,340 L330,290 Q330,240 395,240 Q460,240 460,290 L460,340"
                    {...iconStroke}
                    {...drawIcon(0 * ICON_SLOT)}
                />
                <motion.path
                    d="M295,410 L495,410"
                    {...iconStrokeThin}
                    {...drawIcon(0 * ICON_SLOT)}
                />
            </g>

            {/* ICON 2: Korzinka */}
            <g style={{ transformOrigin: "395px 435px" }} transform="scale(1.6)">
                <motion.path
                    d="M270,290 L315,290 L350,470 Q353,484 368,484 L470,484 Q484,484 488,470 L520,330 L340,330"
                    {...iconStroke}
                    {...drawIcon(1 * ICON_SLOT)}
                />
                <motion.path
                    d="M355,370 L500,370 M362,410 L493,410"
                    {...iconStrokeThin}
                    {...drawIcon(1 * ICON_SLOT)}
                />
                <motion.path
                    d={circlePath(375, 525, 22)}
                    {...iconStroke}
                    {...drawIcon(1 * ICON_SLOT)}
                />
                <motion.path
                    d={circlePath(475, 525, 22)}
                    {...iconStroke}
                    {...drawIcon(1 * ICON_SLOT)}
                />
            </g>

            {/* ICON 3: Card */}
            <g style={{ transformOrigin: "395px 435px" }} transform="scale(1.6)">
                <motion.path
                    d={roundedRect(260, 320, 260, 170, 26)}
                    {...iconStroke}
                    {...drawIcon(2 * ICON_SLOT)}
                />
                <motion.path
                    d="M260,375 L520,375"
                    {...iconStroke}
                    {...drawIcon(2 * ICON_SLOT)}
                />
                <motion.path
                    d={roundedRect(288, 405, 55, 40, 8)}
                    {...iconStrokeThin}
                    {...drawIcon(2 * ICON_SLOT)}
                />
                <motion.path
                    d="M370,425 L420,425 M370,450 L495,450"
                    {...iconStrokeThin}
                    {...drawIcon(2 * ICON_SLOT)}
                />
            </g>

            {/* ICON 4: Price tag */}
            <g style={{ transformOrigin: "430px 500px" }} transform="scale(1.6)">
                <motion.path
                    d="M300,340 L400,310 L550,430 L450,560 L301,450 Z"
                    {...iconStroke}
                    {...drawIcon(3 * ICON_SLOT)}
                />
                <motion.path
                    d={circlePath(340, 380, 14)}
                    {...iconStrokeThin}
                    {...drawIcon(3 * ICON_SLOT)}
                />
            </g>

            {/* ICON 5: Gift box */}
            <g style={{ transformOrigin: "395px 500px" }} transform="scale(1.8)">
                <motion.path
                    d={roundedRect(300, 380, 200, 150, 10)}
                    {...iconStroke}
                    {...drawIcon(4 * ICON_SLOT)}
                />
                <motion.path
                    d="M300,420 L500,420"
                    {...iconStrokeThin}
                    {...drawIcon(4 * ICON_SLOT)}
                />
                <motion.path
                    d="M400,380 L400,530"
                    {...iconStrokeThin}
                    {...drawIcon(4 * ICON_SLOT)}
                />
                <motion.path
                    d="M400,380 Q360,330 330,350 Q320,375 400,380 Q440,330 470,350 Q480,375 400,380"
                    {...iconStroke}
                    {...drawIcon(4 * ICON_SLOT)}
                />
            </g>

            {/* ICON 6: Receipt */}
            <g style={{ transformOrigin: "395px 480px" }} transform="scale(1.6)">
                <motion.path
                    d="M320,320 L470,320 L470,540 L440,520 L410,540 L380,520 L350,540 L320,520 Z"
                    {...iconStroke}
                    {...drawIcon(5 * ICON_SLOT)}
                />
                <motion.path
                    d="M345,370 L445,370 M345,410 L445,410 M345,450 L410,450"
                    {...iconStrokeThin}
                    {...drawIcon(5 * ICON_SLOT)}
                />
            </g>

            {/* ICON 7: Heart */}
            <g style={{ transformOrigin: "395px 500px" }} transform="scale(1.6)">
                <motion.path
                    d="M395,545 C395,545 258,462 258,378 C258,332 300,305 342,320 C368,330 386,352 395,378 C404,352 422,330 448,320 C490,305 532,332 532,378 C532,462 395,545 395,545 Z"
                    {...iconStroke}
                    {...drawIcon(6 * ICON_SLOT)}
                />
            </g>

            {/* Yakuniy "M" logo - faqat barcha iconlar tugagach chiqadi */}
            <motion.g {...logoReveal}>
                <path
                    d="M248 240L259.5 228.5L275 221.5L292 221.5L306 228.5L320 240L327.5 251L331 264.5L141 675.999L72.5 675.999L72.5 609.5L248 240Z"
                    fill="white"
                />
                <path
                    d="M477.5 263.5L485 248L490 239.5L495.5 233L501.5 227.5L509 224.5L516.5 221.5L524.5 221.5L534 221.5L541 224.5L548.5 228L555.5 233.5L559 236.5L560.5 239L565.5 246.5L574.5 260.5L702 530.5L693.5 556.5L679.5 582.5L663 605L643.5 624.5L477.5 263.5Z"
                    fill="white"
                />
                <path
                    d="M238 267.5L240.5 254L248.5 241L258 230L271.5 222.5L296.5 222.5L313.5 235L325.5 249L523 677L428.5 677L238 267.5Z"
                    fill="white"
                />
                <path
                    d="M484 249.5L491.5 236.5L502.5 226.5L517 221.5L534.5 221.5L547 227L559 236.5L574 260L452 525.5L401.5 420.5L484 249.5Z"
                    fill="white"
                />
            </motion.g>
        </motion.svg>
    );
}