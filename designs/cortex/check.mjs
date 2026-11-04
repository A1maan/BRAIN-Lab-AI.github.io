import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const clean = value => value.replace(/<!--.*?-->/gs, '').replace(/<[^>]+>/g, '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity) => entity[0] === '#' ? String.fromCodePoint(parseInt(entity.slice(entity[1].toLowerCase() === 'x' ? 2 : 1), entity[1].toLowerCase() === 'x' ? 16 : 10)) : ({amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '})[entity.toLowerCase()]).replace(/\s+/g, ' ').trim();
const articles = html => [...html.replace(/<!--.*?-->/gs, '').matchAll(/<article\b.*?<\/article>/gs)].map(match => match[0]);
const field = (html, name) => clean(html.match(new RegExp(`<[^>]+class="${name}"[^>]*>(.*?)</(?:p|span)>`, 's'))?.[1] || '');
const sourceRoster = articles(read('../../members.html'));
const roster = articles(read('members.html'));
const signature = (article, original) => JSON.stringify({
  name: clean(article.match(/<h3[^>]*>(.*?)<\/h3>/s)[1]),
  role: field(article, original ? 'member__role' : 'person-role') || field(article, 'role'),
  topic: field(article, original ? 'member__topic' : 'person-topic'),
  affiliation: field(article, original ? 'member__aff' : 'person-aff'),
  photo: article.match(/<img[^>]+src="([^"]+)"/)[1].replace(/^\.\.\/\.\.\//, '')
});
assert.deepEqual(roster.map(article => signature(article, false)), sourceRoster.map(article => signature(article, true)), 'Every source profile, role, topic, affiliation and original portrait must be preserved');
assert.equal(roster.length, 49, 'The source contains 49 profile records, including the duplicate current/alumni entry');
for (const original of sourceRoster) {
  const migrated = roster.find(article => signature(article, false) === signature(original, true));
  for (const [, href] of original.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    if (href.startsWith('mailto:')) {
      assert(migrated.includes('href="#join"'), 'The director contact link must reach the usable on-page contact section');
      assert(read('members.html').includes(href), 'Keep the original email address available in the contact section');
    } else assert(migrated.includes(href), `Missing source profile link: ${href}`);
  }
  const bio = field(original, 'bio');
  if (bio) assert(clean(migrated).includes(bio), 'Director biography must remain complete');
}
assert(read('members.html').includes('brainlab-logo-on-light.png'), 'Keep the full lab logo');
for (const [page, noun] of [['members.html', 'profiles'], ['projects.html', 'projects']]) {
  const html = read(page);
  const controls = [...html.matchAll(/data-filter="([^"]+)"/g)].map(([, filter]) => ({
    dataset: {filter},
    setAttribute(name, value) { this[name] = value; },
    addEventListener(event, callback) { this.click = callback; }
  }));
  const items = articles(html).map(article => ({dataset: {cat: article.match(/data-cat="([^"]+)"/)[1]}, textContent: clean(article), hidden: false}));
  const groups = [...html.matchAll(/<section\b[^>]*data-member-group="([^"]+)"[^>]*>(.*?)<\/section>/gs)].map(([, category, content]) => {
    const markup = content.match(/<button\b([^>]*data-view-more[^>]*)>(.*?)<\/button>/s);
    const more = markup ? {
      hidden: /\bhidden\b/.test(markup[1]), textContent: markup[2],
      'aria-expanded': markup[1].match(/aria-expanded="([^"]+)"/)?.[1],
      getAttribute(name) { return this[name] ?? null; },
      scrollIntoView(options) { this.scrollOptions = options; },
      setAttribute(name, value) { this[name] = value; },
      addEventListener(event, callback) { this.click = callback; }
    } : null;
    assert.equal(Boolean(more), ['grad', 'ugrad', 'alumni'].includes(category), 'Every non-director group should collapse');
    if (more) {
      assert.equal(more.hidden, true, 'Keep disclosure controls hidden until JavaScript is ready');
      assert.equal(more['aria-expanded'], 'false');
      assert.equal(markup[2], 'View more', 'The disclosure is text only');
      assert(content.indexOf(markup[0]) > content.lastIndexOf('</article>'), 'Place each disclosure below its people grid');
    }
    return {category, hidden: false, more, querySelector: selector => selector === '[data-view-more]' ? more : null, querySelectorAll: () => items.filter(item => articles(content).some(article => clean(article) === item.textContent))};
  });
  const status = {}, empty = {};
  const search = page === 'members.html' ? {value: '', addEventListener(event, callback) { this.input = callback; }} : null;
  const scope = {
    dataset: {noun},
    querySelectorAll: selector => ({'[data-filter]': controls, '[data-cat]': items, '[data-member-group]': groups})[selector],
    querySelector: selector => ({'[data-filter-status]': status, '[data-empty]': empty, '[data-search]': search})[selector]
  };
  const context = {console, document: {querySelectorAll: () => [scope]}};
  vm.runInNewContext(read('pages.js'), context);
  assert.equal(context.matchesResearch('medical language', 'med'), false);
  const visibleIn = group => group.querySelectorAll().filter(item => !item.hidden);
  const assertCollapsed = () => {
    for (const group of groups) {
      assert.equal(visibleIn(group).length, {director: 1, grad: 4, ugrad: 4, alumni: 4}[group.category]);
      if (group.more) {
        assert.equal(group.more.hidden, false);
        assert.equal(group.more['aria-expanded'], 'false');
        assert.equal(group.more.textContent, 'View more');
      }
    }
    assert.equal(status.textContent, '49 profiles', 'The directory count includes matching profiles behind View more');
  };
  if (groups.length) {
    assert.equal(groups.length, 4, 'Preserve the four directory groups');
    assertCollapsed();
    for (const category of ['grad', 'ugrad', 'alumni']) {
      const group = groups.find(group => group.category === category);
      group.more.click();
      assert.equal(group.more['aria-expanded'], 'true');
      assert.equal(group.more.textContent, 'View less');
      assert.equal(visibleIn(group).length, {grad: 8, ugrad: 31, alumni: 9}[category]);
      for (const other of groups.filter(other => other.more && other !== group)) {
        assert.equal(visibleIn(other).length, 4, 'Expanding one group must not expand another');
      }
      assert.equal(status.textContent, '49 profiles');
      group.more.click();
      assertCollapsed();
      assert.equal(group.more.scrollOptions.block, 'end', 'Keep the bottom disclosure in view after collapsing');
    }
  } else assert(items.every(item => !item.hidden), `${page}: all records must initially be visible`);
  for (const control of controls) {
    control.click();
    const visible = items.filter(item => !item.hidden);
    const matching = items.filter(item => control.dataset.filter === 'all' || item.dataset.cat.split(' ').includes(control.dataset.filter));
    assert.equal(controls.filter(button => button['aria-pressed'] === 'true').length, 1);
    assert(visible.length > 0, `${page}: empty real filter`);
    assert(visible.every(item => control.dataset.filter === 'all' || item.dataset.cat.split(' ').includes(control.dataset.filter)));
    assert.equal(empty.hidden, true);
    assert.equal(status.textContent, `${matching.length} ${matching.length === 1 ? noun.slice(0, -1) : noun}`);
    for (const group of groups) assert.equal(group.hidden, !group.querySelectorAll().some(item => !item.hidden), 'Hide headings for empty groups');
    if (groups.length) {
      assert.equal(matching.length, {all: 49, director: 1, grad: 17, ugrad: 22, alumni: 9}[control.dataset.filter]);
      assert.equal(visible.length, {all: 13, director: 1, grad: 8, ugrad: 4, alumni: 4}[control.dataset.filter]);
      for (const group of groups.filter(group => group.more)) assert.equal(group.more.hidden, group.hidden, 'Show View more only for matching groups with over four profiles');
    }
  }
  controls[0].click();
  if (groups.length) assertCollapsed();
  else assert(items.every(item => !item.hidden), `${page}: reset failed`);
  assert(groups.every(group => !group.hidden));
  if (search) {
    const grad = groups.find(group => group.category === 'grad');
    const ugrad = groups.find(group => group.category === 'ugrad');
    const alumni = groups.find(group => group.category === 'alumni');
    const laterGraduate = grad.querySelectorAll().at(-1);
    assert.equal(laterGraduate.hidden, true);
    search.value = 'Kavya Ram Inder Mal'; search.input();
    assert.equal(laterGraduate.hidden, false, 'Search must find profiles beyond the collapsed first four');
    assert.equal(items.filter(item => !item.hidden).length, 1);
    assert.equal(status.textContent, '1 profile');
    assert.equal(grad.more.hidden, true);
    search.value = ''; search.input();
    assertCollapsed();
    grad.more.click();
    search.value = '  KFUPM  '; search.input();
    assert.equal(items.filter(item => !item.hidden).length, 45, 'Search must reveal all matching profiles, including those beyond the collapsed first four');
    assert.equal(visibleIn(grad).length, 8);
    assert.equal(visibleIn(ugrad).length, 27, 'Affiliation search excludes the four external researchers');
    assert.equal(visibleIn(alumni).length, 9, 'Search also reveals alumni beyond the collapsed first four');
    assert.equal(status.textContent, '45 profiles');
    assert(groups.filter(group => group.more).every(group => group.more.hidden), 'Hide disclosure controls during search');
    assert.equal(grad.more['aria-expanded'], 'true');
    assert.equal(ugrad.more['aria-expanded'], 'false');
    search.value = '   '; search.input();
    assert.equal(visibleIn(grad).length, 8, 'Clearing search restores the expanded preference');
    assert.equal(visibleIn(ugrad).length, 4, 'Clearing search restores the collapsed preference');
    assert.equal(visibleIn(alumni).length, 4, 'Clearing search restores collapsed alumni');
    grad.more.click();
    assertCollapsed();
    search.value = '  ALMAAN  '; search.input();
    assert.equal(items.filter(item => !item.hidden).length, 2, 'Preserve both current and alumni records as requested');
    controls.find(button => button.dataset.filter === 'alumni').click();
    assert.equal(items.filter(item => !item.hidden).length, 1, 'Search and role filters must combine');
    search.value = 'does-not-match-any-profile'; search.input();
    assert.equal(status.textContent, '0 profiles');
    assert.equal(empty.hidden, false);
    assert(groups.every(group => group.hidden));
    search.value = ''; search.input(); controls[0].click();
    assertCollapsed();
    assert(groups.every(group => !group.hidden));
  }
}

