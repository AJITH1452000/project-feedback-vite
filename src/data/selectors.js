/** Pure helpers over the workspace data (same rules as the backend contract). */
import { RATING_PRINCIPLES } from './seed.js';

export const avg = (list) => (list && list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : 0);
export const f1 = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value.toFixed(1) : '—');
/** Rubric reviews average their 4 scores; quick project feedback uses its overall rating. */
export const reviewAvg = (review) => (review?.s?.length ? avg(review.s) : Number(review?.o) || 0);

export const findUser = (users, id) => users.find((u) => u.id === id) || { id, n: 'Team member', r: 'Member', t: 'Specialist' };
export const findProject = (projects, id) => projects.find((p) => p.id === id) || { id, n: 'Enterprise project', c: 'Client', t: [] };

export function initials(name = '') {
  return name.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
}

export function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ratingLabel(score) {
  if (!score) return 'Not rated';
  const level = Math.max(1, Math.min(5, Math.round(score)));
  return RATING_PRINCIPLES.find((r) => r.level === level)?.label || 'Rated';
}

/** Risk scoring — identical to the shared contract. */
export function riskFor(reviews, userId) {
  const mine = reviews.filter((r) => r.u === userId);
  if (!mine.length) return { lvl: 'Low', a: 0, fl: 0 };
  const a = avg(mine.map(reviewAvg));
  const fl = mine.reduce((n, r) => n + r.f.length, 0);
  const sc = fl * 2 + (a < 3.5 ? 2 : 0) + (a < 3 ? 2 : 0);
  return { lvl: sc >= 4 ? 'High' : sc >= 2 ? 'Medium' : 'Low', a, fl };
}

/** Every project-member assignment that has no review yet. */
export function pendingAssignments(projects, users, reviews) {
  const list = [];
  projects.forEach((project) => {
    project.t.forEach((userId) => {
      if (!reviews.some((r) => r.p === project.id && r.u === userId)) {
        const member = findUser(users, userId);
        list.push({ id: `${project.id}-${userId}`, project, member });
      }
    });
  });
  return list;
}

export function totalAssignments(projects) {
  return projects.reduce((n, p) => n + p.t.length, 0);
}

export function projectStats(project, reviews) {
  const mine = reviews.filter((r) => r.p === project.id);
  return {
    reviews: mine,
    count: mine.length,
    avg: mine.length ? avg(mine.map(reviewAvg)) : null,
    coverage: project.t.length ? new Set(mine.map((r) => r.u)).size / project.t.length : 0,
    flags: mine.reduce((n, r) => n + r.f.length, 0),
  };
}

/** Bucket review averages into 1–5 stars for distribution charts. */
export function ratingDistribution(reviews) {
  const buckets = [5, 4, 3, 2, 1].map((level) => ({ level, count: 0 }));
  reviews.forEach((r) => {
    const level = Math.max(1, Math.min(5, Math.round(reviewAvg(r))));
    buckets.find((b) => b.level === level).count += 1;
  });
  return buckets;
}

export function dimensionAverages(reviews) {
  return [0, 1, 2, 3].map((i) => avg(reviews.map((r) => r.s?.[i]).filter((v) => typeof v === 'number')));
}

export function daysUntil(iso) {
  const end = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86_400_000);
}

export function projectTimeline(project) {
  const start = new Date(`${project.s}T00:00:00`).getTime();
  const end = new Date(`${project.e}T00:00:00`).getTime();
  const now = Date.now();
  if (!(end > start)) return 0;
  return Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(rows, filename) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
