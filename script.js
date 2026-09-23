/* ============================================================
   НАСТРОЙКИ
   Заявки уходят ботом @andrew_website_bot в Telegram-канал (CHAT_ID).
   Токен виден в коде страницы — это осознанный выбор владельца.
   Если токен утёк: @BotFather → /revoke, новый токен вписать сюда.
   Если отправка не удалась, форма откроет чат @andreew_8
   и положит текст заявки в буфер обмена.
   ============================================================ */
var CONFIG = {
  TELEGRAM_USER: 'andreew_8',
  PHONE: '+375292978137',
  BOT_TOKEN: '7984341771:AAEddTr3VZqnZtMsS0Emm_2SJ7ODKPxmRn4',
  CHAT_ID: '-1003893474648'
};

/* ---------- ШАПКА / БУРГЕР ---------- */
var header = document.getElementById('header');
window.addEventListener('scroll', function () {
  header.classList.toggle('is-scrolled', window.scrollY > 10);
});
var burger = document.getElementById('burger');
var nav = document.getElementById('nav');
burger.addEventListener('click', function () {
  nav.classList.toggle('is-open');
  burger.classList.toggle('is-open');
});
nav.addEventListener('click', function (e) {
  if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.classList.remove('is-open'); }
});

/* ---------- СЛАЙДЕР В ШАПКЕ ---------- */
(function () {
  var slides = document.querySelectorAll('#heroSlider .slide');
  var dots = document.getElementById('heroDots');
  var i = 0, timer;
  slides.forEach(function (s, n) {
    var b = document.createElement('button');
    b.className = n === 0 ? 'is-active' : '';
    b.setAttribute('aria-label', 'Слайд ' + (n + 1));
    b.addEventListener('click', function () { go(n); restart(); });
    dots.appendChild(b);
  });
  function go(n) {
    slides[i].classList.remove('is-active');
    dots.children[i].classList.remove('is-active');
    i = n;
    slides[i].classList.add('is-active');
    dots.children[i].classList.add('is-active');
  }
  function next() { go((i + 1) % slides.length); }
  function restart() { clearInterval(timer); timer = setInterval(next, 5000); }
  restart();
})();

/* ---------- МОДАЛЬНЫЕ ОКНА ---------- */
var modal = document.getElementById('modal');
var modalTitle = document.getElementById('modalTitle');
var modalText = document.getElementById('modalText');
var svcWrap = document.getElementById('modalServiceWrap');
var qWrap = document.getElementById('modalQuestionWrap');
var modalForm = document.getElementById('modalForm');

function openModal(kind, preset) {
  if (kind === 'question') {
    modalTitle.textContent = 'Задать вопрос';
    modalText.textContent = 'Оставьте свои данные и интересующий вопрос — ответим вместе с расчётом стоимости.';
    svcWrap.hidden = true; qWrap.hidden = false;
    modalForm.dataset.form = 'Вопрос с сайта';
  } else {
    modalTitle.textContent = 'Бесплатный замер';
    modalText.textContent = 'Оставьте свои данные, и мы свяжемся с вами в ближайшее время.';
    svcWrap.hidden = false; qWrap.hidden = true;
    modalForm.dataset.form = 'Заявка на бесплатный замер';
    if (preset) { var sel = svcWrap.querySelector('select'); if (sel) sel.value = preset; }
  }
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }

document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-modal]');
  if (t) { e.preventDefault(); openModal(t.getAttribute('data-modal')); }
  if (e.target.closest('[data-close]')) closeModal();
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

/* ---------- ОТПРАВКА ЗАЯВОК ---------- */
function collect(form) {
  var lines = [];
  form.querySelectorAll('input,select,textarea').forEach(function (el) {
    if (el.type === 'checkbox' || !el.name) return;
    var wrap = el.closest('label');
    if (wrap && wrap.hidden) return;
    if (el.name === 'website') return;
    if (el.value.trim()) lines.push(el.name + ': ' + el.value.trim().slice(0, 500));
  });
  return lines;
}

