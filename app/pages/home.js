// Home page: card grid rendering, search/sort controls, pagination, and load-more logic
import { cardHTML, injectTypes, showSkeletons } from "../../components/card.js";
import {
  getPokemon,
  fetchTotalCount,
  fetchPokemonBatch,
} from "../../lib/services/pokemon-service.js";
import cache from "../../lib/services/cache.js";
import {
  getSearchQuery,
  setSearchQuery,
  getSortMode,
  setSortMode,
  getTypeFilter,
  setTypeFilter,
  filteredList,
} from "../../hooks/use-search.js";
import * as pagination from "../../hooks/use-pagination.js";
import { escapeHtml } from "../../utils/escape-html.js";
import { capitalize } from "../../utils/capitalize.js";

let gridEl, countEl, loadMoreWrap, loadMoreBtn;
let onCardClick = null;
let footerResizeObserver = null;
let loadAllPromise = null;

export function setupHome(cardClickCallback) {
  onCardClick = cardClickCallback;
  gridEl = document.querySelector(".card-grid");
  countEl = document.querySelector(".results-count");
  loadMoreWrap = document.querySelector(".load-more-wrap");
  loadMoreBtn = document.querySelector(".load-more-btn");

  setupFooterLayout();

  // Event delegation on card grid
  gridEl.addEventListener("click", (e) => {
    const card = e.target.closest(".poke-card");
    if (card) {
      onCardClick(parseInt(card.dataset.id, 10));
      return;
    }
    if (e.target.closest('[data-action="retry-load"]')) {
      loadMore();
    }
  });

  gridEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const card = e.target.closest(".poke-card");
      if (card) onCardClick(parseInt(card.dataset.id, 10));
    }
  });

  // Load More Pokemons
  loadMoreBtn.addEventListener("click", loadMore);

  // Search
  document
    .querySelector(".search-input")
    .addEventListener("input", function () {
      setSearchQuery(this.value.trim());
      if (getSearchQuery()) {
        ensureAllPokemonLoaded().then(() => {
          if (getSearchQuery()) {
            renderGrid();
            syncLoadMoreVisibility();
          }
        });
      }
      renderGrid();
      syncLoadMoreVisibility();
    });

  // Sort
  const sortIdBtn = document.querySelector('[data-sort="id"]');
  const sortNameBtn = document.querySelector('[data-sort="name"]');
  const typeFilterSelect = document.querySelector(".type-filter");
  const typeFilterWrap = document.querySelector(".type-filter-wrap");

  sortIdBtn.addEventListener("click", () => {
    setSortMode("id");
    sortIdBtn.classList.add("sort-btn--active");
    sortNameBtn.classList.remove("sort-btn--active");
    renderGrid();
  });

  sortNameBtn.addEventListener("click", () => {
    setSortMode("name");
    sortNameBtn.classList.add("sort-btn--active");
    sortIdBtn.classList.remove("sort-btn--active");
    renderGrid();
  });

  // Type filter
  let typeMenuOpen = false;
  const setTypeMenuOpen = (next) => {
    typeMenuOpen = next;
    if (typeFilterWrap) {
      typeFilterWrap.classList.toggle("type-filter-wrap--open", typeMenuOpen);
    }
  };

  typeFilterSelect.addEventListener("click", () => {
    setTypeMenuOpen(!typeMenuOpen);
  });

  typeFilterSelect.addEventListener("change", () => {
    setTypeMenuOpen(false);
    setTypeFilter(typeFilterSelect.value);
    if (getTypeFilter()) {
      ensureAllPokemonLoaded().then(async () => {
        if (!getTypeFilter()) return;
        await primeTypeData(cache.list);
        renderGrid();
        syncLoadMoreVisibility();
      });
    }
    renderGrid();
    syncLoadMoreVisibility();
  });

  typeFilterSelect.addEventListener("blur", () => {
    setTypeMenuOpen(false);
  });

  document.addEventListener("click", (e) => {
    if (!typeFilterWrap || typeFilterWrap.contains(e.target)) return;
    setTypeMenuOpen(false);
  });
}

