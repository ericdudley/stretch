import initStretch from './stretch';
import initHeaderAnimation from './header';

window.addEventListener('DOMContentLoaded', () => {
  const noTransitionOnLoadElements = document.querySelectorAll(
    '.no-transition-on-load',
  );
  noTransitionOnLoadElements.forEach((element) => element.classList.remove('no-transition-on-load'));

  initHeaderAnimation();
  initStretch();
});