function carouselHarness(reduce = false) {
  const events = {}, documentEvents = {}, animations = [], dots = [], timers = new Map();
  let timerId = 0;
  let intersect;
  const slideNode = attributes => ({
    ...attributes,
    cloneNode() { return slideNode({...this}); },
    removeAttribute(name) { delete this[name]; },
    setAttribute(name, value) { this[name] = value; }
  });
  const slides = [...read('members.html').matchAll(/<img\b[^>]*data-slide[^>]*>/g)].map(([markup]) => slideNode({
    src: markup.match(/src="([^"]+)"/)[1],
    alt: markup.match(/alt="([^"]+)"/)[1],
    'data-slide': '',
    'aria-hidden': markup.match(/aria-hidden="([^"]+)"/)?.[1]
  }));
  assert.equal(slides.length, 4);
  const children = [...slides];
  const track = {
    presentation: 'matrix(1, 0, 0, 1, -120, 0)',
    querySelectorAll: () => slides,
    append(slide) { children.push(slide); },
    animate(frames, timing) {
      const animation = {frames, timing, currentTime: 0, playState: 'running',
        play() { this.playState = 'running'; }, pause() { this.playState = 'paused'; },
        cancel() { this.playState = 'idle'; }, finish() { this.playState = 'finished'; this.onfinish?.(); }};
      animations.push(animation);
      return animation;
    }
  };
  const button = () => ({setAttribute(name, value) { this[name] = value; }, addEventListener(event, callback) { this.click = callback; }});
  const pause = button(), previous = button(), next = button(), controls = {hidden: true}, counter = {};
  const indicators = {append(dot) { dots.push(dot); }};
  const carousel = {
    querySelector: selector => ({'[data-carousel-count]': counter, '[data-carousel-indicators]': indicators, '.lab-slide-track': track, '[data-carousel-pause]': pause, '[data-carousel-prev]': previous, '[data-carousel-next]': next, '.lab-carousel-controls': controls})[selector],
    addEventListener(event, callback) { events[event] = callback; }
  };
  const doc = {createElement: () => button(), hidden: false, querySelector: () => carousel, addEventListener(event, callback) { documentEvents[event] = callback; }};
  const reduced = {matches: reduce, addEventListener(event, callback) { this.change = callback; }};
  vm.runInNewContext(read('people-carousel.js'), {
    document: doc, matchMedia: () => reduced, getComputedStyle: () => ({transform: track.presentation}),
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, {callback, delay}); return id; },
    clearTimeout(id) { timers.delete(id); },
    IntersectionObserver: class {constructor(callback) { intersect = callback; } observe() {}}
  });
  assert.equal(animations.length, 1, 'Use one persistent animation for the timed photo sequence');
  return {animations, track, dots, counter, timers, drift: animations[0], children, slides, pause, previous, next, controls, doc, events, documentEvents, reduced, intersect: visible => intersect([{isIntersecting: visible}])};
}
const carousel = carouselHarness();
assert.equal(carousel.dots.length, carousel.slides.length, 'Generate one indicator for each original photo');
assert.equal(carousel.counter.textContent, '01 / 04');
assert.equal(carousel.dots[0]['aria-current'], 'true');
assert.equal(carousel.timers.size, 0, 'Do not poll indicators while paused or offscreen');
assert.equal(carousel.drift.timing.duration, 17800);
assert.equal(carousel.drift.timing.iterations, Infinity);
assert.equal(carousel.drift.timing.easing, 'linear');
assert.equal(carousel.drift.frames.length, 9);
for (let index = 0; index < 4; index++) {
  const start = carousel.drift.frames[index * 2];
  const hold = carousel.drift.frames[index * 2 + 1];
  const next = carousel.drift.frames[index * 2 + 2];
  assert.equal(start.transform, hold.transform, 'Each photo stays completely still during its hold');
  assert(Math.abs((hold.offset - start.offset) * 17800 - 4000) < .001, 'Hold each photo for four seconds');
  assert(Math.abs((next.offset - hold.offset) * 17800 - 450) < .001, 'Swipe to the next photo in 450ms');
  assert.equal(hold.easing, 'cubic-bezier(.22, 1, .36, 1)', 'Decelerate gently without overshoot');
}
assert.equal(carousel.drift.frames.at(-1).transform, 'translateX(calc(-400% - 64px))', 'The loop must include four 16px photo gaps');
assert.equal(carousel.children.length, 5);
const repeatPhoto = carousel.children.at(-1);
assert.notEqual(repeatPhoto, carousel.slides[0]);
assert.equal(repeatPhoto.src, carousel.slides[0].src, 'Repeat the first photo at the loop seam');
assert.equal(repeatPhoto['aria-hidden'], 'true');
assert.equal(repeatPhoto.alt, '');
assert(!('data-slide' in repeatPhoto), 'Exclude the decorative repeat from the source photo set');
assert(carousel.slides.every(slide => slide['aria-hidden'] !== 'true' && slide.alt), 'All four original photos retain accessible descriptions');
assert.equal(carousel.controls.hidden, false);
assert.equal(carousel.drift.playState, 'paused', 'The track must wait until it is visible');
carousel.intersect(true); assert.equal(carousel.drift.playState, 'running');
assert.equal(carousel.timers.size, 1);
assert.equal([...carousel.timers.values()][0].delay, 4466, 'Sync at the next photo boundary rather than every frame');
carousel.drift.currentTime = 4450;
[...carousel.timers.values()][0].callback();
assert.equal(carousel.counter.textContent, '02 / 04', 'Counter follows autoplay');
assert.equal(carousel.dots[1]['aria-current'], 'true');
carousel.drift.currentTime = 17800;
[...carousel.timers.values()][0].callback();
assert.equal(carousel.counter.textContent, '01 / 04', 'Counter wraps with the seamless loop');
carousel.drift.currentTime = 1234;
carousel.pause.click(); assert.equal(carousel.drift.playState, 'paused'); assert.equal(carousel.pause.textContent, 'Play slideshow');
assert.equal(carousel.drift.currentTime, 1234, 'Pausing must preserve the exact track position');
carousel.doc.hidden = true; carousel.documentEvents.visibilitychange();
carousel.doc.hidden = false; carousel.documentEvents.visibilitychange();
assert.equal(carousel.drift.playState, 'paused', 'Returning to the tab must preserve a manual pause');
carousel.pause.click(); assert.equal(carousel.drift.playState, 'running');
assert.equal(carousel.drift.currentTime, 1234, 'Resuming must not restart the loop');
carousel.doc.hidden = true; carousel.documentEvents.visibilitychange(); assert.equal(carousel.drift.playState, 'paused');
carousel.doc.hidden = false; carousel.documentEvents.visibilitychange(); assert.equal(carousel.drift.playState, 'running');
carousel.intersect(false); assert.equal(carousel.drift.playState, 'paused');
carousel.intersect(true); assert.equal(carousel.drift.playState, 'running');
assert.equal(carousel.drift.currentTime, 1234, 'Visibility changes preserve position');
assert.equal(carousel.events.mouseenter, undefined, 'Hover must not interrupt the photo sequence');
assert.equal(carousel.events.mouseleave, undefined);
carousel.events.focusin({target: {matches: () => false}}); assert.equal(carousel.drift.playState, 'running');
carousel.events.focusin({target: {matches: selector => selector === ':focus-visible'}}); assert.equal(carousel.drift.playState, 'paused');
carousel.intersect(false); carousel.intersect(true); assert.equal(carousel.drift.playState, 'paused', 'Keyboard focus pauses until an explicit restart');
carousel.pause.click(); assert.equal(carousel.drift.playState, 'running');
carousel.next.click(); assert.equal(carousel.drift.currentTime, 4450); assert.equal(carousel.drift.playState, 'paused', 'Manual navigation pauses autoplay');
carousel.next.click(); assert.equal(carousel.drift.currentTime, 8900);
carousel.next.click(); assert.equal(carousel.drift.currentTime, 13350);
carousel.next.click(); assert.equal(carousel.drift.currentTime, 0, 'Next wraps from the fourth photo to the first');
carousel.previous.click(); assert.equal(carousel.drift.currentTime, 13350, 'Previous wraps from the first photo to the fourth');
carousel.previous.click(); assert.equal(carousel.drift.currentTime, 8900);
carousel.drift.currentTime = 36834; carousel.next.click(); assert.equal(carousel.drift.currentTime, 4450, 'Seeking works after several infinite-loop iterations');
carousel.pause.click(); carousel.reduced.matches = true; carousel.reduced.change(); assert.equal(carousel.drift.playState, 'paused');
const reducedCarousel = carouselHarness(true);
reducedCarousel.intersect(true); assert.equal(reducedCarousel.drift.playState, 'paused', 'Reduced motion prevents initial slideshow autoplay');
reducedCarousel.next.click(); assert.equal(reducedCarousel.drift.currentTime, 4450);
assert.equal(reducedCarousel.drift.playState, 'paused', 'Reduced-motion navigation seeks directly without autoplay');
reducedCarousel.pause.click(); assert.equal(reducedCarousel.drift.playState, 'running', 'Explicit playback remains available with reduced motion');

