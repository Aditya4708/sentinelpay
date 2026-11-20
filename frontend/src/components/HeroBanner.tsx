import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import HeroScoreDemo from "./HeroScoreDemo";
import PaymentFlowBackground from "./PaymentFlowBackground";

const TRUSTED_WITH = ["SBI", "HDFC", "ICICI", "PhonePe", "GPay", "BHIM"];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HeroBanner() {
  return (
    <section className="w-full min-h-screen flex flex-col relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <Navbar />

      <div className="absolute inset-0" style={{ maskImage: "linear-gradient(to bottom, transparent, #000 18%, #000 72%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 18%, #000 72%, transparent)" }}>
        <PaymentFlowBackground intensity="full" />
      </div>

      <div className="relative flex-1 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 lg:pt-24 grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-12 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
            <h1 className="font-medium mb-6 text-[40px] leading-[1.06] sm:text-[56px] sm:leading-[1.04]" style={{ letterSpacing: "-0.03em" }}>
              UPI fraud scores that explain themselves
            </h1>

            <p className="text-lg max-w-[36rem] mb-8" style={{ color: "var(--text-secondary)", lineHeight: "28px" }}>
              SentinelPay scores every UPI transaction in real time and tells you exactly why. No black box, just risk signals
              you can read.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                Sign up free
              </Link>
              <a href="#how-it-works" className="sp-btn sp-btn-ghost sp-btn-lg">
                See how it works
              </a>
            </div>

            <div className="mt-12">
              <p className="sp-label mb-3">Works with your bank and UPI app</p>
              <p className="text-sm flex flex-wrap gap-x-4 gap-y-1" style={{ color: "var(--text-secondary)" }}>
                {TRUSTED_WITH.map((name) => (
                  <span key={name}>{name}</span>
                ))}
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: EASE }}>
            <HeroScoreDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
