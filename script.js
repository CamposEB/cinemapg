/* ===== CinemaPG — lógica ===== */

/* ---------------- ✏️ CONFIGURAÇÕES (edite aqui) ---------------- */
const VIDEO_SRC  = "assets/video/nos.mp4";      // o filme final
const POSTER_SRC = "assets/filme/poster.jpg";   // imagem dentro do player antes do play (e card da tela Início, no index.html)

// Capas que se alternam na tela de detalhes (use quantas tiver, até 5; as que não existirem são ignoradas)
const COVERS = [
  "assets/catalogo/capa1.jpg", "assets/catalogo/capa2.jpg", "assets/catalogo/capa3.jpg",
  "assets/catalogo/capa4.jpg", "assets/catalogo/capa5.jpg",
];
const COVER_INTERVAL = 6000; // tempo entre trocas (ms)

// WhatsApp que recebe a reação dela. Formato: DDI + DDD + número, só dígitos. Ex.: "5521999998888"
const WHATSAPP_NUMBER = "5521993267426";

// 🔒 FECHADURA: o botão "Assistir agora" só libera a partir desta data/hora (horário de Brasília, -03:00).
// Formato: AAAA-MM-DDTHH:MM:SS-03:00. Para testar antes da data, abra o site com #teste no final do endereço.
const RELEASE_AT = "2026-11-14T00:00:00-03:00";

// 🔍 Foto que clareia: a capa e o poster começam borrados (BLUR_MAX px) e ficam mais nítidos a cada dia até a estreia.
// BLUR_DAYS = quantos dias antes da estreia o efeito começa (use o nº de dias entre a publicação e a estreia).
const BLUR_MAX = 0, BLUR_DAYS = 12;

// 🎞️ Teaser curtinho (opcional). Se o arquivo não existir, o botão "Assistir teaser" nem aparece.
const TEASER_SRC = "assets/video/teaser.mp4";
let teaserOK = false;

// Capítulos do filme: t = segundo em que o capítulo começa. AJUSTE depois que o vídeo estiver pronto!
const CHAPTERS = [
  { t: 0,   title: "Os primeiros passos" },
  { t: 45,  title: "A menina que cresceu" },
  { t: 100, title: "Adolescência" },
  { t: 160, title: "Quando nossos caminhos se cruzaram" },
  { t: 220, title: "Nós" },
  { t: 290, title: "Créditos" },
];

// Mensagens do botão "Pular abertura" (ele nunca pula!)
const SKIP_MESSAGES = [
  "Calma, Yasmin. Tenha paciência, a estreia vale a espera. 🍿",
  "Ainda não! Toda grande história merece uma boa abertura.",
  "Eu avisei que não dava pra pular. 😌 Respira e aprecie.",
  "Insistente, hein? Já já o botão Entrar aparece. 💛",
];
/* --------------------------------------------------------------- */

const $ = (id) => document.getElementById(id);
const video = $("video"), player = $("player"), catalog = $("catalog"), home = $("home");
const KEY_PROGRESS = "nos-progress", KEY_FAV = "nos-fav";

/* Armazenamento seguro (se o navegador bloquear, o site segue funcionando) */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  del(k) { try { localStorage.removeItem(k); } catch (_) {} },
};
const fmt = (t) => {
  if (!isFinite(t)) return "0:00";
  return Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0");
};

/* ---- Navegação entre telas (fade) ---- */
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  // o aviso de boas-vindas não fica por cima da abertura, do filme ou do teaser
  if (id === "presents" || id === "player" || id === "teaser") $("welcome").classList.remove("show");
}
document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));

/* Início (poster) <-> Detalhes */
function goHome() { updateResume(); home.scrollTop = 0; show("home"); }
function openDetails() { catalog.scrollTop = 0; updateResume(); show("catalog"); } // NÃO toca o filme
document.querySelectorAll("[data-home]").forEach((b) => b.addEventListener("click", goHome));
$("feature").addEventListener("click", openDetails);
document.querySelectorAll(".soon-card").forEach((b) => b.addEventListener("click", () => {
  showWelcome(b.dataset.soon + ": em breve, Yasmin. 💛");
}));

