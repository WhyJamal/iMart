"use client";

import { motion } from "framer-motion";

export default function Logo() {
    return (
        <motion.svg
            width={140}
            viewBox="0 0 708 677"
            initial="hidden"
            animate="show"
        >
            {/* background */}

            <path
                d="M708 479C708 588.352 619.352 677 510 677H73V240C73 130.648 161.648 42 271 42H708V479Z"
                fill="#ff4d4f"
            />

            {/* Left 1 */}

            <motion.path
                d="M248 240L259.5 228.5L275 221.5L292 221.5L306 228.5L320 240L327.5 251L331 264.5L141 675.999L72.5 675.999L72.5 609.5L248 240Z"
                fill="white"
                initial={{
                    x: -120,
                    opacity: 0
                }}
                animate={{
                    x: 0,
                    opacity: 1
                }}
                transition={{
                    duration: .45
                }}
            />

            {/* Right 2 */}

            <motion.path
                d="M477.5 263.5L485 248L490 239.5L495.5 233L501.5 227.5L509 224.5L516.5 221.5L524.5 221.5L534 221.5L541 224.5L548.5 228L555.5 233.5L559 236.5L560.5 239L565.5 246.5L574.5 260.5L702 530.5L693.5 556.5L679.5 582.5L663 605L643.5 624.5L477.5 263.5Z"
                fill="white"
                initial={{
                    x: 120,
                    opacity: 0
                }}
                animate={{
                    x: 0,
                    opacity: 1
                }}
                transition={{
                    delay: .15,
                    duration: .45
                }}
            />

            {/* Left 2 */}

            <motion.path
                d="M238 267.5L240.5 254L248.5 241L258 230L271.5 222.5L296.5 222.5L313.5 235L325.5 249L523 677L428.5 677L238 267.5Z"
                fill="white"
                initial={{
                    y: 120,
                    opacity: 0
                }}
                animate={{
                    y: 0,
                    opacity: 1
                }}
                transition={{
                    delay: .3,
                    duration: .45
                }}
            />

            {/* Right 1 */}

            <motion.path
                d="M484 249.5L491.5 236.5L502.5 226.5L517 221.5L534.5 221.5L547 227L559 236.5L574 260L452 525.5L401.5 420.5L484 249.5Z"
                fill="white"
                initial={{
                    y: -120,
                    opacity: 0
                }}
                animate={{
                    y: 0,
                    opacity: 1
                }}
                transition={{
                    delay: .45,
                    duration: .45
                }}
            />
        </motion.svg>
    );
}