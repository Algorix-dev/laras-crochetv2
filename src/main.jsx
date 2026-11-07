/*
  TIP: This is the entry point of the entire app. React mounts
  into the <div id="root"> that lives in index.html.

  The component tree wraps top-to-bottom:
    StrictMode → BrowserRouter → CartProvider → App

  BrowserRouter must wrap the app BEFORE any component uses
  <Link> or useParams(). CartProvider must wrap the app BEFORE
  any component calls useCart(). The order matters — if you
  swap them, you'll get "useParams must be used within Router"
  errors that are confusing to debug.
*/
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import { BrandProvider } from './BrandProvider.jsx';
import { getProducts, warmProductImages } from './api.js';

// TIP: start loading the products NOW (this also wakes the server if it was asleep) instead of waiting
// for the page to draw first. Everything that later asks for products shares this same request.
getProducts().then((list) => warmProductImages(list)).catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <BrandProvider><CurrencyProvider><WishlistProvider><CartProvider>
        <App />
      </CartProvider></WishlistProvider></CurrencyProvider></BrandProvider>
    </BrowserRouter>
  </StrictMode>
);