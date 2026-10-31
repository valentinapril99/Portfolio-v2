/* Аналитика: Яндекс Метрика.
   Метрика запускается сразу; посетитель видит уведомление о cookie («Хорошо» скрывает его навсегда).
   Не запускается, если в браузере включён запрет отслеживания (Do Not Track / Global Privacy Control)
   или посетитель отключил статистику на странице политики («analytics-consent» = no).
   Цели для Метрики (тип «JavaScript-событие»):
     case_open, case_read_solutions, case_read_finish,
     по каждому кейсу: basket_open / basket_solutions / basket_finish,
       eat_fast_open / eat_fast_solutions / eat_fast_finish, onboarding_open / onboarding_solutions / onboarding_finish,
     contact_click, tg_channel_click, cv_open, cv_download, photo_open, concepts_view */
(function () {
  var ID = 113964333, KEY = 'analytics-consent', NOTICE = 'cookie-notice', on = false;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function blocked() {
    return get(KEY) === 'no' || navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  }

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

  /* ---------- уведомление о cookie ---------- */
  function notice() {
    var css = document.createElement('style');
    css.textContent =
      '.cookie{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:1000;' +
      'max-width:800px;margin:0 auto;display:flex;align-items:center;gap:24px;padding:20px 20px 20px 28px;border-radius:24px;' +
      'background:var(--btn-secondary-s,#f0f0f2);color:var(--name,#0f0f0f);box-shadow:0 12px 40px rgba(0,0,0,.16);' +
      'font:400 16px/24px var(--font-text,system-ui,sans-serif);letter-spacing:.32px;animation:cookie-in .3s ease-out}' +
      '.cookie p{margin:0;flex:1;min-width:0}' +
      '.cookie a{color:inherit;text-decoration:underline;text-decoration-color:var(--main-1,#ff8d2a);' +
      'text-decoration-thickness:2px;text-underline-offset:4px}' +
      '.cookie a:hover{color:var(--main-1,#ff8d2a)}' +
      '.cookie .cookie__ok{flex:none}' +  /* сама кнопка — стиль сайта .btn.btn--primary */
      '@keyframes cookie-in{from{opacity:0;transform:translateY(12px)}}' +
      '@media (max-width:640px){.cookie{flex-direction:column;align-items:stretch;gap:16px;padding:20px}}' +
      '@media (prefers-reduced-motion:reduce){.cookie{animation:none}}';
    document.head.appendChild(css);
    var el = document.createElement('div');
    el.className = 'cookie'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Уведомление о cookie');
    el.innerHTML =
      '<p>Я использую файлы cookie, чтобы сайт работал корректно и чтобы понимать, какие кейсы читают. ' +
      'Продолжая просмотр, вы соглашаетесь с этим. Подробнее — в <a href="privacy.html">политике конфиденциальности</a>.</p>' +
      '<button type="button" class="btn btn--primary cookie__ok">Хорошо</button>';
    el.querySelector('.cookie__ok').addEventListener('click', function () { set(NOTICE, 'ok'); el.remove(); });
    document.body.appendChild(el);
  }

  /* ---------- события ---------- */
  function startTracking() {
    var CASES = { 'case-basket': 'basket', 'case-eat-fast': 'eat-fast', 'case-onboarding': 'onboarding' };
    var PREF = { cb: 'basket', es: 'eat-fast', ob: 'onboarding' };
    var source = 'direct', sent = {};
    function key(c) { return c.replace('-', '_'); }  /* basket, eat_fast, onboarding */

    /* откуда открыли кейс: карточка на главной, «следующий кейс», меню */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#case-"]');
      if (a) source = a.classList.contains('next-case') ? 'next_case' : a.classList.contains('pblock__a') ? 'card' : 'menu';
    }, true);

    function caseOpened() {
      var c = CASES[location.hash.slice(1)];
      if (c) { goal('case_open', { case: c, from: source }); goal(key(c) + '_open', { from: source }); }
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
          if (s === 'solutions') { goal('case_read_solutions', { case: c }); goal(key(c) + '_solutions'); }
          if (s === 'team') { goal('case_read_finish', { case: c }); goal(key(c) + '_finish'); }
        });
      }, { threshold: 0, rootMargin: '0px 0px -40% 0px' });  /* раздел засчитан, когда его начало поднялось выше 60% экрана */
      document.querySelectorAll('[id^="cb-"],[id^="es-"],[id^="ob-"]').forEach(function (el) {
        if (/^(cb|es|ob)-[a-z]+$/.test(el.id)) io.observe(el);
      });

      /* главная: до каких разделов долистали; концепты — отдельной целью.
         how: scroll — долистали сами, menu — перешли по ссылке в меню */
      var HOME = { projects: 'Кейсы', career: 'Опыт', concepts: 'Концепты', about: 'Обо мне', contacts: 'Контакты' };
      var hio = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (!x.isIntersecting) return;
          var id = x.target.id; if (sent[id]) return; sent[id] = true;
          var how = location.hash.slice(1) === id ? 'menu' : 'scroll';
          window.ym(ID, 'params', { 'Главная: разделы': { [HOME[id]]: how } });
          if (id === 'concepts') goal('concepts_view', { how: how });
        });
      }, { threshold: 0, rootMargin: '0px 0px -40% 0px' });
      Object.keys(HOME).forEach(function (id) { var el = document.getElementById(id); if (el) hio.observe(el); });
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
    if (!blocked()) load();
    if (get(NOTICE) !== 'ok') notice();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
