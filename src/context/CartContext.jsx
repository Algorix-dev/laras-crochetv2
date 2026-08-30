/*
  TIP: This is a React Context — it's how we share "cart state" across
  the entire app without passing props down through every single component.
  Think of it like a global variable that React tracks, so when you add
  something to the bag on the product page, the navbar badge updates
  automatically, the drawer shows the item, and everything stays in sync.

  To use it anywhere:
    import { useCart } from '../context/CartContext';
    const { cartItems, addToBag, cartCount } = useCart();
*/
import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

/* -----------------------------------------------------------
   CartProvider wraps your app (in main.jsx) and provides the
   cart state to every component inside it.
----------------------------------------------------------- */
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  /* TIP: addToBag creates a unique ID from the product + all
     selected options. If the exact same variant already exists
     in the cart, it just bumps the quantity instead of adding
     a duplicate row. This is how "add the same thing twice"
     becomes "quantity: 2" instead of two separate cart items. */
  const addToBag = (product, selectedColor, selectedShade, selectedSize) => {
    const id = `${product.id}-${selectedColor}-${selectedShade}-${selectedSize}`;
    setCartItems((items) => {
      const existing = items.find((item) => item.id === id);
      if (existing) {
        return items.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...items,
        {
          product,
          quantity: 1,
          selectedColor,
          selectedShade,
          selectedSize,
          id,
        },
      ];
    });
  };

  const removeFromBag = (itemId) =>
    setCartItems((items) => items.filter((item) => item.id !== itemId));

  /* TIP: Math.max(1, qty) ensures quantity never drops below 1
     when the user clicks minus. To actually remove an item,
     they use the trash button which calls removeFromBag instead. */
  const updateQuantity = (itemId, qty) =>
    setCartItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, qty) }
          : item
      )
    );

  const clearCart = () => setCartItems([]);

  /* TIP: useMemo makes sure these derived values only recompute
     when cartItems actually changes — not on every render.
     cartCount = total number of items (for the badge).
     cartTotal = sum of (price × quantity) for every item. */
  const value = useMemo(
    () => ({
      cartItems,
      addToBag,
      removeFromBag,
      updateQuantity,
      clearCart,
      cartCount: cartItems.reduce((total, item) => total + item.quantity, 0),
      cartTotal: cartItems.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      ),
    }),
    [cartItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* -----------------------------------------------------------
   useCart is the hook you import in any component that needs
   cart access. It throws if you forget to wrap the app in
   CartProvider — that error saves you from hours of debugging
   "why is my cart null?"
----------------------------------------------------------- */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}