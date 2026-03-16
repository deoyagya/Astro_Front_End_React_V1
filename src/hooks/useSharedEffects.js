import { useEffect } from 'react';

let notificationStylesInjected = false;

export function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  const icon = document.createElement('i');
  icon.className = `fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`;

  const text = document.createElement('span');
  text.textContent = message;

  notification.appendChild(icon);
  notification.appendChild(text);

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
  }, []);
}
