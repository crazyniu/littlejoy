"use client";
import { useEffect, useRef } from "react";

const COLORS = ["#ffffff", "#ffd54b", "#b69cff", "#5fd3ff", "#ff5d8f"];

// A pixel starfield: square stars on three depth layers, slow drift,
// pointer parallax and the odd shooting star. Pauses when off-screen.
export default function Starfield({ density = 1 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let unit = 2;
    let stars = [];
    let shooter = null;
    let frame = 0;
    let visible = true;
    let mx = 0;
    let my = 0;

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = canvas.width = Math.round(rect.width * dpr);
      h = canvas.height = Math.round(rect.height * dpr);
      unit = Math.round(2 * dpr);
      const count = Math.round(((rect.width * rect.height) / 5200) * density);
      stars = Array.from({ length: Math.min(count, 420) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 1 + Math.floor(Math.random() * 3),
        c: COLORS[Math.random() < 0.72 ? 0 : 1 + Math.floor(Math.random() * 4)],
        t: Math.random() * Math.PI * 2,
      }));
      draw(0);
    }

    function snap(v) {
      return Math.round(v / unit) * unit;
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!reduce) {
          s.x -= 0.06 * s.z * unit;
          if (s.x < -unit * 4) s.x = w + unit * 2;
        }
        const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(time / 600 + s.t);
        ctx.globalAlpha = tw * (0.35 + s.z * 0.2);
        ctx.fillStyle = s.c;
        const size = unit * (s.z === 3 ? 2 : 1);
        const x = snap(s.x + mx * s.z * 6 * unit);
        const y = snap(s.y + my * s.z * 4 * unit);
        ctx.fillRect(x, y, size, size);
        if (s.z === 3 && tw > 0.92) {
          ctx.fillRect(x - unit * 2, y + unit / 2, unit, unit);
          ctx.fillRect(x + size + unit, y + unit / 2, unit, unit);
        }
      }
      if (!reduce) {
        if (!shooter && Math.random() < 0.004) {
          shooter = { x: Math.random() * w, y: Math.random() * h * 0.4, life: 0 };
        }
        if (shooter) {
          shooter.life += 1;
          shooter.x += unit * 5;
          shooter.y += unit * 2.5;
          for (let i = 0; i < 8; i++) {
            ctx.globalAlpha = (1 - i / 8) * (1 - shooter.life / 50);
            ctx.fillStyle = i < 2 ? "#ffffff" : "#ffd54b";
            ctx.fillRect(
              snap(shooter.x - i * unit * 2),
              snap(shooter.y - i * unit),
              unit * 2,
              unit,
            );
          }
          if (shooter.life > 50) shooter = null;
        }
      }
      ctx.globalAlpha = 1;
    }

    function loop(time) {
      if (visible && !document.hidden) draw(time);
      frame = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const move = (e) => {
      mx = (e.clientX / innerWidth - 0.5) * -1;
      my = (e.clientY / innerHeight - 0.5) * -1;
    };
    if (!reduce) {
      addEventListener("pointermove", move, { passive: true });
      frame = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      removeEventListener("pointermove", move);
    };
  }, [density]);
  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
