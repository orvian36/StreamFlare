"use client";

import * as React from "react";
import {
  motion,
  MotionConfig,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";

export const MOTION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  ease: [0.16, 1, 0.3, 1] as const,
  spring: { type: "spring", stiffness: 300, damping: 30 } as const,
};

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function FadeIn({
  children,
  delay = 0,
  y = 12,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.base, ease: MOTION.ease, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  stagger = 0.04,
  ...props
}: HTMLMotionProps<"div"> & { stagger?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: stagger } } }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 12 },
        show: { opacity: 1, y: 0, transition: { duration: MOTION.base, ease: MOTION.ease } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function HoverScale({
  children,
  scale = 1.03,
  ...props
}: HTMLMotionProps<"div"> & { scale?: number }) {
  return (
    <motion.div whileHover={{ scale }} whileTap={{ scale: 0.98 }} transition={MOTION.spring} {...props}>
      {children}
    </motion.div>
  );
}