const indicatorCarousel = carouselHarness();
indicatorCarousel.intersect(true);
indicatorCarousel.dots[2].click();
assert.equal(indicatorCarousel.drift.currentTime, 8900);
assert.equal(indicatorCarousel.counter.textContent, '03 / 04');
assert.equal(indicatorCarousel.drift.playState, 'paused');
assert.equal(indicatorCarousel.timers.size, 0);
assert.equal(indicatorCarousel.dots.filter(dot => dot['aria-current'] === 'true').length, 1);
assert.equal(indicatorCarousel.dots[2]['aria-label'], 'Show group photo 3');
indicatorCarousel.next.click();
assert.equal(indicatorCarousel.counter.textContent, '04 / 04', 'Arrow navigation also updates the counter');

const manualCarousel = carouselHarness();
manualCarousel.intersect(true);
manualCarousel.dots[2].click();
let swipe = manualCarousel.animations.at(-1);
assert.equal(swipe.timing.duration, 450);
assert.equal(swipe.timing.easing, manualCarousel.drift.frames[1].easing, 'Manual navigation uses the autoplay easing');
assert.equal(swipe.frames[0].transform, manualCarousel.track.presentation, 'Start from the actual displayed position');
assert.equal(swipe.frames[1].transform, 'translateX(calc(-200% - 32px))');
manualCarousel.track.presentation = 'matrix(1, 0, 0, 1, -360, 0)';
manualCarousel.previous.click();
assert.equal(swipe.playState, 'idle', 'Cancel superseded swipes');
swipe = manualCarousel.animations.at(-1);
assert.equal(swipe.frames[0].transform, manualCarousel.track.presentation, 'Rapid direction changes retarget from the live position');
manualCarousel.doc.hidden = true; manualCarousel.documentEvents.visibilitychange();
assert.equal(swipe.playState, 'paused');
manualCarousel.doc.hidden = false; manualCarousel.documentEvents.visibilitychange();
assert.equal(swipe.playState, 'running');
manualCarousel.pause.click();
assert.equal(manualCarousel.drift.playState, 'paused', 'Do not advance autoplay underneath a manual swipe');
swipe.finish();
assert.equal(swipe.playState, 'idle');
assert.equal(manualCarousel.drift.playState, 'running', 'Resume autoplay after settling if requested');
manualCarousel.dots[0].click(); manualCarousel.animations.at(-1).finish();
manualCarousel.previous.click();
swipe = manualCarousel.animations.at(-1);
assert.equal(swipe.frames[0].transform, 'translateX(calc(-400% - 64px))', 'Previous from the first photo starts at its identical end copy');
assert.equal(swipe.frames[1].transform, 'translateX(calc(-300% - 48px))');
swipe.finish();
manualCarousel.next.click();
assert.equal(manualCarousel.animations.at(-1).frames[1].transform, 'translateX(calc(-400% - 64px))', 'Next from the last photo swipes to the repeated first photo');
manualCarousel.reduced.matches = true; manualCarousel.reduced.change();
assert.equal(manualCarousel.animations.at(-1).playState, 'idle', 'A reduced-motion change stops a running swipe');
const animationCount = manualCarousel.animations.length;
manualCarousel.next.click();
assert.equal(manualCarousel.animations.length, animationCount, 'Reduced-motion navigation changes photos without a swipe');

