(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  let index = 0;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const showSlide = (nextIndex) => {
    index = clamp(nextIndex, 0, total - 1);
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    const current = slides[index];
    const section = current.dataset.section || '';
    const title = current.dataset.title || '';
    const chromeMode = current.dataset.chrome || 'on';

    const header = current.querySelector('.header .section');
    const subsection = current.querySelector('.header .subsection');
    const footerTitle = current.querySelector('.footer .title');
    const footerCount = current.querySelector('.footer .count');
    const headerWrap = current.querySelector('.header');
    const footerWrap = current.querySelector('.footer');

    if (header) header.textContent = section;
    if (subsection) subsection.textContent = title;
    // Fixed presentation title in footer
    if (footerTitle) footerTitle.textContent = "Hydrokinetic Energy Conversion Systems";
    if (footerCount) footerCount.textContent = `${index + 1} / ${total}`;

    if (chromeMode === 'off') {
      if (headerWrap) headerWrap.style.visibility = 'hidden';
      if (footerWrap) footerWrap.style.visibility = 'hidden';
    } else {
      if (headerWrap) headerWrap.style.visibility = 'visible';
      if (footerWrap) footerWrap.style.visibility = 'visible';
    }

    if (location.hash !== `#/${index + 1}`) {
      history.replaceState(null, '', `#/${index + 1}`);
    }
  };

  const step = (delta) => showSlide(index + delta);

  const onKey = (event) => {
    const key = event.key;
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(key)) {
      event.preventDefault();
      step(1);
    } else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(key)) {
      event.preventDefault();
      step(-1);
    } else if (key === 'Home') {
      event.preventDefault();
      showSlide(0);
    } else if (key === 'End') {
      event.preventDefault();
      showSlide(total - 1);
    }
  };

  const fromHash = () => {
    const match = location.hash.match(/#\/(\d+)/);
    if (!match) return 0;
    const parsed = parseInt(match[1], 10);
    if (Number.isNaN(parsed)) return 0;
    return clamp(parsed - 1, 0, total - 1);
  };

  window.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', () => showSlide(fromHash()));

  const nextBtn = document.getElementById('nav-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => step(1));
  }

  showSlide(fromHash());
})();
