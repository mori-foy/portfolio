/* ============================================================
   PORTFOLIO — main.js
   - hero: WebGL liquid pastel field / glass cards tilt /
           masked line reveal / live clock
   - scroll effects (reveal, parallax blobs, progress bar)
   ============================================================ */

(() => {
  "use strict";

  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(pointer: fine)").matches;

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
  vec3 blue  = vec3(0.694, 0.898, 0.965);
  vec3 lav   = vec3(0.804, 0.749, 0.945);
  vec3 pink  = vec3(0.961, 0.827, 0.906);
  vec3 mint  = vec3(0.784, 0.925, 0.851);
  vec3 lemon = vec3(0.969, 0.941, 0.769);
  vec3 col = white;
  col = mix(col, blue,  smoothstep(0.38, 0.85, q.x) * 0.70);
  col = mix(col, pink,  smoothstep(0.40, 0.90, r.y) * 0.24);
  col = mix(col, lav,   smoothstep(0.50, 0.95, n)   * 0.22);
  col = mix(col, mint,  smoothstep(0.55, 0.95, q.y) * 0.34);
  col = mix(col, lemon, smoothstep(0.62, 1.00, r.x) * 0.24);
  col = mix(col, white, 0.14);
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
     3. WORK DETAIL MODAL
     tapping a work/project card opens a detail panel; the
     "サイトを見る" link only shows up when data-url is set.
     ========================================================== */

  const workModal = document.getElementById("workModal");
  if (workModal) {
    const modalTitle = document.getElementById("workModalTitle");
    const modalMeta = document.getElementById("workModalMeta");
    const modalDesc = document.getElementById("workModalDesc");
    const modalTags = document.getElementById("workModalTags");
    const modalLink = document.getElementById("workModalLink");
    let lastFocused = null;

    function openWorkModal(card) {
      modalTitle.textContent = card.dataset.title || "";
      modalMeta.textContent = card.dataset.meta || "";
      modalDesc.textContent = card.dataset.desc || "";

      modalTags.innerHTML = "";
      const tags = (card.dataset.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
      tags.forEach((tag) => {
        const span = document.createElement("span");
        span.textContent = tag;
        modalTags.appendChild(span);
      });

      if (card.dataset.url) {
        modalLink.href = card.dataset.url;
        modalLink.classList.remove("is-hidden");
      } else {
        modalLink.removeAttribute("href");
        modalLink.classList.add("is-hidden");
      }

      lastFocused = document.activeElement;
      workModal.classList.add("is-open");
      workModal.setAttribute("aria-hidden", "false");
      workModal.querySelector(".work-modal-close").focus();
    }

    function closeWorkModal() {
      workModal.classList.remove("is-open");
      workModal.setAttribute("aria-hidden", "true");
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll(".work-card").forEach((card) => {
      card.addEventListener("click", () => {
        // data-page があるカードは専用の詳細ページへ、無ければ簡易モーダル
        if (card.dataset.page) {
          window.location.href = card.dataset.page;
          return;
        }
        openWorkModal(card);
      });
    });
    workModal.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", closeWorkModal);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && workModal.classList.contains("is-open")) closeWorkModal();
    });
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
  function markRevealed(el) {
    el.classList.add(el.hasAttribute("data-split") ? "split-in" : "in");
  }
  // shrinking list of not-yet-revealed elements, kept in sync with the
  // IntersectionObserver so the scroll safety-net below never has to
  // re-query the DOM.
  const pendingReveal = [...document.querySelectorAll(".reveal, [data-split]")];
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        markRevealed(entry.target);
        io.unobserve(entry.target);
        const idx = pendingReveal.indexOf(entry.target);
        if (idx !== -1) pendingReveal.splice(idx, 1);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
  );
  pendingReveal.forEach((el) => io.observe(el));

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
      // safety net: a fast flick-scroll or an instant anchor jump (reduced-motion)
      // can skip an element's viewport crossing between two frames, so the
      // IntersectionObserver never fires and it stays permanently hidden.
      // Iterates a shrinking cached list instead of re-querying the DOM,
      // and becomes a no-op once every element has revealed.
      for (let i = pendingReveal.length - 1; i >= 0; i--) {
        const el = pendingReveal[i];
        if (el.getBoundingClientRect().top < window.innerHeight) {
          markRevealed(el);
          io.unobserve(el);
          pendingReveal.splice(i, 1);
        }
      }
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

  /* ---------- about photo: crossfade between portraits ---------- */
  const aboutPhotoImgs = document.querySelectorAll("#aboutPhoto .about-photo-img");
  if (aboutPhotoImgs.length > 1 && !REDUCED) {
    let activeIndex = 0;
    setInterval(() => {
      aboutPhotoImgs[activeIndex].classList.remove("is-active");
      activeIndex = (activeIndex + 1) % aboutPhotoImgs.length;
      aboutPhotoImgs[activeIndex].classList.add("is-active");
    }, 4000);
  }

  /* ---------- about policy: slow down handwritten video ---------- */
  const policyVideo = document.getElementById("policyVideo");
  if (policyVideo) {
    const setRate = () => { policyVideo.playbackRate = 0.4; };
    setRate();
    policyVideo.addEventListener("loadeddata", setRate);
    policyVideo.addEventListener("play", setRate);
  }
})();
