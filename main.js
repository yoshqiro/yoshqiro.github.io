// Сайт на бумаге, как референс 1. Страницы переключаются по адресу (#/about и т.д.) без перезагрузки.
// Всё, что ломается, ломается рваными полосами и обрывками — не квадратными пикселями.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const css = getComputedStyle(document.documentElement);
const INK = css.getPropertyValue('--ink').trim(), DIM = css.getPropertyValue('--dim').trim(), CYAN = css.getPropertyValue('--cyan').trim();

const ROUTES = ['home', 'about', 'skills', 'works', 'contact'];
const pages = Object.fromEntries([...document.querySelectorAll('.page')].map((p) => [p.dataset.route, p]));
const navLinks = [...document.querySelectorAll('nav a')];
const next = document.querySelector('.next');

/* ---------- Язык (en / ru) ----------
   Английский текст лежит прямо в разметке, русский — здесь, по ключам data-i18n (значение — innerHTML).
   Выбор хранится в localStorage; при первом заходе с русской/украинской системой — ru. */
const RU = {
  skip: 'перейти к содержимому',
  'nav.home': '<i>01</i>главная', 'nav.about': '<i>02</i>обо мне', 'nav.skills': '<i>03</i>услуги', 'nav.works': '<i>04</i>работы', 'nav.contact': '<i>05</i>контакты',
  'home.lead': 'моушн-дизайн, монтаж, анимация логотипов, рекламные ролики, telegram-боты, ии-автоматизация.',
  'home.about': '<i>02</i>обо мне<span>кто я</span>', 'home.skills': '<i>03</i>услуги<span>что я делаю</span>',
  'home.works': '<i>04</i>работы<span>шоурил</span>', 'home.contact': '<i>05</i>контакты<span>где меня найти</span>',
  'h.about': 'обо мне', 'h.skills': 'услуги', 'h.works': 'работы', 'h.contact': 'контакты',
  'about.lead': 'привет! я Артём. занимаюсь дизайном и неплохо монтирую :)',
  'about.p1': 'беру логотип или идею и даю им жизнь — движение, ритм и звук. анимирую логотипы, собираю рекламные ролики, монтирую видео для youtube и соцсетей.',
  'about.p2': 'люблю тёмную эстетику и старые гравюры — отсюда и этот сайт.',
  'about.p3': 'пиши — воплотим твою идею в реальность.',
  'sk.1': '<i>01</i>анимация логотипов', 'sk.2': '<i>02</i>рекламные ролики', 'sk.3': '<i>03</i>монтаж', 'sk.4': '<i>04</i>звуковой дизайн',
  'sk.5': '<i>05</i>telegram-боты', 'sk.6': '<i>06</i>ии-автоматизация', 'sk.7': '<i>07</i>арт-дирекшн для ии',
  reel: 'смотреть шоурил ▶', 'home.reel': 'шоурил · 1 мин ▶',
  'c.note': 'расскажи, каким должен ощущаться твой бренд или в чём задача — отвечу первой идеей.',
  next: 'дальше:',
};
const NAMES = {
  en: { home: 'home', about: 'about', skills: 'skills', works: 'works', contact: 'contact', menu: '[menu]', close: '[close]', title: 'yoshiro — motion design', reel: 'showreel' },
  ru: { home: 'главная', about: 'обо мне', skills: 'услуги', works: 'работы', contact: 'контакты', menu: '[меню]', close: '[закрыть]', title: 'yoshiro — моушн-дизайн и монтаж', reel: 'шоурил' },
};
const EN = {};
document.querySelectorAll('[data-i18n]').forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });
let lang = (() => {
  try { const s = localStorage.getItem('lang'); if (s === 'en' || s === 'ru') return s; } catch {}
  return /^(ru|uk|be)\b/i.test(navigator.language || '') ? 'ru' : 'en';
})();
const T = (k) => NAMES[lang][k];

function setLang(l) {
  lang = l;
  try { localStorage.setItem('lang', l); } catch {}
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    el.innerHTML = (l === 'ru' ? RU[k] : null) ?? EN[k];
    if (el.matches('h1')) el.dataset.text = el.textContent;
  });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  const bt = document.querySelector('.burger');
  bt.textContent = document.body.classList.contains('menu-open') ? T('close') : T('menu');
  dispatchEvent(new Event('langchange'));
}
function pickLang(l) {
  if (l === lang) return;
  setLang(l);
  if (current) mark(current.dataset.route);
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => pickLang(b.dataset.lang)));
document.querySelector('[data-lang-toggle]')?.addEventListener('click', () => pickLang(lang === 'en' ? 'ru' : 'en'));

