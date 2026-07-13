/**
 * Reviews: public list + register/login + post review
 */
'use strict';

const ReviewsApp = (() => {
  const TOKEN_KEY = 'butik_auth_token';
  const API = '/api';

  let user = null;
  let myReview = null;
  let rating = 5;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(`${API}${path}`, { ...options, headers });
    } catch {
      throw new Error('Сервер недоступен. Запустите сайт через node serve.js');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Ошибка ${res.status}`);
    }
    return data;
  }

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

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  }

  function toast(msg, type) {
    if (typeof window.toast === 'function') window.toast(msg, type);
    else if (type === 'error') alert(msg);
  }

  function renderList(reviews) {
    const grid = $('#reviewsGrid');
    const empty = $('#reviewsEmpty');
    const count = $('#reviewsCount');
    if (!grid) return;

    if (count) count.textContent = String(reviews.length);

    if (!reviews.length) {
      grid.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    grid.innerHTML = reviews
      .map(
        (r) => `
      <article class="review-card reveal">
        <div class="review-card__top">
          <div class="review-card__avatar" aria-hidden="true">${escapeHtml((r.author?.name || '?').charAt(0).toUpperCase())}</div>
          <div>
            <strong class="review-card__name">${escapeHtml(r.author?.name || 'Пользователь')}</strong>
            <div class="review-card__meta">
              <span class="review-card__stars">${starsHtml(r.rating || 5)}</span>
              <time datetime="${escapeHtml(r.createdAt)}">${formatDate(r.createdAt)}</time>
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
        if (textArea) textArea.value = '';
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

  async function loadReviews() {
    try {
      const data = await api('/reviews');
      renderList(data.reviews || []);
    } catch (e) {
      renderList([]);
      const empty = $('#reviewsEmpty');
      if (empty) {
        empty.classList.remove('hidden');
        empty.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>${escapeHtml(e.message)}</p>
          <p class="text-muted">Для отзывов сайт нужно открывать через <code>node serve.js</code></p>
        `;
      }
    }
  }

  async function loadMe() {
    if (!getToken()) {
      user = null;
      myReview = null;
      setAuthUi();
      return;
    }
    try {
      const data = await api('/me');
      user = data.user;
      myReview = data.myReview;
    } catch {
      setToken('');
      user = null;
      myReview = null;
    }
    setAuthUi();
  }

  async function onRegister(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    try {
      const data = await api('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setToken(data.token);
      user = data.user;
      myReview = null;
      setAuthUi();
      toast('Регистрация успешна! Теперь можно оставить отзыв', 'success');
      form.reset();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function onLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    try {
      const data = await api('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      user = data.user;
      await loadMe();
      toast(`С возвращением, ${user.name}!`, 'success');
      form.reset();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function onLogout() {
    try {
      await api('/logout', { method: 'POST' });
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
    const text = $('#reviewText')?.value.trim() || '';
    try {
      const data = await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({ text, rating }),
      });
      myReview = data.review;
      renderList(data.reviews || []);
      setAuthUi();
      toast('Отзыв опубликован', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function onDeleteReview() {
    if (!confirm('Удалить ваш отзыв?')) return;
    try {
      const data = await api('/reviews/mine', { method: 'DELETE' });
      myReview = null;
      renderList(data.reviews || []);
      setAuthUi();
      toast('Отзыв удалён', 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function init() {
    if (!$('#page-reviews')) return;

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
    loadReviews();
    loadMe();
  }

  /** Called when navigating to reviews page */
  function refresh() {
    loadReviews();
    loadMe();
  }

  return { init, refresh };
})();

document.addEventListener('DOMContentLoaded', () => ReviewsApp.init());
