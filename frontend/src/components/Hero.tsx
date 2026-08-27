import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import HandsIllustration from "./HandsIllustration";

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "24px",
      }}
    >
      <HandsIllustration />
      <nav
        style={{
          position: "absolute",
          top: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "999px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <Shield size={16} color="var(--accent)" />
          <span className="font-display" style={{ fontWeight: 600, fontSize: "14px" }}>
            RiskLens AI
          </span>
        </div>
        {["Product", "How it works", "Docs"].map((item) => (
          <div
            key={item}
            style={{
              padding: "10px 18px",
              borderRadius: "999px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontSize: "14px",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            {item}
          </div>
        ))}
        <ThemeToggle />
      </nav>

      <div
        className="pulse-orb"
        style={{
          position: "absolute",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle at 30% 30%, var(--accent), transparent 70%)",
          filter: "blur(60px)",
          opacity: 0.5,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          position: "relative",
          zIndex: 5,
          maxWidth: "680px",
          width: "100%",
          padding: "56px 48px",
          borderRadius: "28px",
          background: "var(--surface-glass)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-soft)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 14px",
            borderRadius: "999px",
            background: "var(--accent-soft)",
            color: "var(--accent)",
            fontSize: "13px",
            fontWeight: 500,
            marginBottom: "24px",
          }}
        >
          Continuous transaction monitoring
        </div>

        <h1
          className="font-display"
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 600,
            lineHeight: 1.15,
            margin: "0 0 16px 0",
            color: "var(--text-primary)",
          }}
        >
          Fraud detection<br />
          <span style={{ color: "var(--text-secondary)" }}>that explains</span> itself
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            maxWidth: "480px",
            margin: "0 auto 32px auto",
          }}
        >
          RiskLens scores every UPI transaction in real time and tells you exactly why -
          no black box, just clear, explainable risk signals.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            style={{
              padding: "14px 28px",
              borderRadius: "999px",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View Dashboard
          </button>
          <button
            style={{
              padding: "14px 28px",
              borderRadius: "999px",
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            How it works
          </button>
        </div>
      </motion.div>
    </section>
  );
}