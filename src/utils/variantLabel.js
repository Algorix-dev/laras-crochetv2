/*
  TIP — "NO COLOUR / NO SHADE". When a piece has no colour (or shade) options, quick-add (the bag icon on a
  card, the hero's add button) stores an empty value instead of a made-up word. Anywhere the bag shows a
  colour or shade, wrap it in realVariant() so empty values (and the old "Default" placeholder that may
  still be sitting in someone's bag) are simply not shown.
*/
export const realVariant = (v) => {
  const t = String(v ?? '').trim();
  return !t || t.toLowerCase() === 'default' ? '' : t;
};
