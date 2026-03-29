import { Navigate, useParams } from 'react-router-dom';

export default function AdminLegalPolicyEditorPage() {
  const { policyType } = useParams();
  return <Navigate to={`/admin/legal-policies?policy=${policyType}&tab=edit`} replace />;
}
