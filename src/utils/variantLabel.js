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

/*
  TIP — WHAT QUICK-ADD PUTS IN THE BAG. The bag icon on a card (and the hero's add button) adds a piece
  without opening its page, so it has to pick a colour, shade and size for the customer. It picks the SAME
  first choices the product page pre-selects: Lara's first colour / shade from the product form
  (colorOptions / shadeOptions), or the standard first ones if she left them empty.
  If you change the standard lists in pages/ProductDetail.jsx (FIGMA_COLOR_MIXES / FIGMA_SHADES /
  FIGMA_SIZES), change the three fallback words below to match their first entries.
*/
const FALLBACK_COLOR = 'Red';
const FALLBACK_SHADE = 'Ivory';
const FALLBACK_SIZE = 'XS';

export const defaultVariant = (product) => ({
  color: product?.colorOptions?.[0]?.name || FALLBACK_COLOR,
  shade: product?.shadeOptions?.[0]?.name || FALLBACK_SHADE,
  size: product?.sizes?.[0] || FALLBACK_SIZE,
});