/* ---------- ЗАЩИТА ФОРМ ОТ СПАМА ----------
   Сервера нет, поэтому всё проверяется в браузере: это отсекает ботов,
   которые заполняют формы, но не того, кто вытащит токен из кода. */
var LIMIT = { minFillMs: 3000, pauseMs: 60 * 1000, perHour: 3 };

// время первого касания формы — боты отправляют мгновенно
document.addEventListener('focusin', function (e) {
  var f = e.target.form;
  if (f && !f.dataset.t) f.dataset.t = Date.now();
});

function sentLog(add) {
  var log = [];
  try { log = JSON.parse(localStorage.getItem('leadLog') || '[]'); } catch (e) {}
  var hourAgo = Date.now() - 3600 * 1000;
  log = log.filter(function (t) { return t > hourAgo; });
  if (add) { log.push(Date.now()); try { localStorage.setItem('leadLog', JSON.stringify(log)); } catch (e) {} }
  return log;
}

// null — можно отправлять, 'bot' — тихо «принять» и выбросить, иначе — текст ошибки
function checkLead(form) {
  if (form.elements.website && form.elements.website.value) return 'bot';
  if (!form.dataset.t || Date.now() - form.dataset.t < LIMIT.minFillMs) return 'bot';

  var fields = form.querySelectorAll('input[type=text],input[type=tel],textarea');
  for (var i = 0; i < fields.length; i++) {
    if (/https?:|www\.|t\.me\/|@\w+\.\w/i.test(fields[i].value)) return 'Уберите, пожалуйста, ссылки из заявки.';
  }
  var name = form.elements['Имя'];
  if (name && (name.value.trim().length < 2 || /^\d+$/.test(name.value.trim()))) return 'Укажите, пожалуйста, имя.';
  var tel = form.elements['Телефон'];
  if (tel) {
    var d = tel.value.replace(/\D/g, '');
    var ok = (d.length === 12 && d.indexOf('375') === 0) || (d.length === 11 && d.indexOf('80') === 0) || d.length === 9;
    if (!ok) return 'Проверьте номер: например, +375 29 123-45-67.';
  }
  var log = sentLog(false);
  if (log.length && Date.now() - log[log.length - 1] < LIMIT.pauseMs) return 'Заявка уже отправлена. Если нужно что-то добавить, подождите минуту.';
  if (log.length >= LIMIT.perHour) return 'Вы уже отправили несколько заявок — мы их получили. Срочно? Позвоните: ' + CONFIG.PHONE;
  return null;
}

function showErr(form, msg) {
  var el = form.querySelector('.form__err');
  if (!el) {
    el = document.createElement('p');
    el.className = 'form__err';
    el.setAttribute('role', 'alert');
    var btn = form.querySelector('button[type=submit]');
    btn.parentNode.insertBefore(el, btn);
  }
  el.textContent = msg || '';
  el.hidden = !msg;
}

// боту показываем «успех», но ничего не отправляем
function fakeDone(form) {
  var btn = form.querySelector('button[type=submit]');
  if (btn) { btn.textContent = 'Заявка отправлена ✓'; btn.disabled = true; }
}

// true — заявку можно отправлять
function guard(form) {
  var res = checkLead(form);
  if (res === 'bot') return false;
  showErr(form, res);
  if (res) return false;
  sentLog(true);
  return true;
}

function sendLead(title, lines, form) {
  var text = '🏠 ' + title + '\n' + lines.join('\n') +
    '\nСтраница: ' + location.href +
    '\nВремя: ' + new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Minsk' });
  var btn = form && form.querySelector('button[type=submit]');
  var label = btn ? btn.textContent : '';

  function done() {
    if (!btn) return;
    btn.textContent = 'Заявка отправлена ✓';
    btn.disabled = true;
    setTimeout(function () { if (!modal.hidden) closeModal(); }, 1400);
  }

  // запасной путь: текст в буфер обмена и чат менеджера
  function fallback() {
    if (navigator.clipboard) { navigator.clipboard.writeText(text).catch(function () {}); }
    window.open('https://t.me/' + CONFIG.TELEGRAM_USER, '_blank', 'noopener');
    done();
  }

  if (!CONFIG.BOT_TOKEN || !CONFIG.CHAT_ID) { fallback(); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }
  fetch('https://api.telegram.org/bot' + CONFIG.BOT_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CONFIG.CHAT_ID, text: text })
  })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d.ok) done(); else throw new Error(d.description); })
    .catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = label; }
      fallback();
    });
}