function tween(dur, f, delay = 0) {
  return new Promise((done) => setTimeout(() => {
    const start = performance.now();
    const step = (now) => {
      const k = clamp((now - start) / dur, 0, 1);
      f(k);
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  }, delay));
}

// Псевдослучайность с зерном: логи каждый раз одинаковые
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

/* ---------- Стены логов (как колонка на референсе 1) ---------- */
const LOGS = {
  boot() {
    const r = rng(7), units = ['wings', 'halo', 'memory', 'grace', 'motion', 'keyframes', 'sound', 'silence', 'heaven', 'fall', 'render', 'vines'];
    const lines = [];
    for (let i = 0; i < 120; i++) {
      const u = units[(r() * units.length) | 0], t = (r() * 99).toFixed(6);
      const k = r();
      if (k < 0.55) lines.push(`[ ${t.padStart(10, ' ')}] ${u}: loading module ${u}_${((r() * 900) | 0) + 100}.ko ... ok`);
      else if (k < 0.85) lines.push(`[ ${t.padStart(10, ' ')}] ${u}: checksum mismatch at 0x${((r() * 0xffffff) | 0).toString(16).padStart(6, '0')} — continuing`);
      else lines.push(`[ ${t.padStart(10, ' ')}] <em>${u}</em>: lost ${((r() * 90) | 0) + 1}% — falling back`);
    }
    return lines.join('\n');
  },
  apt() {
    const r = rng(19);
    const pkgs = ['motion-design', 'logo-reveal', 'sound-design', 'keyframes', 'easing-curves', 'after-images', 'wings', 'halo',
      'grace', 'silence', 'risers', 'kinetic-type', 'color-grade', 'vertical-cut', 'render-queue', 'memory', 'paradise-lost'];
    const v = () => `${(r() * 9) | 0}.${(r() * 30) | 0}.${(r() * 9) | 0}-yoshiro${(r() * 3) | 0}`;
    const lines = [];
    for (let i = 1; i <= 46; i++) {
      const p = pkgs[(r() * pkgs.length) | 0];
      lines.push(`Get:${i} http://heaven.internal/fall main amd64 ${p} ${v()} [${((r() * 900) | 0) + 12} kB]`);
    }
    lines.push(`Fetched ${(r() * 90).toFixed(1)} MB in ${(r() * 9).toFixed(0)}s (${(r() * 9).toFixed(1)} MB/s)`);
    for (let i = 0; i < 70; i++) {
      const p = pkgs[(r() * pkgs.length) | 0], ver = v(), kind = r();
      if (kind < 0.33) lines.push(`Preparing to unpack .../${p}_${ver}_amd64.deb ...`);
      else if (kind < 0.66) lines.push(`Unpacking ${p} (${ver}) over (${v()}) ...`);
      else lines.push(`Setting up ${p} (${ver}) ...`);
      if (r() < 0.06) lines.push('(Reading database ... <em>fallen</em> files and directories currently installed.)');
    }
    return lines.join('\n');
  },
  render() {
    const r = rng(31), jobs = ['halden_reveal', 'nordval_mark', 'respawn_sting', 'tournament_16x9', 'tournament_9x16'];
    const lines = [];
    for (let i = 0; i < 120; i++) {
      const j = jobs[(r() * jobs.length) | 0], f = String((r() * 450) | 0).padStart(4, '0'), k = r();
      if (k < 0.5) lines.push(`render ${j} frame ${f}/0450  ${(r() * 60).toFixed(1)} fps  mem ${(r() * 4).toFixed(2)}G`);
      else if (k < 0.8) lines.push(`encode ${j}.mp4  h264  crf ${18 + ((r() * 6) | 0)}  [${'#'.repeat((r() * 24) | 0).padEnd(24, '.')}]`);
      else lines.push(`mix    ${j}.wav  -${(r() * 14).toFixed(1)} LUFS  peak -${(r() * 2).toFixed(1)} dB`);
      if (r() < 0.04) lines.push('<em>fall</em>  everything moves. the idea stays still.');
    }
    return lines.join('\n');
  },
};
document.querySelectorAll('[data-log]').forEach((el) => { el.innerHTML = LOGS[el.dataset.log](); });

/* ---------- Распад картинки при переходе ----------
   amount 0 — картинка целая, 1 — её нет. Картинка рвётся на горизонтальные обрывки,
   они съезжают вправо, тянут за собой размазанный след и гаснут. */
function dissolver(fig) {
  const img = fig.querySelector('img'), cv = fig.querySelector('canvas'), ctx = cv.getContext('2d');
  const full = document.createElement('canvas'), fctx = full.getContext('2d');
  let W, H, strips = [];

  function prep() {
    const r = fig.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    cv.width = full.width = W; cv.height = full.height = H;
    const s = Math.min(W / img.naturalWidth, H / img.naturalHeight);   // как object-fit: contain
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    fctx.fillStyle = '#fff'; fctx.fillRect(0, 0, W, H);   // белое через multiply исчезает
    fctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    strips = [];
    for (let y = 0; y < H;) {
      const h = Math.round((3 + Math.random() * 26) * dpr);
      for (let x = 0; x < W;) {
        const w = Math.round((40 + Math.random() * 260) * dpr);
        strips.push({ x, y, w, h, th: 0.05 + 0.55 * Math.random() + 0.25 * (1 - x / W), v: (120 + Math.random() * 520) * dpr });
        x += w;
      }
      y += h;
    }
  }

  function frame(amount) {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    for (const s of strips) {
      const a = clamp((amount - s.th) / 0.3, 0, 1);
      if (a >= 1) continue;
      const dx = s.v * a * a;
      if (a > 0) {   // размазанный след: крайний столбец обрывка растянут назад
        ctx.globalAlpha = 0.5 * (1 - a);
        ctx.drawImage(full, s.x, s.y, 2, s.h, s.x, s.y, dx, s.h);
      }
      ctx.globalAlpha = 1 - a * a;
      ctx.drawImage(full, s.x, s.y, s.w, s.h, s.x + dx, s.y, s.w, s.h);
    }
    ctx.globalAlpha = 1;
  }

  return {
    async run(from, to, dur, delay = 0) {
      try { await img.decode(); } catch {}
      prep();
      fig.classList.add('busy');
      frame(from);
      await tween(dur, (k) => frame(from + (to - from) * k), delay);
      if (to === 0) fig.classList.remove('busy');
    },
    async hide() { try { await img.decode(); } catch {} prep(); fig.classList.add('busy'); frame(1); },
    reset() { fig.classList.remove('busy'); },
  };
}
const figs = new Map([...document.querySelectorAll('.pimg')].map((f) => [f, dissolver(f)]));
const figsOf = (page) => [...page.querySelectorAll('.pimg')].map((f) => figs.get(f));

/* ---------- Цепи поперёк ангела ----------
   Звенья по очереди лицом и ребром вдоль провисшей кривой. Цепь чуть дышит, а её строки
   время от времени съезжают вбок — как всё на сайте. Точки — из data-chains у картинки. */
function chained(fig) {
  const spec = JSON.parse(fig.dataset.chains || '[]');
  if (!spec.length) return null;
  const img = fig.querySelector('img');
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  cv.className = 'chain'; cv.setAttribute('aria-hidden', 'true');
  fig.appendChild(cv);
  const raw = document.createElement('canvas'), rc = raw.getContext('2d');
  const phase = spec.map(() => Math.random() * 6.3);
  let W, H, dpr, box, rows = [], grown = 1, ready = false;

  function prep() {
    const r = fig.getBoundingClientRect();
    if (!r.width || !img.naturalWidth) return;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = cv.width = raw.width = Math.round(r.width * dpr); H = cv.height = raw.height = Math.round(r.height * dpr);
    const s = Math.min(W / img.naturalWidth, H / img.naturalHeight);
    box = { w: img.naturalWidth * s, h: img.naturalHeight * s };
    box.x = (W - box.w) / 2; box.y = (H - box.h) / 2;
    rows = [];
    for (let y = 0; y < H;) { const h = Math.round((2 + Math.random() * 16) * dpr); rows.push({ y, h, dx: 0 }); y += h; }
    ready = true;
  }
  function tear() { for (const r of rows) r.dx = Math.random() < 0.14 ? (Math.random() - 0.5) * 46 * dpr : 0; }

  function link(x, y, a, face, L, t) {
    rc.save(); rc.translate(x, y); rc.rotate(a);
    rc.beginPath();
    if (face) rc.ellipse(0, 0, L * 0.56, L * 0.3, 0, 0, Math.PI * 2);
    else { rc.moveTo(-L * 0.56, 0); rc.lineTo(L * 0.56, 0); }
    rc.lineCap = 'round'; rc.lineWidth = face ? t * 0.9 : t * 1.2; rc.strokeStyle = '#3a3e3c'; rc.stroke();
    rc.beginPath();   // блик, как штрих гравюры
    if (face) rc.ellipse(0, -t * 0.2, L * 0.5, L * 0.26, 0, Math.PI * 1.12, Math.PI * 1.88);
    else { rc.moveTo(-L * 0.4, -t * 0.25); rc.lineTo(L * 0.4, -t * 0.25); }
    rc.lineWidth = t * 0.28; rc.strokeStyle = '#c4c7c1'; rc.stroke();
    if (face) {   // штриховка тени снизу звена, как на гравюре
      rc.lineWidth = Math.max(1, t * 0.12); rc.strokeStyle = '#2a2d2c';
      for (let k = -2; k <= 2; k++) { rc.beginPath(); rc.moveTo(k * L * 0.14 - L * 0.05, L * 0.12); rc.lineTo(k * L * 0.14 + L * 0.05, L * 0.3); rc.stroke(); }
    }
    rc.restore();
  }

  function draw(time) {
    if (!ready) return;
    rc.clearRect(0, 0, W, H);
    const L = Math.max(10 * dpr, box.h * 0.034), th = L * 0.21, step = L * 0.8;
    spec.forEach(([x1, y1, x2, y2, sag], ci) => {
      const ax = box.x + x1 * box.w, ay = box.y + y1 * box.h, bx = box.x + x2 * box.w, by = box.y + y2 * box.h;
      const len = Math.hypot(bx - ax, by - ay);
      let nx = -(by - ay) / len, ny = (bx - ax) / len;
      if (ny < 0) { nx = -nx; ny = -ny; }                                   // провис — вниз
      const k = sag * box.h * 2 * (1 + 0.12 * Math.sin(time * 0.9 + phase[ci]));
      const cx = (ax + bx) / 2 + nx * k, cy = (ay + by) / 2 + ny * k;
      const N = 120, pts = [], cum = [0];
      for (let i = 0; i <= N; i++) {
        const u = i / N, v = 1 - u;
        pts.push([v * v * ax + 2 * v * u * cx + u * u * bx, v * v * ay + 2 * v * u * cy + u * u * by]);
        if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      }
      const count = Math.floor(cum[N] / step), shown = Math.floor(count * grown);
      for (let n = 0, j = 1; n < shown; n++) {
        const d = n * step;
        while (j < N && cum[j] < d) j++;
        const f = (d - cum[j - 1]) / (cum[j] - cum[j - 1] || 1);
        const x = pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, y = pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f;
        const snap = grown < 1 && n > shown - 4 ? (Math.random() - 0.5) * 12 * dpr : 0;   // последние звенья ещё дёргаются
        link(x + snap, y, Math.atan2(pts[j][1] - pts[j - 1][1], pts[j][0] - pts[j - 1][0]), n % 2 === 0, L, th);
      }
    });
    ctx.clearRect(0, 0, W, H);
    for (const r of rows) ctx.drawImage(raw, 0, r.y, W, r.h, r.dx, r.y, W, r.h);
  }

  return {
    prep, draw, tear,
    get ready() { return ready; },
    hide() { grown = 0; },
    grow(dur) { return tween(dur, (k) => { grown = k; }); },
  };
}
const chains = new Map([...document.querySelectorAll('.pimg')].map((f) => [f, chained(f)]).filter(([, c]) => c));
const chainsOf = (page) => [...page.querySelectorAll('.pimg')].map((f) => chains.get(f)).filter(Boolean);
function chainLoop(now) {
  if (current && !document.hidden) {
    for (const c of chainsOf(current)) {
      if (!c.ready) c.prep();
      if (!reduce && Math.random() < 0.02) c.tear();
      c.draw(reduce ? 0 : now / 1000);
    }
  }
  setTimeout(() => requestAnimationFrame(chainLoop), 33);
}
requestAnimationFrame(chainLoop);   // после того, как скрипт целиком прочитан
let chainResize; addEventListener('resize', () => { clearTimeout(chainResize); chainResize = setTimeout(() => chains.forEach((c) => c.prep()), 200); });

/* ---------- Переход: старая страница осыпается ----------
   Картинки, лозы, цепи и цитата сводятся в один снимок, он режется на обрывки, и они падают
   с размазанным следом — нижние раньше. Текстовые блоки режутся на куски-копии и падают так же.
   Под обломками уже проступает новая страница. */
const debris = document.querySelector('.debris');
function crumble(page) {
  const vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, 1.5);
  const snap = document.createElement('canvas'), sc = snap.getContext('2d');
  snap.width = Math.round(vw * dpr); snap.height = Math.round(vh * dpr);
  sc.fillStyle = '#fff'; sc.fillRect(0, 0, snap.width, snap.height);
  sc.globalCompositeOperation = 'multiply';
  let x0 = vw, x1 = 0, y0 = vh, y1 = 0;
  const put = (src, r, fit, alpha = 1) => {
    if (!r.width || r.bottom < 0 || r.top > vh) return;
    let dx = r.left, dy = r.top, dw = r.width, dh = r.height;
    if (fit) { const s = Math.min(dw / fit.w, dh / fit.h); dx += (dw - fit.w * s) / 2; dy += (dh - fit.h * s) / 2; dw = fit.w * s; dh = fit.h * s; }
    sc.globalAlpha = alpha;
    sc.drawImage(src, dx * dpr, dy * dpr, dw * dpr, dh * dpr);
    x0 = Math.min(x0, Math.max(0, dx)); x1 = Math.max(x1, Math.min(vw, dx + dw));
    y0 = Math.min(y0, Math.max(0, dy)); y1 = Math.max(y1, Math.min(vh, dy + dh));
  };
  page.querySelectorAll('.vine img').forEach((im) => im.naturalWidth && put(im, im.getBoundingClientRect(), null, 0.85));
  page.querySelectorAll('.pimg').forEach((f) => {
    const im = f.querySelector('img'), ch = f.querySelector('canvas.chain'), r = f.getBoundingClientRect();
    if (im.naturalWidth) put(im, r, { w: im.naturalWidth, h: im.naturalHeight });
    if (ch && ch.width) put(ch, r);
  });
  page.querySelectorAll('.shards canvas').forEach((c) => c.width && put(c, c.getBoundingClientRect()));

  // холст — отдельным слоем прямо в body: внутри .debris multiply не дотянулся бы до страницы
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  cv.className = 'debris-cv'; cv.setAttribute('aria-hidden', 'true');
  cv.width = snap.width; cv.height = snap.height;
  document.body.appendChild(cv);
  const bits = [], span = Math.max(1, y1 - y0);
  for (let y = y0; y < y1;) {
    const h = 5 + Math.random() * 24;
    for (let x = x0; x < x1;) {
      const w = 30 + Math.random() * 200;
      bits.push({ x, y, w, h, dl: (1 - (y + h - y0) / span) * 0.35 + Math.random() * 0.25,
        vx: (Math.random() - 0.5) * 140, vr: (Math.random() - 0.5) * 2.6, g: 2000 + Math.random() * 1600 });
      x += w;
    }
    y += h;
  }
  const fall = tween(1300, (k) => {
    const t = k * 1.3;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const b of bits) {
      const tt = Math.max(0, t - b.dl), dy = 0.5 * b.g * tt * tt, a = 1 - smooth(0.15, 0.6, tt);
      if (a <= 0) continue;
      const w = b.w * dpr, h = b.h * dpr;
      ctx.save();
      ctx.translate((b.x + b.w / 2 + b.vx * tt) * dpr, (b.y + b.h / 2 + dy) * dpr);
      ctx.rotate(b.vr * tt);
      if (dy > 4) {   // след: верхняя строка обрывка растянута вверх
        ctx.globalAlpha = a * 0.35;
        ctx.drawImage(snap, b.x * dpr, b.y * dpr, w, 1, -w / 2, -h / 2 - dy * 0.3 * dpr, w, dy * 0.3 * dpr);
      }
      ctx.globalAlpha = a;
      ctx.drawImage(snap, b.x * dpr, b.y * dpr, w, h, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  });

  page.querySelectorAll('.note, .wall').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > vh) return;
    for (let y = 0; y < r.height;) {
      const h = Math.min(r.height - y, 16 + Math.random() * 46), cols = 1 + ((Math.random() * 3) | 0);
      for (let c = 0, x = 0; c < cols; c++) {
        const w = c === cols - 1 ? r.width - x : (r.width - x) * (0.3 + Math.random() * 0.4);
        const bit = el.cloneNode(true);
        bit.removeAttribute('id'); bit.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
        bit.classList.add('bit');
        Object.assign(bit.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
          clipPath: `inset(${y}px ${r.width - x - w}px ${r.height - y - h}px ${x}px)`, transformOrigin: `${x + w / 2}px ${y + h / 2}px` });
        debris.appendChild(bit);
        const vx = (Math.random() - 0.5) * 120, rot = (Math.random() - 0.5) * 50, drop = 700 + Math.random() * 500;
        bit.animate([
          { transform: 'none', opacity: 1 },
          { transform: `translate(${vx / 2}px, ${drop / 4}px) rotate(${rot / 4}deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${vx}px, ${drop}px) rotate(${rot}deg)`, opacity: 0 },
        ], { duration: 800, delay: ((1 - (y + h) / r.height) * 0.3 + Math.random() * 0.25) * 1000, easing: 'linear', fill: 'both' });
        x += w;
      }
      y += h;
    }
  });

  return fall.then(() => new Promise((ok) => setTimeout(ok, 200))).then(() => { cv.remove(); debris.replaceChildren(); });
}

