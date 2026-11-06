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

const LETTER = `Yasmin,

Se você chegou até aqui, é porque assistiu tudo. Obrigado por isso.

Eu só queria que você soubesse que eu penso MT em vc, cada uma das fotos é um pedaço seu que você me permitiu fazer parte, e eu guardei todos com muito cuidado e carinho.

Quando eu olho para a sua história, eu vejo uma menina que cresceu, enfrentou muitas coisas, e mesmo assim continuou sendo gentil, meiga e boa. Isso não é pouca coisa. Muita gente endurece no caminho, e você sempre foi tão gentil.

Apesar da distância q há, ela nunca foi capaz de diminuir oq vc significa para mim. Você faz parte dos meus dias, e eu sou muito grato por isso.

Eu não fiz este filme por causa de uma data. Quis fazer num dia comum, justamente para vc ver q não preciso de motivo para lembrar de você. Eu lembro sempre.

Se um dia você duvidar do quanto é especial, volte aqui e assista de novo.

Com todo o carinho do mundo,
Garu 💛`;

// 🔒 FECHADURA: o botão "Assistir agora" só libera a partir desta data/hora (horário de Brasília, -03:00).
// Formato: AAAA-MM-DDTHH:MM:SS-03:00. Para testar antes da data, abra o site com #teste no final do endereço.
const RELEASE_AT = "2026-11-06T17:30:00-03:00";

// 🔍 Foto que clareia: a capa e o poster começam borrados (BLUR_MAX px) e ficam mais nítidos a cada dia até a estreia.
// BLUR_DAYS = quantos dias antes da estreia o efeito começa (use o nº de dias entre a publicação e a estreia).
const BLUR_MAX = 0, BLUR_DAYS = 12;

// 🎞️ Teaser curtinho (opcional). Se o arquivo não existir, o botão "Assistir teaser" nem aparece.
const TEASER_SRC = "assets/video/teaser.mp4";
let teaserOK = false;

