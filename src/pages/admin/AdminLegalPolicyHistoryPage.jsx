import { Navigate, useParams } from 'react-router-dom';

export default function AdminLegalPolicyHistoryPage() {
  const { policyType } = useParams();
  return <Navigate to={`/admin/legal-policies?policy=${policyType}&tab=history`} replace />;
}