document.querySelectorAll('form[data-form]').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (checkLead(form) === 'bot') { fakeDone(form); return; }
    if (!guard(form)) return;
    sendLead(form.dataset.form, collect(form), form);
  });
});

/* ---------- КАЛЬКУЛЯТОР ---------- */
var QUIZ = [
  { q: 'Какой забор вас интересует?', opts: ['Металлоштакетник', 'Профнастил', 'Сетка-рабица', '3D-забор'] },
  { q: 'Какая примерная длина забора?', opts: ['До 30 м', '30–60 м', '60–100 м', 'Более 100 м', 'Не знаю'] },
  { q: 'Нужны ли ворота и калитка?', opts: ['Только забор', 'Забор + калитка', 'Забор, калитка и ворота', 'Нужна консультация'] },
  { q: 'Когда планируете установку?', opts: ['Как можно скорее', 'В ближайший месяц', 'В течение сезона', 'Пока изучаю предложения'] }
];

var qBody = document.getElementById('qBody');
var qStep = document.getElementById('qStep');
var qTotal = document.getElementById('qTotal');
var qBar = document.getElementById('qBar');
var qPrev = document.getElementById('qPrev');
var qNext = document.getElementById('qNext');
var state = { step: 0, answers: {} };

function renderQuiz() {
  var list = QUIZ;
  var total = list.length + 1;
  qTotal.textContent = total;
  qStep.textContent = state.step + 1;
  qBar.style.width = Math.round((state.step + 1) / total * 100) + '%';
  qPrev.style.visibility = state.step === 0 ? 'hidden' : 'visible';

  if (state.step < list.length) {
    var s = list[state.step];
    var html = '<div class="quiz__q">' + s.q + '</div><div class="opts">';
    s.opts.forEach(function (o) {
      var sel = state.answers[s.q] === o ? ' is-sel' : '';
      html += '<button type="button" class="opt' + sel + '" data-q="' + s.q + '" data-v="' + o + '">' + o + '</button>';
    });
    qBody.innerHTML = html + '</div>';
    qNext.textContent = 'Далее →';
    qNext.style.display = '';
  } else {
    qBody.innerHTML =
      '<div class="quiz__q">Получите расчёт</div>' +
      '<p class="quiz__hint">Остался последний шаг — скажите, куда прислать смету. ' +
      'Перезвоним в рабочее время и уточним детали объекта.</p>' +
      '<form class="form form--quiz" id="quizForm">' +
      '<div class="form__row">' +
      '<label>Ваше имя<input type="text" name="Имя" required placeholder="Как к вам обращаться"></label>' +
      '<label>Телефон<input type="tel" name="Телефон" required placeholder="+375 (__) ___-__-__"></label>' +
      '</div>' +
      '<label>Комментарий<textarea name="Комментарий" rows="2" placeholder="Адрес объекта, пожелания"></textarea></label>' +
      '<label class="check"><input type="checkbox" required><span>Я даю согласие на обработку персональных данных.</span></label>' +
      '<div class="form__actions">' +
      '<button class="btn btn--accent btn--lg" type="submit">Получить расчёт</button>' +
      '<span class="form__note">Ответим в течение рабочего дня</span>' +
      '</div>' +
      '</form>';
    qNext.style.display = 'none';
    document.getElementById('quizForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var isBot = checkLead(this) === 'bot';
      if (!isBot && !guard(this)) return;
      if (!isBot) {
        var lines = collect(this);
        Object.keys(state.answers).forEach(function (k) { lines.push(k + ' ' + state.answers[k]); });
        sendLead('Заявка из калькулятора', lines, this);
      }
      qBody.innerHTML = '<div class="quiz__done"><b>Заявка принята</b><p>Свяжемся с вами и подготовим расчёт. Обычно отвечаем в течение рабочего дня.</p></div>';
      qNext.style.display = 'none';
      qPrev.style.visibility = 'hidden';
    });
  }
}
qBody.addEventListener('click', function (e) {
  var b = e.target.closest('.opt');
  if (!b) return;
  var q = b.getAttribute('data-q'), v = b.getAttribute('data-v');
  state.answers[q] = v;
  qBody.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('is-sel'); });
  b.classList.add('is-sel');
  setTimeout(function () { state.step++; renderQuiz(); }, 180);
});
qNext.addEventListener('click', function () {
  var list = QUIZ;
  if (state.step < list.length && !state.answers[list[state.step].q]) {
    qBody.querySelector('.opts').animate(
      [{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 220);
    return;
  }
  state.step++; renderQuiz();
});
qPrev.addEventListener('click', function () { if (state.step > 0) { state.step--; renderQuiz(); } });
renderQuiz();

/* кнопки «Рассчитать забор» начинают калькулятор с первого шага */
document.querySelectorAll('[data-calc]').forEach(function (a) {
  a.addEventListener('click', function () {
    state = { step: 0, answers: {} };
    renderQuiz();
  });
});

/* ---------- COOKIE ---------- */
var cookie = document.getElementById('cookie');
if (!localStorage.getItem('cookieOk')) {
  setTimeout(function () { cookie.hidden = false; }, 1200);
}
document.getElementById('cookieOk').addEventListener('click', function () {
  localStorage.setItem('cookieOk', '1');
  cookie.hidden = true;
});

/* ---------- ДВИЖЕНИЕ: ОБЩИЕ НАСТРОЙКИ ---------- */
var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- РАЗБИВКА ЗАГОЛОВКОВ НА СЛОВА ---------- */
function splitWords(el) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  var frag = document.createDocumentFragment();
  [].slice.call(el.childNodes).forEach(function (node) {
    if (node.nodeType === 3) {
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
        var mask = document.createElement('span');
        mask.className = 'line-mask';
        var inner = document.createElement('i');
        inner.textContent = part;
        mask.appendChild(inner);
        frag.appendChild(mask);
      });
    } else if (node.nodeType === 1) {
      var mask = document.createElement('span');
      mask.className = 'line-mask';
      var inner = document.createElement('i');
      inner.appendChild(node.cloneNode(true));
      mask.appendChild(inner);
      frag.appendChild(mask);
    }
  });
  el.innerHTML = '';
  el.appendChild(frag);
  [].forEach.call(el.querySelectorAll('.line-mask > i'), function (w, i) {
    w.style.setProperty('--d', (i * 0.045) + 's');
  });
}

