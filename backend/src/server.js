const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// Database Initialization
const mysql = require('mysql2/promise');

const initDB = async () => {
  try {
    console.log('Initializing database tables...');

    // First, create the database if it doesn't exist
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    const dbName = process.env.DB_NAME || 'gym_booking';
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

    // 1. Users Table (Registration details)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(100),
        lastName VARCHAR(100),
        full_name VARCHAR(200),
        email VARCHAR(150) UNIQUE,
        phone VARCHAR(50),
        dateOfBirth VARCHAR(50),
        whatsappNumber VARCHAR(50),
        gender VARCHAR(20),
        age VARCHAR(10),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        emergencyContactName VARCHAR(150),
        emergencyContactNumber VARCHAR(50),
        occupation VARCHAR(100),
        idProofType VARCHAR(50),
        idProofNumber VARCHAR(100),
        height VARCHAR(20),
        weight VARCHAR(20),
        bloodGroup VARCHAR(10),
        medical_condition VARCHAR(10),
        medical_details TEXT,
        profilePhoto LONGTEXT,
        idProofPhoto LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Bookings Table (Plan and Slot details)
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        plan_type VARCHAR(100),
        booking_date VARCHAR(50),
        gym_slot VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Pending',
        referralCode VARCHAR(50),
        terms_accepted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Payments Table (Transaction details)
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT,
        amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        payment_status VARCHAR(50) DEFAULT 'Pending',
        currency VARCHAR(10) DEFAULT 'INR',
        transaction_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      )
    `);

    // 4. Admins Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin if not exists (username: admin, password: password -> bcrypt hashed)
    // password hash for 'password' is '$2b$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm'
    const [adminRows] = await db.query('SELECT * FROM admins WHERE username = ?', ['admin']);
    if (adminRows.length === 0) {
      const defaultHash = '$2b$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm';
      await db.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', defaultHash]);
      console.log('Default admin created: admin / password');
    }

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

app.listen(PORT, async () => {
  await initDB();
  console.log(`Server is running on port ${PORT}`);
});
