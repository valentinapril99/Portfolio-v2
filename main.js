// «Click me» — ноутбук покачивается по клику
const laptop = document.querySelector('.deco-laptop');
if (laptop) {
  laptop.addEventListener('click', () => {
    laptop.classList.remove('is-wiggling');
    void laptop.offsetWidth;
    laptop.classList.add('is-wiggling');
  });
  laptop.addEventListener('animationend', () => laptop.classList.remove('is-wiggling'));
}

// Мобильное меню
const nav = document.querySelector('.nav');
const menuBtn = nav.querySelector('.menu-btn');
const setMenu = open => {
  nav.classList.toggle('is-open', open);
  document.documentElement.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
};
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('.nav-links a, .menu-extra a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// Аватар и имя в меню ведут на главную, в самый верх.
// Если мы уже на главной — просто прокручиваем наверх без перезагрузки.
const profileLink = nav.querySelector('.profile');
profileLink.addEventListener('click', e => {
  const onHome = new URL(profileLink.href).pathname === location.pathname || location.pathname.endsWith('/');
  setMenu(false);
  if (onHome) {
    e.preventDefault();
    history.replaceState(null, '', location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
// Меню не должно остаться открытым при переходе на десктопную ширину
matchMedia('(min-width: 761px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

// Мобильная шапка: при прокрутке вниз прячется, при прокрутке вверх появляется
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (Math.abs(y - lastY) < 4) return;
  const down = y > lastY && y > nav.offsetHeight;
  nav.classList.toggle('is-hidden', down);
  nav.classList.toggle('is-scrolled', y > 0);
  lastY = y;
}, { passive: true });

// Переключение темы (тёмная тема временно отключена)
const DARK_THEME_ENABLED = false;
const root = document.documentElement;
if (DARK_THEME_ENABLED) {
  const themeBtn = document.querySelector('.theme-btn');
  const themeLabel = themeBtn.querySelector('span');
  const syncThemeBtn = () => {
    const dark = root.dataset.theme === 'dark';
    themeLabel.textContent = dark ? 'Светлая тема' : 'Тёмная тема';
    themeBtn.setAttribute('aria-label', themeLabel.textContent);
  };
  syncThemeBtn();
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const systemTheme = () => systemDark.matches ? 'dark' : 'light';
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      if (next === systemTheme()) localStorage.removeItem('theme');
      else localStorage.setItem('theme', next);
    } catch (e) {}
    syncThemeBtn();
  });
  // Смена темы на устройстве — сайт следует за ней сразу
  systemDark.addEventListener('change', () => {
    try { localStorage.removeItem('theme'); } catch (e) {}
    root.dataset.theme = systemTheme();
    syncThemeBtn();
  });
}

// Фильтр работ на странице «Концепты»
const filters = document.querySelectorAll('.concept-filter');
if (filters.length) {
  const tiles = [...document.querySelectorAll('.concept-tile')];
  const empty = document.querySelector('.concept-empty');
  const applyFilter = btn => {
    const f = btn.dataset.filter;
    filters.forEach(b => {
      const on = b === btn;
      b.classList.toggle('tag--accent', on);
      b.setAttribute('aria-pressed', on);
    });
    let shown = 0;
    tiles.forEach(t => {
      const match = f === 'all' || t.dataset.cat.split(' ').includes(f);
      t.hidden = !match;
      if (match) shown++;
    });
    empty.hidden = shown > 0;
    relayout(f);
  };
  // «Все» — исходная раскладка из макета. Остальные разделы — работы заново
  // раскладываются с первой колонки, каждая в самую короткую колонку.
  const cols = [...document.querySelectorAll('.concept-col')];
  const home = new Map(tiles.map(t => [t, t.parentElement]));
  const ratio = t => {
    const [w, h] = t.style.aspectRatio.split('/').map(parseFloat);
    return h / w;
  };
  const relayout = f => {
    if (f === 'all') {
      tiles.forEach(t => home.get(t).append(t));
      return;
    }
    const heights = cols.map(() => 0);
    tiles.filter(t => !t.hidden).forEach(t => {
      const i = heights.indexOf(Math.min(...heights));
      cols[i].append(t);
      heights[i] += ratio(t) + 0.06; // 0.06 ≈ отступ 20px относительно ширины колонки
    });
  };
  filters.forEach(btn => btn.addEventListener('click', () => applyFilter(btn)));
  // раздел по умолчанию задан в разметке (aria-pressed="true") — по умолчанию «Все»
  applyFilter(document.querySelector('.concept-filter[aria-pressed="true"]') || filters[0]);
}

// Подсветка пункта меню по прокрутке: пока на экране раздел, на который ведёт
// якорная ссылка меню (например «Карьера» → #career), активна она, иначе — пункт страницы
const pageLink = nav.querySelector('.nav-links a[aria-current="page"]');
const spy = [...nav.querySelectorAll('.nav-links a[href^="#"]')]
  .map(a => ({ a, section: document.querySelector(a.getAttribute('href')) }))
  .filter(x => x.section);
if (pageLink && spy.length) {
  const updateSpy = () => {
    const line = window.innerHeight / 3;
    const hit = spy.find(({ section }) => {
      const r = section.getBoundingClientRect();
      return r.top <= line && r.bottom > line;
    });
    const active = hit ? hit.a : pageLink;
    [pageLink, ...spy.map(x => x.a)].forEach(a => {
      if (a === active) a.setAttribute('aria-current', a === pageLink ? 'page' : 'location');
      else a.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', updateSpy, { passive: true });
  window.addEventListener('resize', updateSpy);
  updateSpy();
}

// Полноэкранная карусель работ на странице «Концепты».
// Листаются работы, видимые при текущем фильтре.
// Работает и для галереи «Концептов», и для фото на страницах кейсов
const conceptTiles = [...document.querySelectorAll('.concept-tile, .case-photo-img')];
if (conceptTiles.length) {
  const icon = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Просмотр работ');
  box.innerHTML = `
    <div class="lightbox-stage"><img class="lightbox-img" alt=""><video class="lightbox-video" hidden controls playsinline loop></video></div>
    <p class="lightbox-caption"><span class="lightbox-title"></span><span class="lightbox-count"></span></p>
    <button class="lightbox-btn lightbox-prev" type="button" aria-label="Предыдущая работа">${icon('M15 18l-6-6 6-6')}</button>
    <button class="lightbox-btn lightbox-next" type="button" aria-label="Следующая работа">${icon('M9 6l6 6-6 6')}</button>
    <button class="lightbox-btn lightbox-close" type="button" aria-label="Закрыть">${icon('M6 6l12 12M18 6L6 18')}</button>`;
  document.body.append(box);

  const img = box.querySelector('.lightbox-img');
  const video = box.querySelector('.lightbox-video');
  const title = box.querySelector('.lightbox-title');
  const count = box.querySelector('.lightbox-count');
  let list = [], index = 0, opener = null;
  // лучший источник: WebP из <picture> (даже если картинка на странице ещё не загружена)
  const srcOf = im => {
    const source = im.closest('picture') && im.closest('picture').querySelector('source[type="image/webp"]');
    return source ? source.getAttribute('srcset') : (im.currentSrc || im.src);
  };

  const show = i => {
    index = (i + list.length) % list.length;
    const src = list[index].querySelector('img');
    // работа с видео: в просмотре — плеер со звуком и управлением
    const file = list[index].dataset.video;
    video.hidden = !file;
    img.hidden = !!file;
    if (file) {
      const [w, h] = list[index].style.aspectRatio.split('/').map(parseFloat);
      video.style.setProperty('--ar', w / h);
      video.src = file; video.poster = src.currentSrc || src.src; video.play().catch(() => {});
    } else { video.pause(); video.removeAttribute('src'); video.load(); }
    img.src = srcOf(src);
    img.alt = src.alt;
    title.textContent = src.alt;
    count.textContent = `${index + 1} / ${list.length}`;
    // заранее подгружаем соседние
    [index - 1, index + 1].forEach(n => { new Image().src = srcOf(list[(n + list.length) % list.length].querySelector('img')); });
  };
  const open = tile => {
    list = conceptTiles.filter(t => !t.hidden);
    opener = tile;
    box.hidden = false;
    document.documentElement.classList.add('lightbox-open');
    requestAnimationFrame(() => box.classList.add('is-visible'));
    show(list.indexOf(tile));
    box.querySelector('.lightbox-close').focus();
  };
  const close = () => {
    box.classList.remove('is-visible', 'show-caption');
    box.hidden = true;
    video.pause();
    document.documentElement.classList.remove('lightbox-open');
    if (opener) opener.focus();
  };

  const videoTiles = [];
  conceptTiles.forEach(tile => {
    // плитка с видеофайлом: лёгкое беззвучное превью поверх обложки, играет, пока плитка видна
    if (tile.dataset.video) {
      const v = document.createElement('video');
      v.className = 'concept-video';
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
      v.setAttribute('aria-hidden', 'true');
      tile.append(v);
      videoTiles.push({ tile, v });
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (!v.src) v.src = tile.dataset.preview || tile.dataset.video; v.play().catch(() => {}); }
        else v.pause();
      }).observe(tile);
    }
    tile.tabIndex = 0;
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', `Открыть: ${tile.querySelector('img').alt}`);
    tile.addEventListener('click', () => open(tile));
    tile.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(tile); }
    });
  });
  // Фоновая подгрузка анимаций: когда страница загрузилась и браузер свободен,
  // заранее качаем превью (десятки КБ), а затем и полные видео для просмотра —
  // к моменту открытия раздела «Анимация» всё уже в кеше. При режиме экономии трафика не качаем.
  const idle = cb => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 3000 }) : setTimeout(cb, 1500));
  const saveData = navigator.connection && navigator.connection.saveData;
  if (videoTiles.length && !saveData) {
    const warm = () => idle(() => {
      videoTiles.forEach(({ tile, v }) => {
        if (!v.src) { v.preload = 'auto'; v.src = tile.dataset.preview || tile.dataset.video; }
      });
      idle(() => videoTiles.forEach(({ tile }) => {
        const link = document.createElement('link');
        link.rel = 'prefetch'; link.as = 'video'; link.href = tile.dataset.video;
        document.head.append(link);
      }));
    });
    if (document.readyState === 'complete') warm(); else addEventListener('load', warm, { once: true });
  }
  box.querySelector('.lightbox-prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.lightbox-next').addEventListener('click', () => show(index + 1));
  box.querySelector('.lightbox-close').addEventListener('click', close);
  // клик по фону (не по картинке и не по кнопкам) закрывает
  // телефон горизонтально: нажатие на экран показывает подпись на 7 секунд, а не закрывает просмотр
  const landscape = matchMedia('(orientation: landscape) and (max-height: 500px)');
  let captionTimer;
  box.addEventListener('click', e => {
    if (landscape.matches) {
      if (e.target.closest('.lightbox-btn')) return;
      box.classList.add('show-caption');
      clearTimeout(captionTimer);
      captionTimer = setTimeout(() => box.classList.remove('show-caption'), 7000);
      return;
    }
    if (e.target === box || e.target.classList.contains('lightbox-stage')) close();
  });
  document.addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'Tab') {
      // держим фокус внутри просмотра
      const btns = [...box.querySelectorAll('button')];
      const i = btns.indexOf(document.activeElement);
      e.preventDefault();
      btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
    }
  });
  // свайп на тач-экранах
  let x0 = null;
  box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}

