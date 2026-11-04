const carousel = document.querySelector('.lab-carousel');
if (carousel) {
  const track = carousel.querySelector('.lab-slide-track');
  const slides = [...track.querySelectorAll('[data-slide]')];
  const pause = carousel.querySelector('[data-carousel-pause]');
  const counter = carousel.querySelector('[data-carousel-count]');
  const indicators = carousel.querySelector('[data-carousel-indicators]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const holdDuration = 4000;
  const swipeDuration = 450;
  const photoDuration = holdDuration + swipeDuration;
  const duration = photoDuration * slides.length;
  let paused = reducedMotion.matches;
  let visible = false;
  let indicatorTimer;
  let activeIndex = -1;
  let manualSwipe = null;
  const dots = slides.map((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show group photo ${index + 1}`);
    button.addEventListener('click', () => navigate(index));
    indicators.append(button);
    return button;
  });

  // The repeated first photo makes the end of the track identical to its start.
  const repeat = slides[0].cloneNode(true);
  repeat.removeAttribute('data-slide');
  repeat.setAttribute('aria-hidden', 'true');
  repeat.alt = '';
  track.append(repeat);
  const frames = slides.flatMap((slide, index) => {
    const transform = `translateX(calc(-${index * 100}% - ${index * 16}px))`;
    return [
      {transform, offset: index * photoDuration / duration},
      {transform, offset: (index * photoDuration + holdDuration) / duration, easing: 'cubic-bezier(.22, 1, .36, 1)'}
    ];
  });
  frames.push({transform: `translateX(calc(-${slides.length * 100}% - ${slides.length * 16}px))`, offset: 1});
  const drift = track.animate(frames, {duration, iterations: Infinity, easing: 'linear'});
  drift.pause();

  function syncIndicators() {
    clearTimeout(indicatorTimer);
    const time = Number(drift.currentTime) || 0;
    const index = Math.floor(time / photoDuration) % slides.length;
    if (index !== activeIndex) {
      activeIndex = index;
      counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    }
    if (drift.playState === 'running') indicatorTimer = setTimeout(syncIndicators, photoDuration - time % photoDuration + 16);
  }

  function updatePlayback() {
    pause.textContent = paused ? 'Play slideshow' : 'Pause slideshow';
    if (!paused && visible && !document.hidden && !manualSwipe) drift.play();
    else drift.pause();
    if (manualSwipe) {
      if (visible && !document.hidden) manualSwipe.play();
      else manualSwipe.pause();
    }
    syncIndicators();
  }

  function cancelManualSwipe() {
    if (!manualSwipe) return;
    manualSwipe.onfinish = null;
    manualSwipe.cancel();
    manualSwipe = null;
  }

  function navigate(index, direction = 0) {
    const time = Number(drift.currentTime) || 0;
    const current = Math.floor(time / photoDuration) % slides.length;
    const target = (index + slides.length) % slides.length;
    let from = getComputedStyle(track).transform;
    // Use the identical end copy when going backwards from the resting first photo.
    if (direction < 0 && current === 0 && !manualSwipe && time % photoDuration < holdDuration) {
      from = `translateX(calc(-${slides.length * 100}% - ${slides.length * 16}px))`;
    }
    const destination = direction > 0 && current === slides.length - 1 && target === 0 ? slides.length : target;
    cancelManualSwipe();
    paused = true;
    drift.pause();
    drift.currentTime = target * photoDuration;
    if (!reducedMotion.matches) {
      manualSwipe = track.animate([
        {transform: from},
        {transform: `translateX(calc(-${destination * 100}% - ${destination * 16}px))`}
      ], {duration: swipeDuration, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both'});
      manualSwipe.onfinish = () => { cancelManualSwipe(); updatePlayback(); };
    }
    updatePlayback();
  }

  function step(direction) {
    const current = Math.floor((Number(drift.currentTime) || 0) / photoDuration) % slides.length;
    navigate(current + direction, direction);
  }

  pause.addEventListener('click', () => { paused = !paused; updatePlayback(); });
  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => step(-1));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => step(1));
  carousel.addEventListener('focusin', (event) => {
    if (event.target.matches(':focus-visible')) { paused = true; updatePlayback(); }
  });
  document.addEventListener('visibilitychange', updatePlayback);
  reducedMotion.addEventListener('change', () => {
    paused = reducedMotion.matches;
    if (paused) cancelManualSwipe();
    updatePlayback();
  });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updatePlayback(); }).observe(carousel);
  carousel.querySelector('.lab-carousel-controls').hidden = false;
  updatePlayback();
}
