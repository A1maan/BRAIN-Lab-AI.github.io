const requestedAppearance = new URLSearchParams(location.search).get('appearance');
const motion = new URLSearchParams(location.search).get('motion');
let savedAppearance;
try { savedAppearance = localStorage.getItem('brain-lab-appearance'); } catch {}
let appearance = [requestedAppearance, savedAppearance].find(value => ['light', 'dark'].includes(value))
  || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.motion = ['film', 'brain', 'surface', 'still'].includes(motion) ? motion : 'film';
document.documentElement.dataset.appearance = appearance;
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  if (header) {
    const hero = document.querySelector('.hero');
    const updateHeader = () => {
      const overContent = hero && hero.getBoundingClientRect().bottom <= header.getBoundingClientRect().height / 2;
      header.classList.toggle('is-over-content', Boolean(overContent));
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', updateHeader, {passive: true});
    window.addEventListener('resize', updateHeader);
    window.addEventListener('pageshow', updateHeader);
    updateHeader();
  }
  function updateLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      const url = new URL(link.href);
      const inStudy = url.origin === location.origin && url.pathname.includes('/cortex/');
      if (!inStudy && ['http:', 'https:', 'file:'].includes(url.protocol)) {
        link.target = '_blank';
        link.rel = 'noopener';
      }
      if (inStudy && /\/(index|members|projects)\.html$/.test(url.pathname)) {
        url.searchParams.set('appearance', appearance);
        link.href = url.href;
      }
      if (inStudy && /\/(index|members|projects)\.html$/.test(url.pathname) && ['film', 'brain', 'surface', 'still'].includes(motion)) {
        const destination = new URL(link.href);
        destination.searchParams.set('motion', motion);
        link.href = destination.href;
      }
    });
  }
  const toggle = document.querySelector('[data-theme-toggle]');
  function updateToggle() {
    if (!toggle) return;
    const next = appearance === 'dark' ? 'light' : 'dark';
    toggle.hidden = false;
    toggle.setAttribute('title', `Switch to ${next} mode`);
    toggle.setAttribute('aria-label', `Switch to ${next} mode`);
  }
  toggle?.addEventListener('click', () => {
    appearance = appearance === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.appearance = appearance;
    try { localStorage.setItem('brain-lab-appearance', appearance); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('appearance', appearance);
    history.replaceState(null, '', url.href);
    updateLinks();
    updateToggle();
  });
  updateLinks();
  updateToggle();
});
