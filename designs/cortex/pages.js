function matchesResearch(categories, selected) {
  return selected === 'all' || categories.split(/\s+/).includes(selected);
}

document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
  const controls = [...scope.querySelectorAll('[data-filter]')];
  const items = [...scope.querySelectorAll('[data-cat]')];
  const groups = [...scope.querySelectorAll('[data-member-group]')];
  const search = scope.querySelector('[data-search]');
  const status = scope.querySelector('[data-filter-status]');
  const empty = scope.querySelector('[data-empty]');
  let selected = 'all';

  function update() {
    const query = search ? search.value.trim().toLocaleLowerCase() : '';
    items.forEach((item) => {
      item.hidden = !matchesResearch(item.dataset.cat, selected) || !item.textContent.toLocaleLowerCase().includes(query);
    });
    const count = items.filter((item) => !item.hidden).length;
    groups.forEach((group) => {
      const matching = [...group.querySelectorAll('[data-cat]')].filter((item) => !item.hidden);
      const toggle = group.querySelector('[data-view-more]');
      group.hidden = matching.length === 0;
      if (!toggle) return;
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.hidden = Boolean(query) || matching.length <= 4;
      toggle.textContent = expanded ? 'View less' : 'View more';
      if (!query && !expanded) matching.slice(4).forEach((item) => { item.hidden = true; });
    });
    const noun = scope.dataset.noun;
    status.textContent = `${count} ${count === 1 ? noun.slice(0, -1) : noun}`;
    empty.hidden = count > 0;
  }

  controls.forEach((control) => {
    control.addEventListener('click', () => {
      selected = control.dataset.filter;
      controls.forEach((button) => button.setAttribute('aria-pressed', String(button === control)));
      update();
    });
  });
  if (search) search.addEventListener('input', update);
  groups.forEach((group) => {
    const toggle = group.querySelector('[data-view-more]');
    if (toggle) toggle.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
      update();
      if (toggle.getAttribute('aria-expanded') === 'false') toggle.scrollIntoView({block: 'end', behavior: 'instant'});
    });
  });
  update();
});
