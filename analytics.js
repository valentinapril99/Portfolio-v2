/* Аналитика: Яндекс Метрика включается только после согласия посетителя.
   Выбор хранится в localStorage («analytics-consent»: yes / no).
   Цели для Метрики (тип «JavaScript-событие»):
     case_open, case_read_solutions, case_read_finish,
     contact_click, tg_channel_click, cv_open, cv_download, photo_open */
(function () {
  var ID = 113964333, KEY = 'analytics-consent', on = false;

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function load() {
    if (on) return; on = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) return; }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + ID, 'ym');
    window.ym(ID, 'init', {
      ssr: true, webvisor: true, trackHash: true, clickmap: true, trackLinks: true,
      accurateTrackBounce: true, referrer: document.referrer, url: location.href
    });
    startTracking();
  }

  function goal(name, params) { if (on && window.ym) window.ym(ID, 'reachGoal', name, params || {}); }

  /* ---------- плашка согласия ---------- */
  function banner() {
    var css = document.createElement('style');
    css.textContent =
      '.consent{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:1000;' +
      'max-width:440px;margin:0 auto 0 0;display:flex;flex-direction:column;gap:16px;padding:20px 24px;border-radius:24px;' +
      'background:var(--surface,#fff);color:var(--name,#0f0f0f);box-shadow:0 8px 32px rgba(0,0,0,.16);' +
      'font:400 16px/24px var(--font-text,system-ui,sans-serif);letter-spacing:.32px}' +
      '.consent p{margin:0}.consent a{color:inherit;text-decoration:underline;text-underline-offset:3px}' +
      '.consent__row{display:flex;gap:8px;flex-wrap:wrap}' +
      '.consent__b{flex:1 1 120px;height:48px;padding:0 20px;border:0;border-radius:24px;cursor:pointer;' +
      'font:500 16px/1 var(--font-text,system-ui,sans-serif);letter-spacing:.32px}' +
      '.consent__b--yes{background:var(--main-2,#242426);color:var(--on-primary,#f0f0f2)}' +
      '.consent__b--no{background:var(--btn-secondary-s,#f0f0f2);color:var(--el-main,#242426)}' +
      '.consent__b:focus-visible{outline:2px solid var(--main-1,#ff8d2a);outline-offset:2px}' +
      '@media (min-width:768px){.consent{left:24px;bottom:24px}}';
    document.head.appendChild(css);
    var el = document.createElement('div');
    el.className = 'consent'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Согласие на cookies');
    el.innerHTML =
      '<p>Сайт использует cookies и Яндекс Метрику, чтобы понимать, какие кейсы читают. ' +
      'Подробнее — в <a href="privacy.html">политике обработки данных</a>.</p>' +
      '<div class="consent__row"><button type="button" class="consent__b consent__b--yes">Принять</button>' +
      '<button type="button" class="consent__b consent__b--no">Отклонить</button></div>';
    el.querySelector('.consent__b--yes').addEventListener('click', function () { set('yes'); el.remove(); load(); });
    el.querySelector('.consent__b--no').addEventListener('click', function () { set('no'); el.remove(); });
    document.body.appendChild(el);
  }

  /* ---------- события ---------- */
  function startTracking() {
    var CASES = { 'case-basket': 'basket', 'case-eat-fast': 'eat-fast', 'case-onboarding': 'onboarding' };
    var PREF = { cb: 'basket', es: 'eat-fast', ob: 'onboarding' };
    var source = 'direct', sent = {};

    /* откуда открыли кейс: карточка на главной, «следующий кейс», меню */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#case-"]');
      if (a) source = a.classList.contains('next-case') ? 'next_case' : a.classList.contains('pblock__a') ? 'card' : 'menu';
    }, true);

    function caseOpened() {
      var c = CASES[location.hash.slice(1)];
      if (c) goal('case_open', { case: c, from: source });
      source = 'direct';
    }
    window.addEventListener('hashchange', caseOpened);
    caseOpened();

    /* глубина чтения: какие разделы кейса появились на экране */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (!x.isIntersecting) return;
          var id = x.target.id, p = id.split('-'), c = PREF[p[0]], s = p.slice(1).join('-');
          if (!c || sent[id]) return; sent[id] = true;
          window.ym(ID, 'params', { 'Глубина чтения': { [c]: { [s]: 1 } } });
          if (s === 'solutions') goal('case_read_solutions', { case: c });
          if (s === 'team') goal('case_read_finish', { case: c });
        });
      }, { threshold: 0, rootMargin: '0px 0px -40% 0px' });  /* раздел засчитан, когда его начало поднялось выше 60% экрана */
      document.querySelectorAll('[id^="cb-"],[id^="es-"],[id^="ob-"]').forEach(function (el) {
        if (/^(cb|es|ob)-[a-z]+$/.test(el.id)) io.observe(el);
      });
    }

    /* контакты, канал, резюме, фото */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a,button'); if (!a) return;
      var h = a.getAttribute('href') || '';
      if (h.indexOf('tel:') === 0) return goal('contact_click', { contact: 'phone' });
      if (h.indexOf('t.me/ValentinaPril') > -1) return goal('contact_click', { contact: 'telegram' });
      if (h.indexOf('vk.com') > -1) return goal('contact_click', { contact: 'vk' });
      if (h.indexOf('behance.net') > -1) return goal('contact_click', { contact: 'behance' });
      if (h.indexOf('set.ki') > -1) return goal('contact_click', { contact: 'setka' });
      if (h.indexOf('t.me/ValyaInDesign') > -1) return goal('tg_channel_click');
      if (a.hasAttribute('data-cv-open')) return goal('cv_open');
      if (h.indexOf('CV.pdf') > -1) return goal('cv_download');
    }, true);

    document.addEventListener('click', function (e) {
      var img = e.target.closest('.case__fig img, .case__photo, .gcell>img, .works .card img');
      if (!img) return;
      var c = CASES[location.hash.slice(1)];
      goal('photo_open', { where: c || (img.closest('.works') ? 'gallery' : 'home') });
    }, true);
  }

  /* ---------- запуск ---------- */
  function boot() {
    var v = get();
    if (v === 'yes') load();
    else if (v !== 'no') banner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  /* для страницы политики: отозвать или дать согласие */
  window.analyticsConsent = function (v) { set(v ? 'yes' : 'no'); };
})();
