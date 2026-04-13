// Hardcoded fallback weakness map used when the type API is unreachable
export const FALLBACK_WEAKNESSES = {
  normal:   ['fighting'],
  fire:     ['water', 'ground', 'rock'],
  water:    ['electric', 'grass'],
  electric: ['ground'],
  grass:    ['flying', 'poison', 'bug', 'steel', 'fire', 'ice'],
  ice:      ['fighting', 'rock', 'steel', 'fire'],
  fighting: ['flying', 'psychic', 'fairy'],
  poison:   ['ground', 'psychic'],
  ground:   ['water', 'grass', 'ice'],
  flying:   ['rock', 'electric', 'ice'],
  psychic:  ['bug', 'ghost', 'dark'],
  bug:      ['flying', 'rock', 'fire'],
  rock:     ['water', 'grass', 'fighting', 'ground', 'steel'],
  ghost:    ['ghost', 'dark'],
  dragon:   ['ice', 'dragon', 'fairy'],
  dark:     ['fighting', 'bug', 'fairy'],
  steel:    ['fighting', 'ground', 'fire'],
  fairy:    ['poison', 'steel']
};
