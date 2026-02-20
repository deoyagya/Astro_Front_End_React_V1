import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showNotification } from './useSharedEffects';

export function useLoginEffects() {
  const navigate = useNavigate();

  useEffect(() => {
    const emailInput = document.getElementById('email');
    const sendBtn = document.getElementById('sendCodeBtn');
    const otpGroup = document.getElementById('otpGroup');
    const verifyBtn = document.getElementById('verifyBtn');
    const otpBoxes = document.querySelectorAll('.otp-box');
    const timerEl = document.getElementById('timer');
    const loginForm = document.getElementById('loginForm');

    if (!emailInput || !sendBtn || !otpGroup || !verifyBtn || !timerEl || !loginForm) return undefined;

    let timerInterval;
    let timeLeft = 60;

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const updateTimer = () => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerEl.textContent = `Code expires in ${minutes}:${seconds.toString().padStart(2, '0')}`;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        sendBtn.disabled = false;
        otpGroup.style.display = 'none';
        verifyBtn.style.display = 'none';
        timerEl.textContent = '';
      }

      timeLeft -= 1;
    };

    const onSend = () => {
      const email = emailInput.value.trim();

      if (!email || !isValidEmail(email)) {
        showNotification('Please enter a valid email', 'error');
        return;
      }

      otpGroup.style.display = 'block';
      verifyBtn.style.display = 'block';
      sendBtn.disabled = true;

      timeLeft = 60;
      updateTimer();
      timerInterval = setInterval(updateTimer, 1000);

      if (otpBoxes[0]) otpBoxes[0].focus();
      showNotification('Verification code sent!', 'success');
    };

    const otpCleanup = [];
    otpBoxes.forEach((box, index) => {
      const onInput = function onInput() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value && index < otpBoxes.length - 1) {
          otpBoxes[index + 1].focus();
        }
      };

      const onKeyDown = function onKeyDown(e) {
        if (e.key === 'Backspace' && !this.value && index > 0) {
          otpBoxes[index - 1].focus();
        }
      };

      box.addEventListener('input', onInput);
      box.addEventListener('keydown', onKeyDown);
      otpCleanup.push(() => {
        box.removeEventListener('input', onInput);
        box.removeEventListener('keydown', onKeyDown);
      });
    });

    const onSubmit = (e) => {
      e.preventDefault();
      const allFilled = Array.from(otpBoxes).every((box) => box.value);

      if (!allFilled) {
        showNotification('Please enter complete OTP', 'error');
        return;
      }

      showNotification('Verification successful!', 'success');
      setTimeout(() => navigate('/reports'), 1000);
    };

    sendBtn.addEventListener('click', onSend);
    loginForm.addEventListener('submit', onSubmit);

    return () => {
      clearInterval(timerInterval);
      sendBtn.removeEventListener('click', onSend);
      loginForm.removeEventListener('submit', onSubmit);
      otpCleanup.forEach((fn) => fn());
    };
  }, [navigate]);
}
