export default function AmbientBackground() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        opacity: 0.5,
      }} />

      <div className="pulse-orb fixed rounded-full pointer-events-none z-0" style={{
        width: "600px", height: "600px", top: "-10%", left: "5%",
        background: "radial-gradient(circle, var(--accent), transparent 70%)",
        filter: "blur(80px)", opacity: 0.35,
      }} />
      <div className="fixed rounded-full pointer-events-none z-0" style={{
        width: "500px", height: "500px", top: "10%", right: "0%",
        background: "radial-gradient(circle, var(--risk-safe), transparent 70%)",
        filter: "blur(90px)", opacity: 0.18,
      }} />
      <div className="fixed rounded-full pointer-events-none z-0" style={{
        width: "400px", height: "400px", bottom: "-5%", left: "35%",
        background: "radial-gradient(circle, var(--risk-watch), transparent 70%)",
        filter: "blur(90px)", opacity: 0.15,
      }} />
    </>
  );
}