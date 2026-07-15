/* ============================================================
   PORTFOLIO — main.js
   - hero: WebGL liquid pastel field / glass cards tilt /
           masked line reveal
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
  vec2 mw = (p - m) * exp(-md * 1.4) * 0.45;
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

  /* ---------- UIのこだわり: marker→callout lines follow actual layout at any width ---------- */
  const wpUiRows = document.querySelectorAll(".wp-ui-row");
  const syncWpUiLines = () => {
    wpUiRows.forEach((row) => {
      const svg = row.querySelector(".wp-ui-lines");
      if (!svg) return;
      const rowRect = row.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${rowRect.width} ${rowRect.height}`);
      svg.querySelectorAll("line").forEach((line) => {
        const suffix = line.className.baseVal.match(/wp-ui-line-(\w)/);
        const marker = row.querySelector(suffix ? `.wp-ui-marker-${suffix[1]}` : ".wp-ui-marker");
        const callout = row.querySelector(suffix ? `.wp-ui-callout-${suffix[1]}` : ".wp-ui-callout");
        if (!marker || !callout) return;
        const mRect = marker.getBoundingClientRect();
        const cRect = callout.getBoundingClientRect();
        line.setAttribute("x1", mRect.left + mRect.width / 2 - rowRect.left);
        line.setAttribute("y1", mRect.top + mRect.height / 2 - rowRect.top);
        line.setAttribute("x2", cRect.left - rowRect.left);
        line.setAttribute("y2", cRect.top + 20 - rowRect.top);
      });
    });
  };
  if (wpUiRows.length) {
    syncWpUiLines();
    window.addEventListener("resize", syncWpUiLines);
    window.addEventListener("load", syncWpUiLines);
  }

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
      if (wpUiRows.length) syncWpUiLines();
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

  /* ---------- hobby tags: tap to reveal a one-line note ---------- */
  const HOBBY_NOTE_TOOL_ICONS = {
    claude: '<span class="tool-icon tool-claude" title="Claude"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="#d97757" d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg></span>',
    codex: '<span class="tool-icon tool-codex" title="Codex"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.503 0H4.496A4.496 4.496 0 000 4.496v15.007A4.496 4.496 0 004.496 24h15.007A4.496 4.496 0 0024 19.503V4.496A4.496 4.496 0 0019.503 0z" fill="#fff"/><path d="M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z" fill="url(#codexGrad)"/><defs><linearGradient id="codexGrad" x1="12" x2="12" y1="3" y2="21"><stop stop-color="#B1A7FF"/><stop offset=".5" stop-color="#7A9DFF"/><stop offset="1" stop-color="#3941FF"/></linearGradient></defs></svg></span>',
  };
  document.querySelectorAll(".hobby-tag-btn").forEach((btn) => {
    const li = btn.closest("li");
    const note = document.createElement("span");
    note.className = "hobby-note";
    note.textContent = btn.dataset.note || "";
    const toolKeys = (btn.dataset.noteTools || "").split(",").map((k) => k.trim()).filter(Boolean);
    if (toolKeys.length) {
      const icons = document.createElement("span");
      icons.className = "hobby-note-icons";
      icons.innerHTML = toolKeys.map((key) => HOBBY_NOTE_TOOL_ICONS[key] || "").join("");
      note.appendChild(icons);
    }
    li.appendChild(note);
    btn.addEventListener("click", () => {
      const isOpen = li.classList.contains("is-open");
      document.querySelectorAll(".hobby-tags li.is-open").forEach((el) => el.classList.remove("is-open"));
      if (!isOpen) {
        note.style.setProperty("--note-shift", "0px");
        li.classList.add("is-open");
        const margin = 16;
        const rect = note.getBoundingClientRect();
        let shift = 0;
        if (rect.left < margin) shift = margin - rect.left;
        else if (rect.right > window.innerWidth - margin) shift = (window.innerWidth - margin) - rect.right;
        if (shift !== 0) note.style.setProperty("--note-shift", `${shift}px`);
      }
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".hobby-tags")) {
      document.querySelectorAll(".hobby-tags li.is-open").forEach((el) => el.classList.remove("is-open"));
    }
  });

  /* ---------- about policy: slow down handwritten video ---------- */
  const policyVideo = document.getElementById("policyVideo");
  if (policyVideo) {
    const setRate = () => { policyVideo.playbackRate = 0.4; };
    setRate();
    policyVideo.addEventListener("loadeddata", setRate);
    policyVideo.addEventListener("play", setRate);
  }
})();
