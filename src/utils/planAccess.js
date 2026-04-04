export function hasPremiumOrAbove(user) {
  const role = user?.role;
  return role === 'premium' || role === 'elite' || role === 'admin';
}
