/**
 * ============================================================
 * Page Drop — плавное падение элементов во всех разделах SPA
 * ============================================================
 */

'use strict';

const PageDrop = {
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  /** Сброс анимации для повторного проигрывания */
  restart(el) {
    el.classList.remove('is-landed');
    const keep = ['page-drop', 'hero-drop', 'page-drop--card', 'hero-drop--card'].filter((c) =>
      el.classList.contains(c)
    );
    keep.forEach((c) => el.classList.remove(c));
    void el.offsetWidth;
    keep.forEach((c) => el.classList.add(c));
  },

  clear(el) {
    el.classList.remove('page-drop', 'hero-drop', 'page-drop--card', 'hero-drop--card', 'is-landed', 'is-visible');
    el.removeAttribute('data-drop-active');
    el.style.removeProperty('--drop-i');
  },

  isCard(el) {
    return (
      el.classList.contains('hero-card') ||
      el.classList.contains('hero-drop--card') ||
      el.classList.contains('contact-telegram__card') ||
      el.classList.contains('pricing-note') ||
      el.classList.contains('about-photo__frame') ||
      el.classList.contains('modal-project') ||
      el.classList.contains('portfolio-card')
    );
  },

  /** Собрать элементы для анимации на странице */
  collect(page) {
    const targets = [];
    const seen = new Set();

    const isHidden = (el) => el.closest('.hidden') !== null;

    const add = (el) => {
      if (!el || seen.has(el) || isHidden(el)) return;
      seen.add(el);
      targets.push(el);
    };

    const pageId = page.dataset?.page;

    /* Главная — элементы с hero-drop в разметке */
    if (pageId === 'home') {
      page.querySelectorAll('.hero-drop').forEach(add);
      return targets;
    }

    /* Шапка раздела */
    page.querySelectorAll('.page-hero .container > *').forEach(add);

    /* Блог: открытая статья */
    if (pageId === 'blog') {
      const articleView = page.querySelector('#blogArticleView');
      if (articleView && !articleView.classList.contains('hidden')) {
        this.collectIn(articleView).forEach(add);
        return targets;
      }
    }

    /* Блоки с reveal */
    page.querySelectorAll('.reveal').forEach((el) => {
      if (el.classList.contains('skills-grid')) {
        el.querySelectorAll('.skill-card').forEach(add);
      } else {
        add(el);
      }
    });

    /* Динамические карточки */
    page.querySelectorAll('.portfolio-card, .blog-card').forEach(add);

    return targets;
  },

  /** Элементы внутри контейнера (блог-статья, сетка после фильтра) */
  collectIn(container) {
    const targets = [];
    const seen = new Set();
    const add = (el) => {
      if (!el || seen.has(el)) return;
      seen.add(el);
      targets.push(el);
    };

    const back = container.querySelector('.article-back');
    if (back) add(back);

    const article = container.querySelector('.article');
    if (article) {
      [...article.children].forEach(add);
    }

    container.querySelectorAll('.blog-toolbar, .reveal, .portfolio-card, .blog-card').forEach((el) => {
      if (el.classList.contains('skills-grid')) {
        el.querySelectorAll('.skill-card').forEach(add);
      } else {
        add(el);
      }
    });

    return targets;
  },

  apply(targets, startIndex = 0) {
    targets.forEach((el, i) => {
      const idx = startIndex + i;
      el.style.setProperty('--drop-i', idx);
      el.setAttribute('data-drop-active', '1');
      el.classList.remove('is-visible');

      const hasHeroDrop = el.classList.contains('hero-drop');

      if (!hasHeroDrop) {
        el.classList.add('page-drop');
        if (this.isCard(el) || el.closest('.about-photo')) {
          el.classList.add('page-drop--card');
        }
      }

      if (this.reduced) {
        el.classList.add('is-landed');
        return;
      }

      this.restart(el);
    });
  },

  /** Анимация всей страницы-раздела */
  animate(page) {
    if (!page) return;

    page.querySelectorAll('[data-drop-active]').forEach((el) => this.clear(el));

    const targets = this.collect(page);
    this.apply(targets);

    if (page.dataset.page === 'home') {
      document.dispatchEvent(new CustomEvent('home-drop-replay'));
    }
  },

  /** Анимация части страницы (статья, карточки блога) */
  animateIn(container, startIndex = 0) {
    if (!container) return;

    const targets = this.collectIn(container);
    targets.forEach((el) => {
      if (el.hasAttribute('data-drop-active')) this.clear(el);
    });
    this.apply(targets, startIndex);
  },
};

/* Пометка элементов после приземления */
document.addEventListener('animationend', (e) => {
  const name = e.animationName || '';
  if (
    name === 'heroDropLand' ||
    name === 'heroCardDrop' ||
    name.endsWith('heroDropLand') ||
    name.endsWith('heroCardDrop')
  ) {
    e.target.classList.add('is-landed', 'is-visible');
  }
});

window.PageDrop = PageDrop;