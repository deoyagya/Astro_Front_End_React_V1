import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import EmbeddedCheckoutModal from './EmbeddedCheckoutModal';

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({})),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  EmbeddedCheckoutProvider: ({ children }) => <div data-testid="embedded-provider">{children}</div>,
  EmbeddedCheckout: () => <div data-testid="embedded-checkout">Embedded Checkout</div>,
}));

describe('EmbeddedCheckoutModal', () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 420,
    });
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo = originalScrollTo;
  });

  it('locks body scroll and restores it on close', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <EmbeddedCheckoutModal clientSecret="cs_test_123" onClose={onClose} />,
    );

    expect(screen.getByText('Complete Your Payment')).toBeInTheDocument();
    expect(screen.getByTestId('embedded-checkout')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-420px');
    expect(document.body.style.width).toBe('100%');

    fireEvent.click(screen.getByLabelText('Close checkout'));
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 420);
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.width).toBe('');
  });
});