/* ---- "Pular abertura": aparece nos primeiros segundos, mas não deixa pular ---- */
const skipBtn = $("skip"), skipMsg = $("skip-msg");
let skipCount = 0, skipTimer;
setTimeout(() => skipBtn.classList.add("show"), 1500);
setTimeout(() => { skipBtn.classList.remove("show"); skipMsg.classList.remove("show"); }, 6000);
skipBtn.addEventListener("click", () => {
  skipMsg.textContent = SKIP_MESSAGES[Math.min(skipCount++, SKIP_MESSAGES.length - 1)];
  skipMsg.classList.add("show");
  skipBtn.classList.remove("shake"); void skipBtn.offsetWidth; skipBtn.classList.add("shake");
  clearTimeout(skipTimer);
  skipTimer = setTimeout(() => skipMsg.classList.remove("show"), 3500);
});

/* ---- Seleção do perfil (apenas visual, sem login real) ---- */
let welcomed = false;
$("profile-yasmin").addEventListener("click", (e) => {
  const el = e.currentTarget;
  el.classList.add("picked");
  setTimeout(() => {
    home.scrollTop = 0;
    updateResume();
    show("home");
    el.classList.remove("picked");
    if (!welcomed) { welcomed = true; setTimeout(showWelcome, 900); }
  }, 800);
});
const WELCOME_DEFAULT = $("welcome").textContent;
let welcomeTimer;
function showWelcome(msg) {
  const w = $("welcome");
  w.textContent = typeof msg === "string" ? msg : WELCOME_DEFAULT;
  w.classList.add("show");
  clearTimeout(welcomeTimer);
  welcomeTimer = setTimeout(() => w.classList.remove("show"), 5500);
}

/* ---- Barra superior ganha fundo ao rolar ---- */
catalog.addEventListener("scroll", () => $("topbar").classList.toggle("solid", catalog.scrollTop > 40));
home.addEventListener("scroll", () => $("topbar-home").classList.toggle("solid", home.scrollTop > 40));

/* ---- Capas que se alternam no destaque ---- */
(async function initCovers() {
  const found = await Promise.all(COVERS.map((src) => new Promise((res) => {
    const img = new Image();
    img.onload = () => res(src); img.onerror = () => res(null); img.src = src;
  })));
  const ok = found.filter(Boolean);
  if (!ok.length) { // sem capas: usa o poster; se ele também não existir, fica o fundo vermelho padrão
    const p = await new Promise((res) => {
      const img = new Image();
      img.onload = () => res(POSTER_SRC); img.onerror = () => res(null); img.src = POSTER_SRC;
    });
    if (!p) return;
    ok.push(p);
  }
  const slides = ok.map((src) => {
    const d = document.createElement("div");
    d.className = "slide"; d.style.backgroundImage = `url("${src}")`;
    $("slides").appendChild(d); return d;
  });
  let i = 0; slides[0].classList.add("on");
  if (slides.length > 1) setInterval(() => {
    slides[i].classList.remove("on"); i = (i + 1) % slides.length; slides[i].classList.add("on");
  }, COVER_INTERVAL);
})();

/* ---- Botão de favorito ---- */
const fav = $("btn-fav");
function setFav(on) {
  fav.classList.toggle("on", on);
  fav.setAttribute("aria-pressed", on);
  fav.querySelector(".heart").textContent = on ? "♥" : "♡";
}
setFav(store.get(KEY_FAV) === "1");
fav.addEventListener("click", () => {
  const on = !fav.classList.contains("on");
  setFav(on); store.set(KEY_FAV, on ? "1" : "0");
});

