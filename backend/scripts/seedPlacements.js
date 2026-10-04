/**
 * seedPlacements.js
 *
 * One-time seed / migration for the new placements sections.
 * Idempotent: running it twice does NOT duplicate records.
 *
 * How to run:
 *   node backend/scripts/seedPlacements.js
 *
 * It migrates any existing data from the old flat Placement model
 * into the new structured models, then inserts sample content if
 * the sections are empty so the public page renders immediately.
 */

require('dotenv').config()
const mongoose = require('mongoose')
const Placement = require('../src/models/Placement')
const PlacementStat = require('../src/models/PlacementStat')
const Recruiter = require('../src/models/Recruiter')
const PlacedStudent = require('../src/models/PlacedStudent')
const AlumniStory = require('../src/models/AlumniStory')
const CareerOpening = require('../src/models/CareerOpening')
const User = require('../src/models/User')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/electro-infinity'

async function findAdmin() {
  return await User.findOne({ role: { $in: ['admin', 'super_admin'] } }).select('_id')
}

async function migrateOldPlacements(adminId) {
  const old = await Placement.find({})
  if (old.length === 0) return

  console.log(`   Migrating ${old.length} old Placement records…`)

  for (const p of old) {
    const key = `${p.type}|${(p.statLabel || p.companyName || p.internshipTitle || p.alumniName || '').toLowerCase()}`
    switch (p.type) {
      case 'stat':
        await PlacementStat.findOneAndUpdate(
          { academicYear: p.statLabel || 'N/A' },
          {
            academicYear: p.statLabel || 'N/A',
            totalStudents: parseInt(p.statValue) || 0,
            placed: 0,
            highestPackage: '—',
            averagePackage: '—',
            medianPackage: '',
            published: true,
            order: 0,
            createdBy: adminId,
            updatedBy: adminId,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        break
      case 'recruiter':
        await Recruiter.findOneAndUpdate(
          { name: p.companyName },
          {
            name: p.companyName,
            logoUrl: '',
            website: '',
            type: 'both',
            published: true,
            order: 0,
            createdBy: adminId,
            updatedBy: adminId,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        break
      case 'internship':
        await PlacedStudent.findOneAndUpdate(
          { company: p.internshipCompany, role: p.internshipTitle },
          {
            studentName: '',
            branch: '',
            batchYear: '',
            company: p.internshipCompany,
            role: p.internshipTitle,
            type: 'internship',
            published: true,
            createdBy: adminId,
            updatedBy: adminId,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        break
      case 'alumni':
        await AlumniStory.findOneAndUpdate(
          { name: p.alumniName },
          {
            name: p.alumniName,
            batchYear: p.alumniBatch || '',
            currentRole: p.alumniRole || '',
            company: '',
            quote: p.alumniDesc || '',
            photoUrl: '',
            linkedinUrl: '',
            published: true,
            order: 0,
            createdBy: adminId,
            updatedBy: adminId,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        break
    }
  }
  console.log('   Migration complete.')
}

async function seedStats(adminId) {
  const count = await PlacementStat.countDocuments()
  if (count > 0) {
    console.log(`   PlacementStats: ${count} records exist, skipping`)
    return
  }
  const stats = [
    { academicYear: '2023-24', totalStudents: 180, placed: 165, highestPackage: '12 LPA', averagePackage: '6.5 LPA', medianPackage: '5.8 LPA', order: 0 },
    { academicYear: '2024-25', totalStudents: 200, placed: 188, highestPackage: '15 LPA', averagePackage: '7.2 LPA', medianPackage: '6.4 LPA', order: 1 },
  ]
  for (const s of stats) {
    await PlacementStat.create({ ...s, published: true, createdBy: adminId, updatedBy: adminId })
  }
  console.log(`   PlacementStats: seeded ${stats.length} records`)
}

async function seedRecruiters(adminId) {
  const count = await Recruiter.countDocuments()
  if (count > 0) {
    console.log(`   Recruiters: ${count} records exist, skipping`)
    return
  }
  const recruiters = [
    { name: 'Tata Power', logoUrl: 'https://placehold.co/100x100.png?text=TP', website: 'https://www.tatapower.com', type: 'placement', order: 0 },
    { name: 'L&T Energy', logoUrl: 'https://placehold.co/100x100.png?text=LT', website: 'https://www.larsentoubro.com', type: 'placement', order: 1 },
    { name: 'Siemens', logoUrl: 'https://placehold.co/100x100.png?text=SI', website: 'https://www.siemens.com', type: 'internship', order: 2 },
    { name: 'Schneider Electric', logoUrl: 'https://placehold.co/100x100.png?text=SE', website: 'https://www.se.com', type: 'both', order: 3 },
    { name: 'NTPC', logoUrl: 'https://placehold.co/100x100.png?text=NT', website: 'https://www.ntpc.co.in', type: 'placement', order: 4 },
    { name: 'PowerGrid', logoUrl: 'https://placehold.co/100x100.png?text=PG', website: 'https://www.powergrid.in', type: 'placement', order: 5 },
  ]
  for (const r of recruiters) {
    await Recruiter.create({ ...r, published: true, createdBy: adminId, updatedBy: adminId })
  }
  console.log(`   Recruiters: seeded ${recruiters.length} records`)
}

async function seedPlacedStudents(adminId) {
  const count = await PlacedStudent.countDocuments()
  if (count > 0) {
    console.log(`   PlacedStudents: ${count} records exist, skipping`)
    return
  }
  const students = [
    { studentName: 'Rahul Das', branch: 'Electrical Engineering', batchYear: '2024', company: 'Tata Power', role: 'Graduate Engineer Trainee', package: '6.5 LPA', type: 'placement', order: 0 },
    { studentName: 'Priya Sharma', branch: 'Electrical Engineering', batchYear: '2024', company: 'L&T Energy', role: 'GET', package: '7 LPA', type: 'placement', order: 1 },
    { studentName: 'Arun Kumar', branch: 'Electronics Engineering', batchYear: '2024', company: 'Siemens', role: 'Intern', package: '25K/month', type: 'internship', order: 2 },
    { studentName: 'Sneha Roy', branch: 'Electrical Engineering', batchYear: '2023', company: 'Schneider Electric', role: 'GET', package: '8 LPA', type: 'placement', order: 3 },
  ]
  for (const s of students) {
    await PlacedStudent.create({ ...s, published: true, createdBy: adminId, updatedBy: adminId })
  }
  console.log(`   PlacedStudents: seeded ${students.length} records`)
}

async function seedAlumni(adminId) {
  const count = await AlumniStory.countDocuments()
  if (count > 0) {
    console.log(`   AlumniStories: ${count} records exist, skipping`)
    return
  }
  const stories = [
    { name: 'Vikram Mehta', batchYear: '2020', currentRole: 'Senior Engineer', company: 'Tata Power', quote: 'The hands-on lab work at AGEMC gave me a practical edge that core companies value immensely.', photoUrl: '', linkedinUrl: '', order: 0 },
    { name: 'Anita Bose', batchYear: '2019', currentRole: 'Project Manager', company: 'L&T Energy', quote: 'AGEMC prepared me not just technically, but as a leader. The placements cell was incredibly supportive throughout.', photoUrl: '', linkedinUrl: '', order: 1 },
  ]
  for (const s of stories) {
    await AlumniStory.create({ ...s, published: true, createdBy: adminId, updatedBy: adminId })
  }
  console.log(`   AlumniStories: seeded ${stories.length} records`)
}

async function seedOpenings(adminId) {
  const count = await CareerOpening.countDocuments()
  if (count > 0) {
    console.log(`   CareerOpenings: ${count} records exist, skipping`)
    return
  }
  const openings = [
    {
      title: 'Graduate Engineer Trainee',
      company: 'Tata Power',
      type: 'job',
      location: 'Mumbai',
      mode: 'onsite',
      description: 'Join our graduate trainee program for electrical engineers. On-the-job training in power systems and automation.',
      applyUrl: 'https://www.tatapower.com/careers',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: 'open',
      published: true,
    },
    {
      title: 'Summer Internship - Power Systems',
      company: 'L&T Energy',
      type: 'internship',
      location: 'Chennai',
      mode: 'hybrid',
      description: '8-week summer internship focusing on power system analysis and grid automation technologies.',
      applyUrl: 'https://www.larsentoubro.com/careers',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'open',
      published: true,
    },
    {
      title: 'Industrial Automation Training',
      company: 'Siemens',
      type: 'training',
      location: 'Pune',
      mode: 'onsite',
      description: 'Hands-on training in SCADA, PLC programming, and industrial automation at Siemens facility.',
      applyUrl: 'https://www.siemens.com/training',
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'closed',
      published: true,
    },
  ]
  for (const o of openings) {
    await CareerOpening.create({ ...o, createdBy: adminId, updatedBy: adminId })
  }
  console.log(`   CareerOpenings: seeded ${openings.length} records`)
}

async function main() {
  console.log('Starting placements seed…')
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    const admin = await findAdmin()
    if (!admin) {
      console.warn('No admin user found. Seed will proceed but createdBy will be null.')
      console.log('Run seed_users.js first to create an admin account.')
    }

    const adminId = admin?._id || null
    console.log('Admin user ID:', adminId || '(none)')

    console.log('Migrating old Placement data…')
    await migrateOldPlacements(adminId)

    console.log('Seeding sections…')
    await seedStats(adminId)
    await seedRecruiters(adminId)
    await seedPlacedStudents(adminId)
    await seedAlumni(adminId)
    await seedOpenings(adminId)

    console.log('\nSeed complete!')
    console.log('Verify at: http://localhost:5173/placements')
    console.log('Admin page: http://localhost:5173/admin/placements')
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)
  }
}

main()
