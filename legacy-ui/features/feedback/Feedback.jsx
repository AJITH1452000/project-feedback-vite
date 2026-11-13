import { useEffect, useRef, useState } from 'react';
import { Alert, Button, MenuItem, Snackbar, TextField } from '@mui/material';
import {
  Check, CheckCircle2, CircleHelp, FileText, Info, Plus, RefreshCw, ShieldCheck,
  Sparkles, X,
} from 'lucide-react';
import SectionHeader from '../../components/SectionHeader.jsx';
import { projects } from '../../data/mockData.js';
import './feedback.css';

const ratingGuide = [
  { score: '5.0', label: 'Exceptional', description: 'Consistently exceeds agreed outcomes; clear evidence of impact beyond role expectations.' },
  { score: '4.0–4.9', label: 'Exceeds expectations', description: 'Often delivers above expectations and proactively improves outcomes.' },
  { score: '3.0–3.9', label: 'Meets expectations', description: 'Reliably delivers the agreed scope and expected quality.' },
  { score: '2.0–2.9', label: 'Partially meets expectations', description: 'Some important outcomes are inconsistent; clear examples and support actions are required.' },
  { score: '1.0–1.9', label: 'Does not meet expectations', description: 'Material gaps against agreed expectations, supported by specific and contextualized examples.' },
  { score: '0.0–0.9', label: 'Insufficient evidence', description: 'There is not enough evidence to assess outcomes. This should not be treated as an automatic poor-performance rating.' },
];

const exampleHistory = [
  { employee: 'Priya Sharma', project: 'Beacon LMS rollout', period: 'Q3 2026', rating: 4.2, status: 'Acknowledged' },
  { employee: 'Arun Kumar', project: 'Dolphin AI assistant', period: 'Q3 2026', rating: 3.8, status: 'Employee response pending' },
  { employee: 'Meera Nair', project: 'ERP integration', period: 'Completion review', rating: 4.5, status: 'Manager draft' },
];

const evidence = [
  {
    id: 'resolution',
    kind: 'Positive',
    title: 'Proactive issue resolution',
    source: 'Project channel · Oct 14 · AI confidence: Medium',
    quote: '“I found the issue in the course assignment flow and pushed a fix before the client walkthrough.”',
  },
  {
    id: 'stakeholder',
    kind: 'Positive',
    title: 'Positive stakeholder feedback',
    source: 'Email summary · Oct 9 · AI confidence: High',
    quote: '“The walkthrough was clear and the team responded quickly to our questions.”',
  },
  {
    id: 'deadline',
    kind: 'Concern',
    title: 'Deadline communication',
    source: 'Project channel · Oct 17 · AI confidence: Medium',
    quote: '“The revised delivery date was shared after the original milestone had passed.”',
  },
  {
    id: 'clarification',
    kind: 'Needs context',
    title: 'Repeated clarification needed',
    source: 'Email thread · Oct 20 · AI confidence: Low',
    quote: '“The acceptance criteria needed clarification across two follow-up discussions.”',
  },
];

const initialForm = {
  employee: 'Priya Sharma',
  project: projects[0]?.name ?? '',
  reviewType: 'Project closure',
  period: '',
  overallRating: null,
  delivery: null,
  collaboration: null,
  strengths: '',
  developmentAreas: '',
  employeeComments: '',
  visibility: 'Manager and employee',
  discussed: false,
  nextReviewDate: '',
  evidenceReviewed: false,
};

const ratingFields = ['overallRating', 'delivery', 'collaboration'];
const emptyAnalysis = {
  overallRating: { score: null, confidence: 'low', rationale: '' },
  delivery: { score: null, confidence: 'low', rationale: '' },
  collaboration: { score: null, confidence: 'low', rationale: '' },
  summary: '',
};

function isValidAnalysis(analysis) {
  return ratingFields.every((field) => {
    const rating = analysis?.[field];
    return rating
      && (rating.score === null || (typeof rating.score === 'number' && rating.score >= 0 && rating.score <= 5 && Math.round(rating.score * 10) === rating.score * 10))
      && ['low', 'medium', 'high'].includes(rating.confidence)
      && typeof rating.rationale === 'string';
  }) && typeof analysis.summary === 'string';
}