const links = [
  'https://preview.test/designs/cortex/projects.html#pulse',
  'https://preview.test/members.html',
  'https://github.com/BRAIN-Lab-AI',
  'mailto:muzammil.behzad@kfupm.edu.sa'
].map(href => ({href}));
const document = {
  documentElement: {dataset: {}},
  addEventListener(event, callback) { callback(); },
  querySelector: () => null,
  querySelectorAll: () => links
};
vm.runInNewContext(read('script.js'), {
  URL, URLSearchParams, document, matchMedia: () => ({matches: false}),
  location: {search: '?appearance=dark&motion=surface', origin: 'https://preview.test'}
});
assert.equal(document.documentElement.dataset.appearance, 'dark');
assert.equal(document.documentElement.dataset.motion, 'surface');
assert.equal(links[0].href, 'https://preview.test/designs/cortex/projects.html?appearance=dark&motion=surface#pulse');
assert.equal(links[1].target, '_blank');
assert.equal(links[2].target, '_blank');
assert.equal(links[2].rel, 'noopener');
assert.equal(links[3].target, undefined);
for (const value of ['film', 'brain', 'surface', 'still', 'invalid', '']) {
  const link = {href: 'https://preview.test/designs/cortex/index.html#research'};
  const doc = {documentElement: {dataset: {}}, addEventListener: (event, fn) => fn(), querySelector: () => null, querySelectorAll: () => [link]};
  vm.runInNewContext(read('script.js'), {URL, URLSearchParams, document: doc, matchMedia: () => ({matches: false}), location: {search: `?motion=${value}`, origin: 'https://preview.test'}});
  const valid = ['film', 'brain', 'surface', 'still'].includes(value);
  assert.equal(doc.documentElement.dataset.motion, valid ? value : 'film');
  assert.equal(new URL(link.href).searchParams.get('motion'), valid ? value : null);
  assert.equal(new URL(link.href).hash, '#research');
}

