/**
 * Reviews — works from plain HTML (GitHub Pages, file open, any static host).
 * Shared storage: JSONBlob cloud (no Node server required).
 * Fallback: localStorage if cloud is unreachable (this browser only).
 */
'use strict';

const ReviewsApp = (() => {
  // Shared public store — all visitors read/write the same reviews
  const BLOB_URL = 'https://jsonblob.com/api/jsonBlob/019f5adb-9731-77da-84ca-189d7a6ee7cc';
  const TOKEN_KEY = 'butik_auth_token';
  const LOCAL_DB_KEY = 'butik_reviews_db_v1';

  let user = null;
  let myReview = null;
  let rating = 5;
  let useCloud = true;
  let busy = false;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }
  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function toast(msg, type) {
    if (typeof window.toast === 'function') window.toast(msg, type);
    else if (type === 'error') console.error(msg);
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function uid() {
    if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '');
    return [...crypto.getRandomValues(new Uint8Array(12))]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function emptyDb() {
    return { users: [], reviews: [], sessions: [] };
  }

  /* ---------- Password hashing (Web Crypto, works in browser) ---------- */

  async function hashPassword(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100_000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function makePassword(password) {
    const salt = uid();
    const hash = await hashPassword(password, salt);
    return { salt, hash };
  }

  async function checkPassword(password, salt, hash) {
    const h = await hashPassword(password, salt);
    return h === hash;
  }

  /* ---------- Cloud / local DB ---------- */

  async function cloudGet() {
    const res = await fetch(BLOB_URL, {
      method: 'GET',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('cloud_get_failed');
    const data = await res.json();
    if (!data || typeof data !== 'object') return emptyDb();
    return {
      users: Array.isArray(data.users) ? data.users : [],
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
    };
  }

  async function cloudPut(db) {
    const res = await fetch(BLOB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(db),
    });
    if (!res.ok) throw new Error('cloud_put_failed');
    return true;
  }

  function localGet() {
    try {
      const raw = localStorage.getItem(LOCAL_DB_KEY);
      if (!raw) return emptyDb();
      const data = JSON.parse(raw);
      return {
        users: Array.isArray(data.users) ? data.users : [],
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        sessions: Array.isArray(data.sessions) ? data.sessions : [],
      };
    } catch {
      return emptyDb();
    }
  }

  function localPut(db) {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
  }

  async function loadDb() {
    if (useCloud) {
      try {
        const db = await cloudGet();
        useCloud = true;
        // also mirror to local for snappy reloads
        localPut(db);
        return db;
      } catch {
        useCloud = false;
        showModeBanner(false);
        return localGet();
      }
    }
    return localGet();
  }

  async function saveDb(db) {
    if (useCloud) {
      try {
        await cloudPut(db);
        localPut(db);
        return;
      } catch {
        useCloud = false;
        showModeBanner(false);
      }
    }
    localPut(db);
  }

  /**
   * Optimistic concurrency: re-read, apply mutator, write.
   * Retries a few times if someone else wrote in between.
   */
  async function withDb(mutator) {
    if (busy) throw new Error('Подождите, идёт сохранение…');
    busy = true;
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const db = await loadDb();
        const snapshot = JSON.stringify(db);
        const result = await mutator(db);
        // re-check cloud for conflicts
        if (useCloud) {
          try {
            const fresh = await cloudGet();
            if (JSON.stringify(fresh) !== snapshot && attempt < 3) {
              await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
              continue;
            }
          } catch {
            /* ignore */
          }
        }
        await saveDb(db);
        return result;
      }
      throw new Error('Не удалось сохранить. Попробуйте ещё раз.');
    } finally {
      busy = false;
    }
  }

  function showModeBanner(cloudOk) {
    const el = $('#reviewsModeBanner');
    if (!el) return;
    if (cloudOk) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    el.innerHTML = `
      <i class="fa-solid fa-wifi"></i>
      Облако временно недоступно — отзывы сохраняются <b>только в этом браузере</b>.
      Обновите страницу позже, чтобы синхронизировать.
    `;
  }

  function publicReview(r) {
    return {
      id: r.id,
      text: r.text,
      rating: r.rating,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt || null,
      author: { name: r.authorName || 'Пользователь' },
      userId: r.userId,
    };
  }

  function pruneSessions(sessions) {
    const now = Date.now();
    return sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
  }

  /* ---------- UI ---------- */

  function starsHtml(n, interactive = false) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const on = i <= n ? 'is-on' : '';
      if (interactive) {
        html += `<button type="button" class="star-btn ${on}" data-star="${i}" aria-label="${i} из 5"><i class="fa-solid fa-star"></i></button>`;
      } else {
        html += `<i class="fa-solid fa-star star ${on}"></i>`;
      }
    }
    return html;
  }

  function renderList(reviews) {
    const grid = $('#reviewsGrid');
    const empty = $('#reviewsEmpty');
    const count = $('#reviewsCount');
    if (!grid) return;

    const list = (reviews || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (count) count.textContent = String(list.length);

    if (!list.length) {
      grid.innerHTML = '';
      if (empty) {
        empty.classList.remove('hidden');
        empty.innerHTML = `
          <i class="fa-regular fa-comments"></i>
          <p>Пока нет отзывов. Будьте первым!</p>
        `;
      }
      return;
    }
    empty?.classList.add('hidden');

    grid.innerHTML = list
      .map(
        (r) => `
      <article class="review-card reveal">
        <div class="review-card__top">
          <div class="review-card__avatar" aria-hidden="true">${escapeHtml((r.author?.name || '?').charAt(0).toUpperCase())}</div>
          <div>
            <strong class="review-card__name">${escapeHtml(r.author?.name || 'Пользователь')}</strong>
            <div class="review-card__meta">
              <span class="review-card__stars">${starsHtml(r.rating || 5)}</span>
              <time datetime="${escapeHtml(r.createdAt || '')}">${formatDate(r.createdAt)}</time>
            </div>
          </div>
        </div>
        <p class="review-card__text">${escapeHtml(r.text)}</p>
      </article>
    `
      )
      .join('');
  }

  function setAuthUi() {
    const guest = $('#reviewsGuest');
    const member = $('#reviewsMember');
    const userLabel = $('#reviewsUserLabel');
    const textArea = $('#reviewText');
    const submitBtn = $('#reviewSubmit');

    if (user) {
      guest?.classList.add('hidden');
      member?.classList.remove('hidden');
      if (userLabel) userLabel.textContent = user.name;
      if (myReview) {
        rating = myReview.rating || 5;
        if (textArea) textArea.value = myReview.text || '';
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Обновить отзыв';
      } else {
        if (textArea && !textArea.value) textArea.value = '';
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Опубликовать отзыв';
      }
      renderRatingPicker();
    } else {
      guest?.classList.remove('hidden');
      member?.classList.add('hidden');
    }
  }

  function renderRatingPicker() {
    const box = $('#reviewRating');
    if (!box) return;
    box.innerHTML = starsHtml(rating, true);
  }

  function switchAuthTab(tab) {
    $$('.auth-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.authTab === tab));
    $('#authLoginForm')?.classList.toggle('hidden', tab !== 'login');
    $('#authRegisterForm')?.classList.toggle('hidden', tab !== 'register');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
  }

  /* ---------- Actions ---------- */

  async function refresh() {
    try {
      const db = await loadDb();
      showModeBanner(useCloud);
      renderList(db.reviews.map(publicReview));

      const token = getToken();
      if (!token) {
        user = null;
        myReview = null;
        setAuthUi();
        return;
      }

      const sessions = pruneSessions(db.sessions || []);
      const session = sessions.find((s) => s.token === token);
      if (!session) {
        setToken('');
        user = null;
        myReview = null;
        setAuthUi();
        return;
      }

      const u = db.users.find((x) => x.id === session.userId);
      if (!u) {
        setToken('');
        user = null;
        myReview = null;
        setAuthUi();
        return;
      }

      user = { id: u.id, name: u.name, email: u.email };
      const mine = db.reviews.find((r) => r.userId === u.id);
      myReview = mine ? publicReview(mine) : null;
      setAuthUi();
    } catch (e) {
      console.error(e);
      toast('Не удалось загрузить отзывы', 'error');
    }
  }

  async function onRegister(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    if (name.length < 2) return toast('Укажите имя (минимум 2 символа)', 'error');
    if (!isValidEmail(email)) return toast('Некорректный email', 'error');
    if (password.length < 6) return toast('Пароль минимум 6 символов', 'error');

    try {
      await withDb(async (db) => {
        if (db.users.some((u) => u.email === email)) {
          throw new Error('Этот email уже зарегистрирован');
        }
        const { salt, hash } = await makePassword(password);
        const newUser = {
          id: uid(),
          name,
          email,
          salt,
          hash,
          createdAt: new Date().toISOString(),
        };
        db.users.push(newUser);
        db.sessions = pruneSessions(db.sessions);
        const token = uid() + uid();
        db.sessions.push({
          token,
          userId: newUser.id,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        });
        setToken(token);
        user = { id: newUser.id, name: newUser.name, email: newUser.email };
        myReview = null;
      });
      setAuthUi();
      form.reset();
      toast('Регистрация успешна! Теперь можно оставить отзыв', 'success');
      await refresh();
    } catch (err) {
      toast(err.message || 'Ошибка регистрации', 'error');
    }
  }

  async function onLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    try {
      await withDb(async (db) => {
        const u = db.users.find((x) => x.email === email);
        if (!u || !(await checkPassword(password, u.salt, u.hash))) {
          throw new Error('Неверный email или пароль');
        }
        db.sessions = pruneSessions(db.sessions);
        const token = uid() + uid();
        db.sessions.push({
          token,
          userId: u.id,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        });
        setToken(token);
        user = { id: u.id, name: u.name, email: u.email };
        const mine = db.reviews.find((r) => r.userId === u.id);
        myReview = mine ? publicReview(mine) : null;
      });
      setAuthUi();
      form.reset();
      toast(`С возвращением, ${user.name}!`, 'success');
      await refresh();
    } catch (err) {
      toast(err.message || 'Ошибка входа', 'error');
    }
  }

  async function onLogout() {
    const token = getToken();
    try {
      await withDb(async (db) => {
        db.sessions = pruneSessions(db.sessions).filter((s) => s.token !== token);
      });
    } catch {
      /* ignore */
    }
    setToken('');
    user = null;
    myReview = null;
    setAuthUi();
    toast('Вы вышли из аккаунта', 'info');
  }

  async function onSubmitReview(e) {
    e.preventDefault();
    if (!user) return toast('Сначала войдите или зарегистрируйтесь', 'error');
    const text = ($('#reviewText')?.value || '').trim();
    if (text.length < 10) return toast('Отзыв слишком короткий (минимум 10 символов)', 'error');
    if (text.length > 1000) return toast('Отзыв слишком длинный (максимум 1000)', 'error');

    try {
      await withDb(async (db) => {
        const token = getToken();
        const session = pruneSessions(db.sessions).find((s) => s.token === token);
        if (!session || session.userId !== user.id) {
          throw new Error('Сессия устарела. Войдите снова.');
        }
        const now = new Date().toISOString();
        const idx = db.reviews.findIndex((r) => r.userId === user.id);
        if (idx >= 0) {
          db.reviews[idx] = {
            ...db.reviews[idx],
            text,
            rating,
            authorName: user.name,
            updatedAt: now,
          };
        } else {
          db.reviews.push({
            id: uid(),
            userId: user.id,
            authorName: user.name,
            text,
            rating,
            createdAt: now,
            updatedAt: null,
          });
        }
      });
      toast('Отзыв опубликован — его видят все посетители', 'success');
      await refresh();
    } catch (err) {
      toast(err.message || 'Не удалось сохранить отзыв', 'error');
    }
  }

  async function onDeleteReview() {
    if (!user) return;
    if (!confirm('Удалить ваш отзыв?')) return;
    try {
      await withDb(async (db) => {
        db.reviews = db.reviews.filter((r) => r.userId !== user.id);
      });
      myReview = null;
      toast('Отзыв удалён', 'info');
      await refresh();
    } catch (err) {
      toast(err.message || 'Ошибка удаления', 'error');
    }
  }

  function init() {
    if (!$('#page-reviews')) return;

    // banner element (if missing in HTML, skip)
    if (!$('#reviewsModeBanner')) {
      const panel = $('.reviews-panel__card');
      if (panel) {
        const ban = document.createElement('div');
        ban.id = 'reviewsModeBanner';
        ban.className = 'reviews-mode-banner hidden';
        panel.prepend(ban);
      }
    }

    $$('.auth-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchAuthTab(tab.dataset.authTab));
    });

    $('#authRegisterForm')?.addEventListener('submit', onRegister);
    $('#authLoginForm')?.addEventListener('submit', onLogin);
    $('#reviewForm')?.addEventListener('submit', onSubmitReview);
    $('#reviewLogout')?.addEventListener('click', onLogout);
    $('#reviewDelete')?.addEventListener('click', onDeleteReview);

    $('#reviewRating')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-star]');
      if (!btn) return;
      rating = Number(btn.dataset.star);
      renderRatingPicker();
    });

    switchAuthTab('register');
    renderRatingPicker();
    refresh();
  }

  return { init, refresh };
})();

document.addEventListener('DOMContentLoaded', () => ReviewsApp.init());