const positiveFeedbackWords = ['good', 'great', 'excellent', 'strong', 'successful', 'successfully', 'effective', 'reliable', 'proactive', 'helpful', 'improved', 'improvement', 'resolved', 'delivered', 'completed', 'achieved', 'collaborated', 'communicated', 'supported', 'clear', 'quality', 'on-time'];
const negativeFeedbackWords = ['poor', 'missed', 'late', 'delayed', 'failed', 'failure', 'incomplete', 'unclear', 'unresponsive', 'conflict', 'blocked', 'rework', 'unresolved', 'underperformed', 'needs-improvement'];
const deliveryFeedbackWords = ['deliver', 'delivery', 'deadline', 'milestone', 'schedule', 'quality', 'completed', 'completion', 'release', 'launched', 'on-time', 'late', 'delayed', 'missed'];
const collaborationFeedbackWords = ['collaborat', 'teamwork', 'communicat', 'stakeholder', 'support', 'responsive', 'handoff', 'conflict', 'unresponsive'];
const outcomeFeedbackWords = ['result', 'impact', 'customer', 'client', 'reduced', 'increased', 'launched', 'resolved', 'completed', 'milestone', 'project', 'saved', 'by'];

function countFeedbackWords(text, words) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9% -]/g, ' ');
  return words.reduce((count, word) => {
    const pattern = new RegExp(`(^|\\W)${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|\\W)`, 'i');
    return count + Number(pattern.test(normalized));
  }, 0);
}

function localEstimate(strengths, developmentAreas) {
  const text = `${strengths} ${developmentAreas}`.trim();
  const words = text.match(/[a-z0-9]+/gi) || [];
  if (!words.some((word) => word.length > 1)) return emptyAnalysis;

  const positiveStrengths = countFeedbackWords(strengths, positiveFeedbackWords);
  const negativeStrengths = countFeedbackWords(strengths, negativeFeedbackWords);
  const positiveDevelopment = countFeedbackWords(developmentAreas, positiveFeedbackWords);
  const negativeDevelopment = countFeedbackWords(developmentAreas, negativeFeedbackWords);
  const sentiment = positiveStrengths - negativeStrengths + (positiveDevelopment * 0.35) - (negativeDevelopment * 0.8);
  const outcomes = countFeedbackWords(text, outcomeFeedbackWords) + Number(/\b\d+(?:\.\d+)?%?\b/.test(text));
  const meaningfulSentiment = positiveStrengths + negativeStrengths + positiveDevelopment + negativeDevelopment > 0;
  if (!meaningfulSentiment && !outcomes) return emptyAnalysis;

  const score = Math.round(Math.max(0, Math.min(5, 3 + sentiment * 0.55 + Math.min(outcomes, 2) * 0.15)) * 10) / 10;
  const deliveryMentions = countFeedbackWords(text, deliveryFeedbackWords);
  const collaborationMentions = countFeedbackWords(text, collaborationFeedbackWords);
  const makeRating = (rationale) => ({ score, confidence: 'low', rationale });
  const overallRating = makeRating(
    outcomes
      ? 'Local estimate from wording and outcome terms; verify against measurable project evidence.'
      : 'Local estimate from brief positive or negative wording; add concrete outcomes for a meaningful assessment.',
  );
  const delivery = deliveryMentions
    ? makeRating('Local estimate from delivery-related wording; confirm milestones, quality, and results.')
    : { ...overallRating, rationale: 'No specific delivery evidence was found; using the overall wording as a low-confidence estimate.' };
  const collaboration = collaborationMentions
    ? makeRating('Local estimate from teamwork or communication wording; confirm with specific examples.')
    : { ...overallRating, rationale: 'No specific collaboration evidence was found; using the overall wording as a low-confidence estimate.' };
  return {
    overallRating: { ...overallRating, source: 'local' },
    delivery: { ...delivery, source: 'local' },
    collaboration: { ...collaboration, source: 'local' },
    summary: 'AI is not configured or could not be reached. Showing a local demo estimate (low confidence).',
  };
}

function historyStatusClass(status) {
  if (status === 'Acknowledged') return 'acknowledged';
  if (status === 'Manager draft') return 'draft';
  return 'pending';
}