/* ---------- Переход между страницами ---------- */
let current = null, busy = false, queued = null;
const routeOf = () => { const r = location.hash.replace(/^#\/?/, ''); return ROUTES.includes(r) ? r : 'home'; };

function mark(route) {
  navLinks.forEach((a) => (a.dataset.route === route ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const n = ROUTES[(ROUTES.indexOf(route) + 1) % ROUTES.length];
  next.href = `#/${n === 'home' ? '' : n}`;
  next.querySelector('b').textContent = T(n);
  document.title = route === 'home' ? T('title') : `${T(route)} — yoshiro`;
}

async function go(route, first = false) {
  if (busy) { queued = route; return; }
  if (current === pages[route]) return;
  busy = true;
  const from = current, to = pages[route];

  let fell = null;
  if (from && !reduce) {
    debris.replaceChildren();
    fell = crumble(from);
    document.body.classList.add('quake');
    setTimeout(() => document.body.classList.remove('quake'), 300);
  }
  if (from) { from.hidden = true; figsOf(from).forEach((d) => d.reset()); }
  if (first) Object.values(pages).forEach((p) => { p.hidden = p !== to; });   // прямая ссылка на страницу: главную не показываем

  to.hidden = false;
  mark(route);
  dispatchEvent(new Event('resize'));   // цитата пересчитает размер, если страница была скрыта
  scrollTo(0, 0);
  current = to;
  const cs = chainsOf(to);
  cs.forEach((c) => c.prep());

  if (!reduce) {
    [...to.querySelectorAll('.vine, .wall, .note')].forEach((el, i) => el.style.setProperty('--i', i));
    to.classList.add('in');
    const ds = figsOf(to);
    cs.forEach((c) => c.hide());
    await Promise.all(ds.map((d) => d.hide()));
    await Promise.all(ds.map((d) => d.run(1, 0, 1000, from ? 380 : 120)));
    await Promise.all(cs.map((c) => c.grow(650)));   // цепи защёлкиваются последними
    setTimeout(() => to.classList.remove('in'), 900);
    jolt(to.querySelector('h1'));
  }
  if (!first) to.querySelector('h1').focus({ preventScroll: true });
  if (fell) await fell;

  busy = false;
  if (queued) { const q = queued; queued = null; if (pages[q] !== current) go(q); }
}

addEventListener('hashchange', () => {
  const h = location.hash;
  if (h && !h.startsWith('#/')) return;
  document.body.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', 'false');
  burger.textContent = T('menu');
  go(routeOf());
});

const burger = document.querySelector('.burger');
burger.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  burger.setAttribute('aria-expanded', String(open));
  burger.textContent = open ? T('close') : T('menu');
});

/* ---------- Часы ---------- */
const clock = document.getElementById('clock');
const tickClock = () => { clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false }); };
tickClock(); setInterval(tickClock, 1000);

