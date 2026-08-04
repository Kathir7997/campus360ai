require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const HOD = require('../models/HOD');
const Department = require('../models/Department');
const Subject = require('../models/Subject');

const connectDB = require('../config/db');

const seed = async ({ reset = false } = {}) => {
  await connectDB();

  const existingUsers = await User.countDocuments();
  if (!reset && existingUsers > 0) {
    console.log(`ℹ️  Database already has ${existingUsers} user(s); skipping demo seed.`);
    return { seeded: false, users: existingUsers };
  }

  if (reset) {
    console.log('🌱 Resetting database with demo data...');
    await Promise.all([
      User.deleteMany(), Student.deleteMany(), Mentor.deleteMany(),
      HOD.deleteMany(), Department.deleteMany(), Subject.deleteMany(),
    ]);
  } else {
    console.log('🌱 Seeding database with demo data...');
  }

  const dept = await Department.create({
    name: 'Computer Science and Engineering',
    code: 'CSE',
    description: 'Department of Computer Science',
    totalSemesters: 8,
  });

  await User.create({
    name: 'Admin User',
    email: 'admin@campus360.edu',
    password: 'admin@123',
    role: 'admin',
  });

  const hodUser = await User.create({
    name: 'Dr. Ramesh Kumar',
    email: 'hod@campus360.edu',
    password: 'hod@123',
    role: 'hod',
  });
  await HOD.create({
    user: hodUser._id,
    employeeId: 'HOD001',
    department: dept._id,
    designation: 'Head of Department',
    qualification: 'Ph.D Computer Science',
  });
  await Department.findByIdAndUpdate(dept._id, { hod: hodUser._id });

  const mentorUser = await User.create({
    name: 'Prof. Priya Sharma',
    email: 'mentor@campus360.edu',
    password: 'mentor@123',
    role: 'mentor',
  });
  const mentor = await Mentor.create({
    user: mentorUser._id,
    employeeId: 'PROF001',
    department: dept._id,
    designation: 'Assistant Professor',
    qualification: 'M.Tech',
    assignedSections: ['A'],
  });

  const subjectData = [
    { name: 'Data Structures', code: 'CS301', department: dept._id, semester: 3, credits: 4 },
    { name: 'Database Management Systems', code: 'CS302', department: dept._id, semester: 3, credits: 4 },
    { name: 'Computer Networks', code: 'CS303', department: dept._id, semester: 3, credits: 3 },
    { name: 'Java Programming', code: 'CS304', department: dept._id, semester: 3, credits: 3 },
    { name: 'Operating Systems', code: 'CS305', department: dept._id, semester: 3, credits: 3 },
  ];
  await Subject.insertMany(subjectData);

  const studentUser = await User.create({
    name: 'Arjun Patel',
    email: 'student@campus360.edu',
    password: 'student@123',
    role: 'student',
  });
  const student = await Student.create({
    user: studentUser._id,
    registerNumber: 'CSE2022001',
    rollNumber: '22CS001',
    department: dept._id,
    mentor: mentorUser._id,
    year: 2,
    semester: 3,
    section: 'A',
    batch: '2022-2026',
    gender: 'male',
    parentName: 'Suresh Patel',
    parentPhone: '9876543210',
  });

  await Mentor.findByIdAndUpdate(mentor._id, { $push: { assignedStudents: student._id } });

  console.log('✅ Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('Admin:   admin@campus360.edu / admin@123');
  console.log('HOD:     hod@campus360.edu   / hod@123');
  console.log('Mentor:  mentor@campus360.edu / mentor@123');
  console.log('Student: student@campus360.edu / student@123');

  return { seeded: true };
};

if (require.main === module) {
  seed({ reset: process.env.SEED_RESET === 'true' })
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { seed };
