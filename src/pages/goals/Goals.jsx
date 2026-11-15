import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import GoalPlan from './GoalPlan.jsx';
import TeamGoals from './TeamGoals.jsx';

/**
 * /goals          employee → My goals · manager → Team goals · HR → HR performance review
 * /goals/:userId  manager / HR → one employee's plan
 */
export default function Goals() {
  const { user } = useAuth();
  const { userId } = useParams();
  if (user.role === 'employee') return <GoalPlan userId={user.userId} />;
  if (userId) return <GoalPlan userId={Number(userId)} />;
  return user.role === 'hr' ? <Navigate to="/hr-review" replace /> : <TeamGoals />;
}
