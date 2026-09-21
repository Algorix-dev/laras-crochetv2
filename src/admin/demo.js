/*
  SAMPLE DATA for previewing the admin without a backend or real orders.

  Open  /admin?demo  to switch it on (it stays on for the browser tab, and
  /admin?demo=off turns it off again). Nothing here is ever sent to the
  server — saving is switched off while the sample data is showing.
*/

// tiny seeded random so the sample data looks the same on every reload
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 24 * 60 * 60 * 1000;

const PIECES = [
  ["Reina", "dresses", 68000, "/images/reina-burgundy.jpg"],
  ["Sade", "bikinis", 32000, "/images/reina-orange.jpg"],
  ["Amara", "two-pieces", 54000, "/images/reina-teal.jpg"],
  ["Zuri", "shirts", 28000, "/images/reina-mustard.jpg"],
  ["Kemi", "skirts", 36000, "/images/reina-lilac.jpg"],
  ["Tola", "dresses", 74000, "/images/reina-green.jpg"],
  ["Nia", "bikinis", 30000, "/images/reina-brown.jpg"],
  ["Ife", "two-pieces", 59000, "/images/reina-turquoise-set.jpg"],
];

const FIRST = ["Adaeze", "Tomi", "Efe", "Chidi", "Ngozi", "Kofi", "Ama", "Sophie", "Jade", "Funke", "Bisi", "Ruth", "Mary", "Amina", "Ijeoma", "Temi", "Zainab", "Kemi", "Lola", "Sade"];
const LAST = ["Okafor", "Bello", "Johnson", "Nwosu", "Eze", "Mensah", "Owusu", "Turner", "Williams", "Adeyemi", "Ogunleye", "Okoro", "Yusuf", "Obi", "Coker"];
const PLACES = [["Lagos", "Nigeria"], ["Lagos", "Nigeria"], ["Abuja", "Nigeria"], ["Port Harcourt", "Nigeria"], ["Ibadan", "Nigeria"], ["Enugu", "Nigeria"], ["Accra", "Ghana"], ["Kumasi", "Ghana"], ["London", "United Kingdom"], ["Houston", "United States"]];
const PEOPLE = Array.from({ length: 44 }, (_, i) => {
  const [city, country] = PLACES[(i * 7) % PLACES.length];
  return [`${FIRST[i % FIRST.length]} ${LAST[(i * 3 + Math.floor(i / FIRST.length)) % LAST.length]}`, city, country];
});

export function demoData(now = Date.now()) {
  const rand = rng(20260921);

  const products = PIECES.map(([name, category, price, image], i) => ({
    _id: `demo-product-${i + 1}00000000000000${i}`.slice(0, 24),
    name,
    category,
    price,
    image,
    images: [image],
    views: { front: image, left: i % 2 ? image : "", right: "", back: "" },
    placements: i % 3 === 0 ? ["featured"] : i === 4 ? ["hero"] : [],
    colors: [],
    sizes: ["XS", "S", "M", "XL"],
    stock: i === 3 ? 0 : 4 + Math.floor(rand() * 12),
    description: `${name} — hand-crocheted to order.`,
    isActive: true,
    createdAt: new Date(now - (60 - i * 6) * DAY).toISOString(),
  }));

  const statuses = [
    ["delivered", 0.42],
    ["shipped", 0.12],
    ["packaging", 0.08],
    ["in_production", 0.09],
    ["paid", 0.1],
    ["pending", 0.11],
    ["cancelled", 0.08],
  ];
  const channels = ["card", "card", "card", "card", "bank_transfer", "ussd"];

  const orders = [];
  for (let i = 0; i < 96; i += 1) {
    const person = PEOPLE[Math.floor(rand() * PEOPLE.length)];
    const [name, city, country] = person;
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`;
    const lines = 1 + (rand() > 0.72 ? 1 : 0);
    const items = Array.from({ length: lines }, () => {
      const p = products[Math.floor(rand() * products.length)];
      return { product: p._id, name: p.name, price: p.price, color: "Burgundy", size: "M", quantity: 1 };
    });
    let pick = rand();
    let status = "delivered";
    for (const [key, weight] of statuses) {
      if (pick < weight) {
        status = key;
        break;
      }
      pick -= weight;
    }
    const age = Math.floor(rand() ** 1.6 * 44 * 10) / 10; // more recent orders than old
    const createdAt = new Date(now - age * DAY - Math.floor(rand() * 8) * 3600000).toISOString();
    const total = items.reduce((t, it) => t + it.price * it.quantity, 0);
    orders.push({
      _id: `demo-order-${String(i + 1).padStart(4, "0")}xxxxxxxxxx`,
      orderNumber: status === "pending" ? undefined : `AG-2026-${String(i + 1).padStart(4, "0")}`,
      customerName: name,
      customerEmail: email,
      customerPhone: `+234${Math.floor(7000000000 + rand() * 999999999)}`,
      shippingAddress: `${Math.floor(rand() * 90 + 1)} Adeola Odeku St, ${city}, ${country}`,
      items,
      totalAmount: total,
      paystackReference: `demo${i}ref${Math.floor(rand() * 1e6)}`,
      status,
      paymentMethod: status === "pending" ? undefined : { channel: channels[Math.floor(rand() * channels.length)] },
      createdAt,
      updatedAt: createdAt,
    });
  }

  return { orders, products };
}

// sample visitor numbers, shaped exactly like GET /api/analytics/summary
export function demoAnalytics(now = Date.now()) {
  const rand = rng(77);
  const key = (ms) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const days = {};
  let last7 = 0;
  let prev7 = 0;
  for (let i = 0; i < 15; i += 1) {
    const n = Math.round(120 + rand() * 160 + (i < 7 ? 30 : 0));
    days[key(now - i * DAY)] = n;
    if (i < 7) last7 += n;
    else if (i < 14) prev7 += n;
  }
  return {
    live: {
      last30: 68,
      perMinute: [22, 30, 14, 34, 18, 32, 20, 34, 10, 16, 8, 24, 12, 26, 14, 36, 22, 28, 12, 20, 30, 16, 34, 22, 26, 12, 30, 18, 36, 24],
    },
    days,
    last7: Math.round(last7 * 0.62), // distinct people are fewer than person-days
    prev7: Math.round(prev7 * 0.62),
  };
}