function themeHarness({query = '', saved = null, systemDark = false, blockedStorage = false} = {}) {
  const location = new URL(`https://preview.test/designs/cortex/index.html${query}#research`);
  const state = {saved};
  const toggle = {hidden: true, setAttribute(name, value) {this[name] = value;}, addEventListener(event, fn) {this.click = fn;}};
  const link = {href: 'https://preview.test/designs/cortex/projects.html#pulse'};
  const doc = {documentElement: {dataset: {}}, querySelector: selector => selector === '[data-theme-toggle]' ? toggle : null, querySelectorAll: () => [link], addEventListener(event, fn) {this.ready = fn;}};
  vm.runInNewContext(read('script.js'), {
    URL, URLSearchParams, location, document: doc, matchMedia: () => ({matches: systemDark}),
    localStorage: {getItem() {if (blockedStorage) throw Error('Storage unavailable'); return state.saved;}, setItem(key, value) {if (blockedStorage) throw Error('Storage unavailable'); state.saved = value;}},
    history: {replaceState(state, unused, url) {location.href = url;}}
  });
  return {state, doc, toggle, link, location};
}
const scrollEvents = {}, headerClasses = new Set();
const header = {getBoundingClientRect: () => ({height:88}), classList: {toggle(name, active) {active ? headerClasses.add(name) : headerClasses.delete(name);}}};
const headerHero = {bottom:900, getBoundingClientRect() {return {bottom:this.bottom};}};
const scrollWindow = {scrollY: 0, addEventListener(name, callback, options) {scrollEvents[name] = callback; if (name === 'scroll') assert.equal(options.passive, true);}};
vm.runInNewContext(read('script.js'), {
  URL, URLSearchParams, location: {search:''}, window: scrollWindow, matchMedia: () => ({matches:false}),
  document: {documentElement:{dataset:{}}, querySelector: selector => selector === '.site-header' ? header : selector === '.hero' ? headerHero : null, querySelectorAll: () => [], addEventListener(event, callback) {callback();}}
});
assert(!headerClasses.has('is-scrolled'));
scrollWindow.scrollY = 100; scrollEvents.scroll(); assert(headerClasses.has('is-scrolled'));
scrollWindow.scrollY = 0; scrollEvents.scroll(); assert(!headerClasses.has('is-scrolled'));
scrollWindow.scrollY = 300; scrollEvents.pageshow(); assert(headerClasses.has('is-scrolled'));
headerHero.bottom = 0; scrollEvents.scroll(); assert(headerClasses.has('is-over-content'));
headerHero.bottom = 900; scrollWindow.scrollY = 0; scrollEvents.resize(); assert(!headerClasses.has('is-over-content'));
const theme = themeHarness({query: '?appearance=light&motion=film', saved: 'dark'});
assert.equal(theme.doc.documentElement.dataset.appearance, 'light', 'Explicit preview URLs should override saved choices');
assert.equal(theme.toggle.hidden, true, 'Apply the theme in the head before wiring the control');
theme.doc.ready(); theme.toggle.click();
assert.equal(theme.doc.documentElement.dataset.appearance, 'dark');
assert.equal(theme.state.saved, 'dark');
assert.equal(theme.toggle['aria-label'], 'Switch to light mode');
assert.equal(theme.toggle.title, 'Switch to light mode');
assert.equal(theme.toggle.textContent, undefined, 'Keep the inline icons intact when switching themes');
assert.equal(theme.location.searchParams.get('appearance'), 'dark');
assert.equal(theme.location.hash, '#research');
assert.equal(new URL(theme.link.href).searchParams.get('appearance'), 'dark');
assert.equal(new URL(theme.link.href).searchParams.get('motion'), 'film');
assert.equal(new URL(theme.link.href).hash, '#pulse');
theme.toggle.click(); assert.equal(theme.state.saved, 'light');
assert.equal(theme.toggle['aria-label'], 'Switch to dark mode');
assert.equal(theme.toggle.title, 'Switch to dark mode');
assert.equal(themeHarness({saved:'dark'}).doc.documentElement.dataset.appearance, 'dark');
assert.equal(themeHarness({systemDark:true}).doc.documentElement.dataset.appearance, 'dark');
assert.equal(themeHarness({query:'?appearance=invalid',saved:'invalid'}).doc.documentElement.dataset.appearance, 'light');
const storageBlocked = themeHarness({blockedStorage:true}); storageBlocked.doc.ready(); storageBlocked.toggle.click();
assert.equal(storageBlocked.doc.documentElement.dataset.appearance, 'dark', 'The theme control must work without storage');
for (const page of ['index.html','members.html','projects.html']) {
  const html = read(page);
  assert.equal((html.match(/data-theme-toggle/g)||[]).length,1);
  assert(html.includes('class="theme-sun" aria-hidden="true"'));
  assert(html.includes('class="theme-moon" aria-hidden="true"'));
  assert(!html.match(/<footer[\s\S]*Design study/), 'Remove review labels from the public-facing footer');
}

