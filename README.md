# Pokédex

A single-page Pokédex application built with vanilla HTML, CSS, and JavaScript (ES Modules). No build step required.

## Quick start

Serve the project root with any static file server and open `index.html` in a browser.

```bash
# Using Python
python -m http.server 8000

# Using Node (npx)
npx serve .
```

> **Note:** ES Modules require HTTP — opening `index.html` via `file://` will not work due to CORS restrictions on module imports.

## Project structure

```
config/          → App-wide settings (API base URL, batch size, image URL builder)
constants/       → Fixed data maps (type colors, weakness chart, stat labels)
utils/           → Pure helper functions (formatId, capitalize, escapeHtml, fallback image)
lib/api/         → Generic fetch wrapper
lib/services/    → Business logic: cached API calls, weakness calculation
hooks/           → State containers for pagination and search/sort
components/      → Reusable UI pieces (card renderer, modal shell)
app/pages/       → Page-level views (home grid, detail modal content)
styles/          → CSS split by scope (base, header, controls, card, modal, types)
layout.js        → Renders the persistent HTML shell (header, containers, modal overlay)
router.js        → Wires views together: card click → modal, keyboard nav, close
main.js          → Entry point: renders layout, initializes router
index.html       → Loads CSS and main.js as a module
```

## Data sources

- **Pokémon list & details:** [PokéAPI](https://pokeapi.co/api/v2/)
- **Pokémon images:** [assets.pokemon.com](https://assets.pokemon.com/assets/cms2/img/pokedex/full/)
