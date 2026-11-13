import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { Info } from 'lucide-react';
import { PageHeader } from '../../components/common/index.jsx';
import { useData } from '../../context/DataContext.jsx';
import CreateReviewForm from './CreateReviewForm.jsx';
import AiInsightsPanel from './AiInsightsPanel.jsx';
import { RatingGuide, ReviewHistory, ReviewWorkflow } from './ReviewExtras.jsx';
import { grid, page } from '../../styles/common.js';
import { feedback as s } from '../../styles/pages.js';

const TABS = [
  { value: 'create', label: 'Create review' },
  { value: 'history', label: 'Review history' },
  { value: 'guide', label: 'How ratings work' },
];

export default function Feedback() {
  const [params, setParams] = useSearchParams();
  const { history } = useData();
  const [quote, setQuote] = useState('');
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'create';

  const employee = Number(params.get('employee')) || null;
  const project = Number(params.get('project')) || null;
  const preset = useMemo(() => (employee ? { userId: employee, projectId: project } : null), [employee, project]);
  const clearQuote = useCallback(() => setQuote(''), []);

  const setTab = (value) => setParams(value === 'create' ? {} : { tab: value }, { replace: true });

  return (
    <Box sx={page.root}>
      <PageHeader eyebrow="People performance / project reviews" title="Project feedback" description="Recognize contributions while the work is still fresh — with evidence, not just a score." />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={s.tabs}>
        {TABS.map((t) => <Tab key={t.value} value={t.value} label={t.value === 'history' ? `${t.label} (${history.length})` : t.label} />)}
      </Tabs>

      {tab === 'create' && (
        <>
          <Box sx={s.banner}>
            <Box sx={s.bannerIcon}><Info size={18} /></Box>
            <Box>
              <Typography variant="subtitle2">Review the evidence, not just the score.</Typography>
              <Typography variant="caption" color="text.secondary">
                AI-collected communication signals are suggestions for your review — not verified facts or automatic ratings. Check context and let the employee respond.
              </Typography>
            </Box>
          </Box>
          <Box sx={grid.mainAside}>
            <CreateReviewForm preset={preset} injectedQuote={quote} onQuoteConsumed={clearQuote} onSubmitted={() => setTab('history')} />
            <Box display="flex" flexDirection="column" gap={{ xs: 2, md: 2.5 }}>
              <AiInsightsPanel onAddToRationale={setQuote} />
              <ReviewWorkflow currentStep={1} />
            </Box>
          </Box>
        </>
      )}
      {tab === 'history' && <ReviewHistory history={history} onNewReview={() => setTab('create')} />}
      {tab === 'guide' && <RatingGuide />}
    </Box>
  );
}