/* ---- Continuar assistindo ---- */
function getSaved() {
  try { const o = JSON.parse(store.get(KEY_PROGRESS)); return o && o.t > 5 && o.d ? o : null; }
  catch (_) { return null; }
}
function updateResume() {
  const locked = isLocked();
  const s = locked ? null : getSaved();
  // barrinha de progresso no card do poster (tela Início)
  $("feat-bar").hidden = !s;
  if (s) $("feat-bar-fill").style.width = Math.min(100, (s.t / s.d) * 100) + "%";
  if (locked) return;
  // botão e barra na tela de detalhes
  $("btn-watch").textContent = s ? "▶ Continuar de onde parou" : "▶ Assistir agora";
  $("resume").hidden = !s;
  if (s) {
    $("resume-bar").style.width = Math.min(100, (s.t / s.d) * 100) + "%";
    $("resume-label").textContent = "Você parou em " + fmt(s.t);
  }
}
let lastSave = 0;
function saveProgress(force) {
  if (!video.duration || video.currentTime < 5) return;
  const now = Date.now();
  if (!force && now - lastSave < 2000) return;
  lastSave = now;
  if (video.duration - video.currentTime < 8) return store.del(KEY_PROGRESS); // quase no fim = terminou
  store.set(KEY_PROGRESS, JSON.stringify({ t: Math.floor(video.currentTime), d: Math.floor(video.duration) }));
}
window.addEventListener("pagehide", () => saveProgress(true));

/* ---- Iniciar o filme (com aviso dos fones na 1ª vez) ---- */
let loaded = false, noticeSeen = false;
function loadVideo() {
  if (loaded) return;
  loaded = true;
  video.poster = POSTER_SRC;
  video.src = VIDEO_SRC;
  // Se o arquivo não existir, mostra a tela "estreia em preparação"
  video.addEventListener("error", () => { $("soon").hidden = false; player.classList.add("nofile"); });
}
function seekWhenReady(t) {
  if (video.readyState >= 1) video.currentTime = t;
  else video.addEventListener("loadedmetadata", () => { video.currentTime = t; }, { once: true });
}
/* iPhone/Safari só deixa o vídeo tocar se o play nascer de um toque. Como a abertura "CinemaPG apresenta"
   atrasa o play por alguns segundos, damos um "play+pause" mudo já no toque para liberar o vídeo. */
let unlocking = false, mutedBefore = false;
function unlockVideo() {
  mutedBefore = video.muted; video.muted = true; unlocking = true;
  const p = video.play();
  if (p && p.then) p.then(() => { if (unlocking) { video.pause(); video.currentTime = 0; endUnlock(); } }).catch(endUnlock);
}
function endUnlock() { if (!unlocking) return; unlocking = false; video.muted = mutedBefore; }

function enterPlayer() {
  clearTimeout(presentsTimer);
  endUnlock();
  show("player");
  $("endcard").hidden = true;
  video.play().catch(() => {});
  wake();
}

/* 🎬 "CinemaPG apresenta" (só quando começa do início; ao continuar de onde parou, pula) */
let presentsTimer, pendingIntro = false;
const PRESENTS_MS = 5200;
function beginIntro() {
  unlockVideo();
  show("presents");
  clearTimeout(presentsTimer);
  presentsTimer = setTimeout(enterPlayer, PRESENTS_MS);
}
function launch(withIntro) {
  if (!noticeSeen) { pendingIntro = withIntro; show("notice"); }
  else if (withIntro) beginIntro();
  else enterPlayer();
}
function startWatch(fromStart) {
  if (isLocked()) return lockedHint();
  loadVideo();
  const s = getSaved();
  const resuming = !fromStart && !!s;
  seekWhenReady(resuming ? s.t : 0);
  launch(!resuming);
}
$("btn-watch").addEventListener("click", () => startWatch(false));
$("btn-restart").addEventListener("click", () => { store.del(KEY_PROGRESS); updateResume(); startWatch(true); });
$("btn-ready").addEventListener("click", () => { noticeSeen = true; if (pendingIntro) beginIntro(); else enterPlayer(); });

function backToCatalog() { // volta para a tela de detalhes
  video.pause(); saveProgress(true);
  if (document.fullscreenElement) document.exitFullscreen();
  updateResume(); show("catalog");
}
$("btn-back").addEventListener("click", backToCatalog);
$("end-back").addEventListener("click", backToCatalog);

