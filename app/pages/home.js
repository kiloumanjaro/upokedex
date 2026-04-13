// Home page: card grid rendering, search/sort controls, pagination, and load-more logic
import { cardHTML, injectTypes, showSkeletons } from '../../components/card.js';
import { getPokemon, fetchTotalCount, fetchPokemonBatch } from '../../lib/services/pokemonService.js';
import cache from '../../lib/services/cache.js';
import { getSearchQuery, setSearchQuery, getSortMode, setSortMode, filteredList } from '../../hooks/useSearch.js';
import * as pagination from '../../hooks/usePagination.js';
import { escapeHtml } from '../../utils/escapeHtml.js';

let gridEl, countEl, loadMoreWrap, loadMoreBtn;
let onCardClick = null;

export function setupHome(cardClickCallback) {
  onCardClick   = cardClickCallback;
  gridEl        = document.getElementById('cardGrid');
  countEl       = document.getElementById('resultsCount');
  loadMoreWrap  = document.getElementById('loadMoreWrap');
  loadMoreBtn   = document.getElementById('loadMoreBtn');

  // Event delegation on card grid
  gridEl.addEventListener('click', e => {
    const card = e.target.closest('.poke-card');
    if (card) {
      onCardClick(parseInt(card.dataset.id, 10));
      return;
    }
    if (e.target.closest('[data-action="retry-load"]')) {
      loadMore();
    }
  });

  gridEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const card = e.target.closest('.poke-card');
      if (card) onCardClick(parseInt(card.dataset.id, 10));
    }
  });

  // Load more
  loadMoreBtn.addEventListener('click', loadMore);

  // Search
  document.getElementById('searchInput').addEventListener('input', function () {
    setSearchQuery(this.value.trim());
    renderGrid();
    syncLoadMoreVisibility();
  });

  // Sort
  const sortIdBtn   = document.getElementById('sortId');
  const sortNameBtn = document.getElementById('sortName');

  sortIdBtn.addEventListener('click', () => {
    setSortMode('id');
    sortIdBtn.classList.add('active');
    sortNameBtn.classList.remove('active');
    renderGrid();
  });

  sortNameBtn.addEventListener('click', () => {
    setSortMode('name');
    sortNameBtn.classList.add('active');
    sortIdBtn.classList.remove('active');
    renderGrid();
  });
}

export async function init() {
  showSkeletons(gridEl);
  try {
    const count = await fetchTotalCount();
    pagination.setTotalCount(count);
  } catch { /* continue */ }
  await loadMore();
}

export async function loadMore() {
  if (pagination.getIsLoading() || pagination.getAllLoaded()) return;
  pagination.setLoading(true);
  loadMoreBtn.disabled = true;
  loadMoreBtn.innerHTML = '<span class="spinner-sm"></span> Loading\u2026';

  try {
    const { items, hasMore } = await fetchPokemonBatch(pagination.getOffset());
    cache.list.push(...items);
    pagination.advanceOffset();
    if (!hasMore) pagination.markAllLoaded();

    renderGrid();

    items.forEach(p => {
      if (!cache.pokemon[p.id]) {
        getPokemon(p.id).then(() => injectTypes(p.id)).catch(() => {});
      } else {
        injectTypes(p.id);
      }
    });
  } catch (e) {
    console.error(e);
    showGridError('Failed to load Pok\u00e9mon. Check your connection and try again.');
  } finally {
    pagination.setLoading(false);
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = 'Load More';
    syncLoadMoreVisibility();
  }
}

function renderGrid() {
  const list  = filteredList(cache.list);
  const query = getSearchQuery();
  const total = pagination.getTotalCount();

  if (query) {
    countEl.textContent = `${list.length} result${list.length !== 1 ? 's' : ''} found`;
  } else {
    countEl.textContent = `Showing ${cache.list.length}${total ? ' of ' + total : ''} Pok\u00e9mon`;
  }

  if (list.length === 0) {
    gridEl.innerHTML = `<div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <p>No Pok\u00e9mon match \u201c<strong>${escapeHtml(query)}</strong>\u201d</p>
    </div>`;
    return;
  }

  gridEl.innerHTML = list.map((p, i) => cardHTML(p, i)).join('');
  list.forEach(p => { if (cache.pokemon[p.id]) injectTypes(p.id); });
}

function showGridError(msg) {
  gridEl.innerHTML = `
    <div class="error-state">
      <p>${escapeHtml(msg)}</p>
      <button data-action="retry-load"
              style="padding:10px 24px;background:var(--red);color:#fff;border:none;border-radius:8px;cursor:pointer;font:700 .9rem 'Inter',sans-serif">
        Retry
      </button>
    </div>`;
}

function syncLoadMoreVisibility() {
  loadMoreWrap.style.display = (getSearchQuery() || pagination.getAllLoaded()) ? 'none' : 'block';
}