// Pós-filme configurável
const CREDITS = [
  ["Estrelando","Yasmin (Pucca)"],
  ["Direção","Garu"],
  ["Locações","Paraná · Bahia · Rio de Janeiro"],
  ["Trilha sonora","Photograph · Drunk Text"],
  ["Uma história real","CinemaPG"]
];
const CREDITS_SPEED = 44;
const ENABLE_LETTER = true;
const ENABLE_TICKET = true;

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
const KEY_PROGRESS = "nos-progress", KEY_FAV = "nos-fav", KEY_WATCHED = "nos-watched";

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
function fadeToBlack(callback) {
  const fade = $("fade-black");
  if (!fade) return callback();
  fade.classList.add("show");
  setTimeout(() => { callback(); setTimeout(() => fade.classList.remove("show"), 180); }, 650);
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
  extrasMode = false;
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

/* ---- Controles do player ---- */
const toggle = () => (video.paused ? video.play().catch(() => {}) : video.pause());
$("big-play").addEventListener("click", toggle);
$("c-play").addEventListener("click", toggle);
video.addEventListener("click", () => { toggle(); });
video.addEventListener("play", () => {
  $("c-play").textContent = "⏸";
  $("big-play").classList.add("hide");
  $("pause-card").hidden = true;
  $("player-spinner").hidden = true;
  wake();
});
video.addEventListener("pause", () => {
  $("c-play").textContent = "▶";
  $("big-play").classList.remove("hide");
  $("pause-card").hidden = !player.classList.contains("active");
  player.classList.remove("idle");
  saveProgress(true);
});
video.addEventListener("waiting", () => { $("player-spinner").hidden = false; });
video.addEventListener("playing", () => { $("player-spinner").hidden = true; });
video.addEventListener("error", () => {
  $("player-spinner").hidden = true;
  $("offline-card").hidden = false;
});
window.addEventListener("offline", () => { if (player.classList.contains("active")) $("offline-card").hidden = false; });
window.addEventListener("online", () => { $("offline-card").hidden = true; });

video.addEventListener("loadedmetadata", () => { updateTime(); });
video.addEventListener("timeupdate", () => {
  if (video.duration) $("seek").value = (video.currentTime / video.duration) * 1000;
  $("seek").style.setProperty("--progress", (video.currentTime / (video.duration || 1) * 100).toFixed(2) + "%");
  updateTime(); saveProgress(false);
});
function updateTime() { $("time").textContent = fmt(video.currentTime) + " / " + fmt(video.duration); }
$("seek").addEventListener("input", (e) => { if (video.duration) video.currentTime = (e.target.value / 1000) * video.duration; });
let previewHideTimer;
function showSeekPreview(e) {
  if (!video.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  const preview = $("seek-preview");
  preview.textContent = fmt(ratio * video.duration);
  preview.style.left = rect.left + ratio * rect.width + "px";
  preview.hidden = false;
  clearTimeout(previewHideTimer);
  previewHideTimer = setTimeout(() => { preview.hidden = true; }, 700);
}
$("seek").addEventListener("pointermove", showSeekPreview);
$("seek").addEventListener("pointerdown", showSeekPreview);
$("seek-back").addEventListener("click", () => { video.currentTime = Math.max(0, video.currentTime - 10); wake(); });
$("seek-forward").addEventListener("click", () => { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); wake(); });

$("vol").addEventListener("input", (e) => { video.volume = e.target.value; video.muted = false; icon(); });
$("c-mute").addEventListener("click", () => { video.muted = !video.muted; icon(); });
function icon() { $("c-mute").textContent = video.muted || video.volume === 0 ? "🔇" : "🔊"; }

$("c-full").addEventListener("click", () => {
  if (document.fullscreenElement) return document.exitFullscreen();
  if (player.requestFullscreen) player.requestFullscreen().catch(() => {});
  else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone
});
let wakeLock = null;
async function wake() {
  player.classList.remove("idle");
  clearTimeout(hideTimer);
  if (!video.paused && player.classList.contains("active")) {
    if ("wakeLock" in navigator && !wakeLock && !video.paused) {
      try { wakeLock = await navigator.wakeLock.request("screen"); } catch (_) {}
    }
    hideTimer = setTimeout(() => player.classList.add("idle"), 3000);
  }
}

/* Controles somem após 3s sem movimento enquanto toca */
let hideTimer;
["mousemove", "touchstart", "keydown"].forEach((ev) => player.addEventListener(ev, wake, { passive: true }));
let lastTap = 0, lastSide = "";
player.addEventListener("pointerup", (e) => {
  if (e.target.closest("button,input,.controls")) return;
  const now = Date.now(), side = e.clientX < innerWidth / 2 ? "left" : "right";
  if (now - lastTap < 320 && side === lastSide) {
    video.currentTime = Math.min(video.duration || 0, Math.max(0, video.currentTime + (side === "right" ? 10 : -10)));
  }
  lastTap = now; lastSide = side;
});

/* ---- Avaliação final ---- */
video.addEventListener("ended", () => {
  store.del(KEY_PROGRESS);
  store.set(KEY_WATCHED, "1");
  player.classList.remove("idle");
  updateExtras();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  fadeToBlack(() => { show("credits"); startCredits(); });
});

/* ---- Pós-filme ---- */
function updateExtras() {
  const watched = store.get(KEY_WATCHED) === "1";
  $("btn-extras").hidden = !watched;
  $("btn-rewatch").hidden = !watched;
  if ($("watched-chip")) $("watched-chip").hidden = !watched;
}

function startCredits() {
  const list = $("credits-list");
  list.innerHTML = CREDITS.map((c) => `<p><span>${c[0]}</span><b>${c[1]}</b></p>`).join("");
  $("credits").classList.add("rolling");
  $("credits-skip").hidden = true;
  setTimeout(() => { $("credits-skip").hidden = false; }, 6000);
  setTimeout(() => {
    if ($("credits").classList.contains("active")) advanceAfterCredits();
  }, CREDITS_SPEED * 1000);
}
function advanceAfterCredits() {
  $("credits-skip").hidden = true;
  $("credits").classList.remove("rolling");
  show("ending");
}
$("credits-skip").addEventListener("click", advanceAfterCredits);
$("credits-next").addEventListener("click", advanceAfterCredits);

let letterTimer = null;
function typeLetter() {
  clearInterval(letterTimer);
  const box = $("letter-copy");
  const copy = LETTER || box.innerText.trim();
  box.textContent = "";
  let i = 0;
  letterTimer = setInterval(() => {
    box.textContent += copy[i++] || "";
    box.scrollTop = box.scrollHeight;
    if (i >= copy.length) clearInterval(letterTimer);
  }, 24);
}
function openLetter() {
  if (!ENABLE_LETTER) { openTicket(); return; }
  show("letter");
  typeLetter();
}
function openTicket() {
  if (!ENABLE_TICKET) { openFinale(); return; }
  show("ticket");
}
let extrasMode = false;
function openExtras() { extrasMode = true; openLetter(); }

$("credits-next").addEventListener("click", () => show("ending"));
$("ending-next").addEventListener("click", openLetter);
$("letter-next").addEventListener("click", openTicket);
$("ticket-back").addEventListener("click", () => {
  if (extrasMode) backToCatalog();
  else if (ENABLE_LETTER) { show("letter"); typeLetter(); }
  else { show("ending"); }
});
$("ticket-next").addEventListener("click", () => {
  if (extrasMode) backToCatalog();
  else openFinale();
});
$("btn-extras").addEventListener("click", openExtras);
if ($("btn-rewatch")) $("btn-rewatch").addEventListener("click", () => startWatch(true));
$("final-extras").addEventListener("click", openExtras);
$("final-replay").addEventListener("click", () => startWatch(true));
$("final-back").addEventListener("click", backToCatalog);
updateExtras();
document.querySelectorAll("[data-postfilm-back]").forEach((b) => b.addEventListener("click", backToCatalog));

let selectedReaction = "";
document.querySelectorAll("[data-reaction]").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll("[data-reaction]").forEach((x) => x.classList.remove("selected"));
  b.classList.add("selected");
  selectedReaction = b.dataset.reaction;
}));
$("final-send").addEventListener("click", () => {
  store.set(KEY_WATCHED, "1");
  const message = $("final-message").value.trim();
  const text = [selectedReaction ? `Minha reação: ${selectedReaction}` : "", message].filter(Boolean).join("\n\n");
  if (!text) { $("final-message").focus(); return; }
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
});
$("pause-resume").addEventListener("click", () => video.play().catch(() => {}));