export async function init() {
  showSkeletons(gridEl);
  try {
    const count = await fetchTotalCount();
    pagination.setTotalCount(count);
  } catch {
    /* continue */
  }
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

    if (getTypeFilter()) {
      await primeTypeData(items);
    }

    renderGrid();

    items.forEach((p) => {
      if (!cache.pokemon[p.id]) {
        getPokemon(p.id)
          .then(() => injectTypes(p.id))
          .catch(() => {});
      } else {
        injectTypes(p.id);
      }
    });
  } catch (e) {
    console.error(e);
    showGridError(
      "Failed to load Pok\u00e9mon. Check your connection and try again.",
    );
  } finally {
    pagination.setLoading(false);
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = "Load More Pokemons";
    syncLoadMoreVisibility();
  }
}

function renderGrid() {
  const list = filteredList(cache.list);
  const query = getSearchQuery();
  const typeFilter = getTypeFilter();
  const total = pagination.getTotalCount();
  const isLoadingAll = !!loadAllPromise && !pagination.getAllLoaded();

  if (query || typeFilter) {
    const typeSuffix = typeFilter ? ` in ${capitalize(typeFilter)}` : "";
    const loadingSuffix = isLoadingAll ? " (loading full Pokedex...)" : "";
    countEl.textContent = `${list.length} result${list.length !== 1 ? "s" : ""} found${typeSuffix}${loadingSuffix}`;
  } else {
    countEl.textContent = `Showing ${cache.list.length}${total ? " of " + total : ""} Pok\u00e9mon`;
  }

  if (list.length === 0) {
    if ((query || typeFilter) && isLoadingAll) {
      gridEl.innerHTML = `<div class="empty-state">
        <p>Loading full Pokedex\u2026</p>
      </div>`;
      return;
    }
    const emptyLabel = query
      ? `\u201c<strong>${escapeHtml(query)}</strong>\u201d`
      : typeFilter
        ? `${capitalize(typeFilter)} type`
        : "your filters";
    gridEl.innerHTML = `<div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <p>No Pok\u00e9mon match ${emptyLabel}</p>
    </div>`;
    return;
  }

  gridEl.innerHTML = list.map((p, i) => cardHTML(p, i)).join("");
  list.forEach((p) => {
    if (cache.pokemon[p.id]) injectTypes(p.id);
  });
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
  loadMoreWrap.style.display =
    getSearchQuery() || getTypeFilter() || pagination.getAllLoaded()
      ? "none"
      : "flex";
  syncFooterHeight();
}

function setupFooterLayout() {
  syncFooterHeight();

  if (footerResizeObserver) footerResizeObserver.disconnect();
  window.removeEventListener("resize", syncFooterHeight);

  if ("ResizeObserver" in window) {
    footerResizeObserver = new ResizeObserver(() => syncFooterHeight());
    footerResizeObserver.observe(loadMoreWrap);
  }

  window.addEventListener("resize", syncFooterHeight);
}

function syncFooterHeight() {
  const footerHeight =
    loadMoreWrap && getComputedStyle(loadMoreWrap).display !== "none"
      ? `${loadMoreWrap.offsetHeight}px`
      : "0px";

  document.documentElement.style.setProperty(
    "--home-footer-height",
    footerHeight,
  );
}

async function primeTypeData(list) {
  const missing = list.filter((p) => !cache.pokemon[p.id]);
  if (missing.length === 0) return;
  for (let i = 0; i < missing.length; i += 20) {
    const slice = missing.slice(i, i + 20);
    await Promise.all(
      slice.map((p) =>
        getPokemon(p.id).catch(() => {
          /* ignore */
        }),
      ),
    );
  }
}

async function ensureAllPokemonLoaded() {
  if (pagination.getAllLoaded()) return Promise.resolve();
  if (loadAllPromise) return loadAllPromise;

  loadAllPromise = (async () => {
    let safety = 0;
    while (pagination.getIsLoading() && safety < 80) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      safety += 1;
    }

    pagination.setLoading(true);
    try {
      while (!pagination.getAllLoaded()) {
        const { items, hasMore } = await fetchPokemonBatch(
          pagination.getOffset(),
        );
        cache.list.push(...items);
        pagination.advanceOffset();
        if (!hasMore) pagination.markAllLoaded();
      }
    } catch (error) {
      console.error(error);
    } finally {
      pagination.setLoading(false);
      loadAllPromise = null;
    }
  })();

  return loadAllPromise;
}
