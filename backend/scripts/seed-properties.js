/**
 * One-off seed script. Creates demo properties owned by an existing seller.
 * Usage: node scripts/seed-properties.js <sellerEmail>
 */
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Property = require('../models/Property');

const SAMPLE = [
  {
    title: 'Modern Luxury Family Villa',
    description: 'Spacious villa with modern finishes, private garden and premium location. Close to schools and markets.',
    propertyType: 'house', purpose: 'sale', price: 28500000,
    location: 'F-7, Islamabad', city: 'Islamabad',
    area: 2400, areaUnit: 'sqft', bedrooms: 4, bathrooms: 3, parking: 2,
    yearBuilt: 2024, furnished: 'semi',
    features: ['Modern Kitchen', 'Balcony', 'Garden', 'Security'],
    amenities: ['AC', 'Heating', 'Internet', 'CCTV'],
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=75'],
    featured: true, isPublished: true, status: 'available',
  },
  {
    title: 'Luxury City Apartment',
    description: 'Bright apartment in a secure building with city views and modern amenities. Great for families.',
    propertyType: 'apartment', purpose: 'sale', price: 15900000,
    location: 'Gulberg III, Lahore', city: 'Lahore',
    area: 1650, areaUnit: 'sqft', bedrooms: 3, bathrooms: 2, parking: 1,
    yearBuilt: 2022, furnished: 'unfurnished',
    features: ['Modern Kitchen', 'Balcony'],
    amenities: ['AC', 'Internet', 'Security'],
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=75'],
    featured: false, isPublished: true, status: 'available',
  },
  {
    title: 'Elegant Family House',
    description: 'Elegant home with large living spaces and landscaped surroundings. Located in a premium block.',
    propertyType: 'house', purpose: 'sale', price: 42000000,
    location: 'DHA Phase 6, Karachi', city: 'Karachi',
    area: 3200, areaUnit: 'sqft', bedrooms: 5, bathrooms: 4, parking: 2,
    yearBuilt: 2021, furnished: 'unfurnished',
    features: ['Garden', 'Parking', 'Security'],
    amenities: ['Internet', 'CCTV'],
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=75'],
    featured: true, isPublished: true, status: 'available',
  },
  {
    title: 'Premium Commercial Office',
    description: 'Grade-A office space with modern infrastructure and central location in Blue Area, Islamabad.',
    propertyType: 'office', purpose: 'sale', price: 55000000,
    location: 'Blue Area, Islamabad', city: 'Islamabad',
    area: 5000, areaUnit: 'sqft', bedrooms: 0, bathrooms: 4, parking: 4,
    yearBuilt: 2020, furnished: 'furnished',
    features: ['Parking', 'Security'],
    amenities: ['AC', 'Internet', 'Elevator'],
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=75'],
    featured: false, isPublished: true, status: 'available',
  },
  {
    title: 'Residential Plot — Corner',
    description: 'Prime corner plot in a fast-developing sector. Ready for construction, utilities at boundary.',
    propertyType: 'plot', purpose: 'sale', price: 9800000,
    location: 'Bahria Town, Rawalpindi', city: 'Rawalpindi',
    area: 5400, areaUnit: 'sqft', bedrooms: 0, bathrooms: 0, parking: 0,
    furnished: 'unfurnished',
    features: [], amenities: ['Electricity', 'Water'],
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=75'],
    featured: false, isPublished: true, status: 'available',
  },
  {
    title: 'Retail Shop — Main Boulevard',
    description: 'High-visibility retail shop on a busy main boulevard. Ideal for branded outlets and businesses.',
    propertyType: 'shop', purpose: 'sale', price: 12500000,
    location: 'Johar Town, Lahore', city: 'Lahore',
    area: 900, areaUnit: 'sqft', bedrooms: 0, bathrooms: 1, parking: 1,
    yearBuilt: 2019, furnished: 'unfurnished',
    features: [], amenities: ['AC', 'Security'],
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=75'],
    featured: false, isPublished: true, status: 'pending',
  },
];

(async () => {
  const email = (process.argv[2] || '').toLowerCase();
  if (!email) { console.error('Usage: node scripts/seed-properties.js <sellerEmail>'); process.exit(1); }
  await connectDB();
  try {
    const seller = await User.findOne({ email });
    if (!seller) { console.error('[seed] No user with that email.'); process.exit(1); }
    if (!['seller', 'admin'].includes(seller.role)) {
      console.error('[seed] User must be seller or admin.'); process.exit(1);
    }
    for (const s of SAMPLE) {
      const exists = await Property.findOne({ title: s.title, owner: seller._id });
      if (!exists) await Property.create({ ...s, owner: seller._id });
    }
    console.log('[seed] Seeded properties for', seller.email);
    process.exit(0);
  } catch (err) {
    console.error('[seed] Failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
