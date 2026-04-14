// Renders the persistent UI shell: header, main container with controls, and modal overlay
import { TYPE_LIST } from "./constants/types.js";
import { capitalize } from "./utils/capitalize.js";
export function render() {
  const typeOptions = TYPE_LIST.map(
    (type) => `<option value="${type}">${capitalize(type)}</option>`,
  ).join("");

  document.body.innerHTML = `
    <header>
      <img class="header-logo" src="./assets/pokeball.svg" alt="" aria-hidden="true" />
      <h1>Pokedex</h1>
    </header>

    <main class="container">
      <div class="home-content">
        <div class="controls">
          <div class="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input class="search-input" type="search" placeholder="Search name or #ID\u2026" autocomplete="off" />
          </div>
          <div class="sort-wrap">
            <button class="sort-btn sort-btn--active" data-sort="id">By ID</button>
            <button class="sort-btn" data-sort="name">A \u2013 Z</button>
            <div class="type-filter-wrap">
              <select class="type-filter">
                <option value="">All Types</option>
                ${typeOptions}
              </select>
            </div>
          </div>
        </div>

        <div class="results-count"></div>
        <div class="card-grid"></div>
      </div>
      <footer class="load-more-wrap home-footer">
        <button class="load-more-btn">Load More Pokemons</button>
      </footer>
    </main>

    <div class="modal-overlay">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__content"></div>
      </div>
    </div>
  `;
}
