export const LANG_COLORS = {
  JavaScript:  '#f1e05a',
  TypeScript:  '#3178c6',
  Python:      '#3572A5',
  CSS:         '#563d7c',
  HTML:        '#e34c26',
  SCSS:        '#c6538c',
  Rust:        '#dea584',
  Go:          '#00ADD8',
  Java:        '#b07219',
  'C++':       '#f34b7d',
  'C#':        '#178600',
  Ruby:        '#701516',
  Vue:         '#41B883',
  Svelte:      '#ff3e00',
  Kotlin:      '#A97BFF',
  Swift:       '#F05138',
  Dart:        '#00B4AB',
  Shell:       '#89e051',
  PHP:         '#4F5D95',
  Elixir:      '#6e4a7e',
  Lua:         '#000080',
  R:           '#198CE7',
  Haskell:     '#5e5086',
  Clojure:     '#db5855',
  Nix:         '#7e7eff',
}

export function getLangColor(lang) {
  return LANG_COLORS[lang] || '#6b7280'
}
