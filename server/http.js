/** Small HTTP helpers shared by the routes. */

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Wrap an async route so thrown errors reach the error handler. */
export const route = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const text = (value, max = 600) => String(value ?? '').trim().slice(0, max);

export function requireText(value, min, message, max = 600) {
  const v = text(value, max);
  if (v.length < min) throw new HttpError(400, `${message} (at least ${min} characters).`);
  return v;
}

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || ''));
