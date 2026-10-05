const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./src/models/User');
require('dotenv').config();

// Random per-user passwords — a hardcoded shared password in the
// repo is a standing credential leak. Each seeded user gets a
// unique 16-character password printed once at seed time.
function randomPassword() {
  return crypto.randomBytes(12).toString('hex')
}

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/electro-infinity');

    const users = [
      {
        name: 'Test Student',
        rollNumber: 'STUDENT123',
        email: 'student@gmail.com',
        role: 'student',
        batch: '2027',
        semester: 3,
      },
      {
        name: 'Sumith',
        rollNumber: 'SUMITH4002',
        email: 'heyysumith@gmail.com',
        role: 'student',
        batch: '2027',
        semester: 3,
      },
      {
        name: 'Test CR',
        rollNumber: 'CR123',
        email: 'cr@gmail.com',
        role: 'cr',
        batch: '2027',
        semester: 3,
      },
      {
        name: 'Test Admin',
        rollNumber: 'ADMIN123',
        email: 'admin@gmail.com',
        role: 'admin',
        isVerified: true,
      },
      {
        name: 'Test Faculty',
        rollNumber: 'FACULTY123',
        email: 'faculty@gmail.com',
        role: 'faculty',
        isVerified: true,
      },
    ];

    const credentials = [];
    for (const spec of users) {
      const password = randomPassword();
      const created = await User.create({ ...spec, password });
      credentials.push({ label: spec.name, identifier: spec.rollNumber || spec.email, password });
    }

    console.log('--- TEST USERS CREATED SUCCESSFULLY ---');
    console.log('Each user received a unique random password (shown once):');
    for (const cred of credentials) {
      console.log(`- ${cred.label} (${cred.identifier}): ${cred.password}`);
    }
    console.log('Change these passwords after first login.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
