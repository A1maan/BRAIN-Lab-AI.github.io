document.querySelectorAll('[data-contact-details]').forEach((contact) => {
  const button = contact.querySelector('[data-copy-email]');
  const email = contact.querySelector('.contact-email');
  const status = contact.querySelector('[data-copy-status]');
  button.hidden = false;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email.textContent.trim());
      status.textContent = 'Email copied.';
    } catch {
      status.textContent = 'Select the email address above to copy it.';
    }
  });
});
