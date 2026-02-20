import { useEffect } from 'react';

let notificationStylesInjected = false;

export function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    <span>${message}</span>
  `;

  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'success' ? '#2ed573' : '#ff4757'};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    z-index: 9999;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function createStars() {
  const starsContainer = document.getElementById('stars');
  if (!starsContainer) return;
  starsContainer.innerHTML = '';

  for (let i = 0; i < 150; i += 1) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.width = `${Math.random() * 3}px`;
    star.style.height = star.style.width;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    star.style.opacity = `${Math.random() * 0.3 + 0.1}`;
    starsContainer.appendChild(star);
  }
}

function setupModalHandlers() {
  const termsLink = document.getElementById('terms-link');
  const privacyLink = document.getElementById('privacy-link');
  const termsLinkLogin = document.getElementById('terms-link-login');
  const privacyLinkLogin = document.getElementById('privacy-link-login');
  const termsModal = document.getElementById('termsModal');
  const privacyModal = document.getElementById('privacyModal');
  const closeTerms = document.getElementById('closeTerms');
  const closePrivacy = document.getElementById('closePrivacy');

  const openTerms = (e) => {
    e.preventDefault();
    termsModal?.classList.add('show');
  };

  const openPrivacy = (e) => {
    e.preventDefault();
    privacyModal?.classList.add('show');
  };

  termsLink?.addEventListener('click', openTerms);
  termsLinkLogin?.addEventListener('click', openTerms);
  privacyLink?.addEventListener('click', openPrivacy);
  privacyLinkLogin?.addEventListener('click', openPrivacy);

  const onCloseTerms = () => termsModal?.classList.remove('show');
  const onClosePrivacy = () => privacyModal?.classList.remove('show');

  closeTerms?.addEventListener('click', onCloseTerms);
  closePrivacy?.addEventListener('click', onClosePrivacy);

  const onWindowClick = (e) => {
    if (e.target?.classList?.contains('modal')) {
      e.target.classList.remove('show');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach((modal) => modal.classList.remove('show'));
    }
  };

  window.addEventListener('click', onWindowClick);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    termsLink?.removeEventListener('click', openTerms);
    termsLinkLogin?.removeEventListener('click', openTerms);
    privacyLink?.removeEventListener('click', openPrivacy);
    privacyLinkLogin?.removeEventListener('click', openPrivacy);
    closeTerms?.removeEventListener('click', onCloseTerms);
    closePrivacy?.removeEventListener('click', onClosePrivacy);
    window.removeEventListener('click', onWindowClick);
    document.removeEventListener('keydown', onKeyDown);
  };
}

export function useSharedEffects() {
  useEffect(() => {
    if (!notificationStylesInjected) {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
      notificationStylesInjected = true;
    }

    createStars();
    const cleanup = setupModalHandlers();
    return cleanup;
  }, []);
}
