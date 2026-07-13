/**
 * Simple JSON file store for users, sessions, reviews.
 * No external deps — Node crypto only.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Railway volume: set DATA_DIR=/data  (persists across deploys)
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  sessions: path.join(DATA_DIR, 'sessions.json'),
  reviews: path.join(DATA_DIR, 'reviews.json'),
};

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const file of Object.values(FILES)) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, '[]', 'utf8');
  }
}

function read(file) {
  ensureData();
  try {
    return JSON.parse(fs.readFileSync(file, { encoding: 'utf8' }));
  } catch {
    return [];
  }
}

function write(file, data) {
  ensureData();
  // Explicit utf8 so Cyrillic is stored correctly on all platforms
  fs.writeFileSync(file, JSON.stringify(data, null, 2), { encoding: 'utf8' });
}

function id() {
  return crypto.randomBytes(12).toString('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

function publicReview(review, usersById) {
  const user = usersById[review.userId];
  return {
    id: review.id,
    text: review.text,
    rating: review.rating,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt || null,
    author: user
      ? { name: user.name }
      : { name: review.authorName || 'Пользователь' },
  };
}

/* ---------- Users ---------- */

function findUserByEmail(email) {
  const users = read(FILES.users);
  return users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function findUserById(userId) {
  return read(FILES.users).find((u) => u.id === userId) || null;
}

function createUser({ name, email, password }) {
  const users = read(FILES.users);
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    const err = new Error('EMAIL_TAKEN');
    throw err;
  }
  const { salt, hash } = hashPassword(password);
  const user = {
    id: id(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  write(FILES.users, users);
  return publicUser(user);
}

function authenticate(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.salt, user.hash)) return null;
  return publicUser(user);
}

/* ---------- Sessions ---------- */

function createSession(userId) {
  const sessions = read(FILES.sessions);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days
  });
  // prune expired
  const now = Date.now();
  const active = sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
  write(FILES.sessions, active);
  return token;
}

function getSessionUser(token) {
  if (!token) return null;
  const sessions = read(FILES.sessions);
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  const user = findUserById(session.userId);
  return user ? publicUser(user) : null;
}

function destroySession(token) {
  if (!token) return;
  const sessions = read(FILES.sessions).filter((s) => s.token !== token);
  write(FILES.sessions, sessions);
}

/* ---------- Reviews ---------- */

function listReviews() {
  const reviews = read(FILES.reviews);
  const users = read(FILES.users);
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  return reviews
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((r) => publicReview(r, byId));
}

function upsertReview(userId, { text, rating, authorName }) {
  const reviews = read(FILES.reviews);
  const cleanText = String(text || '').trim();
  const stars = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

  if (cleanText.length < 10) {
    const err = new Error('TEXT_SHORT');
    throw err;
  }
  if (cleanText.length > 1000) {
    const err = new Error('TEXT_LONG');
    throw err;
  }

  const existingIdx = reviews.findIndex((r) => r.userId === userId);
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    reviews[existingIdx] = {
      ...reviews[existingIdx],
      text: cleanText,
      rating: stars,
      authorName,
      updatedAt: now,
    };
    write(FILES.reviews, reviews);
    return listReviews().find((r) => r.id === reviews[existingIdx].id);
  }

  const review = {
    id: id(),
    userId,
    authorName,
    text: cleanText,
    rating: stars,
    createdAt: now,
    updatedAt: null,
  };
  reviews.push(review);
  write(FILES.reviews, reviews);
  return listReviews().find((r) => r.id === review.id);
}

function deleteReview(userId) {
  const reviews = read(FILES.reviews);
  const next = reviews.filter((r) => r.userId !== userId);
  write(FILES.reviews, next);
  return true;
}

function getUserReview(userId) {
  const reviews = read(FILES.reviews);
  const users = read(FILES.users);
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  const mine = reviews.find((r) => r.userId === userId);
  return mine ? publicReview(mine, byId) : null;
}

module.exports = {
  ensureData,
  createUser,
  authenticate,
  createSession,
  getSessionUser,
  destroySession,
  listReviews,
  upsertReview,
  deleteReview,
  getUserReview,
};