export default function Feedback({ onSubmit, feedback = [] }) {
  const [activeTab, setActiveTab] = useState('create');
  const [form, setForm] = useState(initialForm);
  const [verifiedEvidence, setVerifiedEvidence] = useState([]);
  const [flaggedEvidence, setFlaggedEvidence] = useState([]);
  const [manualRatings, setManualRatings] = useState([]);
  const manualRatingsRef = useRef(new Set());
  const [ratingSuggestions, setRatingSuggestions] = useState(emptyAnalysis);
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [analysisError, setAnalysisError] = useState('');
  const [analysisRetry, setAnalysisRetry] = useState(0);
  const [alert, setAlert] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);

  const submittedReviews = feedback
    .filter((item) => item.reviewPeriod)
    .map((item) => ({
      employee: item.employee || item.author,
      project: item.project,
      period: item.reviewPeriod,
      rating: Number(item.rating).toFixed(1),
      status: item.reviewStatus || 'Employee response pending',
    }));

  const history = [...submittedReviews, ...exampleHistory];

  useEffect(() => {
    const strengths = form.strengths.trim();
    const developmentAreas = form.developmentAreas.trim();
    if (!strengths && !developmentAreas) {
      setRatingSuggestions(emptyAnalysis);
      setAnalysisStatus('idle');
      setAnalysisError('');
      setForm((current) => {
        const next = { ...current };
        ratingFields.forEach((field) => {
          if (!manualRatingsRef.current.has(field)) next[field] = null;
        });
        return next;
      });
      return undefined;
    }

    const controller = new AbortController();
    setAnalysisStatus('waiting');
    setAnalysisError('');
    setRatingSuggestions(emptyAnalysis);
    setForm((current) => {
      const next = { ...current };
      ratingFields.forEach((field) => {
        if (!manualRatingsRef.current.has(field)) next[field] = null;
      });
      return next;
    });

    const timer = window.setTimeout(async () => {
      setAnalysisStatus('analyzing');
      try {
        const response = await fetch('/api/analyze-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strengths, developmentAreas }),
          signal: controller.signal,
        });
        const responseBody = await response.text();
        let result;
        try {
          result = JSON.parse(responseBody);
        } catch {
          throw new Error(response.status === 500
            ? 'The AI server is unavailable. Restart the app with npm run dev.'
            : 'The AI server returned an invalid response. Please retry.');
        }
        if (!response.ok) throw new Error(result.error || `AI analysis failed (${response.status}).`);
        if (!isValidAnalysis(result)) throw new Error('AI returned an invalid rating response. Please try again.');

        setRatingSuggestions(result);
        setAnalysisStatus('complete');
        setForm((current) => {
          const next = { ...current };
          ratingFields.forEach((field) => {
            if (!manualRatingsRef.current.has(field)) next[field] = result[field].score;
          });
          return next;
        });
      } catch (error) {
        if (error.name === 'AbortError') return;
        const fallback = localEstimate(strengths, developmentAreas);
        setRatingSuggestions(fallback);
        setAnalysisStatus('fallback');
        setAnalysisError(error.message || 'AI analysis failed.');
        setForm((current) => {
          const next = { ...current };
          ratingFields.forEach((field) => {
            if (!manualRatingsRef.current.has(field)) next[field] = fallback[field].score;
          });
          return next;
        });
      }
    }, 850);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.strengths, form.developmentAreas, analysisRetry]);

  function showMessage(message, severity = 'success') {
    setAlert({ message, severity });
    setToastOpen(true);
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateRating(field, value) {
    manualRatingsRef.current.add(field);
    setManualRatings((current) => current.includes(field) ? current : [...current, field]);
    setForm((current) => ({ ...current, [field]: Number(value) }));
  }

  function useRatingSuggestion(field) {
    manualRatingsRef.current.delete(field);
    setManualRatings((current) => current.filter((item) => item !== field));
    setForm((current) => ({ ...current, [field]: ratingSuggestions[field].score }));
  }

  function resetManualRatings() {
    manualRatingsRef.current.clear();
    setManualRatings([]);
    setForm((current) => ({
      ...current,
      ...Object.fromEntries(ratingFields.map((field) => [field, ratingSuggestions[field].score])),
    }));
  }

  function addEvidenceToRationale(item) {
    const addition = `${item.title}: ${item.quote}`;
    updateForm('strengths', form.strengths ? `${form.strengths}\n\n${addition}` : addition);
    showMessage('Evidence added to strengths and evidence.');
  }

  function toggleEvidence(id, list, setList) {
    setList((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  function saveDraft() {
    try {
      sessionStorage.setItem('profeed-review-draft', JSON.stringify(form));
      showMessage('Draft saved in this browser session.');
    } catch (error) {
      showMessage(`Could not save this draft: ${error.message}`, 'error');
    }
  }

  function submitReview(event) {
    event.preventDefault();
    if (form.overallRating === null) {
      showMessage('Choose an overall performance rating before submitting.', 'error');
      return;
    }
    if (form.strengths.trim().length < 12) {
      showMessage('Add specific strengths or evidence (at least 12 characters) before submitting.', 'error');
      return;
    }
    const feedbackText = [
      `Strengths / evidence: ${form.strengths.trim()}`,
      form.developmentAreas.trim() && `Development areas / next steps: ${form.developmentAreas.trim()}`,
      form.employeeComments.trim() && `Employee comments: ${form.employeeComments.trim()}`,
    ].filter(Boolean).join('\n\n');
    onSubmit({
      employee: form.employee,
      project: form.project,
      reviewPeriod: form.period.trim() || form.reviewType,
      reviewType: form.reviewType,
      rating: Number(form.overallRating),
      category: 'Project review',
      delivery: form.delivery,
      collaboration: form.collaboration,
      strengths: form.strengths.trim(),
      developmentAreas: form.developmentAreas.trim(),
      message: feedbackText,
      text: feedbackText,
      employeeComments: form.employeeComments.trim(),
      visibility: form.visibility,
      nextReviewDate: form.nextReviewDate,
      discussed: form.discussed,
    });
    sessionStorage.removeItem('profeed-review-draft');
    setForm(initialForm);
    manualRatingsRef.current.clear();
    setManualRatings([]);
    setActiveTab('history');
    showMessage('Review submitted for employee review.');
  }

  return (
    <>
      <SectionHeader
        eyebrow="PEOPLE PERFORMANCE / PROJECT REVIEWS"
        title="Project feedback"
        description="Recognize contributions while the work is still fresh."
      />

      <div className="review-tabs" role="tablist" aria-label="Project feedback sections">
        {[
          ['create', 'Create review'],
          ['history', 'Review history'],
          ['guide', 'How ratings work'],
        ].map(([tab, label]) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'active' : ''}
            key={tab}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <div className="review-page">
          <div className="review-info-banner">
            <Info size={20} />
            <div>
              <strong>Review the evidence, not just the score.</strong>
              <p>AI-collected communication signals are suggestions for your review—not verified facts or automatic performance ratings. Check context and let the employee respond.</p>
            </div>
          </div>

          <form className="review-layout" onSubmit={submitReview}>
            <div className="review-main-column">
              <section className="panel review-card">
                <div className="review-card-heading">
                  <div>
                    <h2>Review details</h2>
                    <p>Choose the employee, project and review period.</p>
                  </div>
                  <span className="review-pill draft-pill">Draft review</span>
                </div>
                <div className="review-fields-grid">
                  <TextField select label="Employee" value={form.employee} onChange={(event) => updateForm('employee', event.target.value)}>
                    {['Priya Sharma', 'Arun Kumar', 'Meera Nair', 'Ravi Menon', 'Joseph Paul'].map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                  </TextField>
                  <TextField select label="Project" value={form.project} onChange={(event) => updateForm('project', event.target.value)}>
                    {projects.map((project) => <MenuItem key={project.id} value={project.name}>{project.name}</MenuItem>)}
                  </TextField>
                  <TextField select label="Review type" value={form.reviewType} onChange={(event) => updateForm('reviewType', event.target.value)}>
                    {['Project closure', 'Quarterly review'].map((reviewType) => <MenuItem key={reviewType} value={reviewType}>{reviewType}</MenuItem>)}
                  </TextField>
                  <TextField label="Review period" placeholder="e.g. Q3 2026 or Project closure" value={form.period} onChange={(event) => updateForm('period', event.target.value)} />
                </div>
              </section>

              <section className="panel review-card">
                <div className="review-card-heading">
                  <div>
                    <h2>Performance feedback</h2>
                    <p>Ratings update as you type. You can also adjust each score manually.</p>
                  </div>
                  <span className="review-pill">0.0–5.0 scale</span>
                </div>
                  <div className={`rating-analysis-note ${analysisStatus}`} aria-live="polite">
                  <Sparkles size={16} />
                    <span>
                      {analysisStatus === 'waiting' && 'Waiting for you to finish typing…'}
                      {analysisStatus === 'analyzing' && 'AI is analyzing your review text…'}
                      {analysisStatus === 'complete' && `${ratingSuggestions.summary} AI suggestions are advisory; verify them against project evidence.`}
                      {analysisStatus === 'fallback' && `${ratingSuggestions.summary} (${analysisError})`}
                      {analysisStatus === 'error' && `AI analysis could not run: ${analysisError}`}
                      {analysisStatus === 'idle' && 'Type strengths or development notes to request AI rating suggestions. Text is sent to OpenAI; do not include sensitive personal information.'}
                    </span>
                    {(analysisStatus === 'error' || analysisStatus === 'fallback') && (
                      <Button type="button" size="small" variant="text" onClick={() => setAnalysisRetry((count) => count + 1)}>
                        Retry
                      </Button>
                    )}
                  </div>
                  <RatingControl field="overallRating" title="Overall performance rating" required value={form.overallRating} suggestion={ratingSuggestions.overallRating} manual={manualRatings.includes('overallRating')} onChange={updateRating} onUseSuggestion={useRatingSuggestion} />
                  <div className="review-fields-grid review-subratings">
                    <RatingControl field="delivery" title="Delivery & quality" value={form.delivery} suggestion={ratingSuggestions.delivery} manual={manualRatings.includes('delivery')} onChange={updateRating} onUseSuggestion={useRatingSuggestion} />
                    <RatingControl field="collaboration" title="Collaboration & communication" value={form.collaboration} suggestion={ratingSuggestions.collaboration} manual={manualRatings.includes('collaboration')} onChange={updateRating} onUseSuggestion={useRatingSuggestion} />
                </div>
                <TextField
                  label="Strengths / evidence"
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="What went well? Include examples, outcomes, and impact."
                  value={form.strengths}
                  onChange={(event) => updateForm('strengths', event.target.value)}
                />
                <p className="review-helper">Use specific, observable examples and project outcomes.</p>
                <TextField
                  label="Development areas / next steps"
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="What could be improved? Add a practical action or support needed."
                  value={form.developmentAreas}
                  onChange={(event) => updateForm('developmentAreas', event.target.value)}
                />
                <div className="use-all-suggestions">
                  <Button type="button" size="small" variant="text" disabled={analysisStatus !== 'complete' && analysisStatus !== 'fallback'} onClick={resetManualRatings}>
                    Use live suggestions for all ratings
                  </Button>
                </div>
              </section>

              <section className="panel review-card employee-perspective">
                <div className="review-card-heading">
                  <div>
                    <h2>Employee comments</h2>
                    <p>Optional employee perspective, context, or response to feedback.</p>
                  </div>
                  <span className="review-pill">Optional</span>
                </div>
                <TextField
                  label="Employee comments (optional)"
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Employee perspective, context, or response to feedback."
                  value={form.employeeComments}
                  onChange={(event) => updateForm('employeeComments', event.target.value)}
                />
                <div className="review-fields-grid">
                  <TextField
                    type="date"
                    label="Next review date (for quarterly reviews)"
                    InputLabelProps={{ shrink: true }}
                    value={form.nextReviewDate}
                    onChange={(event) => updateForm('nextReviewDate', event.target.value)}
                  />
                  <TextField select label="Feedback visibility" value={form.visibility} onChange={(event) => updateForm('visibility', event.target.value)}>
                    {['Manager and employee', 'Manager only', 'HR and manager'].map((visibility) => <MenuItem key={visibility} value={visibility}>{visibility}</MenuItem>)}
                  </TextField>
                </div>
                <div className="suggested-workflow">
                  <strong>Suggested workflow</strong>
                  <p>Manager submits feedback → employee acknowledges and adds comments → discussion if needed → HR can view the review history. Ratings should be evidence-based and not the sole input to annual decisions.</p>
                </div>
                <label className="review-checkbox">
                  <input type="checkbox" checked={form.discussed} onChange={(event) => updateForm('discussed', event.target.checked)} />
                  <span>Feedback has been discussed with the employee and their perspective has been considered.</span>
                </label>
              </section>
            </div>

            <aside className="review-side-column">
              <section className="panel evidence-card">
                <div className="review-card-heading">
                  <div className="evidence-heading">
                    <span className="evidence-sparkle"><Sparkles size={18} /></span>
                    <div><h2>AI communication insights</h2><p>Potential evidence to review</p></div>
                  </div>
                  <span className="review-pill ai-pill">AI-assisted</span>
                </div>
                <div className="evidence-summary">
                  <span className="evidence-chip positive-chip">2 positives</span>
                  <span className="evidence-chip concern-chip">2 concerns</span>
                  <span className="evidence-chip source-chip">2 sources</span>
                </div>
                <p className="evidence-disclaimer">Illustrative demo data only — no real email or message accounts are connected.</p>
                <div className="evidence-section-label">POSITIVE SIGNALS</div>
                {evidence.slice(0, 2).map((item) => <EvidenceCard key={item.id} item={item} verified={verifiedEvidence.includes(item.id)} flagged={flaggedEvidence.includes(item.id)} onAdd={() => addEvidenceToRationale(item)} onVerify={() => toggleEvidence(item.id, verifiedEvidence, setVerifiedEvidence)} onFlag={() => toggleEvidence(item.id, flaggedEvidence, setFlaggedEvidence)} />)}
                <div className="evidence-section-label">CONCERNS / IMPROVEMENT SIGNALS</div>
                {evidence.slice(2).map((item) => <EvidenceCard key={item.id} item={item} verified={verifiedEvidence.includes(item.id)} flagged={flaggedEvidence.includes(item.id)} onAdd={() => addEvidenceToRationale(item)} onVerify={() => toggleEvidence(item.id, verifiedEvidence, setVerifiedEvidence)} onFlag={() => toggleEvidence(item.id, flaggedEvidence, setFlaggedEvidence)} />)}
                <div className="evidence-safeguard">
                  <strong>Important safeguards</strong>
                  <p>AI may misread tone, sarcasm, forwarded content or missing context. Verify the original source before using an item. Do not treat message volume, sentiment or private/personal communications as a performance score.</p>
                </div>
                <label className="review-checkbox evidence-review-check">
                  <input type="checkbox" checked={form.evidenceReviewed} onChange={(event) => updateForm('evidenceReviewed', event.target.checked)} />
                  <span>I reviewed the original context for the evidence I intend to use.</span>
                </label>
                <div className="evidence-actions">
                  <Button type="button" variant="outlined" startIcon={<RefreshCw size={15} />} onClick={() => showMessage('Illustrative communication insights refreshed.')}>Refresh insights</Button>
                  <Button type="button" variant="outlined" startIcon={<FileText size={15} />} onClick={saveDraft}>Save evidence review</Button>
                </div>
              </section>

              <section className="panel workflow-card">
                <h2>Review workflow</h2>
                <p>Keep feedback timely and auditable.</p>
                <ol className="workflow-steps">
                  <li><span>1</span><div><strong>Manager drafts review</strong><small>Ratings, evidence and feedback</small></div></li>
                  <li><span>2</span><div><strong>Employee responds</strong><small>Comments, achievements and context</small></div></li>
                  <li><span>3</span><div><strong>Discussion & acknowledgement</strong><small>Acknowledgement confirms discussion, not agreement</small></div></li>
                  <li><span>4</span><div><strong>Finalize & retain history</strong><small>Store edits, timestamps and reviewer details</small></div></li>
                </ol>
                <Button type="button" variant="outlined" onClick={() => showMessage('Discussion reminder prepared for this demo.')}>Send discussion reminder</Button>
              </section>
            </aside>

            <div className="review-submit-row">
              <span className="review-demo-note">Prototype UI · Connect to your HR/project system for real employee data, audit history, permissions and notifications. Draft data is not sent to a server.</span>
              <div>
                <Button type="button" variant="outlined" color="inherit" onClick={() => { manualRatingsRef.current.clear(); setManualRatings([]); setForm(initialForm); showMessage('Review form cleared.'); }}>Cancel</Button>
                <Button type="submit" variant="contained" endIcon={<Check size={16} />}>Submit feedback</Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <section className="panel review-history-card">
          <div className="review-card-heading">
            <div><h2>Recent project reviews</h2><p>Example history view — replace with live system data.</p></div>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setActiveTab('create')}>New review</Button>
          </div>
          {history.length ? (
            <div className="history-table-wrap">
              <table className="review-history-table">
                <thead><tr><th>EMPLOYEE</th><th>PROJECT</th><th>PERIOD</th><th>RATING</th><th>STATUS</th></tr></thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={`${item.employee}-${item.project}-${index}`}>
                      <td>{item.employee}</td><td>{item.project}</td><td>{item.period}</td><td>{item.rating} / 5</td>
                      <td><span className={`review-pill history-status ${historyStatusClass(item.status)}`}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="review-empty-state">No project reviews yet. Create a review to start your history.</div>}
        </section>
      )}

      {activeTab === 'guide' && (
        <section className="panel rating-guide-card">
          <div className="review-card-heading">
            <div><h2>Rating guide & review principles</h2><p>Use the same observable standards across employees and projects.</p></div>
            <CircleHelp size={21} className="rating-guide-icon" />
          </div>
          <div className="rating-guide-list">
            {ratingGuide.map((item) => (
              <article className="rating-guide-row" key={item.score}>
                <div className="guide-rating">{item.score}</div>
                <div><strong>{item.score} — {item.label}</strong><p>{item.description}</p></div>
              </article>
            ))}
          </div>
          <div className="review-info-banner guide-note">
            <ShieldCheck size={19} />
            <p>Ratings are a starting point for a fair conversation—not the only input to annual decisions. Discuss context and specific examples with the employee.</p>
          </div>
        </section>
      )}

      <Snackbar open={toastOpen} autoHideDuration={4500} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {alert && <Alert onClose={() => setToastOpen(false)} severity={alert.severity} variant="filled">{alert.message}</Alert>}
      </Snackbar>
    </>
  );
}

function EvidenceCard({ item, verified, flagged, onAdd, onVerify, onFlag }) {
  return (
    <article className="evidence-item">
      <div className="evidence-item-heading">
        <strong>{item.title}</strong>
        <span className={`evidence-kind ${item.kind.toLowerCase().replace(' ', '-')}`}>{verified ? 'Verified' : item.kind}</span>
      </div>
      <small>{item.source}</small>
      <blockquote>{item.quote}</blockquote>
      <div className="evidence-item-actions">
        <Button type="button" size="small" variant="outlined" startIcon={<Plus size={13} />} onClick={onAdd}>Add to strengths</Button>
        <Button type="button" size="small" variant="outlined" startIcon={verified ? <CheckCircle2 size={13} /> : <Check size={13} />} onClick={onVerify}>{verified ? 'Verified' : 'Verify'}</Button>
        <Button type="button" size="small" variant="outlined" startIcon={flagged ? <Check size={13} /> : <X size={13} />} onClick={onFlag}>{flagged ? 'Context flagged' : 'Flag context'}</Button>
      </div>
    </article>
  );
}

function RatingControl({ field, title, required = false, value, suggestion, manual, onChange, onUseSuggestion }) {
  const score = suggestion?.score ?? null;
  const displayedValue = value ?? 0;
  return (
    <div className={`score-control${required ? ' score-control-overall' : ''}`}>
      <div className="score-control-heading">
        <label htmlFor={`rating-${field}`}>{title}{required && <span className="required-mark"> *</span>}</label>
        <span className={`score-mode ${manual ? 'manual' : suggestion?.source === 'local' ? 'local' : 'suggested'}`}>{manual ? 'Manual' : suggestion?.source === 'local' ? 'Local estimate' : 'AI suggestion'}</span>
      </div>
      <div className="score-input-row">
        <input
          id={`rating-${field}`}
          aria-label={`${title}, 0 to 5 in 0.1 steps`}
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={displayedValue}
          style={{ '--score-progress': `${(displayedValue / 5) * 100}%` }}
          onChange={(event) => onChange(field, event.target.value)}
        />
        <output htmlFor={`rating-${field}`}>{value === null ? '—' : Number(value).toFixed(1)}</output>
      </div>
      <div className="score-control-footer">
        <small>
          {score === null
            ? (suggestion?.rationale || 'Add feedback text to request an AI rating suggestion.')
            : `${suggestion.rationale} · ${suggestion.confidence} confidence`}
        </small>
        {manual && score !== null && (
          <button type="button" onClick={() => onUseSuggestion(field)}>Use suggestion</button>
        )}
      </div>
    </div>
  );
}