/* ---------- Сбои: заголовок и картинки изредка дёргаются полосой ---------- */
function jolt(el) {
  if (!el || reduce) return;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 160);
}
const glitchable = [...document.querySelectorAll('.pimg')];
glitchable.forEach((box) => {
  const src = box.querySelector('img');
  for (let i = 0; i < 3; i++) {
    const g = src.cloneNode();
    g.alt = ''; g.className = 'g1'; g.setAttribute('aria-hidden', 'true');
    box.insertBefore(g, src.nextSibling);
  }
});
function glitchOnce(box) {
  const gs = [...box.querySelectorAll('.g1')], n = 1 + ((Math.random() * gs.length) | 0);
  gs.slice(0, n).forEach((g) => {
    const a = 8 + Math.random() * 78, h = 0.6 + Math.random() * 5;
    g.style.setProperty('--a', `${a}%`);
    g.style.setProperty('--b', `${Math.max(0, 100 - a - h)}%`);
    g.style.setProperty('--dx', `${(Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 60)}px`);
    g.classList.toggle('cy', Math.random() < 0.15);
    g.classList.add('on');
    setTimeout(() => g.classList.remove('on'), 80 + Math.random() * 170);
  });
  const c = chains.get(box);
  if (c && Math.random() < 0.5) c.tear();
}
if (!reduce) (function tick() {
  if (current && !busy) {
    const vis = glitchable.filter((b) => current.contains(b) && !b.classList.contains('busy'));
    if (vis.length) {
      const b = vis[Math.random() * vis.length | 0];
      glitchOnce(b);
      if (Math.random() < 0.5) setTimeout(() => glitchOnce(b), 120 + Math.random() * 120);
    }
    if (Math.random() < 0.4) jolt(current.querySelector('h1'));
  }
  setTimeout(tick, 900 + Math.random() * 1600);
})();

