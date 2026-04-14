// Manages the modal overlay: open/close animation, backdrop click, and delegated action handling
let overlayEl, modalEl, contentEl;

export function initModal(handlers) {
  overlayEl  = document.querySelector('.modal-overlay');
  modalEl    = document.querySelector('.modal');
  contentEl  = document.querySelector('.modal__content');

  const handleOverlayClick = (e) => {
    if (e.target === overlayEl) handlers.close();
  };

  const handleModalClick = (e) => {
    const bookCloseBtn = e.target.closest('[data-book-action="close"]');
    if (bookCloseBtn) {
      handlers.close();
      return;
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id ? parseInt(btn.dataset.id, 10) : null;

    switch (action) {
      case 'close':           handlers.close();       break;
      case 'prev': case 'next': handlers.navigate(id); break;
      case 'retry':           handlers.retry(id);     break;
    }
  };

  overlayEl.addEventListener('click', handleOverlayClick);
  modalEl.addEventListener('click', handleModalClick);

  return contentEl;
}

export function open() {
  overlayEl.classList.add('modal-overlay--open');
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
}

export function close() {
  overlayEl.classList.remove('modal-overlay--open');
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
}

export function scrollToTop() {
  modalEl.scrollTop = 0;
}
