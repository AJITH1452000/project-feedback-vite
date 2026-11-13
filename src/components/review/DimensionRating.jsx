import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Sparkles } from 'lucide-react';
import { feedback as s } from '../../styles/pages.js';

/** One rubric dimension with a 1–5 star control and an optional AI suggestion chip. */
export default function DimensionRating({ dimension, value, onChange, suggestion }) {
  return (
    <Box sx={s.dimension}>
      <Box sx={s.dimensionText}>
        <Typography variant="subtitle2">{dimension.name}</Typography>
        <Typography variant="caption" color="text.secondary">{dimension.desc}</Typography>
      </Box>
      <Box sx={s.dimensionScore}>
        <Rating
          name={dimension.id}
          value={value || null}
          onChange={(_, next) => onChange(next || 0)}
          getLabelText={(v) => `${v} of 5`}
        />
        <Typography variant="caption" sx={s.dimensionValue}>{value ? `${value} / 5` : 'Not rated'}</Typography>
        {suggestion?.score != null && (
          <Tooltip title={suggestion.rationale || 'AI suggestion'}>
            <Button size="small" sx={s.suggestion} startIcon={<Sparkles size={12} />} onClick={() => onChange(suggestion.score)}>
              AI {suggestion.score}
            </Button>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