if (!REDUCED) {
  document.querySelectorAll('.hero h1, .h2, .row__body h3, .tile h3').forEach(splitWords);
}

/* ---------- ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ ---------- */
var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (en) {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in');
    io.unobserve(en.target);
    if (en.target.classList.contains('parallax')) {
      setTimeout(function (el) { el.classList.add('px-ready'); }, 1500, en.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

function watch(selector, cls, stagger) {
  var groups = {};
  document.querySelectorAll(selector).forEach(function (el) {
    if (cls) el.classList.add(cls);
    if (stagger) {
      var key = el.parentElement;
      groups.i = groups.i || new Map();
      var n = groups.i.get(key) || 0;
      el.style.setProperty('--d', (n * 0.09) + 's');
      groups.i.set(key, n + 1);
    }
    io.observe(el);
  });
}

watch('.h2, .sec__label, .lead, .about__side, .row__body, .tile h3, .faq__i, .rev, .cta__contacts, .footer__col', 'reveal');
watch('.card3, .why__item, .step, .stat, .gal', 'reveal', true);
document.querySelectorAll('.row__media, .card3__img, .tile__img, .gal').forEach(function (el) {
  el.classList.add('img-reveal');
  io.observe(el);
});

/* ---------- СЧЁТЧИКИ ---------- */
var activeCounters = [];
document.addEventListener('visibilitychange', function () {
  // во вкладке без фокуса rAF почти не тикает — дорисовываем цифры сразу
  if (document.hidden) {
    activeCounters.forEach(function (el) {
      el.textContent = el.dataset.count + (el.dataset.suffix || '');
    });
    activeCounters = [];
  }
});

function runCounter(el) {
  var target = parseInt(el.dataset.count, 10);
  var suffix = el.dataset.suffix || '';
  if (REDUCED) { el.textContent = target + suffix; return; }
  var dur = 1400, start = Date.now();
  activeCounters.push(el);
  var timer = setInterval(function () {
    if (activeCounters.indexOf(el) === -1) { clearInterval(timer); return; }
    var p = Math.min((Date.now() - start) / dur, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (p >= 1) {
      clearInterval(timer);
      activeCounters.splice(activeCounters.indexOf(el), 1);
    }
  }, 30);
}
var counterIO = new IntersectionObserver(function (entries) {
  entries.forEach(function (en) {
    if (!en.isIntersecting) return;
    runCounter(en.target);
    counterIO.unobserve(en.target);
  });
}, { threshold: 0.6 });
function startCounters() {
  document.querySelectorAll('[data-count]').forEach(function (el) { counterIO.observe(el); });
}
// запускаем, только когда прелоадер ушёл — иначе цифры «сгорают» под ним
if (document.body.classList.contains('is-ready')) startCounters();
else document.addEventListener('site:ready', startCounters, { once: true });

/* ---------- ПАРАЛЛАКС ФОТОГРАФИЙ ---------- */
var parallaxItems = [];
if (!REDUCED && window.matchMedia('(min-width: 900px)').matches) {
  document.querySelectorAll('.row__media, .tile__img').forEach(function (el) {
    el.classList.add('parallax');
    parallaxItems.push(el);
  });
}

/* ---------- ПОЛОСА ПРОКРУТКИ ---------- */
// если браузер умеет scroll()-таймлайны, полосу рисует CSS — JS не нужен
var NATIVE_TIMELINE = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));
var scrollbar = NATIVE_TIMELINE ? null : document.querySelector('#scrollbar i');
var ticking = false;
function onFrame() {
  ticking = false;
  var max = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollbar) scrollbar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  var vh = window.innerHeight;
  parallaxItems.forEach(function (el) {
    if (!el.classList.contains('px-ready')) return;
    var r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    var progress = (r.top + r.height / 2 - vh / 2) / vh;   // -1 … 1
    var img = el.querySelector('img');
    if (img) img.style.transform = 'scale(1.06) translate3d(0,' + (progress * -18).toFixed(2) + 'px,0)';
  });
}
window.addEventListener('scroll', function () {
  if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
}, { passive: true });

/* ---------- МАГНИТНЫЕ КНОПКИ ---------- */
if (!REDUCED && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.btn--accent, .btn--dark, .fab__btn').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      btn.style.transform = 'translate3d(' + (x * 0.18).toFixed(1) + 'px,' + (y * 0.3).toFixed(1) + 'px,0)';
    });
    btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
  });
}