/* ---------- Цитата из обрывков ----------
   Текст режется на рваные горизонтальные полоски. Они прилетают сбоку с размазанным следом, собираются,
   стоят, иногда пара полосок съезжает — и всё снова разлетается. По кругу, 14 секунд. */
(function shards() {
  const fig = document.querySelector('.shards');
  if (!fig) return;
  const cv = fig.querySelector('canvas'), ctx = cv.getContext('2d');
  const QUOTE = {
    en: [['the mind is its own place, and in itself', 'can make a heaven of hell, a hell of heaven.'], '— john milton, paradise lost'],
  };
  let LINES, SIGN;
  let W, H, src, tint, parts = [], ready = false, visible = false;

  async function setup() {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;   // страница скрыта — посчитаем, когда покажут
    [LINES, SIGN] = QUOTE.en;   // надписи «внутри картинок» всегда на английском
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr);
    try { await document.fonts.load('500 20px "IBM Plex Mono"'); } catch {}
    // кегль подбираем так, чтобы самая длинная строка влезла по ширине
    let fs = Math.round(H * 0.17);
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = `500 ${fs}px "IBM Plex Mono"`;
    const longest = Math.max(...LINES.map((l) => probe.measureText(l).width));
    if (longest > W * 0.94) fs = Math.floor(fs * (W * 0.94) / longest);
    const draw = (color) => {
      const o = document.createElement('canvas'); o.width = W; o.height = H;
      const c = o.getContext('2d');
      c.fillStyle = color; c.textBaseline = 'top';
      c.font = `500 ${fs}px "IBM Plex Mono"`;
      LINES.forEach((l, i) => c.fillText(l, Math.round(W * 0.03), Math.round(H * 0.12 + i * fs * 1.35)));
      c.font = `${Math.round(fs * 0.6)}px "IBM Plex Mono"`; c.fillStyle = color === INK ? DIM : color;
      c.fillText(SIGN, Math.round(W * 0.03), Math.round(H * 0.12 + 2 * fs * 1.35 + fs * 0.3));
      return o;
    };
    src = draw(INK); tint = draw(CYAN);
    parts = [];
    for (let y = 0; y < H;) {
      const h = Math.round((2 + Math.random() * 9) * dpr);
      for (let x = 0; x < W;) {
        const w = Math.round((18 + Math.random() * 140) * dpr);
        parts.push({ x, y, w, h, dl: Math.random(), dir: Math.random() < 0.7 ? -1 : 1, d: (150 + Math.random() * 600) * dpr,
          cyan: Math.random() < 0.06, jit: Math.random() < 0.05 });
        x += w;
      }
      y += h;
    }
    ready = true;
  }

  function frame(t) {
    const p = reduce ? 0.6 : (t / 14) % 1;
    ctx.clearRect(0, 0, W, H);
    for (const s of parts) {
      const inK = smooth(0.02 + s.dl * 0.3, 0.22 + s.dl * 0.3, p);          // прилетает
      const outK = smooth(0.78 + s.dl * 0.14, 0.92 + s.dl * 0.08, p);       // разлетается
      const off = s.dir * s.d * ((1 - inK) ** 2) + s.d * 0.8 * outK * outK;
      const alpha = inK * (1 - outK);
      if (alpha <= 0.01) continue;
      let dx = off;
      if (!reduce && s.jit && p > 0.5 && p < 0.75 && Math.sin(t * 7 + s.dl * 40) > 0.85) dx += (s.dl - 0.5) * 60;   // редкий сдвиг на месте
      const img = s.cyan ? tint : src;
      if (Math.abs(dx) > 2) {   // размазанный след за обрывком
        ctx.globalAlpha = alpha * 0.35;
        const sx = dx > 0 ? s.x : s.x + s.w - 2;
        ctx.drawImage(img, sx, s.y, 2, s.h, dx > 0 ? s.x : s.x + s.w + dx, s.y, Math.abs(dx), s.h);
      }
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, s.x, s.y, s.w, s.h, s.x + dx, s.y, s.w, s.h);
    }
    ctx.globalAlpha = 1;
  }

  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(cv);
  setup();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { ready = false; setup(); }, 200); });
  let last = 0;
  (function loop(now) {
    if (ready && visible && now - last > 30) { frame(now / 1000); last = now; }
    requestAnimationFrame(loop);
  })(0);
})();

