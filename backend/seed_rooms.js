const mongoose = require('mongoose');
const CommunityRoom = require('./src/models/CommunityRoom');
const User = require('./src/models/User');

const DEFAULT_ROOMS = [
  { name: 'General', description: 'Open discussions for all batches and topics', icon: 'Hash', color: '#5865F2', isPopular: true },
  { name: 'Academics', description: 'Course queries, subject help, and study discussions', icon: 'BookOpen', color: '#10b981', isPopular: true },
  { name: 'Coding', description: 'Programming, DSA, projects, and tech interviews', icon: 'Code2', color: '#f59e0b', isPopular: true },
  { name: 'Placements', description: 'Internships, job alerts, resume reviews, and interview experiences', icon: 'Briefcase', color: '#ef4444', isPopular: true },
  { name: 'Hostel & Life', description: 'Campus life, hostel tips, and student lifestyle', icon: 'Home', color: '#8b5cf6', isPopular: false },
  { name: 'Projects & Hackathons', description: 'Showcase your work and find teammates', icon: 'Rocket', color: '#ec4899', isPopular: true },
  { name: 'Clubs', description: 'Club events, recruitment, and activities', icon: 'Users', color: '#06b6d4', isPopular: false }
];

async function seedRooms() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/electro-infinity');
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ role: 'super_admin' }) || await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    for (const roomData of DEFAULT_ROOMS) {
      const existing = await CommunityRoom.findOne({ name: roomData.name });
      if (!existing) {
        await CommunityRoom.create({
          ...roomData,
          createdBy: admin._id
        });
        console.log(`Created room: ${roomData.name}`);
      } else {
        console.log(`Room already exists: ${roomData.name}`);
      }
    }

    console.log('Room seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedRooms();