function drawingContext() {
  return {
    draws: 0, clears: 0, globalAlpha: 1, filter: 'none', states: [], composites: [],
    save() { this.states.push([this.globalAlpha, this.filter]); },
    restore() { [this.globalAlpha, this.filter] = this.states.pop(); },
    drawImage(layer, x, y, width, height) {
      assert([x, y, width, height].every(Number.isFinite));
      this.composites.push({layer, x, y, width, height, filter: this.filter, alpha: this.globalAlpha});
    },
    clearRect() { this.clears++; },
    setTransform() {}, beginPath() {}, fill() {},
    moveTo(...values) { assert(values.every(Number.isFinite), 'Mesh vertices must be finite'); },
    lineTo(...values) { assert(values.every(Number.isFinite), 'Mesh vertices must be finite'); },
    closePath() {},
    arc(...values) {
      assert(values.every(Number.isFinite), 'Particle coordinates must be finite');
      assert(values[2] > 0, 'Particle radius must be positive');
      this.draws++;
    },
    ellipse(...values) {
      assert(values.every(Number.isFinite), 'Surface coordinates must be finite');
      assert(values[2] > 0 && values[3] > 0, 'Surface radii must be positive');
      assert(this.globalAlpha >= 0 && this.globalAlpha <= 1);
      this.draws++;
    }
  };
}

const renderer = vm.createContext({});
vm.runInContext(read('surface-renderer.js'), renderer);
const surface = renderer.createNeuralSurface();
for (const [width, height] of [[1440, 700], [390, 500]]) {
  for (const dark of [false, true]) {
    for (const time of [0, 12.5, 100000, NaN]) {
      const ctx = drawingContext();
      surface(ctx, width, height, time, {dark, ink: dark ? [238, 240, 245] : [24, 32, 44], accent: [26, 42, 108]});
      assert(ctx.draws > 100, 'The neural surface must render visible points');
      assert.equal(ctx.globalAlpha, 1, 'Drawing must restore the canvas state');
    }
  }
}
for (const size of [[0, 500], [500, 0], [-1, 500], [Infinity, 500]]) {
  const ctx = drawingContext();
  surface(ctx, ...size, 0, {});
  assert.equal(ctx.draws, 0, 'Invalid dimensions must not draw');
}

