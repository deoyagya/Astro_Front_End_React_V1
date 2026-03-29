export const LEGAL_POLICY_META = {
  privacy_policy: {
    label: 'Privacy Policy',
    shortLabel: 'Privacy',
    icon: 'fa-user-shield',
    publicPath: '/legal/privacy',
  },
  terms_of_use: {
    label: 'Terms of Use',
    shortLabel: 'Terms',
    icon: 'fa-file-contract',
    publicPath: '/legal/terms',
  },
};

export function formatPolicyDate(value) {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}
