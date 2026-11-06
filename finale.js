/* ===== CinemaPG — Finale romântico =====
   Cena pós-créditos (constelação em forma de coração) + tela "UM DESEJO" + chuva de corações.
   Carregue DEPOIS do script.js:  <script src="finale.js"></script>  */
(function () {
  "use strict";

  /* ---------------- ✏️ EDITE AQUI ---------------- */
  // Um motivo por estrela (8 estrelas). Troque por motivos reais de vocês: quanto mais pessoal, mais impacto.
  const REASONS = [
    "Porque você é gentil mesmo quando o mundo não facilita.",
    "Porque o seu sorriso tem poder sobre o meu dia inteiro.",
    "Entre tantas coisas boas da vida, você é minha favorita.",
    "Porque eu lembro de você até nos dias mais comuns.",
    "Porque você é meiga sem nem perceber.",
    "Porque cada foto sua é uma lembrança que eu guardo com carinho.",
    "Porque você me faz querer ser alguém melhor.",
    "Porque sim. Porque é você.",
  ];
  const STARS_END_TEXT = "Esses são só alguns motivos. Faltaram estrelas pra caber todos. ✨";

  // Tela final: "Um desejo"
  const WISH_KICKER = "ÚLTIMA CENA";
  const WISH_TITLE = "UM DESEJO";
  const WISH_TAG = "Antes dos créditos finais…";
  const WISH_TEXT = "Se eu pudesse escolher uma coisa para o nosso futuro, seria continuar colecionando momentos ao seu lado.";
  const WISH_BUTTON = "Quero guardar esse desejo 💛";
  const WISH_DONE = "Então que venham muitos capítulos, risadas, abraços e histórias.<br>Ainda temos tanto para viver juntos. ❤️";
  const WISH_PREFILL = "Gostei muito e quero q vc continue fazendo parte da minha história 💛"; // já vem escrito na mensagem final

  // Posição das 8 estrelas (formato de coração, grade 300x280). Não precisa mexer.
  const STAR_POINTS = [[150, 252], [84, 188], [42, 122], [78, 56], [150, 100], [222, 56], [258, 122], [216, 188]];
  /* ------------------------------------------------ */

  const CSS = `
/* correção: o brilho das telas pós-filme não deve ocupar espaço no layout */
.postfilm > .postfilm-glow{position:absolute}

#stars,#sequel{overflow:hidden;gap:.5rem;background:
  radial-gradient(ellipse at 50% 38%,rgba(176,18,31,.22),transparent 55%),
  linear-gradient(170deg,#0a0610,#050305 70%)}
#stars::before,#sequel::before{content:"";position:absolute;inset:0;pointer-events:none;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 82% 12%,#fff,transparent),
    radial-gradient(1.5px 1.5px at 30% 72%,#fff,transparent),radial-gradient(1px 1px at 90% 66%,#fff,transparent),
    radial-gradient(1px 1px at 55% 8%,#fff,transparent),radial-gradient(1.5px 1.5px at 8% 52%,#fff,transparent),
    radial-gradient(1px 1px at 70% 88%,#fff,transparent),radial-gradient(1px 1px at 44% 92%,#fff,transparent),
    radial-gradient(1.5px 1.5px at 94% 36%,#fff,transparent),radial-gradient(1px 1px at 22% 38%,#fff,transparent);
  animation:st-twinkle 4s ease-in-out infinite alternate}
@keyframes st-twinkle{from{opacity:.35}to{opacity:.95}}

.st-title{font-family:var(--serif);font-weight:300;color:var(--ivory);text-align:center;text-wrap:balance;
  font-size:clamp(1.7rem,6vw,2.8rem);line-height:1.15;max-width:20ch;margin-top:.2rem}
.st-sky{position:relative;width:min(340px,84vw,calc(44svh * 1.07));aspect-ratio:300/280;margin:.4rem 0}
.st-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.st-seg{fill:none;stroke:var(--red-hi);stroke-width:1.8;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;
  filter:drop-shadow(0 0 4px rgba(224,34,47,.9));transition:stroke-dashoffset .8s cubic-bezier(.5,0,.2,1)}
.st-seg.on{stroke-dashoffset:0}
.st-fill{fill:rgba(224,34,47,.24);opacity:0;transition:opacity 1.6s;transform-box:fill-box;transform-origin:center}
.st-sky.done .st-fill{opacity:1;animation:st-beat 1.5s ease-in-out infinite}
@keyframes st-beat{50%{transform:scale(1.05)}}

.star{position:absolute;width:48px;height:48px;margin:-24px 0 0 -24px;display:grid;place-items:center;
  font-size:1.6rem;color:#8d8d8d;border-radius:50%;transition:color .3s,transform .3s,text-shadow .3s}
.star.next{color:#fff;text-shadow:0 0 16px #fff;animation:st-pulse 1.3s ease-in-out infinite}
.star.lit{color:#fff;transform:scale(1.2);animation:none;text-shadow:0 0 16px rgba(255,214,120,.95),0 0 38px rgba(224,34,47,.65)}
@keyframes st-pulse{50%{transform:scale(1.35);text-shadow:0 0 28px #fff,0 0 50px rgba(224,34,47,.7)}}
.st-sky.done .star.lit{animation:st-beat 1.5s ease-in-out infinite}

.st-count{color:var(--muted);font-size:.85rem;letter-spacing:.2em}
.st-reason{min-height:4.4em;max-width:30ch;text-align:center;font-family:var(--serif);font-size:clamp(1.1rem,3.8vw,1.4rem);
  line-height:1.4;color:var(--ivory)}
.st-reason.pop{animation:rise .7s both}
.star.shake{animation:shake .4s}

#sequel{text-align:center}
.sq-title{font-family:var(--serif);font-weight:300;font-size:clamp(2.6rem,12vw,5rem);line-height:1;letter-spacing:.14em;
  padding-left:.14em;color:var(--ivory);text-shadow:0 16px 56px rgba(246,241,234,.12),0 0 48px rgba(176,18,31,.25)}
.sq-tag{font-family:var(--serif);letter-spacing:.2em;color:var(--muted);font-size:clamp(.85rem,3vw,1.05rem)}
.sq-ask{font-family:var(--serif);font-weight:300;font-size:clamp(1.25rem,4.6vw,1.8rem);max-width:26ch;line-height:1.4;
  color:var(--ivory);margin-top:.8rem;text-wrap:balance}
.sq-arena{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1.2rem;min-height:110px;margin-top:.4rem}
#sq-yes{transition:transform .35s var(--ease-premium),background .2s}
.sq-done{font-family:var(--serif);font-size:clamp(1.2rem,4.4vw,1.7rem);line-height:1.55;color:var(--ivory);max-width:26ch;
  text-wrap:balance;animation:rise 1s both}
#sequel.active > *{animation:rise .9s both}
#sequel.active > *:nth-child(3){animation-delay:.15s}
#sequel.active > *:nth-child(4){animation-delay:.3s}
#sequel.active > *:nth-child(5){animation-delay:.45s}
#sequel.active > *:nth-child(6){animation-delay:.6s}
#sequel.active > .postfilm-exit{animation:none}
#sequel.active .ending-thread path{stroke-dashoffset:1;animation:draw 1.8s .6s cubic-bezier(.5,0,.2,1) forwards}

.fx-hearts{position:fixed;inset:0;z-index:28;pointer-events:none;overflow:hidden}
.fx-hearts span{position:absolute;bottom:-8%;opacity:0;animation:fx-heart 4s ease-out forwards}
@keyframes fx-heart{
  0%{transform:translate(0,0) scale(.6);opacity:0}
  12%{opacity:1}
  100%{transform:translate(var(--dx),-110vh) scale(1.2) rotate(var(--rot));opacity:0}}
`;

  const HTML = `
<section id="stars" class="screen postfilm" aria-label="Cena pós-créditos">
  <p class="postfilm-kicker">CENA PÓS-CRÉDITOS</p>
  <h2 class="st-title" id="st-title">Toque na estrela que brilha, Yasmin.</h2>
  <div class="st-sky" id="st-sky">
    <svg class="st-svg" viewBox="0 0 300 280" aria-hidden="true"><g id="st-lines"></g></svg>
  </div>
  <p class="st-count" id="st-count">0 / 8</p>
  <p class="st-reason" id="st-reason" aria-live="polite">Cada estrela guarda um motivo.</p>
  <button class="btn btn-primary" id="st-next" type="button" hidden>Continuar</button>
  <button class="btn btn-ghost postfilm-exit" type="button" data-finale-exit>Sair</button>
</section>

<section id="sequel" class="screen postfilm" aria-label="Um desejo">
  <p class="postfilm-kicker" id="sq-kicker"></p>
  <h2 class="sq-title" id="sq-title"></h2>
  <svg class="ending-thread" viewBox="0 0 340 20" aria-hidden="true">
    <path pathLength="1" d="M0 10 C40 -2 70 22 110 10 S170 -2 210 10 S280 22 340 10"/>
  </svg>
  <p class="sq-tag" id="sq-tag"></p>
  <p class="sq-ask" id="sq-ask"></p>
  <div class="sq-arena" id="sq-arena">
    <button class="btn btn-primary" id="sq-yes" type="button"></button>
  </div>
  <p class="sq-done" id="sq-done" hidden></p>
  <button class="btn btn-primary" id="sq-next" type="button" hidden>Continuar</button>
  <button class="btn btn-ghost postfilm-exit" type="button" data-finale-exit>Sair</button>
</section>`;

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML("beforeend", HTML);

  const $ = (id) => document.getElementById(id);
  const vibrate = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {} };

  /* ---------- Chuva de corações ---------- */
  let layer = null;
  function hearts(n) {
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "fx-hearts";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    const set = ["💛", "❤️", "💖", "✨", "💗"];
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.textContent = set[i % set.length];
      s.style.cssText =
        `left:${(Math.random() * 100).toFixed(1)}%;font-size:${(18 + Math.random() * 26).toFixed(0)}px;` +
        `--dx:${Math.round(Math.random() * 140 - 70)}px;--rot:${Math.round(Math.random() * 60 - 30)}deg;` +
        `animation-duration:${(3 + Math.random() * 2.5).toFixed(2)}s;animation-delay:${(Math.random() * 0.9).toFixed(2)}s`;
      s.addEventListener("animationend", () => s.remove());
      layer.appendChild(s);
    }
  }
  // um mimo extra na tela final: as reações soltam corações
  document.querySelectorAll("[data-reaction]").forEach((b) => b.addEventListener("click", () => hearts(14)));

  /* ---------- Constelação ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const N = STAR_POINTS.length;
  const sky = $("st-sky"), linesG = $("st-lines"), reasonEl = $("st-reason");
  const stars = [], segs = [];
  let idx = 0, timers = [];

  (function build() {
    const poly = document.createElementNS(NS, "polygon");
    poly.setAttribute("class", "st-fill");
    poly.setAttribute("points", STAR_POINTS.map((p) => p.join(",")).join(" "));
    linesG.appendChild(poly);
    STAR_POINTS.forEach((a, i) => {
      const b = STAR_POINTS[(i + 1) % N];
      const seg = document.createElementNS(NS, "path");
      seg.setAttribute("class", "st-seg");
      seg.setAttribute("pathLength", "1");
      seg.setAttribute("d", `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`);
      linesG.appendChild(seg);
      segs.push(seg);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "star";
      btn.textContent = "✦";
      btn.setAttribute("aria-label", "Estrela " + (i + 1));
      btn.style.left = (a[0] / 300 * 100) + "%";
      btn.style.top = (a[1] / 280 * 100) + "%";
      btn.addEventListener("click", () => tapStar(i));
      sky.appendChild(btn);
      stars.push(btn);
    });
  })();

  function setReason(text) {
    reasonEl.textContent = text;
    reasonEl.classList.remove("pop"); void reasonEl.offsetWidth; reasonEl.classList.add("pop");
  }
  function resetStars() {
    timers.forEach(clearTimeout); timers = [];
    idx = 0;
    sky.classList.remove("done");
    segs.forEach((s) => s.classList.remove("on"));
    stars.forEach((b, i) => { b.className = "star" + (i === 0 ? " next" : ""); });
    $("st-count").textContent = "0 / " + N;
    $("st-title").textContent = "Toque na estrela que brilha, Yasmin.";
    reasonEl.textContent = "Cada estrela guarda um motivo.";
    $("st-next").hidden = true;
  }
  function tapStar(i) {
    if (i < idx) { setReason(REASONS[i] || ""); return; }
    if (i > idx) {
      setReason("Siga a estrela que está brilhando ✨");
      stars[i].classList.remove("shake"); void stars[i].offsetWidth; stars[i].classList.add("shake");
      return;
    }
    stars[i].classList.remove("next");
    stars[i].classList.add("lit");
    if (i > 0) segs[i - 1].classList.add("on");
    setReason(REASONS[i] || "");
    idx++;
    $("st-count").textContent = idx + " / " + N;
    vibrate(25);
    if (idx < N) stars[idx].classList.add("next");
    else completeStars();
  }
  function completeStars() {
    timers.push(setTimeout(() => segs[N - 1].classList.add("on"), 500));
    timers.push(setTimeout(() => {
      sky.classList.add("done");
      $("st-title").textContent = "Olha o que a gente desenhou. 💛";
      hearts(26);
      vibrate([60, 50, 60]);
    }, 1300));
    timers.push(setTimeout(() => { setReason(STARS_END_TEXT); $("st-next").hidden = false; }, 3600));
  }

  /* ---------- UM DESEJO ---------- */
  const wishBtn = $("sq-yes"), arena = $("sq-arena"), ask = $("sq-ask"), done = $("sq-done");
  let accepted = false, wishTimer = null;

  $("sq-kicker").textContent = WISH_KICKER;
  $("sq-title").textContent = WISH_TITLE;
  $("sq-tag").textContent = WISH_TAG;
  wishBtn.textContent = WISH_BUTTON;

  function resetWish() {
    clearTimeout(wishTimer);
    accepted = false;
    ask.textContent = WISH_TEXT;
    ask.hidden = false; arena.hidden = false; done.hidden = true; $("sq-next").hidden = true;
  }
  function keepWish() {
    if (accepted) return;
    accepted = true;
    arena.hidden = true; ask.hidden = true;
    done.innerHTML = WISH_DONE; done.hidden = false;
    hearts(42);
    setTimeout(() => hearts(24), 1400);
    vibrate([80, 60, 80, 60, 120]);
    wishTimer = setTimeout(() => { $("sq-next").hidden = false; }, 2200);
  }
  wishBtn.addEventListener("click", keepWish);

  /* ---------- Fluxo ---------- */
  window.openFinale = function () { // chamado pelo script.js no lugar de show("final")
    resetStars();
    resetWish();
    show("stars");
  };
  $("st-next").addEventListener("click", () => show("sequel"));
  $("sq-next").addEventListener("click", () => {
    const ta = $("final-message");
    if (ta && accepted && !ta.value.trim()) ta.value = WISH_PREFILL;
    show("final");
  });
  document.querySelectorAll("[data-finale-exit]").forEach((b) => b.addEventListener("click", () => backToCatalog()));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.querySelector("#stars.active, #sequel.active")) backToCatalog();
  });
})();