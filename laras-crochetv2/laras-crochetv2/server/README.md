# Lara's Crochet — Backend

## What this is
Express API + MongoDB backend, providing:
- Product CRUD (public read, admin-protected write) — powers the future admin dashboard
- Admin authentication (JWT-based login)
- Product photo uploads via Cloudinary
- Order storage
- Paystack payment initialization + verification
- Order tracking by reference number (public lookup)

## Setup

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Create a free MongoDB Atlas cluster** at mongodb.com/atlas, get your connection string.

3. **Create a free Cloudinary account** at cloudinary.com, get your cloud name / API key / API secret from the dashboard.

4. **Get your Paystack test secret key** from your Paystack dashboard (Settings → API Keys) — use the TEST key (`sk_test_...`) until you're ready to go live.

5. **Copy the env template and fill in your real values:**
   ```bash
   cp .env.example .env
   ```

6. **Create the first admin login:**
   Edit the email/password in `seedAdmin.js`, then run:
   ```bash
   node seedAdmin.js
   ```

7. **Start the server:**
   ```bash
   npm run dev
   ```
   Should print `MongoDB connected` then `Server running on port 5000`.

## API overview

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/login | — | Admin login, returns a JWT |
| GET | /api/products | — | List products (storefront) |
| GET | /api/products/:id | — | Single product |
| POST | /api/products | admin | Create product |
| PUT | /api/products/:id | admin | Edit product |
| DELETE | /api/products/:id | admin | Deactivate product |
| POST | /api/upload | admin | Upload product photos |
| POST | /api/payments/initialize | — | Start a Paystack checkout |
| GET | /api/payments/verify/:reference | — | Confirm a payment went through |
| GET | /api/orders/track/:reference | — | Customer order tracking lookup |
| GET | /api/orders | admin | Full order list |
| PUT | /api/orders/:id/status | admin | Update order status |

## Note on this being a separate app from the frontend
This lives in its own `server/` folder with its own `package.json` and `node_modules` on purpose — it's a
completely separate Node app from the React frontend in the repo root, and needs to be deployed to its own
host (e.g. Render or Railway), not the static host the frontend uses (e.g. Vercel/Netlify).
