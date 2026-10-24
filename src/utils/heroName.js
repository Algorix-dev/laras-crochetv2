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

/*
  TIP — HOW FAR A BROKEN TITLE DROPS. The hero title sits on its bottom edge, so when a name breaks into
  2+ lines the extra lines grow UPWARD and can touch the navbar. To prevent that, the title is pushed down
  by this much for every extra line, measured in "lines" of the title's own text size
  (0.5 = half a line per extra line). Bigger number = lower title, 0 = turn the drop off.
*/
export const HERO_BROKEN_DROP = 0.55;

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
