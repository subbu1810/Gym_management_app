CREATE DATABASE IF NOT EXISTS gym_booking;
USE gym_booking;

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    terms_accepted BOOLEAN DEFAULT FALSE,
    booking_date VARCHAR(50),
    gym_slot VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending',
    age VARCHAR(10),
    gender VARCHAR(20),
    address TEXT,
    medical_condition VARCHAR(10),
    medical_details TEXT,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    dateOfBirth VARCHAR(50),
    whatsappNumber VARCHAR(50),
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
    referralCode VARCHAR(50),
    profilePhoto LONGTEXT,
    idProofPhoto LONGTEXT
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Online',
    transaction_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
