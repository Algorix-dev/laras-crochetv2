/*
  HERO NAME LINES — how a long product name is broken up in the big hero title (and in the admin preview,
  so Lara sees the same thing before she publishes).

    - a single word longer than HERO_WORD_MAX letters is cut in two (60% / 40%), so
      "Lemonade" shows as LEMON over ADE, centered
    - short words share a line while the line stays within HERO_LINE_MAX characters

  To make the hero more or less eager to break names, change the two numbers below.
*/
export const HERO_WORD_MAX = 7;
export const HERO_LINE_MAX = 8;

export function heroNameLines(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  const flush = () => {
    if (current) lines.push(current);
    current = '';
  };
  for (const word of words) {
    if (word.length > HERO_WORD_MAX) {
      flush();
      const cut = Math.ceil(word.length * 0.6);
      lines.push(word.slice(0, cut), word.slice(cut));
      continue;
    }
    if (!current) current = word;
    else if (`${current} ${word}`.length <= HERO_LINE_MAX) current = `${current} ${word}`;
    else {
      flush();
      current = word;
    }
  }
  flush();
  return lines;
}
