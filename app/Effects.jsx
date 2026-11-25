"use client";
import { useEffect } from "react";

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Page-wide motion layer. Everything here is progressive enhancement: the
// markup is complete without it, and reduced-motion users get the end state.
export default function Effects() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    };

    /* ---------- reveal on scroll ---------- */
    document.querySelectorAll("[data-stagger]").forEach((group) => {
      [...group.children].forEach((child, i) =>
        child.style.setProperty("--d", i * 90 + "ms"),
      );
    });
    const counters = new Set();
    const revealer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target);
          entry.target
            .querySelectorAll("[data-count]")
            .forEach((el) => countUp(el));
          if (entry.target.matches("[data-count]")) countUp(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    function countUp(el) {
      if (counters.has(el)) return;
      counters.add(el);
      const target = Number(el.dataset.count);
      if (reduce) return (el.textContent = target);
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const t = clamp((now - start) / duration);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    document
      .querySelectorAll("[data-reveal], .split, [data-count]")
      .forEach((el) => {
        if (reduce) {
          el.classList.add("is-in");
          return;
        }
        if (el.matches("[data-count]")) el.textContent = "0";
        revealer.observe(el);
      });
    cleanups.push(() => revealer.disconnect());

    /* ---------- scroll-linked state ---------- */
    const words = [...document.querySelectorAll("[data-words]")].map((el) => ({
      el,
      items: [...el.querySelectorAll(".mw")],
    }));
    const fills = [...document.querySelectorAll("[data-fill]")];
    const parallax = reduce
      ? []
      : [...document.querySelectorAll("[data-parallax]")];
    let lastY = scrollY;
    let ticking = false;
    function onScroll() {
      ticking = false;
      const y = scrollY;
      const vh = innerHeight;
      const max = root.scrollHeight - vh;
      root.style.setProperty("--scroll", max > 0 ? (y / max).toFixed(4) : 0);
      root.classList.toggle("is-scrolled", y > 24);
      root.classList.toggle("is-far", y > vh * 1.2);
      if (!root.classList.contains("menu-open")) {
        root.classList.toggle("header-hidden", y > lastY && y > vh * 0.6);
      }
      lastY = y;
      words.forEach(({ el, items }) => {
        const r = el.getBoundingClientRect();
        const p = reduce ? 1 : clamp((vh * 0.82 - r.top) / (r.height + vh * 0.2));
        const lit = Math.round(p * items.length);
        items.forEach((w, i) => w.classList.toggle("lit", i < lit));
      });
      fills.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty(
          "--fill",
          reduce ? 1 : clamp((vh * 0.6 - r.top) / r.height).toFixed(3),
        );
      });
      parallax.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const offset = (r.top + r.height / 2 - vh / 2) * Number(el.dataset.parallax);
        el.style.setProperty("--py", offset.toFixed(1) + "px");
      });
    }
    const requestScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    };
    on(window, "scroll", requestScroll, { passive: true });
    on(window, "resize", requestScroll);
    onScroll();

    /* ---------- pointer: hero depth + card tilt + click sparks ---------- */
    if (finePointer && !reduce) {
      let px = 0;
      let py = 0;
      let pending = false;
      on(window, "pointermove", (e) => {
        px = (e.clientX / innerWidth) * 2 - 1;
        py = (e.clientY / innerHeight) * 2 - 1;
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          root.style.setProperty("--mx", px.toFixed(3));
          root.style.setProperty("--my", py.toFixed(3));
        });
      });

      document.querySelectorAll("[data-tilt]").forEach((card) => {
        const move = (e) => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
          card.style.setProperty("--ry", (x * 12).toFixed(2) + "deg");
          card.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(1) + "%");
          card.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(1) + "%");
          card.classList.add("is-tilting");
        };
        const leave = () => {
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
          card.classList.remove("is-tilting");
        };
        on(card, "pointermove", move);
        on(card, "pointerleave", leave);
      });

      const colors = ["#ffd54b", "#ff5d8f", "#5fd3ff", "#6ff0a0", "#b69cff"];
      on(window, "pointerdown", (e) => {
        if (e.button !== 0) return;
        for (let i = 0; i < 10; i++) {
          const dot = document.createElement("i");
          dot.className = "spark";
          const size = 4 + Math.round(Math.random()) * 4;
          dot.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;width:${size}px;height:${size}px;background:${colors[i % colors.length]}`;
          document.body.appendChild(dot);
          const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
          const dist = 26 + Math.random() * 34;
          dot
            .animate(
              [
                { transform: "translate(-50%,-50%)", opacity: 1 },
                {
                  transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist + 12}px))`,
                  opacity: 0,
                },
              ],
              { duration: 520 + Math.random() * 200, easing: "steps(7, end)" },
            )
            .finished.then(() => dot.remove());
        }
      });
    }

    /* ---------- table of contents scroll-spy ---------- */
    const spy = document.querySelector("[data-spy]");
    if (spy) {
      const links = new Map(
        [...spy.querySelectorAll('a[href^="#"]')].map((a) => [
          a.getAttribute("href").slice(1),
          a,
        ]),
      );
      const watcher = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((a) => a.classList.remove("is-active"));
            links.get(entry.target.id)?.classList.add("is-active");
          });
        },
        { rootMargin: "-20% 0px -70% 0px" },
      );
      links.forEach((_, id) => {
        const section = document.getElementById(id);
        if (section) watcher.observe(section);
      });
      cleanups.push(() => watcher.disconnect());
    }

    root.classList.add("fx-ready");
    return () => cleanups.forEach((fn) => fn());
  }, []);
  return null;
}
