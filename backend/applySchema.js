const db = require('./src/config/db');

async function applySchema() {
  try {
    console.log('Initializing database tables...');

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

    await db.query(`
          CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

    console.log('Schema applied successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to apply schema:', error);
    process.exit(1);
  }
}

applySchema();
