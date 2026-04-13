// Renders the persistent UI shell: header, main container with controls, and modal overlay
export function render() {
  document.body.innerHTML = `
    <header>
      <div class="pokeball"></div>
      <h1>Pokédex</h1>
    </header>

    <main class="container">
      <div class="controls">
        <div class="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input id="searchInput" type="search" placeholder="Search name or #ID\u2026" autocomplete="off" />
        </div>
        <div class="sort-wrap">
          <span class="sort-label">Sort:</span>
          <button class="sort-btn active" id="sortId">By ID</button>
          <button class="sort-btn" id="sortName">A \u2013 Z</button>
        </div>
      </div>

      <div id="resultsCount"></div>
      <div class="card-grid" id="cardGrid"></div>
      <div id="loadMoreWrap">
        <button id="loadMoreBtn">Load More</button>
      </div>
    </main>

    <div class="modal-overlay" id="modalOverlay">
      <div class="modal" id="modal" role="dialog" aria-modal="true">
        <div id="modalContent"></div>
      </div>
    </div>
  `;
}
