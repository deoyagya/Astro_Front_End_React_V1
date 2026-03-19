import { useEffect } from 'react';

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

export function useSharedEffects() {
  useEffect(() => {}, []);
}
