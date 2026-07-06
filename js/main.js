/* ============================================================
   PORTFOLIO — main.js
   - hero: WebGL liquid pastel field / glass cards tilt /
           masked line reveal / live clock
   - custom cursor (dot + trailing ring)
   - playground: generative poster (seeded, animated)
   - scroll effects (reveal, parallax blobs, progress bar)
   ============================================================ */

(() => {
  "use strict";

  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(pointer: fine)").matches;
  const TAU = Math.PI * 2;

  /* ==========================================================
     1. HERO — WebGL liquid pastel field
     domain-warped fbm noise, palette mapped mostly-white,
     pointer warps the flow locally.
     ========================================================== */

  const glCanvas = document.getElementById("heroGL");
  const hero = document.querySelector(".hero");

  if (glCanvas && hero) {
    const gl = glCanvas.getContext("webgl", { antialias: false, depth: false, stencil: false, alpha: false });

    if (!gl) {
      glCanvas.remove(); // graceful fallback: pastel blobs behind still show
    } else {
      const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
      const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform vec2 uMouse;

vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0*fract(p*C.www)-1.0;
  vec3 h = abs(x)-0.5;
  vec3 ox = floor(x+0.5);
  vec3 a0 = x-ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x = a0.x*x0.x + h.x*x0.y;
  g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0*dot(m, g);
}
float fbm(vec2 p){
  float f = 0.0;
  float a = 0.5;
  for(int i = 0; i < 4; i++){ f += a*snoise(p); p *= 2.03; a *= 0.5; }
  return 0.5 + 0.5*f;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv;
  p.x *= uRes.x / uRes.y;
  float t = uT * 0.05;
  vec2 m = uMouse;
  m.x *= uRes.x / uRes.y;
  float md = distance(p, m);
  vec2 mw = (p - m) * exp(-md * 3.0) * 0.45;
  vec2 q = vec2(fbm(p*0.8 + vec2(0.0, t)), fbm(p*0.8 + vec2(5.2, t*1.35)));
  vec2 r = vec2(fbm(p*0.95 + 1.5*q + vec2(1.7, 9.2) + mw), fbm(p*0.95 + 1.5*q + vec2(8.3, 2.8) - mw));
  float n = fbm(p*0.75 + 1.4*r);
  vec3 white = vec3(0.992);
  vec3 blue  = vec3(0.812, 0.894, 0.961);
  vec3 lav   = vec3(0.867, 0.824, 0.941);
  vec3 pink  = vec3(0.961, 0.827, 0.906);
  vec3 mint  = vec3(0.784, 0.925, 0.851);
  vec3 lemon = vec3(0.969, 0.941, 0.769);
  vec3 col = white;
  col = mix(col, blue,  smoothstep(0.38, 0.85, q.x) * 0.42);
  col = mix(col, pink,  smoothstep(0.40, 0.90, r.y) * 0.34);
  col = mix(col, lav,   smoothstep(0.48, 0.95, n)   * 0.36);
  col = mix(col, mint,  smoothstep(0.55, 0.95, q.y) * 0.26);
  col = mix(col, lemon, smoothstep(0.62, 1.00, r.x) * 0.20);
  col = mix(col, white, 0.22);
  col = mix(col, white, smoothstep(0.45, 1.0, distance(uv, vec2(0.5, 0.45)) * 1.3));
  gl_FragColor = vec4(col, 1.0);
}`;

      function shader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      }
      const prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const aLoc = gl.getAttribLocation(prog, "a");
      gl.enableVertexAttribArray(aLoc);
      gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

      const uRes = gl.getUniformLocation(prog, "uRes");
      const uT = gl.getUniformLocation(prog, "uT");
      const uMouse = gl.getUniformLocation(prog, "uMouse");

      const t0 = performance.now();
      let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
      let running = false, rafId = null;

      function resize() {
        const rect = glCanvas.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio || 1, 1.75);
        glCanvas.width = Math.max(1, Math.round(rect.width * dpr));
        glCanvas.height = Math.max(1, Math.round(rect.height * dpr));
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      }

      function frame(now) {
        mx += (tmx - mx) * 0.05;
        my += (tmy - my) * 0.05;
        gl.uniform2f(uRes, glCanvas.width, glCanvas.height);
        gl.uniform1f(uT, (now - t0) / 1000);
        gl.uniform2f(uMouse, mx, my);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      function loop(now) {
        if (!running) return;
        frame(now);
        rafId = requestAnimationFrame(loop);
      }

      resize();
      window.addEventListener("resize", resize);

      if (REDUCED) {
        frame(t0 + 24000); // one static frame
      } else {
        hero.addEventListener(
          "pointermove",
          (e) => {
            const r = glCanvas.getBoundingClientRect();
            tmx = (e.clientX - r.left) / r.width;
            tmy = 1 - (e.clientY - r.top) / r.height;
          },
          { passive: true }
        );
        new IntersectionObserver(
          (entries) => {
            running = entries[0].isIntersecting && !document.hidden;
            if (running) rafId = requestAnimationFrame(loop);
            else cancelAnimationFrame(rafId);
          },
          { threshold: 0.02 }
        ).observe(glCanvas);
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            running = false;
            cancelAnimationFrame(rafId);
          }
        });
      }
    }
  }

  /* ---------- glass cards: 3D tilt + parallax + sheen ---------- */
  const cards = [...document.querySelectorAll(".g-card")];

  if (hero && cards.length && FINE && !REDUCED) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let lastX = 0, lastY = 0, pRaf = null;

    function tiltLoop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      for (const card of cards) {
        const depth = parseFloat(card.dataset.depth || 1);
        card.style.transform =
          `translate3d(${(cx * depth * 26).toFixed(2)}px, ${(cy * depth * 18).toFixed(2)}px, 0) ` +
          `rotateX(${(-cy * depth * 6).toFixed(2)}deg) rotateY(${(cx * depth * 8).toFixed(2)}deg)`;
        const body = card.firstElementChild;
        const r = card.getBoundingClientRect();
        body.style.setProperty("--shx", `${(((lastX - r.left) / r.width) * 100).toFixed(1)}%`);
        body.style.setProperty("--shy", `${(((lastY - r.top) / r.height) * 100).toFixed(1)}%`);
      }
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001) pRaf = requestAnimationFrame(tiltLoop);
      else pRaf = null;
    }

    hero.addEventListener(
      "pointermove",
      (e) => {
        const r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
        lastX = e.clientX;
        lastY = e.clientY;
        if (!pRaf) tiltLoop();
      },
      { passive: true }
    );
  }

  /* ---------- masked line reveal ---------- */
  requestAnimationFrame(() => {
    setTimeout(() => document.body.classList.add("hero-in"), 80);
  });

  /* ---------- live clock (Tokyo) ---------- */
  const clockEl = document.getElementById("heroClock");
  if (clockEl) {
    const fmt = new Intl.DateTimeFormat("ja-JP", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Tokyo",
    });
    const tick = () => {
      clockEl.textContent = fmt.format(new Date());
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ==========================================================
     2. CUSTOM CURSOR — dot + trailing ring
     ========================================================== */

  if (FINE && !REDUCED) {
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.append(dot, ring);
    document.body.classList.add("has-cursor");

    let dx = innerWidth / 2, dy = innerHeight / 2;
    let rx = dx, ry = dy;
    let visible = false, cRaf = null;

    function cursorLoop() {
      rx += (dx - rx) * 0.16;
      ry += (dy - ry) * 0.16;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      if (Math.abs(dx - rx) + Math.abs(dy - ry) > 0.3) cRaf = requestAnimationFrame(cursorLoop);
      else cRaf = null;
    }

    window.addEventListener(
      "pointermove",
      (e) => {
        dx = e.clientX;
        dy = e.clientY;
        if (!visible) {
          visible = true;
          dot.style.opacity = "1";
          ring.style.opacity = "1";
        }
        dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        if (!cRaf) cursorLoop();
      },
      { passive: true }
    );

    document.addEventListener("mouseover", (e) => {
      ring.classList.toggle(
        "is-active",
        !!e.target.closest("a, button, #posterCanvas, .work-card")
      );
    });

    document.documentElement.addEventListener("mouseleave", () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      visible = false;
    });
  }

  /* ==========================================================
     3. GENERATIVE POSTER (playground)
     seeded random composition: soft blobs (multiply blend),
     concentric arcs, halftone dots, hairlines, typography.
     constantly drifting; regenerate on click.
     ========================================================== */

  const poster = document.getElementById("posterCanvas");

  if (poster) {
    const pctx = poster.getContext("2d");
    const W = poster.width;   // 840
    const H = poster.height;  // 1120
    const seedEl = document.getElementById("posterSeed");
    const btn = document.getElementById("btnGenerate");

    const PASTELS = ["#cfe4f5", "#ddd2f0", "#f5d3e7", "#f7f0c4", "#c8ecd9"];
    const ACCENTS = ["#9db8e8", "#b7a6e3", "#e8a8cc", "#cdb960", "#8fd0b8"];
    const INK = "#4a4655";
    const WORDS = ["SOFT", "TONE", "FORM", "PALE", "PLAY", "HUE"];

    function mulberry32(a) {
      return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let z = Math.imul(a ^ (a >>> 15), 1 | a);
        z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
      };
    }
    const easeOut = (x) => 1 - Math.pow(1 - x, 3);

    function compose(seed) {
      const rnd = mulberry32(seed);
      const pick = (arr) => arr[(rnd() * arr.length) | 0];

      const blobs = Array.from({ length: 2 + ((rnd() * 2) | 0) }, () => {
        const k = 7 + ((rnd() * 4) | 0);
        return {
          cx: W * (0.22 + rnd() * 0.56),
          cy: H * (0.18 + rnd() * 0.55),
          r: W * (0.16 + rnd() * 0.2),
          jit: Array.from({ length: k }, () => 0.72 + rnd() * 0.56),
          k,
          color: pick(PASTELS),
          rot0: rnd() * TAU,
          spin: (rnd() - 0.5) * 0.14,
        };
      });

      const rings = {
        cx: W * (0.25 + rnd() * 0.5),
        cy: H * (0.25 + rnd() * 0.45),
        radii: Array.from({ length: 3 + ((rnd() * 3) | 0) }, (_, i) => 46 + i * (26 + rnd() * 22)),
        start: rnd() * TAU,
        span: 1.1 + rnd() * 3.4,
        speed: (rnd() - 0.5) * 0.22,
      };

      const gap = 17 + rnd() * 9;
      const dots = {
        x: W * (0.08 + rnd() * 0.45),
        y: H * (0.52 + rnd() * 0.3),
        cols: 8 + ((rnd() * 7) | 0),
        rows: 6 + ((rnd() * 6) | 0),
        gap,
        maxR: 3 + rnd() * 3.5,
        color: pick(ACCENTS),
      };

      const lines = Array.from({ length: 3 + ((rnd() * 3) | 0) }, () => {
        const vertical = rnd() > 0.5;
        const pos = 0.12 + rnd() * 0.76;
        return vertical
          ? { x1: W * pos, y1: H * 0.06, x2: W * pos, y2: H * 0.94 }
          : { x1: W * 0.07, y1: H * pos, x2: W * 0.93, y2: H * pos };
      });

      const bar = {
        x: W * (0.1 + rnd() * 0.6),
        y: H * (0.08 + rnd() * 0.12),
        w: 60 + rnd() * 140,
        h: 14 + rnd() * 10,
        color: pick(ACCENTS),
      };

      return {
        seed,
        blobs,
        rings,
        dots,
        lines,
        bar,
        word: pick(WORDS),
        wordY: H * (0.72 + rnd() * 0.14),
        no: String(seed % 10000).padStart(4, "0"),
      };
    }

    function blobPath(b, time, scale) {
      const pts = [];
      for (let i = 0; i < b.k; i++) {
        const a = b.rot0 + time * b.spin + (i / b.k) * TAU;
        const r = b.r * b.jit[i] * scale * (1 + 0.045 * Math.sin(time * 1.4 + i * 2.1));
        pts.push([b.cx + Math.cos(a) * r, b.cy + Math.sin(a) * r]);
      }
      pctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        if (i === 0) pctx.moveTo(mx, my);
        else pctx.quadraticCurveTo(x1, y1, mx, my);
        if (i === pts.length - 1) pctx.quadraticCurveTo(x2, y2, (x2 + pts[0][0]) / 2, (y2 + pts[0][1]) / 2);
      }
      pctx.closePath();
    }

    function render(c, time, p) {
      const e = easeOut(p);
      pctx.setTransform(1, 0, 0, 1, 0, 0);
      pctx.fillStyle = "#fdfdfd";
      pctx.fillRect(0, 0, W, H);

      // pastel blobs, print-like multiply overlap
      pctx.globalCompositeOperation = "multiply";
      for (const b of c.blobs) {
        pctx.fillStyle = b.color;
        blobPath(b, time, e);
        pctx.fill();
      }
      pctx.globalCompositeOperation = "source-over";

      // hairlines
      pctx.strokeStyle = "rgba(74, 70, 85, 0.35)";
      pctx.lineWidth = 1;
      for (const l of c.lines) {
        pctx.beginPath();
        pctx.moveTo(l.x1, l.y1);
        pctx.lineTo(l.x1 + (l.x2 - l.x1) * e, l.y1 + (l.y2 - l.y1) * e);
        pctx.stroke();
      }

      // concentric arcs
      pctx.strokeStyle = INK;
      pctx.lineWidth = 2;
      pctx.lineCap = "round";
      c.rings.radii.forEach((r, i) => {
        const dir = i % 2 ? 1 : -1;
        const s = c.rings.start + time * c.rings.speed * dir;
        pctx.beginPath();
        pctx.arc(c.rings.cx, c.rings.cy, r, s, s + c.rings.span * e);
        pctx.stroke();
      });

      // halftone dot grid
      pctx.fillStyle = c.dots.color;
      const maxD = Math.hypot(c.dots.cols, c.dots.rows);
      for (let i = 0; i < c.dots.cols; i++) {
        for (let j = 0; j < c.dots.rows; j++) {
          const pop = Math.min(1, Math.max(0, p * 2.2 - (i + j) * 0.04));
          if (pop <= 0) continue;
          const fade = 1 - Math.hypot(i, j) / maxD;
          const r =
            c.dots.maxR * fade * easeOut(pop) *
            (0.82 + 0.18 * Math.sin(time * 2 + (i + j) * 0.5));
          if (r < 0.2) continue;
          pctx.beginPath();
          pctx.arc(c.dots.x + i * c.dots.gap, c.dots.y + j * c.dots.gap, r, 0, TAU);
          pctx.fill();
        }
      }

      // accent bar
      pctx.fillStyle = c.bar.color;
      pctx.fillRect(c.bar.x, c.bar.y, c.bar.w * e, c.bar.h);

      // typography
      pctx.fillStyle = INK;
      pctx.globalAlpha = e;
      pctx.font = '800 150px "Syne", sans-serif';
      pctx.fillText(c.word, W * 0.09, c.wordY);
      pctx.font = '500 22px "Syne", sans-serif';
      pctx.fillText(`GRAPHIC WORKS — No. ${c.no}`, W * 0.09, c.wordY + 44);
      pctx.save();
      pctx.translate(W - 44, H * 0.09);
      pctx.rotate(Math.PI / 2);
      pctx.font = '600 20px "Syne", sans-serif';
      pctx.fillText("PORTFOLIO / 2026 — GENERATIVE", 0, 0);
      pctx.restore();
      pctx.globalAlpha = 1;

      // frame + registration marks
      pctx.strokeStyle = "rgba(74, 70, 85, 0.4)";
      pctx.lineWidth = 1;
      pctx.strokeRect(26, 26, W - 52, H - 52);
      const cross = (x, y) => {
        pctx.beginPath();
        pctx.moveTo(x - 8, y);
        pctx.lineTo(x + 8, y);
        pctx.moveTo(x, y - 8);
        pctx.lineTo(x, y + 8);
        pctx.stroke();
      };
      cross(26, 26);
      cross(W - 26, 26);
      cross(26, H - 26);
      cross(W - 26, H - 26);
    }

    let comp = compose((Math.random() * 1e9) | 0);
    let genTime = performance.now();
    let posterVisible = false;
    seedEl.textContent = `No. ${comp.no}`;

    function regenerate() {
      comp = compose((Math.random() * 1e9) | 0);
      genTime = performance.now();
      seedEl.textContent = `No. ${comp.no}`;
      if (REDUCED) render(comp, 0, 1);
    }
    btn.addEventListener("click", regenerate);
    poster.addEventListener("click", regenerate);

    if (REDUCED) {
      render(comp, 0, 1);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(comp, 0, 1));
    } else {
      new IntersectionObserver(
        (entries) => {
          posterVisible = entries[0].isIntersecting;
          if (posterVisible) requestAnimationFrame(tick);
        },
        { threshold: 0.05 }
      ).observe(poster);

      function tick(now) {
        if (!posterVisible || document.hidden) return;
        const p = Math.min(1, (now - genTime) / 900);
        render(comp, now / 1000, p);
        requestAnimationFrame(tick);
      }
    }
  }

  /* ==========================================================
     4. SCROLL EFFECTS
     ========================================================== */

  /* ---------- split section titles into letters ---------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "ch";
      span.style.setProperty("--i", i);
      span.textContent = ch === " " ? " " : ch;
      el.appendChild(span);
    });
  });

  /* ---------- IntersectionObserver: reveal + title split-in ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(entry.target.hasAttribute("data-split") ? "split-in" : "in");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal, [data-split]").forEach((el) => io.observe(el));

  /* ---------- progress bar + parallax blobs ---------- */
  const progressBar = document.getElementById("progressBar");
  const blobs = document.querySelectorAll(".blob");
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressBar) progressBar.style.width = `${(y / Math.max(max, 1)) * 100}%`;
      blobs.forEach((b) => {
        b.style.transform = `translateY(${y * parseFloat(b.dataset.speed || 0.15)}px)`;
      });
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- marquee: pixel-exact loop distance (avoids drift/jump) ---------- */
  const marqueeTrack = document.querySelector(".marquee-track");
  if (marqueeTrack) {
    const syncMarqueeShift = () => {
      const first = marqueeTrack.querySelector("span");
      if (first) marqueeTrack.style.setProperty("--marquee-shift", `${first.getBoundingClientRect().width}px`);
    };
    syncMarqueeShift();
    window.addEventListener("resize", syncMarqueeShift);
  }
})();
