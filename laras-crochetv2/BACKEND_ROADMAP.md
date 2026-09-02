# Lara's Crochet — Backend Roadmap & Architecture

> **Status:** Backend API is ~70% built. Frontend is fully built but disconnected from backend.
> **Database:** MongoDB Atlas
> **Backend:** Node.js + Express (already in `server/`)
> **Frontend:** React + Vite (already built)

---

## What Already Exists (Backend)

| Feature | Status | Notes |
|---------|--------|-------|
| Customer OTP auth (email → code → verify) | ✅ Done | `server/routes/customerAuth.js` |
| Admin login (email/password + JWT) | ✅ Done | `server/routes/auth.js` |
| Product CRUD (admin-only) | ✅ Done | `server/routes/products.js` |
| Image upload → Cloudinary | ✅ Done | `server/routes/upload.js` |
| Order model | ✅ Done | `server/models/Order.js` |
| Payment init + verify (Paystack) | ✅ Done | `server/routes/payments.js` |
| Address CRUD (per customer) | ✅ Done | `server/routes/addresses.js` |
| Order history (per customer) | ✅ Done | `server/routes/orders.js` |
| Order tracking (public by reference) | ✅ Done | `server/routes/orders.js` |
| Admin order management | ✅ Done | `server/routes/orders.js` |

---

## What Needs to Be Built

### Phase 1: Connect Frontend to Backend (Critical)

#### 1.1 Products from API instead of hardcoded `products.js`
**What:** Replace the static `products` array with `fetch('/api/products')` calls.

**How:**
- Create a `src/api.js` helper file with typed fetch wrappers:
  ```js
  export async function getProducts(category = 'all') {
    const res = await fetch(`${API_URL}/api/products?category=${category}`);
    return res.json();
  }
  ```
- In `HomePage`, `ShopPage`, `ProductDetail` — replace the `import { products }` with a `useEffect` + `useState` fetch pattern.
- The backend returns `{ _id, name, price, category, images: [], colors, shades, sizes }` — the frontend needs to map `images[0]` → `product.image` for compatibility with `ProductCard`.
- **Hero section** will need a separate `hero` field on products, or a `GET /api/products/hero` endpoint that returns the featured product with its angles.

**Files to change:** `App.jsx`, `ShopPage.jsx`, `ProductDetail.jsx`, `Hero.jsx`, `ProductGrid.jsx`

#### 1.2 Checkout → Order Creation
**What:** The checkout page currently just shows a toast. It needs to:
1. Collect form data
2. Call `POST /api/payments/initialize` with cart items + customer info
3. Redirect to Paystack's `authorizationUrl`
4. After payment, Paystack redirects back → verify → show confirmation

**How:**
```
CheckoutPage form submit
  → POST /api/payments/initialize { customerName, customerEmail, customerPhone, shippingAddress, items }
  → response: { authorizationUrl }
  → window.location = authorizationUrl (redirects to Paystack)
  → After payment, Paystack redirects to /order-confirmation?reference=xxx
  → OrderConfirmationPage calls GET /api/payments/verify/:reference
  → Shows success/failure screen
```

**Files to change:** `CheckoutPage.jsx`, create `OrderConfirmationPage.jsx`, add route in `App.jsx`

#### 1.3 Sign In Page → Already Connected
The `SignInPage` already calls the backend OTP endpoints. Just needs `VITE_API_URL` in `.env.local`.

#### 1.4 Auth State Persistence
The `AuthContext` already saves user + token to localStorage. Need to:
- Add an `api.js` helper that attaches the JWT token to authenticated requests:
  ```js
  export async function authenticatedFetch(path, options = {}) {
    const token = localStorage.getItem('laras-token');
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }
  ```

---

### Phase 2: Admin Panel (Frontend)

**This is a separate React app or a protected section of the existing frontend.**

#### 2.1 Admin Dashboard Layout
- Login page (`/admin/login`) — email/password → JWT token
- Dashboard layout with sidebar:
  - **Orders** — list all orders, filter by status, update status
  - **Products** — list, create, edit, deactivate products
  - **Upload Images** — upload product photos to Cloudinary
  - **Customers** (optional) — view customer list

