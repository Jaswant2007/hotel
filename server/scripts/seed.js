/**
 * Seed database with menu items, delivery zones and a staff account.
 * Safe to re-run: upserts menu items by name, staff by email.
 *
 * PRICES ARE CHENNAI-AREA PRICING — confirm before going live.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import MenuItem from '../src/models/MenuItem.js';
import DeliveryZone from '../src/models/DeliveryZone.js';
import User from '../src/models/User.js';

const MENU = [
  // ---------- Morning ----------
  { name: 'Idli (2pcs)', category: 'morning', price: 40, isVeg: true, isPopular: true, image: '/images/dishes/idli.jpg',
    description: 'Soft steamed rice cakes served with coconut chutney and hot sambar.' },
  { name: 'Vada (2pcs)', category: 'morning', price: 35, isVeg: true, isPopular: true, image: '/images/dishes/vada.jpg',
    description: 'Crispy medu vada, golden fried — best dipped in sambar.' },
  { name: 'Plain Dosa', category: 'morning', price: 50, isVeg: true, image: '/images/dishes/dosa.jpg',
    description: 'Thin, crispy dosa roasted on a hot tawa with chutney and sambar.' },
  { name: 'Masala Dosa', category: 'morning', price: 70, isVeg: true, isPopular: true, image: '/images/dishes/dosa.jpg',
    description: 'Classic dosa stuffed with spiced potato masala, served with three chutneys.' },
  { name: 'Pongal', category: 'morning', price: 50, isVeg: true, image: '/images/dishes/pongal.jpg',
    description: 'Ven pongal — peppered rice and lentil comfort food with ghee, gingelly oil oggarane.' },
  { name: 'Upma', category: 'morning', price: 40, isVeg: true, image: '/images/dishes/upma.jpg',
    description: 'Rava upma with mustard, curry leaves and a hint of ginger.' },
  { name: 'Poori + Kurma', category: 'morning', price: 50, isVeg: true, image: '/images/dishes/poori.jpg',
    description: 'Two puffed pooris with fragrant coconut kurma.' },
  { name: 'Filter Coffee', category: 'morning', price: 20, isVeg: true, isPopular: true, image: '/images/dishes/filter-coffee.jpg',
    description: 'Strong degree coffee brewed the traditional filter way — 60ml of pure energy.' },

  // ---------- Afternoon ----------
  { name: 'Full Meals', category: 'afternoon', price: 90, isVeg: true, isPopular: true, image: '/images/dishes/meals.jpg',
    description: 'Unlimited rice with sambar, rasam, kootu, poriyal, curd, pickle, appalam and dessert.' },
  { name: 'Mini Meals', category: 'afternoon', price: 70, isVeg: true, image: '/images/dishes/meals.jpg',
    description: 'A lighter portion of the full meals — rice, sambar, one veg, rasam and curd.' },
  { name: 'Curd Rice', category: 'afternoon', price: 50, isVeg: true, image: '/images/dishes/rice.jpg',
    description: 'Cooling curd rice with pomegranate, ginger and a tempering of mustard and curry leaves.' },
  { name: 'Lemon Rice', category: 'afternoon', price: 50, isVeg: true, image: '/images/dishes/rice.jpg',
    description: 'Tangy lemon rice with peanuts, chana dal and curry leaves.' },
  { name: 'Veg Biryani', category: 'afternoon', price: 110, isVeg: true, image: '/images/dishes/veg-biryani.jpg',
    description: 'Seeraga samba rice biryani with seasonal vegetables, raita on the side.' },
  { name: 'Chicken Biryani', category: 'afternoon', price: 150, isVeg: false, isPopular: true, image: '/images/dishes/chicken-biryani.jpg',
    description: 'Dum-cooked Chicken biryani with tender pieces, fried onion and raitha.' },
  { name: 'Rasam Rice', category: 'afternoon', price: 50, isVeg: true, image: '/images/dishes/rice.jpg',
    description: 'Steamed rice drowned in hot pepper-tamarind rasam with a spoon of ghee.' },

  // ---------- Dinner ----------
  { name: 'Parotta + Salna (2pcs)', category: 'dinner', price: 50, isVeg: true, isPopular: true, image: '/images/dishes/parotta.jpg',
    description: 'Flaky layered parottas with a rich, spicy salna gravy.' },
  { name: 'Kothu Parotta', category: 'dinner', price: 100, isVeg: false, image: '/images/dishes/kothu.jpg',
    description: 'Parotta minced on the hot tawa with egg, onions and salna — the street-side classic.' },
  { name: 'Chapati + Kurma', category: 'dinner', price: 60, isVeg: true, image: '/images/dishes/poori.jpg',
    description: 'Soft whole-wheat chapatis with coconut kurma.' },
  { name: 'Chicken Chettinad', category: 'dinner', price: 180, isVeg: false, isPopular: true, image: '/images/dishes/chettinad-chicken.jpg',
    description: 'Fiery Chettinad chicken roasted with freshly ground masala — our signature dish.' },
  { name: 'Egg Curry', category: 'dinner', price: 70, isVeg: false, image: '/images/dishes/egg-curry.jpg',
    description: 'Boiled eggs simmered in a thick onion-tomato gravy.' },
  { name: 'Fish Fry', category: 'dinner', price: 150, isVeg: false, image: '/images/dishes/fish-fry.jpg',
    description: 'Seer fish slices marinated in chilli and turmeric, shallow fried till crisp.' },
];

const ZONES = [
  { name: 'Central Chennai (flat ₹20)', pincodes: ['600001', '600002', '600003', '600004', '600005', '600006'], fee: 20, active: true },
  { name: 'Greater Chennai (₹30)', pincodes: ['600016', '600017', '600020', '600028', '600029', '600032', '600039', '600040', '600041'], fee: 30, active: true },
  { name: 'Nearby areas (₹40)', pincodes: ['600044', '600045', '600048', '600050', '600058', '600059', '600061', '600063'], fee: 40, active: true },
];

async function run() {
  await connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hotel_sri_vari');

  // Menu (upsert by name)
  for (const item of MENU) {
    await MenuItem.updateOne({ name: item.name }, { $set: { ...item, available: true } }, { upsert: true });
  }
  console.log(`✅ Menu seeded: ${MENU.length} items`);

  // Delivery zones (replace all)
  await DeliveryZone.deleteMany({});
  await DeliveryZone.insertMany(ZONES);
  console.log(`✅ Delivery zones seeded: ${ZONES.length}`);

  // Staff account
  const staffEmail = 'staff@hotelsrivar.com';
  let staff = await User.findOne({ email: staffEmail });
  if (!staff) {
    staff = await User.create({
      name: 'Hotel Staff',
      email: staffEmail,
      phone: '9840012345',
      password: 'staff123',
      role: 'staff',
      isFirstOrder: false,
      addresses: [],
    });
    console.log(`✅ Staff account created: ${staffEmail} / staff123`);
  } else {
    console.log(`ℹ️ Staff account already exists: ${staffEmail}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