/* ---------- ПРЕЛОАДЕР ---------- */
(function () {
  var pre = document.getElementById('preloader');
  var bar = document.getElementById('plBar');
  var pct = document.getElementById('plPct');
  if (!pre) return;
  document.body.classList.add('is-loading');

  var critical = ['img/hero-3.webp'];
  var loaded = 0, shown = 0;
  var started = Date.now();
  var minTime = REDUCED ? 0 : 1500;

  function paint(v) {
    shown = Math.max(shown, v);
    if (bar) bar.style.width = shown + '%';
    if (pct) pct.textContent = Math.round(shown);
  }

  critical.forEach(function (src) {
    var img = new Image();
    img.onload = img.onerror = function () {
      loaded++;
      paint(Math.round((loaded / critical.length) * 85));
    };
    img.src = src;
  });

  // ползём вперёд, даже если сеть молчит
  var creep = setInterval(function () { paint(Math.min(shown + 3, 90)); }, 220);

  function finish() {
    clearInterval(creep);
    paint(100);
    setTimeout(function () {
      pre.classList.add('is-done');
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-ready');
      document.dispatchEvent(new Event('site:ready'));
      // выдержка внутри hero: тег → текст → кнопки → счётчики
      var order = ['.hero__text .tag', '.hero__text p', '.rating', '.hero__btns', '.hero__mini'];
      order.forEach(function (sel, i) {
        var el = document.querySelector(sel);
        if (el) el.style.setProperty('--d', (0.15 + i * 0.09) + 's');
      });
      setTimeout(function () { pre.classList.add('is-gone'); }, 900);
    }, 220);
  }

  function ready() {
    var wait = Math.max(0, minTime - (Date.now() - started));
    setTimeout(finish, wait);
  }

  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready);
  // страховка: не держим человека дольше 6 секунд
  setTimeout(function () { if (!pre.classList.contains('is-done')) finish(); }, 6000);
})();

