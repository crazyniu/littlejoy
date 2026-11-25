/* Littlejoy Games: every interaction and animation on the site, in one small
   vanilla script (no framework runtime ships to the browser).

   The HTML is complete without it. Behaviour hangs off data attributes:
     data-reveal / data-stagger / data-count / data-words / data-fill
     data-parallax / data-tilt / data-spy / data-scramble / data-pixelate
     canvas.starfield[data-density][data-critters]
     [data-menu] [data-lang] [data-catalog] [data-gallery] #lightbox
   Reduced-motion users get every end state immediately. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const run = (name, fn) => {
    try {
      fn();
    } catch (error) {
      console.warn("[littlejoy] " + name, error);
    }
  };

  /* ------------------------------------------------------------ reveals */
  const counted = new WeakSet();
  function countUp(el) {
    if (counted.has(el)) return;
    counted.add(el);
    const target = Number(el.dataset.count);
    if (reduce) return void (el.textContent = target);
    const start = performance.now();
    const tick = (now) => {
      const t = clamp((now - start) / 1400);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const GLYPHS = "#*+=<>/\\_-01";
  function scramble(el) {
    if (reduce || el.dataset.done) return;
    el.dataset.done = "1";
    const final = el.textContent;
    const chars = [...final];
    const pool = [...new Set([...GLYPHS, ...chars.filter((c) => c.trim())])];
    const total = 16 + chars.length;
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const settled = Math.floor((frame / total) * chars.length * 1.4);
      el.textContent = chars
        .map((c, i) =>
          i < settled || !c.trim() ? c : pool[(Math.random() * pool.length) | 0],
        )
        .join("");
      if (settled >= chars.length) {
        clearInterval(timer);
        el.textContent = final;
      }
    }, 34);
  }

  // Stagger counts only the items of a [data-stagger] group that enter in the
  // same batch, so the 18th tile of a grid doesn't wait 1.6 s after scrolling.
  const revealer = new IntersectionObserver(
    (entries) => {
      const batch = new Map();
      const timed = new Set();
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        const item = el.closest("[data-stagger] > *");
        if (item && !timed.has(item)) {
          const n = batch.get(item.parentElement) || 0;
          item.style.setProperty("--d", Math.min(n, 8) * 90 + "ms");
          batch.set(item.parentElement, n + 1);
          timed.add(item);
        }
        el.classList.add("is-in");
        revealer.unobserve(el);
        if (el.matches("[data-count]")) countUp(el);
        $$("[data-count]", el).forEach(countUp);
        if (el.matches("[data-scramble]")) scramble(el);
        $$("[data-scramble]", el).forEach(scramble);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );

  run("reveal", () => {
    $$("[data-reveal], .split, [data-count], [data-scramble]").forEach((el) => {
      if (reduce) return el.classList.add("is-in");
      if (el.matches("[data-count]")) el.textContent = "0";
      revealer.observe(el);
    });
  });

  /* ---------------------------------------------- scroll-linked state */
  run("scroll", () => {
    const words = $$("[data-words]").map((el) => ({ el, items: $$(".mw", el) }));
    const fills = $$("[data-fill]");
    const parallax = reduce ? [] : $$("[data-parallax]");
    let lastY = scrollY;
    let ticking = false;
    function update() {
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
      for (const { el, items } of words) {
        const r = el.getBoundingClientRect();
        const p = reduce ? 1 : clamp((vh * 0.82 - r.top) / (r.height + vh * 0.2));
        const lit = Math.round(p * items.length);
        items.forEach((w, i) => w.classList.toggle("lit", i < lit));
      }
      for (const el of fills) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--fill", reduce ? 1 : clamp((vh * 0.6 - r.top) / r.height).toFixed(3));
      }
      for (const el of parallax) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const offset = (r.top + r.height / 2 - vh / 2) * Number(el.dataset.parallax);
        el.style.setProperty("--py", offset.toFixed(1) + "px");
      }
    }
    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request);
    update();
  });

  /* ------------------------------------- pointer: depth, tilt, magnet */
  const pointer = { x: -1e4, y: -1e4, nx: 0, ny: 0 };
  run("pointer", () => {
    addEventListener(
      "pointermove",
      (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.nx = (e.clientX / innerWidth) * 2 - 1;
        pointer.ny = (e.clientY / innerHeight) * 2 - 1;
      },
      { passive: true },
    );
    if (!fine || reduce) return;
    let pending = false;
    addEventListener(
      "pointermove",
      () => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          root.style.setProperty("--mx", pointer.nx.toFixed(3));
          root.style.setProperty("--my", pointer.ny.toFixed(3));
        });
      },
      { passive: true },
    );

    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
        card.style.setProperty("--ry", (x * 12).toFixed(2) + "deg");
        card.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(1) + "%");
        card.classList.add("is-tilting");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
        card.classList.remove("is-tilting");
      });
    });

    // Buttons lean toward the cursor.
    $$(".btn").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--mgx", ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) + "px");
        btn.style.setProperty("--mgy", ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.removeProperty("--mgx");
        btn.style.removeProperty("--mgy");
      });
    });

    // Pixel confetti on click.
    const colors = ["#ffd54b", "#ff5d8f", "#5fd3ff", "#6ff0a0", "#b69cff"];
    addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("[data-no-sparks]")) return;
      burst(e.clientX, e.clientY, colors, 10);
    });
  });

  function burst(x, y, colors, count) {
    if (reduce) return;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement("i");
      const size = 4 + Math.round(Math.random()) * 4;
      dot.className = "spark";
      dot.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[i % colors.length]}`;
      document.body.appendChild(dot);
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
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
  }
  window.littlejoyBurst = burst;

  /* ------------------------------------------- starfields + critters */
  run("starfield", () => {
    const STAR = ["#ffffff", "#ffd54b", "#b69cff", "#5fd3ff", "#ff5d8f"];
    const BIRD = [
      ["x...x", ".x.x.", "..x.."],
      ["xx.xx", "..x..", "....."],
    ];
    const fields = $$("canvas.starfield").map((canvas) => {
      const field = {
        canvas,
        ctx: canvas.getContext("2d"),
        density: Number(canvas.dataset.density || 1),
        critters: canvas.hasAttribute("data-critters"),
        visible: true,
        w: 0,
        h: 0,
        unit: 2,
        stars: [],
        birds: [],
        bubbles: [],
        pops: [],
        shooter: null,
      };
      new ResizeObserver(() => resize(field)).observe(canvas);
      new IntersectionObserver(([e]) => (field.visible = e.isIntersecting)).observe(canvas);
      return field;
    });
    if (!fields.length) return;

    function resize(f) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const rect = f.canvas.getBoundingClientRect();
      f.dpr = dpr;
      f.w = f.canvas.width = Math.round(rect.width * dpr);
      f.h = f.canvas.height = Math.round(rect.height * dpr);
      f.unit = Math.round(2 * dpr);
      const count = Math.min(420, Math.round(((rect.width * rect.height) / 5200) * f.density));
      f.stars = Array.from({ length: count }, () => ({
        x: Math.random() * f.w,
        y: Math.random() * f.h,
        z: 1 + Math.floor(Math.random() * 3),
        c: STAR[Math.random() < 0.72 ? 0 : 1 + Math.floor(Math.random() * 4)],
        t: Math.random() * Math.PI * 2,
      }));
      if (f.critters && !f.birds.length) {
        const flock = rect.width < 640 ? 4 : 7;
        const baseY = f.h * (0.14 + Math.random() * 0.12);
        f.birds = Array.from({ length: flock }, (_, i) => ({
          x: -i * f.unit * 14 - Math.random() * f.unit * 20,
          y: baseY + (i % 2 ? 1 : -1) * i * f.unit * 4,
          vx: f.unit * (0.55 + Math.random() * 0.15),
          vy: 0,
          phase: Math.random() * 6,
          c: i % 3 === 2 ? "#5fd3ff" : "#ffd54b",
        }));
      }
      draw(f, performance.now());
    }

    const snap = (f, v) => Math.round(v / f.unit) * f.unit;

    function dot(f, x, y, size, color, alpha) {
      f.ctx.globalAlpha = alpha;
      f.ctx.fillStyle = color;
      f.ctx.fillRect(snap(f, x), snap(f, y), size, size);
    }

    function draw(f, time) {
      const { ctx, w, h, unit } = f;
      ctx.clearRect(0, 0, w, h);
      const rect = f.canvas.getBoundingClientRect();
      const px = (pointer.x - rect.left) * f.dpr;
      const py = (pointer.y - rect.top) * f.dpr;
      const mx = reduce ? 0 : -pointer.nx * 0.5;
      const my = reduce ? 0 : -pointer.ny * 0.5;

      for (const s of f.stars) {
        if (!reduce) {
          s.x -= 0.06 * s.z * unit;
          if (s.x < -unit * 4) s.x = w + unit * 2;
        }
        const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(time / 600 + s.t);
        const size = unit * (s.z === 3 ? 2 : 1);
        const x = s.x + mx * s.z * 6 * unit;
        const y = s.y + my * s.z * 4 * unit;
        dot(f, x, y, size, s.c, tw * (0.35 + s.z * 0.2));
        if (s.z === 3 && tw > 0.92) {
          dot(f, x - unit * 2, y + unit / 2, unit, s.c, tw);
          dot(f, x + size + unit, y + unit / 2, unit, s.c, tw);
        }
      }

      if (!reduce) {
        if (!f.shooter && Math.random() < 0.004) {
          f.shooter = { x: Math.random() * w, y: Math.random() * h * 0.4, life: 0 };
        }
        if (f.shooter) {
          const s = f.shooter;
          s.life++;
          s.x += unit * 5;
          s.y += unit * 2.5;
          for (let i = 0; i < 8; i++) {
            ctx.globalAlpha = (1 - i / 8) * (1 - s.life / 50);
            ctx.fillStyle = i < 2 ? "#ffffff" : "#ffd54b";
            ctx.fillRect(snap(f, s.x - i * unit * 2), snap(f, s.y - i * unit), unit * 2, unit);
          }
          if (s.life > 50) f.shooter = null;
        }
      }

      if (f.critters && !reduce) critters(f, time, px, py);
      ctx.globalAlpha = 1;
    }

    // A small flock crossing the sky (it swerves around the cursor) and
    // bubbles rising from the floor that pop when the cursor touches them.
    function critters(f, time, px, py) {
      const { ctx, w, h, unit } = f;
      const cell = unit * 1.5;
      for (const b of f.birds) {
        const dx = b.x - px;
        const dy = b.y - py;
        const d2 = dx * dx + dy * dy;
        const near = unit * 70;
        if (d2 < near * near) b.vy += (dy > 0 ? 1 : -1) * unit * 0.12;
        b.vy *= 0.92;
        b.x += b.vx;
        b.y += b.vy + Math.sin(time / 380 + b.phase) * unit * 0.12;
        if (b.x > w + unit * 30) {
          b.x = -unit * (20 + Math.random() * 60);
          b.y = h * (0.1 + Math.random() * 0.25);
        }
        const frame = BIRD[Math.floor(time / 160 + b.phase) % 2];
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = b.c;
        frame.forEach((row, ry) => {
          for (let rx = 0; rx < row.length; rx++) {
            if (row[rx] === "x") {
              ctx.fillRect(
                Math.round(b.x / cell) * cell + rx * cell,
                Math.round(b.y / cell) * cell + ry * cell,
                cell,
                cell,
              );
            }
          }
        });
      }

      if (f.bubbles.length < (w > 1200 ? 9 : 5) && Math.random() < 0.02) {
        f.bubbles.push({
          x: w * (0.05 + Math.random() * 0.9),
          y: h + unit * 10,
          r: unit * (2 + Math.floor(Math.random() * 3)),
          v: unit * (0.25 + Math.random() * 0.35),
          p: Math.random() * 6,
        });
      }
      f.bubbles = f.bubbles.filter((b) => {
        b.y -= b.v;
        const x = b.x + Math.sin(time / 700 + b.p) * unit * 6;
        const hit = (x - px) ** 2 + (b.y - py) ** 2 < (b.r + unit * 10) ** 2;
        if (hit || b.y < h * 0.35) {
          f.pops.push({ x, y: b.y, r: b.r, life: 0 });
          return false;
        }
        ringPixels(f, x, b.y, b.r, "#5fd3ff", 0.55);
        dot(f, x - b.r * 0.45, b.y - b.r * 0.45, unit, "#ffffff", 0.8);
        return true;
      });
      f.pops = f.pops.filter((p) => {
        p.life++;
        const spread = p.r + p.life * unit * 0.9;
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI / 4) * i;
          dot(f, p.x + Math.cos(a) * spread, p.y + Math.sin(a) * spread, unit, "#ffffff", 1 - p.life / 14);
        }
        return p.life < 14;
      });
    }

    function ringPixels(f, cx, cy, r, color, alpha) {
      const steps = Math.max(8, Math.round(r / f.unit) * 6);
      for (let i = 0; i < steps; i++) {
        const a = (Math.PI * 2 * i) / steps;
        dot(f, cx + Math.cos(a) * r, cy + Math.sin(a) * r, f.unit, color, alpha);
      }
    }

    if (reduce) return;
    const loop = (time) => {
      if (!document.hidden) for (const f of fields) if (f.visible && f.w) draw(f, time);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  /* ---------------------------------------------- depixelate reveal */
  run("pixelate", () => {
    const images = $$("img[data-pixelate]");
    const sharpen = (img) => img.classList.add("is-sharp");
    images.forEach((img) => {
      if (img.complete && img.naturalWidth) sharpen(img);
      else img.addEventListener("load", () => sharpen(img), { once: true });
    });
    if (reduce) return;
    const STEPS = [5, 9, 16, 28, 48, 90];
    function animate(img) {
      // Layout (untransformed) box: the canvas is the image's sibling, so it
      // shares its offsetParent, and it copies the image's own transforms.
      const w = img.offsetWidth;
      const h = img.offsetHeight;
      if (w < 48 || h < 48) return;
      const r = { width: w, height: h };
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const canvas = document.createElement("canvas");
      canvas.className = "pixelate-canvas";
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.setAttribute("aria-hidden", "true");
      const cs = getComputedStyle(img);
      Object.assign(canvas.style, {
        left: img.offsetLeft + "px",
        top: img.offsetTop + "px",
        width: w + "px",
        height: h + "px",
        rotate: cs.rotate,
        translate: cs.translate,
        scale: cs.scale,
        transform: cs.transform,
        zIndex: cs.zIndex,
      });
      img.after(canvas);
      // Source rectangle that matches object-fit: cover.
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      let sx = 0;
      let sy = 0;
      let sw = iw;
      let sh = ih;
      if (cs.objectFit === "cover") {
        const scale = Math.max(r.width / iw, r.height / ih);
        sw = r.width / scale;
        sh = r.height / scale;
        sx = (iw - sw) / 2;
        sy = (ih - sh) / 2;
      }
      const ctx = canvas.getContext("2d");
      const small = document.createElement("canvas");
      const sctx = small.getContext("2d");
      let i = 0;
      const step = () => {
        const cols = STEPS[i];
        const rows = Math.max(1, Math.round((cols * r.height) / r.width));
        small.width = cols;
        small.height = rows;
        sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(small, 0, 0, cols, rows, 0, 0, canvas.width, canvas.height);
        if (++i < STEPS.length) setTimeout(step, 70);
        else {
          canvas.classList.add("is-done");
          setTimeout(() => canvas.remove(), 260);
        }
      };
      step();
    }
    const watcher = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const img = entry.target;
          watcher.unobserve(img);
          const go = () => requestAnimationFrame(() => animate(img));
          if (img.complete && img.naturalWidth) go();
          else img.addEventListener("load", go, { once: true });
        }
      },
      { threshold: 0.3 },
    );
    images.forEach((img) => watcher.observe(img));
  });

  /* ------------------------------------------------------ mobile menu */
  run("menu", () => {
    const toggle = document.querySelector("[data-menu]");
    const menu = document.getElementById("mobile-menu");
    if (!toggle || !menu) return;
    const set = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? toggle.dataset.close : toggle.dataset.open);
      menu.dataset.open = String(open);
      menu.inert = !open;
      root.classList.toggle("menu-open", open);
      if (open) root.classList.remove("header-hidden");
    };
    toggle.addEventListener("click", () => set(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => e.target.closest("a") && set(false));
    addEventListener("keydown", (e) => e.key === "Escape" && set(false));
    matchMedia("(min-width: 960px)").addEventListener("change", (e) => e.matches && set(false));
  });

  /* -------------------------------------------------- language picker */
  run("language", () => {
    $$("select[data-lang]").forEach((select) => {
      select.addEventListener("change", () => {
        const option = select.selectedOptions[0];
        if (option?.dataset.href) location.assign(option.dataset.href + location.hash);
      });
    });
  });

  /* --------------------------------------------------- catalog filter */
  run("filter", () => {
    const catalog = document.querySelector("[data-catalog]");
    if (!catalog) return;
    const buttons = $$(".filter-btn[data-filter]", catalog);
    buttons.forEach((btn) =>
      btn.addEventListener("click", () => {
        const key = btn.dataset.filter;
        catalog.dataset.filter = key;
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        $$(`[data-group="${key}"] [data-reveal]`, catalog).forEach((el) => el.classList.add("is-in"));
        const top = catalog.getBoundingClientRect().top + scrollY - 90;
        if (scrollY > top) scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
      }),
    );
  });

  /* --------------------------------------------------------- lightbox */
  run("lightbox", () => {
    const dialog = document.getElementById("lightbox");
    if (!dialog) return;
    const image = dialog.querySelector(".lightbox-stage img");
    const caption = dialog.querySelector("[data-caption]");
    const counter = dialog.querySelector("[data-counter]");
    const nav = $$("[data-step]", dialog);
    let items = [];
    let index = 0;
    const show = () => {
      const item = items[index];
      image.src = item.src;
      image.alt = item.caption;
      image.style.animation = "none";
      void image.offsetWidth;
      image.style.animation = "";
      caption.textContent = item.caption;
      counter.textContent = items.length > 1 ? `${index + 1} / ${items.length}` : "";
      nav.forEach((b) => (b.hidden = items.length < 2));
    };
    const step = (delta) => {
      index = (index + delta + items.length) % items.length;
      show();
    };
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-lightbox]");
      if (!trigger) return;
      const gallery = trigger.closest("[data-gallery]");
      if (!gallery || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      items = JSON.parse(gallery.dataset.gallery);
      index = Number(trigger.dataset.lightbox) || 0;
      show();
      dialog.showModal();
    });
    nav.forEach((b) => b.addEventListener("click", () => step(Number(b.dataset.step))));
    dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
    dialog.addEventListener("keydown", (e) => {
      if (items.length < 2) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        step(e.key === "ArrowRight" ? 1 : -1);
      }
    });
    let start = null;
    const stage = dialog.querySelector(".lightbox-stage");
    stage.addEventListener("touchstart", (e) => {
      start = e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null;
    });
    stage.addEventListener("touchend", (e) => {
      if (!start || items.length < 2 || e.touches.length) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start[0];
      const dy = t.clientY - start[1];
      start = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    });
  });

  /* ------------------------------------------- contents scroll-spy */
  run("spy", () => {
    const spy = document.querySelector("[data-spy]");
    if (!spy) return;
    const links = new Map($$('a[href^="#"]', spy).map((a) => [a.getAttribute("href").slice(1), a]));
    const watcher = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          links.forEach((a) => a.classList.remove("is-active"));
          links.get(entry.target.id)?.classList.add("is-active");
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    links.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) watcher.observe(section);
    });
  });

  /* --------------------------------- game-over screen: continue timer */
  run("continue", () => {
    const counter = document.querySelector("[data-countdown]");
    if (!counter || reduce) return;
    let n = Number(counter.textContent) || 9;
    const timer = setInterval(() => {
      n--;
      counter.textContent = n;
      counter.animate([{ transform: "scale(1.5)" }, { transform: "none" }], {
        duration: 300,
        easing: "steps(3)",
      });
      if (n <= 0) {
        clearInterval(timer);
        counter.closest("[data-continue]")?.classList.add("is-out");
      }
    }, 1000);
  });

  /* ------------------------------------ page transitions (iris wipe) */
  run("transitions", () => {
    // Remember where the visitor clicked, so the next page can open its
    // iris wipe from that point (see the pagereveal handler in <head>).
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a[href]");
        if (!a || a.target || a.origin !== location.origin || e.defaultPrevented) return;
        const point = e.detail
          ? [e.clientX / innerWidth, e.clientY / innerHeight]
          : [0.5, 0.5];
        try {
          sessionStorage.setItem("lj-vt", JSON.stringify(point));
        } catch {}
      },
      true,
    );
  });

  root.classList.add("fx-ready");
})();
