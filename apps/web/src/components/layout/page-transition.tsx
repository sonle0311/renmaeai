"use client";

import { motion } from "framer-motion";

/* ============================================================
   PageTransition — Subtle fade-in wrapper for page content
   Wraps page content to provide smooth enter animations
   ============================================================ */
export function PageTransition({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.3,
                ease: [0.25, 0.1, 0.25, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
