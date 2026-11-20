import { ScanLine, Fingerprint, Brain, ClipboardCheck } from "lucide-react";

const STEPS = [
  {
    icon: ScanLine,
    title: "A payment arrives",
    text: "The amount, device, time, location and, when given, the payee address reach the backend.",
  },
  {
    icon: Fingerprint,
    title: "Compared with the user's own habits",
    text: "The server loads what is normal for this sender: usual amount, known devices, active hours.",
  },
  {
    icon: Brain,
    title: "Model, rules and payee check",
    text: "A Random Forest scores the payment, administrator rules add their weight, and the payee address is checked for scam patterns.",
  },
  {
    icon: ClipboardCheck,
    title: "Explained and reviewed",
    text: "Every score comes with reasons. Flagged payments go to an analyst, whose decision teaches the system.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full py-24 px-4 sm:px-6 border-t scroll-mt-16" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl mb-12">
          <h2 className="font-medium mb-3" style={{ fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            How a payment gets judged
          </h2>
          <p className="text-base" style={{ color: "var(--text-secondary)", lineHeight: "24px" }}>
            Four steps, from the moment money moves to the moment a person signs off
          </p>
        </div>

        <ol className="grid gap-px md:grid-cols-4 rounded-xl overflow-hidden border" style={{ background: "var(--border)", borderColor: "var(--border)" }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="p-6" style={{ background: "var(--surface)" }}>
                <div className="flex items-center justify-between mb-8">
                  <Icon size={18} strokeWidth={1.5} color="var(--text-muted)" />
                  <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-base font-medium mb-2">{s.title}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
