// Handles view switching between home (card list) and detail (modal) views
import { initModal, open as openModal, close as closeModal, scrollToTop } from './components/modal.js';
import { setupHome, init as initHome } from './app/pages/home.js';
import { loadDetail } from './app/pages/detail.js';
import { getTotalCount } from './hooks/usePagination.js';

let currentId = null;
let contentEl = null;

export function init() {
  setupHome(showDetail);

  contentEl = initModal({
    close:    hideDetail,
    navigate: navigateDetail,
    retry:    retryDetail
  });

  document.addEventListener('keydown', e => {
    if (!currentId) return;
    if (e.key === 'Escape')                       hideDetail();
    if (e.key === 'ArrowLeft')                    navigateDetail(getPreviousDetailId(currentId));
    if (e.key === 'ArrowRight')                   navigateDetail(getNextDetailId(currentId));
  });

  initHome();
}

function showDetail(id) {
  currentId = normalizeDetailId(id);
  openModal();
  loadDetail(currentId, contentEl, {
    close: hideDetail,
    previous: () => navigateDetail(getPreviousDetailId(currentId)),
    next: () => navigateDetail(getNextDetailId(currentId)),
  });
}

function hideDetail() {
  closeModal();
  currentId = null;
}

function navigateDetail(id) {
  currentId = normalizeDetailId(id);
  scrollToTop();
  loadDetail(currentId, contentEl, {
    close: hideDetail,
    previous: () => navigateDetail(getPreviousDetailId(currentId)),
    next: () => navigateDetail(getNextDetailId(currentId)),
  });
}

function retryDetail(id) {
  const targetId = normalizeDetailId(id);
  currentId = targetId;
  loadDetail(targetId, contentEl, {
    close: hideDetail,
    previous: () => navigateDetail(getPreviousDetailId(targetId)),
    next: () => navigateDetail(getNextDetailId(targetId)),
  });
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
