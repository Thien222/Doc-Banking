// database-cleanup.js - Script để clean up invalid dates trong database
const mongoose = require('mongoose');
const HoSo = require('./models/HoSo'); // Adjust path as needed

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';

async function cleanupDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🧹 Starting database cleanup...');

    // Method 1: Use the static method we defined in the model
    const cleanedCount = await HoSo.cleanInvalidDates();

    // Method 2: Additional cleanup for other edge cases
    console.log('🔍 Checking for other date issues...');

    // Find documents where ngayGiaiNgan is string 'Invalid Date'
    const invalidStringDates = await HoSo.find({
      ngayGiaiNgan: 'Invalid Date'
    });

    if (invalidStringDates.length > 0) {
      console.log(`🧹 Found ${invalidStringDates.length} documents with string 'Invalid Date'`);
      await HoSo.updateMany(
        { ngayGiaiNgan: 'Invalid Date' },
        { $unset: { ngayGiaiNgan: 1 } }
      );
      console.log('✅ Cleaned string Invalid Date documents');
    }

    // Find documents where ngayGiaiNgan is empty string
    const emptyStringDates = await HoSo.find({
      ngayGiaiNgan: ''
    });

    if (emptyStringDates.length > 0) {
      console.log(`🧹 Found ${emptyStringDates.length} documents with empty string dates`);
      await HoSo.updateMany(
        { ngayGiaiNgan: '' },
        { $unset: { ngayGiaiNgan: 1 } }
      );
      console.log('✅ Cleaned empty string date documents');
    }

    // Verify cleanup
    console.log('🔍 Verifying cleanup...');
    const remainingIssues = await HoSo.find({
      $or: [
        { ngayGiaiNgan: 'Invalid Date' },
        { ngayGiaiNgan: '' },
        { ngayGiaiNgan: { $type: 'string' } } // Any remaining string dates
      ]
    });

    if (remainingIssues.length > 0) {
      console.log('⚠️ Found remaining date issues:', remainingIssues.length);
      for (const doc of remainingIssues) {
        console.log(`- Document ${doc._id}: ngayGiaiNgan = ${doc.ngayGiaiNgan} (${typeof doc.ngayGiaiNgan})`);
      }
    } else {
      console.log('✅ No remaining date issues found');
    }

    // Statistics
    const totalDocs = await HoSo.countDocuments();
    const docsWithDates = await HoSo.countDocuments({
      ngayGiaiNgan: { $exists: true, $ne: null }
    });
    const docsWithValidDates = await HoSo.countDocuments({
      ngayGiaiNgan: { $type: 'date' }
    });

    console.log('📊 Cleanup Statistics:');
    console.log(`- Total documents: ${totalDocs}`);
    console.log(`- Documents with ngayGiaiNgan: ${docsWithDates}`);
    console.log(`- Documents with valid dates: ${docsWithValidDates}`);
    console.log(`- Cleaned documents: ${cleanedCount + invalidStringDates.length + emptyStringDates.length}`);

    console.log('✅ Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Database cleanup error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupDatabase();
}

module.exports = cleanupDatabase;
