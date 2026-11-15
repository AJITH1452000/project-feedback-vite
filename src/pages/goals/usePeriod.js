import { useSearchParams } from 'react-router-dom';
import { GOAL_PERIODS } from '../../data/constants.js';

/** Review period kept in ?period= so it survives navigation between team and plan views. */
export default function usePeriod() {
  const [params, setParams] = useSearchParams();
  const value = params.get('period');
  const period = GOAL_PERIODS.includes(value) ? value : GOAL_PERIODS[0];
  const setPeriod = (next) => setParams((cur) => {
    const copy = new URLSearchParams(cur);
    copy.set('period', next);
    return copy;
  }, { replace: true });
  return [period, setPeriod];
}