/* ---------- ТЁМНАЯ / СВЕТЛАЯ ТЕМА ---------- */
(function () {
  var btn = document.getElementById('themeToggle');
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!btn) return;

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F4F3F0' : '#0A0B0D');
    btn.setAttribute('aria-label', theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему');
    try { localStorage.setItem('krov-theme', theme); } catch (e) {}
  }

  btn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    // плавно гасим переход цветов на всей странице
    document.documentElement.classList.add('theme-switching');
    apply(next);
    setTimeout(function () { document.documentElement.classList.remove('theme-switching'); }, 520);
  });

  apply(document.documentElement.getAttribute('data-theme') || 'dark');
})();

/* ---------- ПОДСВЕТКА КАРТОЧЕК ЗА КУРСОРОМ ---------- */
if (!REDUCED && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
}

/* ---------- АКТИВНЫЙ ПУНКТ МЕНЮ ---------- */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var map = {};
  links.forEach(function (a) {
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) map[el.id] = a;
  });
  var ids = Object.keys(map);
  if (!ids.length) return;

  var navIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      links.forEach(function (a) { a.classList.remove('is-current'); });
      map[en.target.id].classList.add('is-current');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  ids.forEach(function (id) { navIO.observe(document.getElementById(id)); });
})();

/* ---------- ЛАЙТБОКС ГАЛЕРЕИ ---------- */
(function () {
  var figs = Array.prototype.slice.call(document.querySelectorAll('#gallery .gal'));
  if (!figs.length) return;

  var box = null, cur = 0;

  function build() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML =
      '<button class="lightbox__x" data-lb-close aria-label="Закрыть">×</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<div class="lightbox__nav"><button data-lb-prev aria-label="Предыдущее фото">←</button>' +
      '<button data-lb-next aria-label="Следующее фото">→</button></div>';
    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-lb-close]') || e.target === box) close();
      else if (e.target.closest('[data-lb-prev]')) show(cur - 1);
      else if (e.target.closest('[data-lb-next]')) show(cur + 1);
    });
    document.body.appendChild(box);
  }

  function show(i) {
    cur = (i + figs.length) % figs.length;
    var src = figs[cur].querySelector('img');
    var cap = figs[cur].querySelector('figcaption');
    var img = box.querySelector('img');
    img.src = src.src;
    img.alt = src.alt || '';
    box.querySelector('figcaption').textContent = cap ? cap.textContent : '';
  }

  function open(i) {
    if (!box) build();
    box.hidden = false;
    show(i);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (box) box.hidden = true;
    document.body.style.overflow = '';
  }

  figs.forEach(function (fig, i) {
    fig.setAttribute('role', 'button');
    fig.setAttribute('tabindex', '0');
    fig.addEventListener('click', function () { open(i); });
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!box || box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
})();