// Карусель фото в карточках кейсов (мобильная версия): точки следят за прокруткой
document.querySelectorAll('.gallery').forEach(g => {
  const next = g.nextElementSibling;
  const dots = next && next.classList.contains('gallery-dots') ? [...next.children] : [];
  if (!dots.length) return;
  g.addEventListener('scroll', () => {
    const i = Math.round(g.scrollLeft / g.clientWidth);
    dots.forEach((d, n) => d.classList.toggle('is-active', n === i));
  }, { passive: true });
});

// Скелетон для изображений контента: обёртка мерцает, пока картинка грузится
document.querySelectorAll('.gallery > div img, .concept-tile img, .mini-cover img, .board-shot img, .case-photo-img img').forEach(img => {
  const box = img.closest('.gallery > div, .concept-tile, .mini-cover, .board-shot, .case-photo-img');
  if (!box) return;
  const done = () => box.classList.add('is-loaded');
  const fail = () => box.classList.add('is-failed');
  box.classList.add('skeleton');
  if (img.complete) {
    if (img.naturalWidth) done(); else fail();
  } else {
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', fail, { once: true });
  }
});

// Меню кейса: подсветка раздела, который сейчас на экране
const caseLinks = [...document.querySelectorAll('.case-links a')];
if (caseLinks.length) {
  const caseSecs = caseLinks.map(a => document.querySelector(a.getAttribute('href')));
  const updateCase = () => {
    const line = window.innerHeight / 3;
    let active = -1;
    caseSecs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= line) active = i; });
    caseLinks.forEach((a, i) => {
      if (i === active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', updateCase, { passive: true });
  window.addEventListener('resize', updateCase);
  updateCase();
}

// Кейсы в разработке: по клику — заглушка «Тут кипит работа...»
const soonLinks = document.querySelectorAll('[data-soon]');
if (soonLinks.length) {
  const modal = document.createElement('dialog');
  modal.className = 'soon-modal';
  modal.setAttribute('aria-labelledby', 'soon-title');
  modal.innerHTML = '<picture><source srcset="Portfolio%20Resurses/cat-computer.webp" type="image/webp"><img class="soon-img" src="Portfolio%20Resurses/cat-computer.gif" alt="Кот печатает на ноутбуке" loading="lazy" width="498" height="498"></picture>'
    + '<p class="soon-text" id="soon-title">Тут кипит работа...</p>'
    + '<button class="btn btn--primary" type="button">Ок, зайду позже</button>';
  document.body.append(modal);
  modal.querySelector('button').addEventListener('click', () => modal.close());
  // Клик по затемнению вокруг окна тоже закрывает его
  modal.addEventListener('click', e => {
    const r = modal.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (e.target === modal && !inside) modal.close();
  });
  modal.addEventListener('close', () => document.documentElement.classList.remove('soon-open'));
  soonLinks.forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    document.documentElement.classList.add('soon-open');
    modal.showModal();
  }));
}

// Счётчик посетителей: каждый новый браузер один раз увеличивает общий счётчик
// (бесплатный сервис Abacus) и запоминает свой номер — при повторных визитах
// показываем тот же номер и счётчик не накручиваем. Если сервис недоступен — строка скрыта.
const visitCounter = document.querySelector('.visit-counter');
if (visitCounter) {
  const KEY = 'visitor-number';
  const show = n => {
    visitCounter.querySelector('.visit-number').textContent = Number(n).toLocaleString('ru-RU');
    visitCounter.classList.add('is-ready');
  };
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch {}
  const isLocal = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:';
  if (saved) show(saved);
  else if (!isLocal) {
    fetch('https://abacus.jasoncameron.dev/hit/valentina-mikheeva-portfolio/visitors')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(({ value }) => {
        if (!Number.isFinite(value)) return;
        try { localStorage.setItem(KEY, value); } catch {}
        show(value);
      })
      .catch(() => {});
  }
}
