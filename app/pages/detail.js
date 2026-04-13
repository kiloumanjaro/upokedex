// Detail view: renders the book-style Pokemon notebook inside the modal
import {
  renderPokedex,
  hydratePokedex,
} from '../../components/pokedex.js';
import { getPokemon, getSpecies, calcWeaknesses } from '../../lib/services/pokemonService.js';
import { getTotalCount } from '../../hooks/usePagination.js';

let activeDetailRequest = 0;

export async function fetchDetailState(id) {
  const [pokemon, species] = await Promise.all([
    getPokemon(id),
    getSpecies(id).catch(() => null),
  ]);

  const types = pokemon.types.map(t => t.type.name);
  const weaknesses = await calcWeaknesses(types);

  return {
    id,
    totalCount: getTotalCount(),
    pokemon,
    species,
    weaknesses,
  };
}

export async function loadDetail(id, contentEl, handlers = {}) {
  const requestId = ++activeDetailRequest;
  const hasNotebook = !!contentEl.querySelector('[data-book-root]');

  contentEl.dataset.detailLoading = 'true';

  if (!hasNotebook) {
    contentEl.innerHTML = '<div class="modal-loading"><div class="spinner-lg"></div></div>';
  }

  try {
    const detailState = await fetchDetailState(id);
    if (requestId !== activeDetailRequest) return;
    contentEl.innerHTML = renderPokedex(detailState);

    hydratePokedex(contentEl, handlers);
    contentEl.dataset.detailLoading = 'false';

  } catch (e) {
    if (requestId !== activeDetailRequest) return;

    console.error(e);
    contentEl.dataset.detailLoading = 'false';
    contentEl.innerHTML = `
      <div class="modal-loading">
        <p style="color:#dc2626;font-weight:700;margin-bottom:14px">Failed to load #${id}</p>
        <button data-action="retry" data-id="${id}"
                style="padding:10px 24px;background:var(--red);color:#fff;border:none;border-radius:8px;
                       cursor:pointer;font:700 .9rem 'Inter',sans-serif">
          Retry
        </button>
        <br/><br/>
        <button data-action="close"
                style="padding:8px 20px;background:none;color:var(--muted);border:2px solid var(--border);
                       border-radius:8px;cursor:pointer;font:600 .85rem 'Inter',sans-serif">
          Close
        </button>
      </div>`;
  }
}
