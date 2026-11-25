/* Tiny Flock: a browser sorting puzzle in the spirit of Fly Home.
   Branches hold up to four birds. Tap a branch to lift the run of
   same-colored birds at its tip, tap another to land them (it must be empty
   or show the same color at its tip, and have room). Four of a kind fly home.
   Levels are generated from a seed and checked with a solver, so every level
   can be cleared. Progress (the level number) stays in localStorage. */
(() => {
  const host = document.querySelector("[data-flock]");
  if (!host) return;
  const t = JSON.parse(host.dataset.copy);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const board = host.querySelector(".flock-board");
  const status = host.querySelector(".flock-status");
  const levelOut = host.querySelector("[data-level]");
  const movesOut = host.querySelector("[data-moves]");
  const undoBtn = host.querySelector("[data-undo]");
  const restartBtn = host.querySelector("[data-restart]");
  const nextBtn = host.querySelector("[data-next]");
  const clearPanel = host.querySelector(".flock-clear");
  const CAP = 4;
  const STORE = "lj-flock-level";
  const PALETTE = [
    ["#ff5d8f", "#c93a6a"],
    ["#ffd54b", "#d9a21f"],
    ["#5fd3ff", "#2a8fd6"],
    ["#6ff0a0", "#2fb36a"],
    ["#a98bff", "#6a4fd0"],
    ["#f6f1ff", "#b9aedb"],
  ];
  // 10×9 pixel bird facing right. x body, d wing, w eye, k outline, o beak/feet.
  const BIRD = [
    "...kkkk...",
    "..kxxxxkk.",
    ".kxxxxwkxk",
    ".kxxxxxxko",
    "kddxxxxxkoo",
    "kdddxxxxk.",
    ".kddxxxk..",
    "..kkkkk...",
    "...o.o....",
  ];
  const FLAP = [
    "...kkkk...",
    "..kxxxxkk.",
    ".kxxxxwkxk",
    "kdxxxxxxko",
    "kddxxxxxkoo",
    ".kddxxxxk.",
    "..kdxxxk..",
    "..kkkkk...",
    "...o.o....",
  ];

  function spritePaths(rows, body, wing) {
    const fill = { x: body, d: wing, w: "#ffffff", k: "#1a1230", o: "#ff8a3d" };
    const byColor = {};
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = row[x];
        if (c === ".") continue;
        let end = x + 1;
        while (row[end] === c) end++;
        byColor[c] = (byColor[c] || "") + `M${x} ${y}h${end - x}v1h-${end - x}z`;
        x = end - 1;
      }
    });
    return Object.entries(byColor)
      .map(([c, d]) => `<path fill="${fill[c]}" d="${d}"/>`)
      .join("");
  }
  const birdSvg = PALETTE.map(
    ([body, wing]) =>
      `<svg viewBox="0 0 11 9" aria-hidden="true" shape-rendering="crispEdges">` +
      `<g class="pose pose-a">${spritePaths(BIRD, body, wing)}</g>` +
      `<g class="pose pose-b">${spritePaths(FLAP, body, wing)}</g></svg>`,
  );

  /* ---------------------------------------------------------------- rules */
  const top = (branch) => branch[branch.length - 1];
  function runLength(branch) {
    if (!branch.length) return 0;
    const c = top(branch).c;
    let n = 0;
    for (let i = branch.length - 1; i >= 0 && branch[i].c === c; i--) n++;
    return n;
  }
  function moveCount(state, from, to) {
    const src = state[from];
    const dst = state[to];
    if (from === to || !src.length || dst.length >= CAP) return 0;
    if (dst.length && top(dst).c !== top(src).c) return 0;
    return Math.min(runLength(src), CAP - dst.length);
  }
  const complete = (b) => b.length === CAP && b.every((bird) => bird.c === b[0].c);

  /* ------------------------------------------------------------ generator */
  function rng(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const colorsFor = (level) => Math.min(PALETTE.length, 2 + Math.ceil(level / 2));

  // Depth-first search over canonical states (branch order does not matter).
  function solvable(colors) {
    const seen = new Set();
    let budget = 40000;
    const key = (s) => s.map((b) => b.join("")).sort().join("|");
    function search(s) {
      if (s.every((b) => !b.length)) return true;
      const k = key(s);
      if (seen.has(k) || --budget < 0) return false;
      seen.add(k);
      for (let from = 0; from < s.length; from++) {
        const src = s[from];
        if (!src.length) continue;
        const run = (() => {
          let n = 0;
          for (let i = src.length - 1; i >= 0 && src[i] === src[src.length - 1]; i--) n++;
          return n;
        })();
        for (let to = 0; to < s.length; to++) {
          const dst = s[to];
          if (to === from || dst.length >= CAP) continue;
          if (dst.length && dst[dst.length - 1] !== src[src.length - 1]) continue;
          if (!dst.length && run === src.length) continue; // pointless shuffle
          const n = Math.min(run, CAP - dst.length);
          const next = s.map((b) => b.slice());
          next[to].push(...next[from].splice(next[from].length - n, n));
          if (next[to].length === CAP && next[to].every((c) => c === next[to][0])) next[to] = [];
          if (search(next)) return true;
        }
      }
      return false;
    }
    return search(colors);
  }

  function generate(level) {
    const n = colorsFor(level);
    const random = rng(level * 7919 + 13);
    for (let attempt = 0; attempt < 60; attempt++) {
      const pool = [];
      for (let c = 0; c < n; c++) for (let k = 0; k < CAP; k++) pool.push(c);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const branches = Array.from({ length: n + 2 }, (_, i) =>
        i < n ? pool.slice(i * CAP, i * CAP + CAP) : [],
      );
      if (branches.some((b) => b.length === CAP && b.every((c) => c === b[0]))) continue;
      if (!solvable(branches)) continue;
      let id = 0;
      return branches.map((b) => b.map((c) => ({ id: "b" + id++, c })));
    }
    // Fallback: a gentle layout that is always solvable.
    let id = 0;
    return Array.from({ length: n + 2 }, (_, i) =>
      i < n ? [0, 1, 2, 3].map((k) => ({ id: "f" + id++, c: (i + (k > 1 ? 1 : 0)) % n })) : [],
    );
  }

  /* ---------------------------------------------------------------- state */
  let level = Math.max(1, Number(localStorage.getItem(STORE)) || 1);
  let state = [];
  let start = [];
  let history = [];
  let moves = 0;
  let selected = -1;
  let winTimer = 0;
  const nodes = new Map();
  const COLOR_OF = new WeakMap();
  let branchEls = [];

  function snapshot() {
    return state.map((b) => b.slice());
  }

  function birdNode(bird) {
    let el = nodes.get(bird.id);
    if (!el) {
      el = document.createElement("span");
      el.className = "flock-bird";
      el.innerHTML = birdSvg[bird.c];
      nodes.set(bird.id, el);
      COLOR_OF.set(el, bird.c);
    }
    return el;
  }

  function label(i) {
    const b = state[i];
    const names = b.map((bird) => t.colors[bird.c]);
    return `${t.branch} ${i + 1}: ${names.length ? names.join(", ") : t.empty}`;
  }

  function build() {
    board.textContent = "";
    nodes.clear();
    branchEls = state.map((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "flock-branch " + (i % 2 ? "is-right" : "is-left");
      btn.style.setProperty("--row", Math.floor(i / 2));
      btn.innerHTML = '<span class="flock-perch"></span><span class="flock-wood" aria-hidden="true"></span>';
      btn.addEventListener("click", () => tap(i));
      board.appendChild(btn);
      return btn;
    });
    board.style.setProperty("--rows", Math.ceil(state.length / 2));
    render();
  }

  function render() {
    const keep = new Set();
    state.forEach((branch, i) => {
      const perch = branchEls[i].firstChild;
      branch.forEach((bird, slot) => {
        const el = birdNode(bird);
        keep.add(bird.id);
        el.classList.toggle("is-lifted", i === selected && slot >= branch.length - runLength(branch));
        if (perch.children[slot] !== el) perch.insertBefore(el, perch.children[slot] || null);
      });
      branchEls[i].setAttribute("aria-label", label(i));
      branchEls[i].setAttribute("aria-pressed", String(i === selected));
    });
    for (const [id, el] of nodes) {
      if (!keep.has(id)) {
        el.remove();
        nodes.delete(id);
      }
    }
    levelOut.textContent = level;
    movesOut.textContent = moves;
    undoBtn.disabled = !history.length;
  }

  function say(text) {
    status.textContent = text;
  }

  /* ---------------------------------------------------------- interaction */
  function tap(i) {
    if (!clearPanel.hidden) return;
    if (selected === -1) {
      if (!state[i].length) return shake(i);
      selected = i;
      say(`${t.colors[top(state[i]).c]} × ${runLength(state[i])}`);
      return render();
    }
    if (selected === i) {
      selected = -1;
      return render();
    }
    const n = moveCount(state, selected, i);
    if (!n) {
      shake(i);
      selected = state[i].length ? i : -1;
      return render();
    }
    move(selected, i, n);
  }

  function shake(i) {
    if (reduce) return;
    branchEls[i].animate(
      [{ translate: "0" }, { translate: "-6px" }, { translate: "6px" }, { translate: "0" }],
      { duration: 240, easing: "steps(4)" },
    );
  }

  function move(from, to, n) {
    history.push({ state: snapshot(), moves });
    const birds = state[from].splice(state[from].length - n, n);
    const firsts = birds.map((b) => birdNode(b).getBoundingClientRect());
    state[to].push(...birds);
    moves++;
    selected = -1;
    say("");
    render();
    const movedEls = birds.map((b) => birdNode(b));
    const lasts = movedEls.map((el) => el.getBoundingClientRect());

    // A finished flock leaves the board state at once; its birds move to an
    // overlay so the player can keep tapping while they fly away.
    let ghosts = [];
    if (complete(state[to])) {
      const box = board.getBoundingClientRect();
      ghosts = state[to].map((b) => {
        const el = nodes.get(b.id);
        const r = el.getBoundingClientRect();
        nodes.delete(b.id);
        el.classList.add("is-ghost");
        el.classList.toggle("is-mirrored", to % 2 === 1);
        el.classList.remove("is-lifted");
        Object.assign(el.style, {
          left: r.left - box.left + "px",
          top: r.top - box.top + "px",
          width: r.width + "px",
        });
        board.appendChild(el);
        return el;
      });
      state[to] = [];
      render();
    }

    const flights = reduce
      ? []
      : birds.map((b, k) => {
          const el = movedEls[k];
          const dx = firsts[k].left - lasts[k].left;
          const dy = firsts[k].top - lasts[k].top;
          el.classList.add("is-flying");
          const flip = to % 2 !== from % 2;
          return el
            .animate(
              [
                { transform: `translate(${dx}px, ${dy}px)${flip ? " scaleX(-1)" : ""}` },
                { transform: `translate(${dx / 2}px, ${dy / 2 - 46}px)${flip ? " scaleX(-1)" : ""}`, offset: 0.5 },
                { transform: "none" },
              ],
              { duration: 420, delay: k * 60, easing: "cubic-bezier(.3,.7,.3,1)", fill: "backwards" },
            )
            .finished.then(() => el.classList.remove("is-flying"));
        });
    if (ghosts.length) Promise.all(flights).then(() => flyHome(ghosts, to));
    afterMove();
  }

  function flyHome(flock, i) {
    const rect = branchEls[i].getBoundingClientRect();
    const color = PALETTE[COLOR_OF.get(flock[0])][0];
    window.littlejoyBurst?.(rect.left + rect.width / 2, rect.top + rect.height / 2, [color, "#ffffff", "#ffd54b"], 14);
    const side = i % 2 ? -1 : 1;
    flock.forEach((el, k) => {
      el.classList.add("is-flying");
      if (reduce) return el.remove();
      el.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: `translate(${side * 30}px, -60px)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${side * 90}px, -${innerHeight * 0.6}px)`, opacity: 0 },
        ],
        { duration: 900, delay: k * 90, easing: "cubic-bezier(.5,0,.8,.4)", fill: "forwards" },
      ).finished.then(() => el.remove());
    });
  }

  function afterMove() {
    render();
    if (state.every((b) => !b.length)) {
      clearTimeout(winTimer);
      winTimer = setTimeout(win, reduce ? 0 : 1300);
      return;
    }
    let any = false;
    for (let a = 0; a < state.length && !any; a++)
      for (let b = 0; b < state.length && !any; b++) if (moveCount(state, a, b)) any = true;
    if (!any) say(t.stuck);
  }

  function win() {
    localStorage.setItem(STORE, String(level + 1));
    say(t.clear);
    clearPanel.querySelector("[data-clear-moves]").textContent = moves;
    clearPanel.hidden = false;
    host.classList.add("is-clear");
    nextBtn.focus({ preventScroll: true });
    if (!reduce) {
      const r = board.getBoundingClientRect();
      for (let k = 0; k < 5; k++)
        setTimeout(
          () => window.littlejoyBurst?.(r.left + Math.random() * r.width, r.top + Math.random() * r.height * 0.6, ["#ffd54b", "#ff5d8f", "#5fd3ff", "#6ff0a0"], 12),
          k * 160,
        );
    }
  }

  function clearGhosts() {
    clearTimeout(winTimer);
    board.querySelectorAll(".is-ghost").forEach((el) => el.remove());
  }

  function load(n) {
    clearGhosts();
    level = n;
    state = generate(level);
    start = snapshot();
    history = [];
    moves = 0;
    selected = -1;
    clearPanel.hidden = true;
    host.classList.remove("is-clear");
    say("");
    build();
  }

  undoBtn.addEventListener("click", () => {
    const last = history.pop();
    if (!last || !clearPanel.hidden) return;
    clearGhosts();
    state = last.state;
    moves = last.moves;
    selected = -1;
    say("");
    render();
  });
  restartBtn.addEventListener("click", () => {
    clearGhosts();
    clearPanel.hidden = true;
    host.classList.remove("is-clear");
    state = start.map((b) => b.slice());
    history = [];
    moves = 0;
    selected = -1;
    say("");
    render();
  });
  nextBtn.addEventListener("click", () => load(level + 1));

  host.classList.add("is-ready");
  load(level);
})();
