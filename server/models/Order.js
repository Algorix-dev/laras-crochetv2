import mongoose from 'mongoose';

// TIP: orderItems store a snapshot of the product's name/price/color/size
// AT THE TIME OF PURCHASE, rather than just a reference to the Product.
// This matters: if Lara later changes a product's price, past orders
// shouldn't retroactively change — an order is a historical record.
const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        color: String,
        size: String,
        quantity: { type: Number, default: 1 },
      },
    ],
    totalAmount: { type: Number, required: true },
    // TIP: Paystack's own transaction reference — this is what you use
    // later to look up or verify a payment, and what powers order tracking.
    paystackReference: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
