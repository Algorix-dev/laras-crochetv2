// TIP — ONE PLACE THAT DECIDES THE PRICE. A piece has a normal `price`, and Lara can add a
// `salePrice` with an optional start and end date. The sale only counts while today is
// inside those dates (no start = already started, no end = never expires). The shop page,
// the bag and the payment all use this same function, so they can never disagree.
export function saleIsActive(product, now = new Date()) {
  const sale = Number(product?.salePrice);
  if (!Number.isFinite(sale) || sale <= 0 || sale >= Number(product.price)) return false;
  if (product.saleStart && now < new Date(product.saleStart)) return false;
  if (product.saleEnd && now > new Date(product.saleEnd)) return false;
  return true;
}

export function currentPrice(product, now = new Date()) {
  return saleIsActive(product, now) ? Number(product.salePrice) : Number(product.price);
}
