const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/electro-infinity');
    
    const password = '12345678';

    // Create Student
    const student1 = await User.create({
      name: 'Test Student',
      rollNumber: 'STUDENT123',
      email: 'student@gmail.com',
      password: password,
      role: 'student',
      batch: '2027',
      semester: 3
    });

    const student2 = await User.create({
      name: 'Sumith',
      rollNumber: 'SUMITH4002',
      email: 'heyysumith@gmail.com',
      password: password,
      role: 'student',
      batch: '2027',
      semester: 3
    });

    // Create CR (Same Batch)
    const cr = await User.create({
      name: 'Test CR',
      rollNumber: 'CR123',
      email: 'cr@gmail.com',
      password: password,
      role: 'cr',
      batch: '2027',
      semester: 3
    });

    // Create Admin
    const admin = await User.create({
      name: 'Test Admin',
      rollNumber: 'ADMIN123',
      email: 'admin@gmail.com',
      password: password,
      role: 'admin',
      isVerified: true,
    });

    // Create Faculty
    const faculty = await User.create({
      name: 'Test Faculty',
      email: 'faculty@gmail.com',
      password: password,
      role: 'faculty',
      assignedBatches: ['2027', '2024-2028'],
      assignedCourses: ['ECT', 'EM-II'],
      isVerified: true,
    });

    console.log('--- TEST USERS CREATED SUCCESSFULY ---');
    console.log('1. Student 1');
    console.log(`   Roll Number: ${student1.rollNumber}`);
    console.log(`   Password: ${password}`);
    console.log('2. CR');
    console.log(`   Roll Number: ${cr.rollNumber}`);
    console.log(`   Password: ${password}`);
    console.log('3. Admin');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);
    console.log('4. Faculty');
    console.log(`   Email: ${faculty.email}`);
    console.log(`   Password: ${password}`);
    console.log('5. Student 2');
    console.log(`   Roll Number: ${student2.rollNumber}`);
    console.log(`   Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
