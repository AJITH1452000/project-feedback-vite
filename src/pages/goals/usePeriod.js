import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { defaultCycle, visibleCycles } from '../../data/cycles.js';
import { useGoalData } from '../../hooks/queries/workspace.js';

/**
 * Review period (= appraisal cycle) kept in ?period= so it survives navigation between team and plan views.
 * Returns [period, setPeriod, cycles] where cycles are the ones this person may see (open first).
 */
export default function usePeriod() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { cycles } = useGoalData();
  const visible = visibleCycles(cycles, user);
  const names = visible.map((c) => c.period);
  const value = params.get('period');
  const period = names.includes(value) ? value : defaultCycle(visible)?.period || '';
  const setPeriod = (next) => setParams((cur) => {
    const copy = new URLSearchParams(cur);
    copy.set('period', next);
    return copy;
  }, { replace: true });
  return [period, setPeriod, visible];
}