#### 2.2 Product Management
- **Create Product form:**
  - Name, price, category dropdown
  - Upload images (multipart → Cloudinary)
  - Colors (hex color picker or input)
  - Shades (hex color picker or input)
  - Sizes (checkboxes: XS, S, M, XL, XXL)
  - Description (textarea)
  - "Set as hero product" toggle
- **Edit Product** — same form, pre-filled
- **Product List** — table with image thumbnail, name, price, category, status, actions (edit/deactivate)

#### 2.3 Order Management
- **Order List** — table with order ID, customer name, email, total, status, date
- **Order Detail** — view items, shipping address, payment reference
- **Update Status** — dropdown to change: pending → paid → shipped → delivered → cancelled

#### 2.4 Admin Auth Flow
```
POST /api/auth/login { email, password }
  → { token, name, email }
  → save token to localStorage
  → all admin API calls include: Authorization: Bearer {token}
```

**Tech approach:** Build admin as pages under `/admin/*` routes in the same React app, protected by checking for an admin token in localStorage. Or build as a separate app — depends on whether Lara needs the admin panel to look like the storefront or be a plain CRUD interface.

---

### Phase 3: Enhanced Features

#### 3.1 Order Confirmation Page
- Route: `/order-confirmation`
- Reads `?reference=xxx` from URL
- Calls `GET /api/payments/verify/:reference`
- Shows order summary, reference number, estimated delivery
- Clear CTA: "Continue Shopping" + "Track Order"

#### 3.2 Order History Page (Connected to Backend)
- `OrderHistoryPage` currently shows placeholder data
- Connect to `GET /api/orders/mine` (requires customer JWT)
- Display orders with status badges, dates, totals
- "Track Order" button linking to `/order-confirmation?reference=xxx`

#### 3.3 Addresses Page (Connected to Backend)
- `AddressesPage` already exists — connect to `GET/POST/PUT/DELETE /api/account/addresses`
- Show saved addresses, add new, edit, delete, set default

#### 3.4 Newsletter Subscription Backend
- Simple MongoDB collection: `{ email, subscribedAt }`
- Endpoint: `POST /api/newsletter` — upsert email
- Or integrate with Mailchimp/Klaviyo API (Lara needs to choose provider)

#### 3.5 Google Sign-In
- Register app on Google Cloud Console → get Client ID
- Frontend: Google Identity Services (GIS) SDK
- Flow: Google button → ID token → `POST /api/auth/customer/google` → verify token → return JWT
- Backend needs a new route in `customerAuth.js`

#### 3.6 Product Reviews Backend
- New `Review` model: `{ product, customerEmail, rating, title, text, fit, verified }`
- Endpoints: `GET /api/products/:id/reviews`, `POST /api/reviews` (customer must be logged in)
- Admin: approve/delete reviews

---

### Phase 4: Polish & Production

#### 4.1 Email Notifications
Using `server/utils/email.js` (already set up):
- Order confirmation email (after payment verified)
- Order status change email (shipped, delivered)
- OTP code email (already done)

#### 4.2 Environment Variables
```env
# server/.env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
CLIENT_URL=https://larascrochet.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_SERVICE=...
EMAIL_API_KEY=...

# frontend/.env.local
VITE_API_URL=http://localhost:5000  (dev) / https://api.larascrochet.com (prod)
VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
```

#### 4.3 Deployment
- **Frontend:** Vercel or Netlify (Vite builds to static HTML)
- **Backend:** Render.com (free tier) or Railway (~$5/mo)
- **Database:** MongoDB Atlas (free tier M0)
- **Images:** Cloudinary (free tier — 25GB storage)

#### 4.4 CORS
- In production, lock `cors()` to `CLIENT_URL`:
  ```js
  app.use(cors({ origin: process.env.CLIENT_URL }));
  ```

