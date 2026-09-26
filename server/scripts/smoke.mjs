/* Smoke test: exercise the same query patterns the app uses against the DB server. */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import MenuItem from '../src/models/MenuItem.js';
import Order from '../src/models/Order.js';
import DeliveryZone from '../src/models/DeliveryZone.js';

const uri = 'mongodb://127.0.0.1:27017/smoke_test';
await mongoose.connect(uri);
console.log('connected');

// 1. insert + unique-ish email lookup
const u = await User.create({
  name: 'Test User',
  email: 'test@example.com',
  phone: '9876543210',
  password: 'secret123',
  isFirstOrder: true,
  addresses: [{ label: 'Home', line1: '12 Temple St', city: 'Chennai', pincode: '600004', isDefault: true }],
});
console.log('user created', String(u._id), 'password hashed:', u.password.startsWith('$2'));

const found = await User.findOne({ email: 'test@example.com' }).select('+password');
console.log('findOne + select:', found && (await found.comparePassword('secret123')) ? 'OK' : 'FAIL');

// 2. subdocument ops (address push / delete / save)
u.addresses.push({ label: 'Work', line1: '2 MG Road', city: 'Chennai', pincode: '600002' });
await u.save();
console.log('address push+save:', u.addresses.length === 2 ? 'OK' : 'FAIL');
u.addresses.id(u.addresses[1]._id).deleteOne();
await u.save();
console.log('subdoc delete:', u.addresses.length === 1 ? 'OK' : 'FAIL');

// 3. menu items + category query + sort
await MenuItem.insertMany([
  { name: 'Idli', description: '2 pcs', price: 40, category: 'morning', isVeg: true, isPopular: true, image: '/x.jpg' },
  { name: 'Chicken Biryani', description: 'spicy', price: 150, category: 'afternoon', isVeg: false },
  { name: 'Parotta', description: '2 pcs + salna', price: 50, category: 'dinner', isVeg: true },
]);
const morning = await MenuItem.find({ category: 'morning', available: true }).sort({ category: 1, name: 1 });
console.log('find+sort:', morning.length === 1 ? 'OK' : 'FAIL', morning.map((m) => m.name));

// 4. order create (pre-validate hook computing estimatedAt)
const items = await MenuItem.find({});
const order = await Order.create({
  user: u._id,
  items: items.map((m) => ({ menuItem: m._id, name: m.name, price: m.price, qty: 2, image: m.image, isVeg: m.isVeg })),
  subtotal: 480, discount: 48, deliveryFee: 20, total: 452,
  isFirstOrderDiscount: true,
  deliveryAddress: { line1: '12 Temple St', city: 'Chennai', pincode: '600004', phone: '9876543210' },
  status: 'placed',
  statusHistory: [{ status: 'placed', by: u._id }],
  paymentMethod: 'razorpay', paymentStatus: 'pending',
});
console.log('order create + estimatedAt:', order.estimatedAt ? 'OK' : 'FAIL', order.estimatedAt?.toISOString());

// 5. conditional update (first-order flag consumption)
const r = await User.updateOne({ _id: u._id, isFirstOrder: true }, { $set: { isFirstOrder: false } });
console.log('conditional updateOne:', r.modifiedCount === 1 ? 'OK' : 'FAIL');

// 6. staff list: find().sort().limit().populate()
const orders = await Order.find({}).sort({ createdAt: -1 }).limit(50).populate('user', 'name phone email');
console.log('populate:', orders[0].user?.name === 'Test User' ? 'OK' : 'FAIL');

// 7. findByIdAndUpdate (status update style)
order.statusHistory.push({ status: 'confirmed', at: new Date(), by: u._id });
order.status = 'confirmed';
await order.save();
const updated = await Order.findByIdAndUpdate(order._id, { status: 'preparing' }, { new: true });
console.log('findByIdAndUpdate:', updated.status === 'preparing' ? 'OK' : 'FAIL');

// 8. $in query (menu resolution by ids)
const ids = items.map((i) => i._id);
const docs = await MenuItem.find({ _id: { $in: ids }, available: true });
console.log('$in query:', docs.length === 3 ? 'OK' : 'FAIL');

// 9. count via countDocuments
const n = await Order.countDocuments({ user: u._id });
console.log('countDocuments:', n === 1 ? 'OK' : 'FAIL');

// 10. deleteOne on cart style + unique-ish email clash check
const clash = await User.findOne({ email: 'test@example.com', _id: { $ne: u._id } });
console.log('clash lookup ($ne):', clash === null ? 'OK' : 'FAIL');

// 11. DeliveryZone array containment (pincodes: '600004')
await DeliveryZone.create({ name: 'Central Chennai', pincodes: ['600001', '600004'], fee: 20 });
const zone = await DeliveryZone.findOne({ active: true, pincodes: '600004' });
console.log('array containment query:', zone?.fee === 20 ? 'OK' : 'FAIL');

// 12. regex validation path (invalid pincode should fail validation)
let invalidCaught = false;
try {
  await User.create({ name: 'X', email: 'x@y.com', phone: '9876543210', password: 'abcdef', addresses: [{ line1: 'a', pincode: 'abc' }] });
} catch (e) {
  invalidCaught = e.name === 'ValidationError';
}
console.log('schema validation:', invalidCaught ? 'OK' : 'FAIL');

// 13. toJSON strips password
console.log('toJSON no password:', u.toJSON().password === undefined ? 'OK' : 'FAIL');

// 14. persistence check: drop & reconnect handled by another run; verify indexes command tolerated
const coll = mongoose.connection.db.collection('users');
try {
  await coll.createIndex({ email: 1 }, { unique: true });
  console.log('createIndex: OK');
} catch (e) {
  console.log('createIndex: tolerated error ->', e.message.slice(0, 80));
}

await mongoose.disconnect();
console.log('ALL DONE');
