// Manages the modal overlay: open/close animation, backdrop click, and delegated action handling
let overlayEl, modalEl, contentEl;

export function initModal(handlers) {
  overlayEl  = document.getElementById('modalOverlay');
  modalEl    = document.getElementById('modal');
  contentEl  = document.getElementById('modalContent');

  overlayEl.addEventListener('click', e => {
    if (e.target === overlayEl) handlers.close();
  });

  modalEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id ? parseInt(btn.dataset.id, 10) : null;

    switch (action) {
      case 'close':           handlers.close();       break;
      case 'prev': case 'next': handlers.navigate(id); break;
      case 'retry':           handlers.retry(id);     break;
    }
  });

  return contentEl;
}

export function open() {
  overlayEl.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function close() {
  overlayEl.classList.remove('open');
  document.body.style.overflow = '';
}

export function scrollToTop() {
  modalEl.scrollTop = 0;
}
