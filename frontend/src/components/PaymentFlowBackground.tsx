import { useEffect, useRef } from "react";

/*
  A motion background drawn from the product itself: UPI payments travelling
  along curved rails. Most move through in the accent colour; now and then one
  turns red and holds at a checkpoint, the way a flagged payment is stopped for
  review. Colours come from the active colourway's CSS variables.

  - Pauses when off-screen or the tab is hidden
  - Draws a single still frame when the user prefers reduced motion
*/

type Intensity = "full" | "subtle";

interface Rail {
  y0: number; // 0..1 of height at the left edge
  y1: number; // at the right edge
  bend: number; // vertical bend of the curve, fraction of height
  speed: number; // fraction of the rail per second
}

interface Packet {
  rail: number;
  t: number; // 0..1 along the rail
  speed: number;
  flagged: boolean;
  hold: number; // seconds left to hold at the checkpoint
  checked: boolean;
}

const CONFIG: Record<Intensity, { rails: number; packets: number; lineAlpha: number; dotAlpha: number; gridAlpha: number }> = {
  full: { rails: 9, packets: 26, lineAlpha: 0.14, dotAlpha: 0.9, gridAlpha: 0.22 },
  subtle: { rails: 7, packets: 16, lineAlpha: 0.1, dotAlpha: 0.65, gridAlpha: 0.14 },
};

const CHECKPOINT = 0.62; // where along a rail flagged payments are held

function readColours() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    accent: v("--accent", "#4da3ff"),
    high: v("--risk-high", "#e5484d"),
    muted: v("--text-muted", "#7a8296"),
  };
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pointOn(r: Rail, t: number, w: number, h: number) {
  // Quadratic curve from left edge to right edge, with a bend in the middle
  const x0 = -0.05 * w;
  const x2 = 1.05 * w;
  const y0 = r.y0 * h;
  const y2 = r.y1 * h;
  const cx = (x0 + x2) / 2;
  const cy = (y0 + y2) / 2 + r.bend * h;
  const u = 1 - t;
  return { x: u * u * x0 + 2 * u * t * cx + t * t * x2, y: u * u * y0 + 2 * u * t * cy + t * t * y2 };
}

export default function PaymentFlowBackground({ intensity = "full", className = "" }: { intensity?: Intensity; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = CONFIG[intensity];
    const rand = seeded(7);
    const rails: Rail[] = Array.from({ length: cfg.rails }, (_, i) => {
      const base = (i + 0.5) / cfg.rails;
      return {
        y0: base + (rand() - 0.5) * 0.25,
        y1: base + (rand() - 0.5) * 0.35,
        bend: (rand() - 0.5) * 0.3,
        speed: 0.035 + rand() * 0.03,
      };
    });
    const newPacket = (spread = false): Packet => ({
      rail: Math.floor(rand() * rails.length),
      t: spread ? rand() : 0,
      speed: 0.6 + rand() * 0.8,
      flagged: rand() < 0.14,
      hold: 0,
      checked: false,
    });
    const packets: Packet[] = Array.from({ length: cfg.packets }, () => newPacket(true));

    let colours = readColours();
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Dot grid, like a ledger sheet
      ctx.fillStyle = colours.muted;
      ctx.globalAlpha = cfg.gridAlpha;
      const step = 28;
      for (let x = step / 2; x < w; x += step) {
        for (let y = step / 2; y < h; y += step) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Rails
      ctx.strokeStyle = colours.accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = cfg.lineAlpha;
      for (const r of rails) {
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const p = pointOn(r, i / 48, w, h);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // Checkpoint ticks
      ctx.globalAlpha = cfg.lineAlpha * 2;
      ctx.strokeStyle = colours.muted;
      for (const r of rails) {
        const p = pointOn(r, CHECKPOINT, w, h);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 4);
        ctx.lineTo(p.x, p.y + 4);
        ctx.stroke();
      }

      // Payments, each with a short trail
      for (const pk of packets) {
        const r = rails[pk.rail];
        const red = pk.flagged && pk.t >= CHECKPOINT - 0.001;
        const colour = red ? colours.high : colours.accent;
        const head = pointOn(r, pk.t, w, h);

        // Trail: short segments fading out behind the payment
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1.5;
        const SEG = 6;
        for (let s = 0; s < SEG; s++) {
          const a = pointOn(r, Math.max(0, pk.t - ((s + 1) / SEG) * 0.045), w, h);
          const b = pointOn(r, Math.max(0, pk.t - (s / SEG) * 0.045), w, h);
          ctx.globalAlpha = cfg.dotAlpha * 0.55 * (1 - s / SEG);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        ctx.globalAlpha = cfg.dotAlpha;
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(head.x, head.y, red ? 2.6 : 2, 0, Math.PI * 2);
        ctx.fill();

        if (red && pk.hold > 0) {
          // Review ring while it is held
          ctx.globalAlpha = cfg.dotAlpha * 0.5 * Math.min(1, pk.hold);
          ctx.strokeStyle = colour;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(head.x, head.y, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const step = (dt: number) => {
      for (let i = 0; i < packets.length; i++) {
        const pk = packets[i];
        if (pk.hold > 0) {
          pk.hold -= dt;
          continue;
        }
        const next = pk.t + rails[pk.rail].speed * pk.speed * dt;
        if (pk.flagged && !pk.checked && pk.t < CHECKPOINT && next >= CHECKPOINT) {
          pk.t = CHECKPOINT;
          pk.checked = true;
          pk.hold = 1.6;
          continue;
        }
        pk.t = next;
        if (pk.t > 1.02) packets[i] = newPacket();
      }
    };

    resize();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = 0;
    let visible = true;

    const loop = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    draw();
    start();

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // Follow colourway and light/dark changes
    const mo = new MutationObserver(() => {
      colours = readColours();
      draw();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette"] });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} aria-hidden className={"pointer-events-none block w-full h-full " + className} />;
}
