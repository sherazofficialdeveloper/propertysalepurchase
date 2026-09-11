/**
 * Seed script — inserts demo properties + creates the seller account.
 * Uses bcrypt to pre-hash the password (required by User model validation).
 * Run:  node scripts/seed-demo-properties.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Property = require('../models/Property');

const SELLER = {
  name: 'Sheraz Developer',
  email: 'sherazofficialdev@gmail.com',
  phone: '03486346858',
  password: 'seller123',
  role: 'seller',
};

const PROPERTIES = [
  { title: 'Modern Luxury Family Villa', description: 'Spacious villa with modern finishes, private garden and premium location. Close to schools and markets. Ideal for families looking for comfort and privacy.', propertyType: 'house', purpose: 'sale', price: 28500000, currency: 'PKR', location: 'F-7, Islamabad', city: 'Islamabad', area: 2400, areaUnit: 'sqft', bedrooms: 4, bathrooms: 3, parking: 2, yearBuilt: 2024, furnished: 'semi', constructionStatus: 'Completed', features: ['Modern Kitchen', 'Balcony', 'Garden', 'Security'], amenities: ['AC', 'Heating', 'Internet', 'CCTV'], images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=75'], featured: true, isPublished: true, status: 'available' },
  { title: 'Luxury City Apartment', description: 'Bright apartment in a secure building with city views and modern amenities. Great for families and professionals working nearby.', propertyType: 'apartment', purpose: 'sale', price: 15900000, currency: 'PKR', location: 'Gulberg III, Lahore', city: 'Lahore', area: 1650, areaUnit: 'sqft', bedrooms: 3, bathrooms: 2, parking: 1, yearBuilt: 2022, furnished: 'unfurnished', constructionStatus: 'Completed', features: ['Modern Kitchen', 'Balcony'], amenities: ['AC', 'Internet', 'Security'], images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=75'], featured: false, isPublished: true, status: 'available' },
  { title: 'Elegant Family House', description: 'Elegant home with large living spaces and landscaped surroundings. Located in a premium block with easy access to schools and markets.', propertyType: 'house', purpose: 'sale', price: 42000000, currency: 'PKR', location: 'DHA Phase 6, Karachi', city: 'Karachi', area: 3200, areaUnit: 'sqft', bedrooms: 5, bathrooms: 4, parking: 2, yearBuilt: 2021, furnished: 'unfurnished', constructionStatus: 'Completed', features: ['Garden', 'Parking', 'Security'], amenities: ['Internet', 'CCTV'], images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=75'], featured: true, isPublished: true, status: 'available' },
  { title: 'Premium Commercial Office', description: 'Grade-A office space with modern infrastructure and central location in Blue Area, Islamabad. Suitable for corporate headquarters.', propertyType: 'office', purpose: 'sale', price: 55000000, currency: 'PKR', location: 'Blue Area, Islamabad', city: 'Islamabad', area: 5000, areaUnit: 'sqft', bedrooms: 0, bathrooms: 4, parking: 4, yearBuilt: 2020, furnished: 'furnished', constructionStatus: 'Completed', features: ['Parking', 'Security'], amenities: ['AC', 'Internet', 'Elevator'], images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=75'], featured: false, isPublished: true, status: 'available' },
  { title: 'Residential Plot — Corner', description: 'Prime corner plot in a fast-developing sector. Ready for construction with utilities available at the boundary.', propertyType: 'plot', purpose: 'sale', price: 9800000, currency: 'PKR', location: 'Bahria Town, Rawalpindi', city: 'Rawalpindi', area: 5400, areaUnit: 'sqft', bedrooms: 0, bathrooms: 0, parking: 0, yearBuilt: null, furnished: 'unfurnished', constructionStatus: 'Plot', features: [], amenities: ['Electricity', 'Water'], images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=75'], featured: false, isPublished: true, status: 'available' },
  { title: 'Retail Shop — Main Boulevard', description: 'High-visibility retail shop on a busy main boulevard. Ideal for branded outlets and businesses looking for prime frontage.', propertyType: 'shop', purpose: 'sale', price: 12500000, currency: 'PKR', location: 'Johar Town, Lahore', city: 'Lahore', area: 900, areaUnit: 'sqft', bedrooms: 0, bathrooms: 1, parking: 1, yearBuilt: 2019, furnished: 'unfurnished', constructionStatus: 'Completed', features: [], amenities: ['AC', 'Security'], images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=75'], featured: false, isPublished: true, status: 'pending' },
  { title: 'Sea-View Modern Apartment', description: 'Fully furnished apartment with panoramic sea views, modern interiors and premium building amenities. Ideal for executives.', propertyType: 'apartment', purpose: 'sale', price: 33000000, currency: 'PKR', location: 'Clifton Block 5, Karachi', city: 'Karachi', area: 2100, areaUnit: 'sqft', bedrooms: 3, bathrooms: 3, parking: 2, yearBuilt: 2023, furnished: 'furnished', constructionStatus: 'Completed', features: ['Balcony', 'Security'], amenities: ['AC', 'Internet', 'CCTV'], images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=75'], featured: true, isPublished: true, status: 'available' },
  { title: 'Traditional Family Home', description: 'Classic family home in a well-established neighbourhood. Solid construction, generous room sizes and mature trees.', propertyType: 'house', purpose: 'sale', price: 21500000, currency: 'PKR', location: 'Model Town, Lahore', city: 'Lahore', area: 2800, areaUnit: 'sqft', bedrooms: 4, bathrooms: 3, parking: 2, yearBuilt: 2015, furnished: 'unfurnished', constructionStatus: 'Completed', features: ['Garden', 'Parking'], amenities: ['Gas', 'Water'], images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=75'], featured: false, isPublished: true, status: 'sold' },
  { title: 'Commercial Plaza Floor', description: 'Full commercial floor suitable for corporate offices or showrooms. Central location with high footfall and dedicated parking.', propertyType: 'commercial', purpose: 'sale', price: 47000000, currency: 'PKR', location: 'Saddar, Rawalpindi', city: 'Rawalpindi', area: 4200, areaUnit: 'sqft', bedrooms: 0, bathrooms: 3, parking: 3, yearBuilt: 2018, furnished: 'unfurnished', constructionStatus: 'Completed', features: ['Parking'], amenities: ['AC', 'Security', 'Elevator'], images: ['https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=75'], featured: false, isPublished: true, status: 'available' },
  { title: 'Luxury Villa with Pool', description: 'Premium villa with private pool, home theatre and landscaped gardens. A rare offering in one of the most prestigious sectors.', propertyType: 'house', purpose: 'sale', price: 78000000, currency: 'PKR', location: 'DHA Phase 2, Islamabad', city: 'Islamabad', area: 4800, areaUnit: 'sqft', bedrooms: 6, bathrooms: 5, parking: 3, yearBuilt: 2024, furnished: 'furnished', constructionStatus: 'Completed', features: ['Garden', 'Balcony', 'Security', 'Parking'], amenities: ['AC', 'Heating', 'Internet', 'CCTV'], images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=75'], featured: true, isPublished: true, status: 'available' },
  { title: 'Compact Studio Apartment', description: 'Ideal starter apartment in a secure, well-serviced community. Compact layout, fully furnished and ready to move in.', propertyType: 'apartment', purpose: 'sale', price: 6500000, currency: 'PKR', location: 'Bahria Heights, Islamabad', city: 'Islamabad', area: 620, areaUnit: 'sqft', bedrooms: 1, bathrooms: 1, parking: 1, yearBuilt: 2022, furnished: 'furnished', constructionStatus: 'Completed', features: ['Balcony'], amenities: ['AC', 'Internet'], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=75'], featured: false, isPublished: true, status: 'available' },
  { title: 'Agricultural Land', description: 'Fertile agricultural land with canal access and road frontage. Suitable for farming or long-term investment.', propertyType: 'plot', purpose: 'sale', price: 14200000, currency: 'PKR', location: 'Multan Road, Multan', city: 'Multan', area: 43560, areaUnit: 'sqft', bedrooms: 0, bathrooms: 0, parking: 0, yearBuilt: null, furnished: 'unfurnished', constructionStatus: 'Plot', features: [], amenities: ['Water'], images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=75'], featured: false, isPublished: true, status: 'available' },
  { title: 'Executive Penthouse', description: 'Top-floor penthouse with private terrace and skyline views. Exclusive, fully furnished and located in a premium building.', propertyType: 'apartment', purpose: 'sale', price: 95000000, currency: 'PKR', location: 'Clifton Block 2, Karachi', city: 'Karachi', area: 3800, areaUnit: 'sqft', bedrooms: 4, bathrooms: 4, parking: 3, yearBuilt: 2023, furnished: 'furnished', constructionStatus: 'Completed', features: ['Balcony', 'Security'], amenities: ['AC', 'Internet', 'Elevator', 'CCTV'], images: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=75'], featured: true, isPublished: true, status: 'available' },
  { title: 'Investment Plot', description: 'Well-located residential plot ideal for long-term investment. Development in progress in surrounding sectors.', propertyType: 'plot', purpose: 'sale', price: 8900000, currency: 'PKR', location: 'DHA City, Karachi', city: 'Karachi', area: 3600, areaUnit: 'sqft', bedrooms: 0, bathrooms: 0, parking: 0, yearBuilt: null, furnished: 'unfurnished', constructionStatus: 'Plot', features: [], amenities: ['Electricity', 'Water'], images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=75'], featured: false, isPublished: true, status: 'available' },
  { title: 'Furnished Office Suite', description: 'Turn-key office suite ready for immediate occupation. Modern fit-out with meeting rooms, kitchenette and dedicated parking.', propertyType: 'office', purpose: 'sale', price: 28900000, currency: 'PKR', location: 'F-8, Islamabad', city: 'Islamabad', area: 2200, areaUnit: 'sqft', bedrooms: 0, bathrooms: 2, parking: 2, yearBuilt: 2021, furnished: 'furnished', constructionStatus: 'Completed', features: ['Parking', 'Security'], amenities: ['AC', 'Internet', 'Elevator'], images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=75'], featured: false, isPublished: true, status: 'available' },
];

(async () => {
  await connectDB();
  try {
    let seller = await User.findOne({ email: SELLER.email.toLowerCase() });
    if (!seller) {
      // Pre-hash: bypasses the model's `minlength: 60` validation cleanly.
      const hashed = await bcrypt.hash(SELLER.password, 10);
      seller = await User.create({
        name: SELLER.name,
        email: SELLER.email.toLowerCase(),
        phone: SELLER.phone,
        password: hashed,
        role: SELLER.role,
      });
      console.log(`[seed] ✅ Created seller: ${seller.email}`);
      console.log(`       Password (plain): ${SELLER.password}`);
    } else {
      console.log(`[seed] ℹ️  Seller already exists: ${seller.email}`);
    }

    let created = 0, skipped = 0;
    for (const p of PROPERTIES) {
      const exists = await Property.findOne({ title: p.title, owner: seller._id });
      if (exists) { skipped++; continue; }
      await Property.create({ ...p, owner: seller._id });
      created++;
    }

    const totalSeller = await Property.countDocuments({ owner: seller._id });
    const totalAll = await Property.countDocuments({});

    console.log(`\n[seed] ═══════════════════════════════════════`);
    console.log(`   Properties created:   ${created}`);
    console.log(`   Properties skipped:   ${skipped}`);
    console.log(`   Total for seller:     ${totalSeller}`);
    console.log(`   Total in DB:          ${totalAll}`);
    console.log(`\n   Seller login →`);
    console.log(`     Email:    ${SELLER.email}`);
    console.log(`     Password: ${SELLER.password}`);
    console.log(`     Phone:    ${SELLER.phone}`);
    console.log(`\n   Database: ${mongoose.connection.name}`);
    console.log(`   Host:     ${mongoose.connection.host}`);
    console.log(`[seed] ═══════════════════════════════════════`);
    process.exit(0);
  } catch (err) {
    console.error('[seed] ❌ Failed:', err.message);
    if (err.errors) {
      for (const k of Object.keys(err.errors)) console.error(`  - ${k}: ${err.errors[k].message}`);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