/* ---------- Плеер работ ----------
   Кнопки на странице works открывают ролик, «play showreel» крутит все подряд. */
const WORKS = [
  { file: 'halden', title: 'halden', meta: 'coffee roastery · logo + reveal · 8 s',
    brief: 'A specialty roastery: warm, calm, morning light. A drop of espresso hits the paper and pulls itself into the mark.',
    done: ['new logo: a coffee bean with a river crease and a rising sun', 'liquid simulation: splash, droplets rolling back, wet-to-dry ink', 'foley and two guitar strokes instead of stock music'],
    ru: { title: 'halden', meta: 'обжарщик кофе · логотип + появление · 8 с', brief: 'Обжарщик спешелти-кофе: тепло, спокойно, утренний свет. Капля эспрессо падает на бумагу и собирается в знак.', done: ['новый логотип: кофейное зерно с изгибом реки и восходящим солнцем', 'симуляция жидкости: всплеск, капли стекают обратно, мокрые чернила высыхают', 'живые звуки и два удара гитары вместо стоковой музыки'] } },
  { file: 'nordval', title: 'nordval', meta: 'strategy consultancy · logo reveal · 5.5 s',
    brief: 'A strategy consultancy. Quiet, exact, nothing that looks like a toy.',
    done: ['monogram built from three strokes', 'light minimalist layout', 'restrained sound: clicks and one low hit'],
    ru: { title: 'nordval', meta: 'стратегический консалтинг · появление логотипа · 5.5 с', brief: 'Консалтинговая компания. Тихо, точно, ничего игрушечного.', done: ['монограмма из трёх штрихов', 'светлая минималистичная подача', 'сдержанный звук: щелчки и один низкий удар'] } },
  { file: 'respawn-logo', title: 'respawn', meta: 'gaming club · logo sting · 5.5 s',
    brief: 'A 24/7 gaming club. Loud, neon, and it has to work as a stream intro.',
    done: ['neon flicker and glitch transition', 'terminal-style tagline', 'bass hit synced to the reveal'],
    ru: { title: 'respawn', meta: 'игровой клуб · заставка с логотипом · 5.5 с', brief: 'Игровой клуб 24/7. Громко, неон, и это должно работать как интро для стрима.', done: ['мерцание неона и глитч-переход', 'слоган в стиле терминала', 'басовый удар точно на появление'] } },
  { file: 'respawn-ad', title: 'respawn tournament', meta: '15 s promo · 16:9',
    brief: 'A weekend 5v5 tournament announcement for social media, in two formats.',
    done: ['art direction for ai-generated stills', 'edit, motion graphics and titles', 'music cut and sound effects'],
    ru: { title: 'respawn tournament', meta: 'реклама 15 с · 16:9', brief: 'Анонс турнира 5×5 на выходных для соцсетей, в двух форматах.', done: ['арт-дирекшн картинок, сгенерированных ии', 'монтаж, моушн-графика и титры', 'нарезка музыки и звуковые эффекты'] } },
  { file: 'respawn-ad-vertical', title: 'respawn tournament, vertical', meta: '15 s · 9:16 for reels, tiktok, shorts',
    brief: 'The same promo rebuilt for a phone screen, not just cropped.',
    done: ['layout rebuilt for 9:16', 'same timing and sound as the main cut'],
    ru: { title: 'respawn tournament, вертикальный', meta: '15 с · 9:16 для reels, tiktok, shorts', brief: 'Та же реклама, пересобранная под экран телефона, а не просто обрезанная.', done: ['раскладка пересобрана под 9:16', 'тот же тайминг и звук, что в основной версии'] } },
  { file: 'yoru-ad', title: 'yoru ramen', meta: '15 s promo · 16:9',
    brief: 'A late-night ramen bar. Rain outside, a hot bowl inside, open till 3 am. One feeling, no hard sell.',
    done: ['2.5D camera moves built from ai-generated stills (depth parallax)', 'anime-style atmosphere: light rays, lantern glow, drifting embers', 'vertical japanese titles, edit cut to the beat of a city pop track'],
    ru: { title: 'yoru ramen', meta: 'реклама 15 с · 16:9', brief: 'Ночной рамен-бар. Снаружи дождь, внутри горячая миска, открыто до 3 ночи. Одно настроение, никакого давления.', done: ['2.5D-движение камеры из ии-картинок (параллакс по глубине)', 'аниме-атмосфера: лучи света, свечение фонарей, летящие искры', 'вертикальные японские титры, монтаж в бит city pop'] } },
  { file: 'yoru-ad-vertical', title: 'yoru ramen, vertical', meta: '15 s · 9:16 for reels, tiktok, shorts',
    brief: 'The same promo rebuilt for a phone screen, not just cropped.',
    done: ['wide shots kept as a band, nothing upscaled', 'own vertical street shot and layout'],
    ru: { title: 'yoru ramen, вертикальный', meta: '15 с · 9:16 для reels, tiktok, shorts', brief: 'Та же реклама, пересобранная под экран телефона, а не просто обрезанная.', done: ['широкие кадры идут полосой, ничего не растянуто', 'своя вертикальная улица и раскладка'] } },
];
/* Шоурил — главный ролик (своя версия для каждого языка), за ним отдельные работы. */
const REEL = { file: () => `showreel-${lang}`, title: 'showreel', meta: '68 s · about me, logos, promos, editing, bots, ai',
  brief: 'Everything i do, in one minute: logo animation, promo videos, editing, telegram bots and small ai automations.',
  done: ['edit cut to the music, one block per section of the track', 'each block keeps the style of its project and flows into the next', 'bot and automation blocks are animated demos'],
  ru: { title: 'шоурил', meta: '68 с · обо мне, логотипы, реклама, монтаж, боты, ии',
    brief: 'Всё, что я делаю, за одну минуту: анимация логотипов, рекламные ролики, монтаж, telegram-боты и небольшая ии-автоматизация.',
    done: ['монтаж под музыку, каждый блок — на свою часть трека', 'каждый блок в стиле своего проекта и перетекает в следующий', 'блоки про бота и автоматизацию — анимированные демо'] } };
