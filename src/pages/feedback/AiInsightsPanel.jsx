import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { AlertTriangle, Check, Flag, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { Pill, SectionCard } from '../../components/common/index.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { form, text } from '../../styles/common.js';
import { feedback as s } from '../../styles/pages.js';

const TONE = { positive: 'success', concern: 'error', context: 'warning' };

function SignalCard({ signal, onAdd, onVerify, onFlag }) {
  const tone = TONE[signal.type] || 'info';
  return (
    <Box sx={s.signal(tone)}>
      <Box sx={s.signalHead}>
        <Typography variant="subtitle2">{signal.title}</Typography>
        <Pill tone={tone}>{signal.badge}</Pill>
      </Box>
      <Typography variant="caption" color="text.secondary">{signal.source} · {signal.date} · AI confidence {signal.confidence}</Typography>
      <Typography variant="body2" sx={text.quote}>“{signal.quote}”</Typography>
      <Box sx={s.signalActions}>
        <Button size="small" sx={s.signalBtn()} startIcon={<Plus size={13} />} onClick={() => onAdd(signal.quote)}>Add to rationale</Button>
        <Button size="small" sx={s.signalBtn(signal.verified && 'verified')} startIcon={<Check size={13} />} onClick={onVerify} aria-pressed={signal.verified}>
          {signal.verified ? 'Verified' : 'Verify'}
        </Button>
        <Button size="small" sx={s.signalBtn(signal.flagged && 'flagged')} startIcon={<Flag size={13} />} onClick={onFlag} aria-pressed={signal.flagged}>
          {signal.flagged ? 'Flagged' : 'Flag context'}
        </Button>
      </Box>
    </Box>
  );
}

export default function AiInsightsPanel({ onAddToRationale }) {
  const { signals, updateSignal } = useData();
  const { notify } = useToast();
  const [reviewed, setReviewed] = useState(false);
  const positives = signals.filter((x) => x.type === 'positive');
  const concerns = signals.filter((x) => x.type !== 'positive');

  const toggle = (signal, key) => {
    const next = { verified: false, flagged: false, [key]: !signal[key] };
    updateSignal(signal.id, next);
    notify(key === 'verified' ? (next.verified ? 'Evidence verified against the source.' : 'Verification removed.') : (next.flagged ? 'Context flagged for reviewer discretion.' : 'Flag removed.'), 'info');
  };
  const add = (quote) => { onAddToRationale(quote); notify('Quote added to your rationale.', 'info'); };

  return (
    <SectionCard title="AI communication insights" subtitle="Potential evidence to review" icon={Sparkles} action={<Pill tone="info">AI-assisted</Pill>}>
      <Box display="flex" gap={0.75} flexWrap="wrap" mb={1.5}>
        <Pill tone="success">{positives.length} positives</Pill>
        <Pill tone="warning">{concerns.length} concerns</Pill>
        <Pill>{new Set(signals.map((x) => x.source)).size} sources</Pill>
      </Box>
      <Typography variant="caption" color="text.secondary">Illustrative signals — no real email or chat accounts are connected.</Typography>

      <Typography variant="overline" component="div" sx={s.signalGroupLabel}>Positive signals</Typography>
      {positives.map((x) => <SignalCard key={x.id} signal={x} onAdd={add} onVerify={() => toggle(x, 'verified')} onFlag={() => toggle(x, 'flagged')} />)}

      <Typography variant="overline" component="div" sx={s.signalGroupLabel}>Concerns & context</Typography>
      {concerns.map((x) => <SignalCard key={x.id} signal={x} onAdd={add} onVerify={() => toggle(x, 'verified')} onFlag={() => toggle(x, 'flagged')} />)}

      <Box sx={s.safeguard}>
        <Box sx={s.safeguardIcon}><AlertTriangle size={17} /></Box>
        <Box>
          <Typography variant="subtitle2">Important safeguards</Typography>
          <Typography variant="caption" color="text.secondary">
            AI may misread tone, sarcasm, forwarded content or missing context. Verify the original source before using an item, and never treat message volume or sentiment as a performance score.
          </Typography>
        </Box>
      </Box>
      <Box sx={[form.checkRow, { mt: 1.5 }]}>
        <Checkbox size="small" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} inputProps={{ 'aria-label': 'Original context reviewed' }} />
        <Typography variant="body2" color="text.secondary">I reviewed the original context for the evidence I intend to use.</Typography>
      </Box>
      <Button fullWidth variant="outlined" sx={{ mt: 1.5 }} startIcon={<ShieldCheck size={16} />} disabled={!reviewed}
        onClick={() => notify('Evidence review saved to the project audit log.')}>
        Save evidence review
      </Button>
    </SectionCard>
  );
}
