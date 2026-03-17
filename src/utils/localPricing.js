export function convertUsdCentsToLocal(usdCents, currency = 'USD', exchangeRate = 1) {
  if (!usdCents || usdCents <= 0) return 0;

  const code = (currency || 'USD').toUpperCase();
  const usdAmount = usdCents / 100;

  if (code === 'USD') {
    return usdAmount;
  }

  const converted = usdAmount * (exchangeRate || 1);
  return code === 'INR' ? Math.round(converted) : Number(converted.toFixed(2));
}

export function formatLocalCurrency(amount, currency = 'USD') {
  const code = (currency || 'USD').toUpperCase();
  if (!amount || amount <= 0) return 'Free';

  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  const maximumFractionDigits = code === 'INR' ? 0 : 2;
  const minimumFractionDigits = code === 'INR' ? 0 : 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(amount);
  } catch {
    return code === 'INR' ? `₹${amount}` : `$${Number(amount).toFixed(2)}`;
  }
}

export function formatUsdCentsForUser(usdCents, paymentContext) {
  const currency = paymentContext?.currency || 'USD';
  const exchangeRate = paymentContext?.exchangeRate || 1;
  const localAmount = convertUsdCentsToLocal(usdCents, currency, exchangeRate);
  return formatLocalCurrency(localAmount, currency);
}

export function formatDiscountValue(discountValue, discountType, paymentContext) {
  if (discountType === 'percentage') {
    return `${discountValue}% off`;
  }
  return `${formatUsdCentsForUser(discountValue, paymentContext)} off`;
}