(function player() {
  const dlg = document.querySelector('.viewer');
  if (!dlg) return;
  const video = dlg.querySelector('video'), frame = dlg.querySelector('.v-frame');
  const $ = (id) => document.getElementById(id);
  const LIST = [REEL];   // на сайте только шоурил; описания отдельных работ остаются в WORKS
  let idx = 0;

  function show(i) {
    idx = (i + LIST.length) % LIST.length;
    const w = LIST[idx], file = typeof w.file === 'function' ? w.file() : w.file;
    const ru = lang === 'ru' && w.ru;
    $('v-title').textContent = idx ? `${String(idx).padStart(2, '0')} ${ru ? w.ru.title : w.title}` : (ru ? w.ru.title : w.title);
    $('v-meta').textContent = ru ? w.ru.meta : w.meta;
    $('v-brief').textContent = ru ? w.ru.brief : w.brief;
    $('v-done').replaceChildren(...(ru ? w.ru.done : w.done).map((d) => Object.assign(document.createElement('li'), { textContent: d })));
    video.poster = `works/${file}.jpg`;
    video.src = `works/${file}.mp4`;
    frame.classList.remove('tear');
    if (!reduce) { void frame.offsetWidth; frame.classList.add('tear'); }
    video.play().catch(() => {});
  }
  function open(i) {
    if (!dlg.open) dlg.showModal();
    show(i);
  }

  document.querySelectorAll('[data-reel]').forEach((b) => b.addEventListener('click', () => open(0)));
  dlg.querySelector('.v-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {   // клик мимо окна закрывает его
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
  dlg.addEventListener('close', () => { video.pause(); video.removeAttribute('src'); video.load(); });
})();

setLang(lang);
go(routeOf(), true);
