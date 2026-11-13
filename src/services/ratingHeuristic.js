/** Built-in rule-based rating analyser (demo mode / offline fallback). Mirrors profeed-backend/src/services/ai.js. */

const clampHalf = (n) => Math.max(1, Math.min(5, Math.round(Number(n) * 2) / 2));

/* ------------------------- Built-in rule-based analyser ------------------------- */

const CUES = {
  delivery: {
    pos: ['deliver', 'shipped', 'ship ', 'ahead of', 'early', 'on time', 'on schedule', 'zero defect', 'no defect', 'quality', 'tested', 'test coverage',
      'ownership', 'owned', 'reliable', 'automated', 'optimi', 'fixed', 'resolved', 'released', 'launched', 'performance', 'clean code', 'accurate'],
    neg: ['late', 'delay', 'missed', 'slipped', 'overdue', 'bug', 'defect', 'error', 'rework', 'incomplete', 'regression', 'outage', 'broke', 'sloppy', 'deviation'],
  },
  collaboration: {
    pos: ['team', 'collaborat', 'communicat', 'helped', 'support', 'mentor', 'shared', 'stakeholder', 'client', 'clear update', 'transparent', 'responsive',
      'proactive', 'pair', 'documented', 'aligned', 'feedback', 'walkthrough', 'demo'],
    neg: ['miscommunic', 'unclear', 'conflict', 'silent', 'no update', 'not updated', 'late update', 'escalat', 'unresponsive', 'clarification', 'confus'],
  },
  general: {
    pos: ['excellent', 'outstanding', 'exceptional', 'great', 'strong', 'impressive', 'improved', 'impact', 'exceeded', 'excellent', 'consistent', 'initiative'],
    neg: ['poor', 'weak', 'struggl', 'needs improvement', 'below', 'inconsistent', 'concern', 'issue', 'problem', 'fail'],
  },
};

// Positive phrases that contain a "concern" word (e.g. "zero defects") must not count as concerns.
const NEGATED = ['zero defect', 'no defect', 'without defect', 'zero bug', 'no bug', 'without bug', 'bug-free', 'zero error', 'no error',
  'error-free', 'not late', 'never late', 'no delay', 'without delay', 'no rework', 'no outage', 'no issue', 'no problem', 'no concern'];
const stripNegated = (text) => NEGATED.reduce((acc, phrase) => acc.split(phrase).join(' '), text);

function hits(text, words) {
  return words.filter((w) => text.includes(w));
}

// Each positive cue +0.35 (max 5 cues), each concern −0.6 (max 4): strong evidence ≈ 4, clear problems ≈ 2.
function scoreFrom(pos, neg, base = 3) {
  return clampHalf(base + Math.min(pos, 5) * 0.35 - Math.min(neg, 4) * 0.6);
}

export function heuristicAnalysis({ strengths = '', developmentAreas = '' }) {
  const s = ` ${strengths.toLowerCase()} `;
  const d = ` ${developmentAreas.toLowerCase()} `;
  const sNeg = stripNegated(s); // text used for concern matching
  const words = (strengths + ' ' + developmentAreas).trim().split(/\s+/).filter(Boolean).length;
  const specific = /\d|%|sprint|release|milestone|client|week|day|defect|api|feature/.test(s) ? 1 : 0;

  const dim = (key) => {
    const pos = hits(s, CUES[key].pos);
    // Problems mentioned in "development areas" are expected; weigh them lighter than problems in strengths.
    const neg = [...hits(sNeg, CUES[key].neg), ...hits(stripNegated(d), CUES[key].neg).slice(0, 1)];
    const evidence = pos.length + neg.length;
    return {
      score: evidence ? scoreFrom(pos.length + specific * 0.5, neg.length) : 3,
      confidence: evidence >= 3 ? 'medium' : 'low',
      rationale: evidence
        ? `Signals found — positive: ${pos.slice(0, 4).join(', ') || 'none'}; concerns: ${neg.slice(0, 3).join(', ') || 'none'}.`.slice(0, 200)
        : 'No specific evidence for this area in the text — neutral 3.0. Add an example to improve accuracy.',
    };
  };

  const delivery = dim('delivery');
  const collaboration = dim('collaboration');
  const gPos = hits(s, CUES.general.pos).length;
  const gNeg = hits(sNeg, CUES.general.neg).length + Math.min(hits(d, CUES.general.neg).length, 1);
  const overallScore = clampHalf((delivery.score + collaboration.score) / 2 + Math.max(-1, Math.min(1, (gPos - gNeg) * 0.25)));
  const confidence = words >= 25 && (delivery.confidence === 'medium' || collaboration.confidence === 'medium') ? 'medium' : 'low';

  return {
    overallRating: {
      score: overallScore,
      confidence,
      rationale: words < 12 ? 'Very little text — add concrete outcomes for a more reliable suggestion.' : 'Combined delivery and collaboration signals, adjusted for overall tone and specificity.',
    },
    delivery,
    collaboration,
    summary: `Built-in analysis of ${words} words. Rule-based keyword scoring — review and adjust before saving.`,
    source: 'heuristic',
  };
}

