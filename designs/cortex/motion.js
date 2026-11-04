// Conceptual 2.5D relief sampled from our existing artwork, not an anatomical simulation.
function sampleBrain(pixels, size) {
  const points = [];
  for (let y = 2; y < size - 2; y += 3) {
    for (let x = 2; x < size - 2; x += 3) {
      const offset = (y * size + x) * 4;
      if (pixels[offset + 3] < 180) continue;
      const light = (pixels[offset] * .2126 + pixels[offset + 1] * .7152 + pixels[offset + 2] * .0722) / 255;
      points.push({x: x / size - .5, y: y / size - .5, light, depth: light * .14});
    }
  }
  return points;
}

function drawParticleBrain(ctx, points, box, time, palette) {
  const turn = Math.sin(time * .24) * .055;
  const sway = Math.sin(time * .18) * .008;
  const color = palette.dark ? [184, 197, 255] : [26, 42, 108];
  for (const point of points) {
    const wave = Math.sin(point.x * 8 + point.y * 5 - time * .8);
    const pulse = .5 + .5 * Math.sin(point.x * 5 - point.y * 3 - time * .55);
    const x = box.x + box.size * (.5 + point.x * Math.cos(turn) + point.depth * Math.sin(turn) + wave * .009);
    const y = box.y + box.size * (.5 + point.y + sway + wave * .005);
    const tone = palette.dark ? point.light : 1 - point.light;
    const radius = box.size / 260 * (.43 + tone * .55 + pulse * .13);
    ctx.fillStyle = `rgba(${color},${.22 + tone * .62 + pulse * .12})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function startHeroFilm(hero) {
  const video = hero.querySelector('.hero-video');
  const toggle = hero.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  let visible = false, paused = false, failed = false, request = 0;

  function sync() {
    const ticket = ++request;
    const running = visible && !paused && !failed && !reduced.matches && !forced.matches && !document.hidden;
    toggle.hidden = reduced.matches || forced.matches || failed;
    toggle.setAttribute('aria-label', paused ? 'Play motion' : 'Pause motion');
    toggle.setAttribute('title', paused ? 'Play motion' : 'Pause motion');
    toggle.setAttribute('aria-pressed', String(paused));
    hero.dataset.motionState = failed ? 'unavailable' : reduced.matches ? 'reduced' : running ? 'playing' : paused ? 'paused' : 'idle';
    if (!running) { video.pause(); return; }
    if (!video.getAttribute('src')) {
      video.src = matchMedia('(max-width: 767px)').matches && video.dataset.srcMobile
        ? video.dataset.srcMobile : video.dataset.src;
    }
    video.play().catch(() => {
      if (ticket !== request) return;
      paused = true;
      sync();
    });
  }
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  video.addEventListener('error', () => { failed = true; video.hidden = true; sync(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold: .05}).observe(hero);
  reduced.addEventListener('change', sync);
  forced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { request++; video.pause(); });
  window.addEventListener('pageshow', sync);
  sync();
}

async function startHeroMotion() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const mode = document.documentElement.dataset.motion;
  if (mode === 'still') return;
  if (mode === 'film') return startHeroFilm(hero);
  const canvas = hero.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const toggle = hero.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = matchMedia('(forced-colors: active)');
  const darkMode = matchMedia('(prefers-color-scheme: dark)');
  let points = [];
  if (mode === 'brain') {
    try {
      const image = hero.querySelector('.hero-art img');
      await image.decode();
      const sampler = document.createElement('canvas');
      sampler.width = sampler.height = 260;
      const sample = sampler.getContext('2d', {willReadFrequently: true});
      sample.drawImage(image, 0, 0, 260, 260);
      points = sampleBrain(sample.getImageData(0, 0, 260, 260).data, 260);
      if (!points.length) return;
    } catch { return; } // Keep the still artwork if decoding or local-file canvas access fails.
  }
  const drawSurface = mode === 'surface' ? createNeuralSurface() : null;
  let width = 0, height = 0, ratio = 1, box, palette;
  let paused = false, visible = false, frame = 0, elapsed = 0, lastTime = 0;

  function paint() {
    ctx.clearRect(0, 0, width, height);
    if (drawSurface) drawSurface(ctx, width, height, elapsed, palette);
    else drawParticleBrain(ctx, points, box, elapsed, palette);
  }
  function resize() {
    const rect = hero.getBoundingClientRect();
    const art = hero.querySelector('.hero-art').getBoundingClientRect();
    width = rect.width;
    height = mode === 'surface' && width < 768 ? 300 : rect.height;
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const size = Math.min(art.width, art.height);
    box = {x: art.left - rect.left + (art.width - size) / 2, y: art.top - rect.top, size};
    palette = {dark: true, ink: [220, 231, 247], accent: [134, 160, 215]};
    paint();
  }
  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (now - lastTime < 1000 / 30) return;
    elapsed += Math.min((now - lastTime) / 1000, .1);
    lastTime = now;
    paint();
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    const running = visible && !paused && !reduced.matches && !forcedColors.matches && !document.hidden;
    toggle.hidden = reduced.matches || forcedColors.matches;
    toggle.setAttribute('aria-label', paused ? 'Play motion' : 'Pause motion');
    toggle.setAttribute('title', paused ? 'Play motion' : 'Pause motion');
    toggle.setAttribute('aria-pressed', String(paused));
    hero.dataset.motionState = reduced.matches ? 'reduced' : running ? 'playing' : paused ? 'paused' : 'idle';
    if (running) { lastTime = performance.now(); frame = requestAnimationFrame(tick); }
    else paint();
  }
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold: .05}).observe(hero);
  new ResizeObserver(resize).observe(hero);
  reduced.addEventListener('change', sync);
  forcedColors.addEventListener('change', sync);
  darkMode.addEventListener('change', resize);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
  window.addEventListener('pageshow', sync);
  resize();
  hero.dataset.motionReady = mode;
}
startHeroMotion();