/* ---- Atalhos de teclado ---- */
document.addEventListener("keydown", (e) => {
  // Esc na tela de detalhes volta para o Início
  if (e.key === "Escape" && catalog.classList.contains("active")) return goHome();
  if (e.key === "Escape" && document.querySelector("#credits.active, #ending.active, #letter.active, #ticket.active, #final.active")) {
    return backToCatalog();
  }
  if (!player.classList.contains("active")) return;
  if (e.code === "Space") { e.preventDefault(); toggle(); }
  if (e.key === "ArrowRight") video.currentTime += 10;
  if (e.key === "ArrowLeft") video.currentTime -= 10;
  if (e.key.toLowerCase() === "f") $("c-full").click();
  if (e.key.toLowerCase() === "j" && location.hash.includes("teste")) {
    video.currentTime = Math.max(0, video.duration ? video.duration - 0.5 : 0);
  }
  if (e.key === "Escape" && !document.fullscreenElement) {
    backToCatalog();
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
  const watched = store.get(KEY_WATCHED) === "1";
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
    chip.textContent = watched ? "✓ Assistido" : "🔒 Estreia em " + fmtDate({ day: "numeric", month: "long" });
  } else {
    chip.textContent = watched ? "✓ Assistido" : "▶ Disponível agora";
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