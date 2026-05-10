// Closing-the-gate celebration: the four pieces of the Tranquera mark
// (two postes + two travesaños) slide into place once, then settle.
// Reads as a literal "the gate just closed for you" moment without any
// extra chrome — same brand geometry, just animated in.
"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export function CelebrationMark({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const shared = { duration: 0.9, ease: EASE };

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Tranquera vinculada"
      className={className}
      fill="currentColor"
    >
      <title>Tranquera vinculada</title>
      {/* poste izquierdo — entra desde arriba */}
      <motion.rect
        x="36"
        y="40"
        width="18"
        height="120"
        initial={reduce ? false : { y: -160, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...shared, delay: 0.05 }}
      />
      {/* poste derecho — entra desde abajo */}
      <motion.rect
        x="146"
        y="40"
        width="18"
        height="120"
        initial={reduce ? false : { y: 160, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...shared, delay: 0.05 }}
      />
      {/* travesaño superior — entra desde la izquierda */}
      <motion.rect
        x="54"
        y="74"
        width="92"
        height="18"
        initial={reduce ? false : { x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ...shared, delay: 0.5 }}
      />
      {/* travesaño inferior — entra desde la derecha */}
      <motion.rect
        x="54"
        y="108"
        width="92"
        height="18"
        initial={reduce ? false : { x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ...shared, delay: 0.7 }}
      />
    </svg>
  );
}