/* ---- Controles do player ---- */
const toggle = () => (video.paused ? video.play().catch(() => {}) : video.pause());
$("big-play").addEventListener("click", toggle);
$("c-play").addEventListener("click", toggle);
video.addEventListener("click", () => { chapPanel.hidden = true; toggle(); });
video.addEventListener("play", () => { $("c-play").textContent = "⏸"; $("big-play").classList.add("hide"); $("endcard").hidden = true; wake(); });
video.addEventListener("pause", () => { $("c-play").textContent = "▶"; $("big-play").classList.remove("hide"); player.classList.remove("idle"); saveProgress(true); });

video.addEventListener("loadedmetadata", () => { updateTime(); buildChapters(); });
video.addEventListener("timeupdate", () => {
  if (video.duration) $("seek").value = (video.currentTime / video.duration) * 1000;
  updateTime(); markChapter(); saveProgress(false);
});
function updateTime() { $("time").textContent = fmt(video.currentTime) + " / " + fmt(video.duration); }
$("seek").addEventListener("input", (e) => { if (video.duration) video.currentTime = (e.target.value / 1000) * video.duration; });

$("vol").addEventListener("input", (e) => { video.volume = e.target.value; video.muted = false; icon(); });
$("c-mute").addEventListener("click", () => { video.muted = !video.muted; icon(); });
function icon() { $("c-mute").textContent = video.muted || video.volume === 0 ? "🔇" : "🔊"; }

$("c-full").addEventListener("click", () => {
  if (document.fullscreenElement) return document.exitFullscreen();
  if (player.requestFullscreen) player.requestFullscreen().catch(() => {});
  else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone
});

/* Controles somem após 3s sem movimento enquanto toca */
let hideTimer;
function wake() {
  player.classList.remove("idle");
  clearTimeout(hideTimer);
  if (!video.paused && chapPanel.hidden) hideTimer = setTimeout(() => player.classList.add("idle"), 3000);
}
["mousemove", "touchstart", "keydown"].forEach((ev) => player.addEventListener(ev, wake, { passive: true }));

/* ---- Capítulos ---- */
const chapPanel = $("chapters");
function buildChapters() {
  const list = CHAPTERS.filter((c) => !video.duration || c.t < video.duration);
  if (!list.length) { $("c-chap").hidden = true; return; }
  chapPanel.innerHTML = "";
  const head = document.createElement("p");
  head.className = "chap-head"; head.textContent = "Capítulos"; chapPanel.appendChild(head);
  list.forEach((c) => {
    const b = document.createElement("button");
    b.dataset.t = c.t;
    const t = document.createElement("span"); t.className = "ct"; t.textContent = fmt(c.t);
    const n = document.createElement("span"); n.textContent = c.title;
    b.append(t, n);
    b.addEventListener("click", () => { video.currentTime = c.t; chapPanel.hidden = true; video.play().catch(() => {}); wake(); });
    chapPanel.appendChild(b);
  });
}
function markChapter() {
  let cur = null;
  chapPanel.querySelectorAll("button").forEach((b) => {
    if (+b.dataset.t <= video.currentTime + 0.3) cur = b;
    b.classList.remove("cur");
  });
  if (cur) { cur.classList.add("cur"); $("chap-now").textContent = cur.querySelector("span:last-child").textContent; }
}
$("c-chap").addEventListener("click", () => { chapPanel.hidden = !chapPanel.hidden; wake(); });
buildChapters();

/* ---- Avaliação final ---- */
video.addEventListener("ended", () => {
  store.del(KEY_PROGRESS);
  player.classList.remove("idle");
  chapPanel.hidden = true;
  $("end-thanks").hidden = true;
  $("endcard").hidden = false;
});
document.querySelectorAll(".reactions button").forEach((b) => b.addEventListener("click", () => {
  const thanks = $("end-thanks");
  thanks.hidden = false;
  if (WHATSAPP_NUMBER) {
    const msg = `Acabei de assistir NÓS no CinemaPG! Minha reação: ${b.dataset.r} ${b.dataset.m}`;
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
    thanks.textContent = "Agora é só enviar a mensagem no WhatsApp. 💌";
  } else {
    thanks.textContent = "Obrigado por assistir, Yasmin. ❤️";
  }
}));
$("end-replay").addEventListener("click", () => { video.currentTime = 0; $("endcard").hidden = true; video.play().catch(() => {}); });