const materialLayers = [];
const offscreenRenderer = vm.createContext({OffscreenCanvas: class {
  constructor(width, height) {
    Object.assign(this, {width, height, ctx: drawingContext()});
    materialLayers.push(this);
  }
  getContext(type) { assert.equal(type, '2d'); return this.ctx; }
}});
vm.runInContext(read('surface-renderer.js'), offscreenRenderer);
const smoothSurface = offscreenRenderer.createNeuralSurface(), smoothContext = drawingContext();
smoothContext.globalAlpha = 0.73;
smoothContext.filter = 'contrast(1.1)';
for (const [frame, [width, height]] of [[1440, 700], [1440, 700], [391, 501]].entries()) {
  smoothSurface(smoothContext, width, height, frame, {dark: true, ink: [220, 231, 247], accent: [134, 160, 215]});
  assert.equal(materialLayers.length, 1, 'Animation and resize must reuse one material layer');
  const layer = materialLayers[0], composite = smoothContext.composites[frame];
  assert.deepEqual([layer.width, layer.height], [Math.ceil(width / 2), Math.ceil(height / 2)]);
  assert.equal(layer.ctx.clears, frame + 1, 'Each material frame must replace the previous one');
  assert.equal(smoothContext.composites.length, frame + 1, 'Composite the blurred skin once per frame');
  assert.equal(composite.layer, layer);
  assert.deepEqual([composite.x, composite.y, composite.width, composite.height], [0, 0, width, height]);
  assert.match(composite.filter, /^blur\(/);
  assert.equal(composite.alpha, 1);
  assert.deepEqual([smoothContext.globalAlpha, smoothContext.filter, smoothContext.states.length], [0.73, 'contrast(1.1)', 0]);
}

async function motionHarness(mode, reduce = false, width = 1200) {
  const ctx = drawingContext(), frames = new Map(), events = {}, windowEvents = {};
  let nextFrame = 0, intersect;
  const reduced = {matches: reduce, addEventListener(event, fn) { this.change = fn; }};
  const forced = {matches: false, addEventListener(event, fn) { this.change = fn; }};
  const dark = {matches: false, addEventListener() {}};
  const toggle = {setAttribute(name, value) { this[name] = value; }, addEventListener(event, fn) { this.click = fn; }};
  const canvas = {getContext: () => ctx};
  const art = {getBoundingClientRect: () => ({left: 600, top: 0, width: 600, height: 600})};
  const image = {decode: async () => {}};
  const hero = {
    dataset: {}, getBoundingClientRect: () => ({left: 0, top: 0, width, height: 600}),
    querySelector: selector => ({canvas, '.motion-toggle': toggle, '.hero-art': art, '.hero-art img': image})[selector]
  };
  const pixels = new Uint8ClampedArray(260 * 260 * 4);
  pixels.set([220, 230, 240, 255], (2 * 260 + 2) * 4);
  const doc = {
    documentElement: {dataset: {motion: mode}}, hidden: false,
    querySelector: () => hero,
    createElement: () => ({getContext: () => ({drawImage() {}, getImageData: () => ({data: pixels})})}),
    addEventListener: (name, fn) => { events[name] = fn; }
  };
  const context = vm.createContext({
    document: doc, window: {addEventListener: (name, fn) => { windowEvents[name] = fn; }},
    devicePixelRatio: 3, performance: {now: () => 100},
    matchMedia: query => query.includes('reduced-motion') ? reduced : query.includes('forced-colors') ? forced : dark,
    requestAnimationFrame: fn => { const id = ++nextFrame; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    IntersectionObserver: class { constructor(fn) { intersect = fn; } observe() {} },
    ResizeObserver: class { observe() {} }
  });
  vm.runInContext(read('surface-renderer.js'), context);
  await vm.runInContext(read('motion.js'), context);
  return {ctx, frames, hero, toggle, reduced, forced, doc, canvas, events, windowEvents, context, intersect: visible => intersect([{isIntersecting: visible}])};
}

for (const mode of ['brain', 'surface']) {
  const h = await motionHarness(mode);
  assert.equal(h.hero.dataset.motionReady, mode);
  assert.equal(h.frames.size, 0, 'Offscreen motion must not schedule frames');
  assert.equal(h.canvas.width, 1800, 'DPR must be capped at 1.5');
  assert(h.ctx.draws > 0, `${mode} needs a visible initial frame`);
  h.intersect(true);
  assert.equal(h.hero.dataset.motionState, 'playing');
  assert.equal(h.frames.size, 1);
  const [id, tick] = h.frames.entries().next().value;
  h.frames.delete(id);
  const before = h.ctx.clears;
  tick(134);
  assert(h.ctx.clears > before, 'An animation frame must paint');
  assert.equal(h.frames.size, 1, 'Only one animation loop may run');
  h.toggle.click();
  assert.equal(h.hero.dataset.motionState, 'paused');
  assert.equal(h.toggle['aria-pressed'], 'true');
  assert.equal(h.frames.size, 0);
  h.toggle.click();
  assert.equal(h.toggle['aria-pressed'], 'false');
  assert.equal(h.frames.size, 1);
  h.reduced.matches = true; h.reduced.change();
  assert.equal(h.hero.dataset.motionState, 'reduced');
  assert.equal(h.toggle.hidden, true);
  assert.equal(h.frames.size, 0);
  h.reduced.matches = false; h.reduced.change();
  assert.equal(h.toggle.hidden, false);
  assert.equal(h.frames.size, 1);
  h.forced.matches = true; h.forced.change();
  assert.equal(h.toggle.hidden, true);
  assert.equal(h.frames.size, 0, 'Forced colors must stop decorative animation');
  h.forced.matches = false; h.forced.change();
  assert.equal(h.toggle.hidden, false);
  assert.equal(h.frames.size, 1);
  h.intersect(false); assert.equal(h.frames.size, 0);
  h.intersect(true); assert.equal(h.frames.size, 1);
  h.doc.hidden = true; h.events.visibilitychange(); assert.equal(h.frames.size, 0);
  h.doc.hidden = false; h.events.visibilitychange(); assert.equal(h.frames.size, 1);
  h.windowEvents.pagehide(); assert.equal(h.frames.size, 0);
  h.windowEvents.pageshow(); assert.equal(h.frames.size, 1);
  h.intersect(false);
  const staticMotion = await motionHarness(mode, true);
  staticMotion.intersect(true);
  assert.equal(staticMotion.frames.size, 0, 'Initial reduced-motion preference must prevent animation');
  assert.equal(staticMotion.hero.dataset.motionState, 'reduced');
  assert(staticMotion.ctx.draws > 0, 'Reduced motion must preserve the visual');
}
const still = await motionHarness('still');
assert.equal(still.frames.size, 0);
assert.equal(still.ctx.draws, 0);
const mobileSurface = await motionHarness('surface', false, 390);
assert.equal(mobileSurface.canvas.height, 450, 'Mobile surface must stay in its 300px band at 1.5 DPR');
function filmHarness(reduce = false, mobile = false) {
  const events = {}, windowEvents = {}, videoEvents = {};
  const reduced = {matches: reduce, addEventListener(event, fn) { this.change = fn; }};
  const forced = {matches: false, addEventListener(event, fn) { this.change = fn; }};
  const toggle = {setAttribute(name, value) { this[name] = value; }, addEventListener(event, fn) { this.click = fn; }};
  const video = {
    src: '', dataset: {src: 'assets/montage/hero.mp4', srcMobile: 'assets/montage/hero-mobile.mp4'}, paused: true, deny: false,
    getAttribute() { return this.src; },
    pause() { this.paused = true; },
    play() { if (this.deny) return Promise.reject(new Error('Autoplay blocked')); this.paused = false; return Promise.resolve(); },
    addEventListener(name, fn) { videoEvents[name] = fn; }
  };
  const hero = {dataset: {}, querySelector: selector => selector === '.hero-video' ? video : toggle};
  const doc = {hidden: false, querySelector: () => null, addEventListener(name, fn) { events[name] = fn; }};
  let intersect;
  const context = vm.createContext({
    document: doc, window: {addEventListener(name, fn) { windowEvents[name] = fn; }},
    matchMedia: query => query.includes('reduced-motion') ? reduced : query.includes('max-width') ? {matches: mobile} : forced,
    IntersectionObserver: class {constructor(fn) { intersect = fn; } observe() {}}
  });
  vm.runInContext(read('motion.js'), context);
  context.startHeroFilm(hero);
  return {video, toggle, hero, doc, events, windowEvents, videoEvents, reduced, forced, intersect: visible => intersect([{isIntersecting: visible}])};
}
const film = filmHarness();
assert.equal(film.video.src, '', 'Do not load an offscreen film');
film.intersect(true);
assert.equal(film.video.src, 'assets/montage/hero.mp4');
assert.equal(film.video.paused, false);
film.toggle.click();
assert.equal(film.video.paused, true);
assert.equal(film.toggle['aria-label'], 'Play motion');
film.doc.hidden = true; film.events.visibilitychange();
film.doc.hidden = false; film.events.visibilitychange();
assert.equal(film.video.paused, true, 'Keep the visitor’s pause choice after tab changes');
film.toggle.click();
film.intersect(false); assert.equal(film.video.paused, true);
film.intersect(true); assert.equal(film.video.paused, false);
film.doc.hidden = true; film.events.visibilitychange(); assert.equal(film.video.paused, true);
film.doc.hidden = false; film.events.visibilitychange(); assert.equal(film.video.paused, false);
film.reduced.matches = true; film.reduced.change();
assert.equal(film.video.paused, true); assert.equal(film.toggle.hidden, true);
film.reduced.matches = false; film.reduced.change();
film.forced.matches = true; film.forced.change(); assert.equal(film.video.paused, true);
film.forced.matches = false; film.forced.change(); assert.equal(film.video.paused, false);
film.windowEvents.pagehide(); assert.equal(film.video.paused, true);
film.windowEvents.pageshow(); assert.equal(film.video.paused, false);
film.videoEvents.error();
assert.equal(film.video.hidden, true, 'Failed playback leaves the static poster');
assert.equal(film.toggle.hidden, true);
const reducedFilm = filmHarness(true); reducedFilm.intersect(true);
assert.equal(reducedFilm.video.src, '', 'Reduced motion should not download the film');
const blockedFilm = filmHarness(); blockedFilm.video.deny = true; blockedFilm.intersect(true);
await Promise.resolve();
assert.equal(blockedFilm.toggle['aria-label'], 'Play motion', 'Offer manual playback when autoplay is blocked');
blockedFilm.video.deny = false; blockedFilm.toggle.click();
assert.equal(blockedFilm.video.paused, false);
console.log('Passed: persistent light/dark toggle, URL and system preferences, storage fallback, clean footers, complete roster, disclosure controls and full-directory search, photo carousel controls and suspension, canvas modes, film playback/pause, accessibility preferences, offscreen/background suspension and playback recovery.');

for (const page of ['index.html', 'members.html', 'projects.html']) {
  const html = read(page);
  assert(!/class="button"/.test(html), `${page}: remove the remaining filled contact CTAs`);
  assert(html.includes('class="nav-contact" href="#join"'), `${page}: header contact stays on the current page`);
  assert.equal((html.match(/id="join"/g) || []).length, 1);
  assert(html.includes('data-contact-details'));
  assert(html.includes('src="contact.js?v=1"'));
  const composeLinks = [...html.matchAll(/href="(https:\/\/(?:mail.google.com|outlook.office.com)[^"]+)"/g)].map(([, href]) => new URL(href.replaceAll('&amp;', '&')));
  assert.equal(composeLinks.length, 2, 'Offer browser-based email options');
  for (const url of composeLinks) {
    assert.equal(url.searchParams.get('to'), 'muzammil.behzad@kfupm.edu.sa');
    assert(url.searchParams.get('su') || url.searchParams.get('subject'), 'Preserve inquiry subject lines');
  }
}
assert(read('members.html').includes('CV and a short research statement'));
for (const available of [true, false]) {
  let copied;
  const button = {hidden: true, addEventListener(event, callback) {this.click = callback;}};
  const status = {textContent: ''};
  const contact = {querySelector: selector => ({'[data-copy-email]':button, '.contact-email':{textContent:'muzammil.behzad@kfupm.edu.sa'}, '[data-copy-status]':status})[selector]};
  vm.runInNewContext(read('contact.js'), {
    document: {querySelectorAll: () => [contact]},
    navigator: {clipboard: available ? {async writeText(value) {copied = value;}} : undefined}
  });
  assert.equal(button.hidden, false);
  await button.click();
  if (available) {
    assert.equal(copied, 'muzammil.behzad@kfupm.edu.sa');
    assert.equal(status.textContent, 'Email copied.');
  } else {
    assert.equal(copied, undefined);
    assert.equal(status.textContent, 'Select the email address above to copy it.', 'Offer a truthful fallback when clipboard access fails');
  }
}
console.log('Passed: local contact anchors, visible original address, browser compose links, copy-email success and clipboard fallback.');

const phoneFilm = filmHarness(false, true);
assert.equal(phoneFilm.video.src, '', 'Mobile must preserve deferred video loading');
phoneFilm.intersect(true);
assert.equal(phoneFilm.video.src, 'assets/montage/hero-mobile.mp4');
phoneFilm.toggle.click();
assert.equal(phoneFilm.video.paused, true);
phoneFilm.toggle.click();
assert.equal(phoneFilm.video.paused, false);
const reducedPhoneFilm = filmHarness(true, true);
reducedPhoneFilm.intersect(true);
assert.equal(reducedPhoneFilm.video.src, '', 'Reduced-motion phones must not download either video');
console.log('Passed: mobile video source selection, lazy loading, pause/resume, and reduced motion.');