#### 4.5 Security Checklist
- [x] JWT secrets in `.env`, not in code
- [x] Paystack secret key server-side only
- [x] Admin routes protected by `requireAdmin` middleware
- [x] Customer routes protected by `requireCustomer` middleware
- [ ] Rate limiting on OTP endpoints (prevent brute force)
- [ ] Input validation on all endpoints (use `zod` or `joi`)
- [ ] HTTPS everywhere (Vercel/Render handle this)
- [ ] Helmet.js for security headers

---

## Recommended Build Order

```
Week 1:
  1. Create src/api.js with fetch helpers
  2. Connect products from API (HomePage, ShopPage, ProductDetail)
  3. Wire up checkout → Paystack → OrderConfirmation page
  4. Test full purchase flow end-to-end

Week 2:
  5. Build admin login page
  6. Build admin product management (create/edit/list)
  7. Build admin order management (list/update status)
  8. Connect OrderHistoryPage & AddressesPage to backend

Week 3:
  9. Newsletter subscription
  10. Google Sign-In
  11. Email notifications (order confirmation)
  12. Deploy to production (Vercel + Render)
  13. Security hardening + testing
```

---

## API Endpoint Summary

### Public (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products?category=xxx` | List active products |
| GET | `/api/products/:id` | Single product detail |
| GET | `/api/orders/track/:reference` | Track order by reference |
| GET | `/api/payments/verify/:reference` | Verify Paystack payment |

### Customer Auth (`/api/auth/customer`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/request-code` | Send OTP to email |
| POST | `/verify-code` | Verify OTP, get JWT |

### Admin Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Admin login, get JWT |

### Admin-Protected (`requireAdmin` middleware)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Deactivate product |
| POST | `/api/upload` | Upload images to Cloudinary |
| GET | `/api/orders` | List all orders |
| PUT | `/api/orders/:id/status` | Update order status |

### Customer-Protected (`requireCustomer` middleware)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/orders/mine` | Customer's order history |
| GET | `/api/account/addresses` | List saved addresses |
| POST | `/api/account/addresses` | Add address |
| PUT | `/api/account/addresses/:id` | Edit address |
| DELETE | `/api/account/addresses/:id` | Delete address |

### Open (anyone, creates order)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/payments/initialize` | Create order + start Paystack checkout |

---

## Data Models

### User (Customer)
```js
{
  email: String (unique, required),
  username: String,
  loyaltyStatus: String,
  googleId: String,
  addresses: [AddressSchema],
  otpCode: String,
  otpExpiresAt: Date,
  createdAt, updatedAt
}
```

### AdminUser
```js
{
  email: String (unique, required),
  password: String (hashed with bcrypt),
  name: String,
  createdAt, updatedAt
}
```

### Product
```js
{
  name: String (required),
  price: Number (required, in Naira),
  category: Enum ['dresses','bikinis','two-pieces','shirts','skirts'],
  images: [String] (Cloudinary URLs),
  colors: [String] (hex codes),
  shades: [String] (hex codes),
  sizes: [String] (e.g. ['XS','S','M','XL','XXL']),
  stock: Number,
  description: String,
  isActive: Boolean,
  createdAt, updatedAt
}
```

### Order
```js
{
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  shippingAddress: String,
  items: [{ product, name, price, color, size, quantity }],
  totalAmount: Number,
  paystackReference: String (unique),
  status: Enum ['pending','paid','shipped','delivered','cancelled'],
  createdAt, updatedAt
}
```

---

## Key Decisions Made

1. **MongoDB over Supabase** — Since this is a custom backend (not just a database), MongoDB gives full control over business logic, payment verification, and email sending without being locked into Supabase's auth/email systems.

2. **OTP auth over password** — Matches the Figma design. No password to remember, no password reset flow needed. Simpler for customers.

3. **Paystack over Flutterwave** — Both are Nigerian, but Paystack has a cleaner API and better documentation. The backend is already wired for Paystack.

4. **Cloudinary for images** — Server disk is ephemeral (Render/Railway wipe on redeploy). Cloudinary handles image optimization, CDN delivery, and storage.

5. **Soft delete for products** — `isActive: false` instead of hard delete. Past orders still reference the product, and Lara can restore it.

6. **Order items snapshot** — Each order stores a copy of the product's name/price at purchase time. If Lara changes prices later, old orders stay accurate.