/* ---- Atalhos de teclado ---- */
document.addEventListener("keydown", (e) => {
  // Esc na tela de detalhes volta para o Início
  if (e.key === "Escape" && catalog.classList.contains("active")) return goHome();
  if (!player.classList.contains("active")) return;
  if (e.code === "Space") { e.preventDefault(); toggle(); }
  if (e.key === "ArrowRight") video.currentTime += 10;
  if (e.key === "ArrowLeft") video.currentTime -= 10;
  if (e.key.toLowerCase() === "f") $("c-full").click();
  if (e.key === "Escape" && !document.fullscreenElement) {
    if (!chapPanel.hidden) chapPanel.hidden = true; else backToCatalog();
  }
});


/* ---- 🔒 Fechadura da estreia + contagem regressiva ---- */
const releaseMs = new Date(RELEASE_AT).getTime();
let clockOffset = 0; // diferença entre o relógio do servidor e o do aparelho (evita burlar mudando a hora do celular)
if (location.protocol.startsWith("http")) {
  fetch(location.href, { method: "HEAD", cache: "no-store" })
    .then((r) => { const d = r.headers.get("date"); if (d) clockOffset = new Date(d).getTime() - Date.now(); wasLocked = isLocked(); tickPremiere(); })
    .catch(() => {});
}
function isLocked() { return !location.hash.includes("teste") && Date.now() + clockOffset < releaseMs; }
const fmtDate = (o) => new Date(releaseMs).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", ...o });
$("release-text").textContent = fmtDate({ day: "numeric", month: "long", year: "numeric" });
let wasLocked = isLocked();
function tickPremiere() {
  const locked = isLocked(), btn = $("btn-watch"), chip = $("feature-chip");
  $("premiere").hidden = !locked;
  $("btn-teaser").hidden = !(locked && teaserOK);
  btn.classList.toggle("locked", locked);
  btn.setAttribute("aria-disabled", locked ? "true" : "false");
  chip.classList.toggle("locked", locked);
  setBlur(locked ? Math.ceil((releaseMs - Date.now() - clockOffset) / 86400000) : 0);
  if (locked) {
    let s = Math.max(0, Math.floor((releaseMs - Date.now() - clockOffset) / 1000));
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    $("pm-d").textContent = d; $("pm-h").textContent = String(h).padStart(2, "0");
    $("pm-m").textContent = String(m).padStart(2, "0"); $("pm-s").textContent = String(s).padStart(2, "0");
    btn.textContent = "🔒 Estreia em " + fmtDate({ day: "numeric", month: "long" });
    chip.textContent = "🔒 Estreia em " + fmtDate({ day: "numeric", month: "long" });
  } else {
    chip.textContent = "▶ Disponível agora";
    if (wasLocked) {
      updateResume();
      celebratePremiere();
    }
  }
  wasLocked = locked;
}
/* 🎉 Momento da estreia: a contagem zerou com ela no site */
function buildConfetti() {
  const box = $("confetti"); box.innerHTML = "";
  const colors = ["#e0222f", "#b0121f", "#f6f1ea", "#ffd1d6", "#ff7b86"];
  for (let i = 0; i < 46; i++) {
    const el = document.createElement("i"), w = 6 + Math.random() * 7;
    el.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;--w:${w.toFixed(1)}px;--h:${(w * (Math.random() < .5 ? 1 : 2.2)).toFixed(1)}px;` +
      `--c:${colors[i % colors.length]};--d:${(3.5 + Math.random() * 3).toFixed(2)}s;--dl:${(Math.random() * 2.5).toFixed(2)}s;` +
      `--x:${Math.round(Math.random() * 160 - 80)}px;--r:${Math.round(Math.random() * 900 - 450)}deg;border-radius:${Math.random() < .3 ? "50%" : "2px"}`;
    box.appendChild(el);
  }
}
function celebratePremiere() {
  try { $("tv").pause(); } catch (_) {}
  buildConfetti();
  $("premiere-fx").hidden = false;
  if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
}
function closePremiereFx() { $("premiere-fx").hidden = true; updateResume(); }
$("fx-go").addEventListener("click", () => { closePremiereFx(); startWatch(false); });
$("fx-later").addEventListener("click", closePremiereFx);

function lockedHint() {
  const b = $("btn-watch");
  b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
  showWelcome("A estreia ainda não chegou, Yasmin. Falta pouco. 💛");
}
setInterval(tickPremiere, 1000);

/* ---- Linha Paraná ↔ Rio: desenha o fio quando ela rola até a seção ---- */
(function () {
  const dist = $("distance");
  if (!("IntersectionObserver" in window)) return dist.classList.add("in");
  new IntersectionObserver((es, o) => {
    if (es[0].isIntersecting) { dist.classList.add("in"); o.disconnect(); }
  }, { root: catalog, threshold: 0.5 }).observe(dist);
})();


/* ---- 🔍 Capa e poster que clareiam com os dias ---- */
function setBlur(daysLeft) {
  const px = daysLeft > 0 ? BLUR_MAX * Math.min(1, daysLeft / BLUR_DAYS) : 0;
  const hb = document.querySelector(".hero-bg");
  const fi = document.querySelector(".feature-img");
  hb.style.setProperty("--blur", px.toFixed(1) + "px");
  hb.classList.toggle("is-blur", px > 0);
  if (fi) { // o poster é menor na tela, então o desfoque é um pouco menor
    fi.style.setProperty("--blur", (px * 0.6).toFixed(1) + "px");
    fi.classList.toggle("is-blur", px > 0);
  }
}
tickPremiere();
updateResume();

/* ---- 🎞️ Teaser ---- */
const tv = $("tv");
(function probeTeaser() { // só mostra o botão se o arquivo existir
  const v = document.createElement("video");
  v.preload = "metadata";
  v.onloadedmetadata = () => { teaserOK = true; tickPremiere(); };
  v.src = TEASER_SRC;
})();
function openTeaser() {
  if (!tv.getAttribute("src")) tv.src = TEASER_SRC;
  tv.currentTime = 0; $("tz-end").hidden = true;
  show("teaser");
  tv.play().catch(() => {});
}
function closeTeaser() { tv.pause(); show("catalog"); }
$("btn-teaser").addEventListener("click", openTeaser);
$("tz-back").addEventListener("click", closeTeaser);
$("tz-close").addEventListener("click", closeTeaser);
$("tz-replay").addEventListener("click", () => { $("tz-end").hidden = true; tv.currentTime = 0; tv.play().catch(() => {}); });
tv.addEventListener("click", () => (tv.paused ? tv.play() : tv.pause()));
tv.addEventListener("timeupdate", () => { $("tz-prog").style.width = (tv.duration ? (tv.currentTime / tv.duration) * 100 : 0) + "%"; });
tv.addEventListener("ended", () => {
  $("tz-when").textContent = "O filme completo estreia em " + fmtDate({ day: "numeric", month: "long" }) + ". 💛";
  $("tz-end").hidden = false;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("teaser").classList.contains("active")) closeTeaser();
});


/* ---- 📲 App (PWA): service worker + botão "Instalar" ---- */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
const isStandalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const installBtn = $("install");
let installEvt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); installEvt = e;
  if (!isStandalone) installBtn.hidden = false;
});
if (isIOS && !isStandalone) installBtn.hidden = false; // iPhone não tem prompt: mostramos o passo a passo
installBtn.addEventListener("click", async () => {
  if (installEvt) {
    installEvt.prompt();
    try { await installEvt.userChoice; } catch (_) {}
    installEvt = null; installBtn.hidden = true;
  } else {
    showWelcome("No iPhone, abra no Safari, toque em Compartilhar ⬆️ e depois em “Adicionar à Tela de Início”. 📲");
  }
});
window.addEventListener("appinstalled", () => { installBtn.hidden = true; showWelcome("CinemaPG instalado! 🎬"); });