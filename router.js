// Handles view switching between home (card list) and detail (modal) views
import { initModal, open as openModal, close as closeModal, scrollToTop } from './components/modal.js';
import { setupHome, init as initHome } from './app/pages/home.js';
import { fetchDetailState, loadDetail } from './app/pages/detail.js';
import { getTotalCount } from './hooks/usePagination.js';

let currentId = null;
let contentEl = null;
let isDetailClosing = false;

export function init() {
  setupHome(showDetail);

  contentEl = initModal({
    close:    requestHideDetail,
    navigate: navigateDetail,
    retry:    retryDetail
  });

  document.addEventListener('keydown', e => {
    if (!currentId) return;
    if (e.key === 'Escape') {
      requestHideDetail();
      return;
    }

    if (contentEl?.dataset.detailLoading === 'true') return;

    if (e.key === 'ArrowLeft') {
      const previousButton = contentEl?.querySelector('[data-book-action="previous"]');
      if (previousButton && !previousButton.disabled) {
        previousButton.click();
        return;
      }

      navigateDetail(getPreviousDetailId(currentId));
    }

    if (e.key === 'ArrowRight') {
      const nextButton = contentEl?.querySelector('[data-book-action="next"]');
      if (nextButton && !nextButton.disabled) {
        nextButton.click();
        return;
      }

      navigateDetail(getNextDetailId(currentId));
    }
  });

  initHome();
}

function showDetail(id) {
  currentId = normalizeDetailId(id);
  isDetailClosing = false;
  openModal();
  loadDetail(currentId, contentEl, createDetailHandlers(currentId));
}

function hideDetailImmediate() {
  closeModal();
  currentId = null;
  isDetailClosing = false;
  if (contentEl) {
    contentEl.__pokedexClose = null;
    contentEl.__pokemonNotebookClose = null;
    contentEl.dataset.bookSessionOpen = 'false';
    contentEl.dataset.detailLoading = 'false';
  }
}

function requestHideDetail() {
  if (!currentId || isDetailClosing) return;

  isDetailClosing = true;

  const finishClose = () => {
    hideDetailImmediate();
  };

  if (typeof contentEl?.__pokedexClose === 'function') {
    contentEl.__pokedexClose(finishClose);
    return;
  }

  if (typeof contentEl?.__pokemonNotebookClose === 'function') {
    contentEl.__pokemonNotebookClose(finishClose);
    return;
  }

  finishClose();
}

function navigateDetail(id) {
  if (isDetailClosing) return;

  currentId = normalizeDetailId(id);
  scrollToTop();
  loadDetail(currentId, contentEl, createDetailHandlers(currentId));
}

function retryDetail(id) {
  const targetId = normalizeDetailId(id);
  currentId = targetId;
  loadDetail(targetId, contentEl, createDetailHandlers(targetId));
}

function createDetailHandlers(id) {
  return {
    close: requestHideDetail,
    previous: () => prepareNotebookTurn(getPreviousDetailId(id)),
    next: () => prepareNotebookTurn(getNextDetailId(id)),
  };
}

async function prepareNotebookTurn(id) {
  if (isDetailClosing) return null;

  const targetId = normalizeDetailId(id);
  const detail = await fetchDetailState(targetId);
  if (isDetailClosing) return null;
  currentId = targetId;

  return {
    detail,
    handlers: createDetailHandlers(targetId),
  };
}

function normalizeDetailId(id) {
  const parsed = Math.floor(Number(id));
  const totalCount = getTotalCount();

  if (!Number.isFinite(parsed)) return 1;
  if (!totalCount) return Math.max(1, parsed);
  if (parsed < 1) return totalCount;
  if (parsed > totalCount) return 1;
  return parsed;
}

function getPreviousDetailId(id) {
  const totalCount = getTotalCount();
  if (id > 1) return id - 1;
  return totalCount || 1;
}

function getNextDetailId(id) {
  const totalCount = getTotalCount();
  if (totalCount && id >= totalCount) return 1;
  return id + 1;
}
