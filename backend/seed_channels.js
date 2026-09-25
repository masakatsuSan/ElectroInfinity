const mongoose = require('mongoose');
const Channel = require('./src/models/Channel');
const User = require('./src/models/User');
require('dotenv').config();

const DEFAULT_CHANNELS = [
  { name: 'announcements', category: 'ANNOUNCEMENTS', description: 'Official announcements and important updates', isReadOnly: true, postRoles: ['admin', 'super_admin', 'faculty'] },
  { name: 'general', category: 'GENERAL', description: 'Open discussions for all batches and topics', isReadOnly: false },
  { name: 'introduction', category: 'GENERAL', description: 'Introduce yourself to the community', isReadOnly: false },
  { name: 'linkedin-resume', category: 'GENERAL', description: 'Share LinkedIn posts and resumes', isReadOnly: false },
  { name: 'sem-5-doubts', category: 'ACADEMICS', description: 'Semester 5 doubts and study discussions', isReadOnly: false },
  { name: 'pyq-requests', category: 'ACADEMICS', description: 'Request and share previous year questions', isReadOnly: false },
  { name: 'deadlines', category: 'ACADEMICS', description: 'Important academic deadlines', isReadOnly: false },
  { name: 'dsa-practice', category: 'CODING & PLACEMENTS', description: 'Data structures and algorithms practice', isReadOnly: false },
  { name: 'interview-prep', category: 'CODING & PLACEMENTS', description: 'Interview preparation discussions', isReadOnly: false },
  { name: 'hackathons', category: 'CODING & PLACEMENTS', description: 'Hackathons and coding competitions', isReadOnly: false },
];

async function seedChannels() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/electro-infinity');
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ role: 'super_admin' }) || await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin user found. Please run seed_users.js first.');
      process.exit(1);
    }

    let order = 0;
    for (const ch of DEFAULT_CHANNELS) {
      const existing = await Channel.findOne({ slug: ch.name });
      if (!existing) {
        await Channel.create({
          ...ch,
          createdBy: admin._id,
          allowedRoles: ['student', 'cr', 'admin', 'super_admin', 'faculty'],
          order: order++,
        });
        console.log(`Created channel: #${ch.name} (${ch.category})`);
      } else {
        console.log(`Channel already exists: #${ch.name}`);
      }
    }

    console.log('Channel seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedChannels();
