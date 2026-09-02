import { Router } from 'express';
import User from '../models/User.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();
router.use(requireCustomer); // every route below requires a logged-in customer

// GET /api/account/addresses
router.get('/', async (req, res) => {
  const user = await User.findById(req.customerId);
  res.json(user.addresses);
});

// POST /api/account/addresses
router.post('/', async (req, res) => {
  const user = await User.findById(req.customerId);
  const { setDefault, ...addressData } = req.body;

  // TIP: if this new address is marked default, every OTHER address
  // needs isDefault flipped to false first — only one can be default
  // at a time. Doing that here keeps the invariant enforced in one
  // place instead of trusting every caller to remember it.
  if (setDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push({ ...addressData, isDefault: !!setDefault });
  await user.save();
  res.status(201).json(user.addresses);
});

// PUT /api/account/addresses/:addressId
router.put('/:addressId', async (req, res) => {
  const user = await User.findById(req.customerId);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ error: 'Address not found' });

  const { setDefault, ...addressData } = req.body;
  if (setDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  Object.assign(address, addressData, { isDefault: !!setDefault });
  await user.save();
  res.json(user.addresses);
});

// DELETE /api/account/addresses/:addressId
router.delete('/:addressId', async (req, res) => {
  const user = await User.findById(req.customerId);
  user.addresses.id(req.params.addressId)?.deleteOne();
  await user.save();
  res.json(user.addresses);
});

export default router;
