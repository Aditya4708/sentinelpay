import { motion } from "framer-motion";

export default function HandsIllustration() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <motion.svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        style={{ position: "absolute", left: "6%", top: "38%" }}
        animate={{ x: [0, 12, 0], y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M40 160 C 40 120, 45 90, 55 70 C 60 55, 62 40, 68 35 C 72 32, 78 34, 78 42 L 76 75 M78 42 C 78 34, 84 30, 88 36 L 90 78 M88 36 C 88 28, 95 26, 98 34 L 100 80 M98 34 C 98 28, 104 28, 106 36 L 108 85 C 130 95, 140 115, 135 145 C 130 165, 100 172, 70 168 C 50 165, 40 160, 40 160 Z"
          fill="none"
          stroke="var(--text-secondary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.35"
        />
      </motion.svg>

      <motion.svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        style={{ position: "absolute", right: "6%", top: "42%", transform: "scaleX(-1)" }}
        animate={{ x: [0, -12, 0], y: [0, 8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M40 160 C 40 120, 45 90, 55 70 C 60 55, 62 40, 68 35 C 72 32, 78 34, 78 42 L 76 75 M78 42 C 78 34, 84 30, 88 36 L 90 78 M88 36 C 88 28, 95 26, 98 34 L 100 80 M98 34 C 98 28, 104 28, 106 36 L 108 85 C 130 95, 140 115, 135 145 C 130 165, 100 172, 70 168 C 50 165, 40 160, 40 160 Z"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
      </motion.svg>

      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: "var(--accent)",
          transform: "translate(-50%, -50%)",
        }}
        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.4, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}