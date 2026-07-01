const db = require('../config/db');

let fallbackBookings = [
    { id: 1, full_name: 'John Doe', email: 'john@example.com', phone: '1234567890', plan_type: 'Monthly', booking_date: '2023-12-01', gym_slot: 'Morning', status: 'Pending', age: '25', gender: 'Male', address: '123 Main St', medical_condition: 'No', medical_details: '' }
];
let nextId = 2;

class BookingModel {
    static async create(booking) {
        const { 
            full_name, email, phone, plan_type, booking_date, gym_slot, status, age, gender, address, medical_condition, medical_details, amount, payment_status, terms_accepted,
            firstName, lastName, dateOfBirth, whatsappNumber, city, state, pincode, emergencyContactName, emergencyContactNumber, occupation, idProofType, idProofNumber, height, weight, bloodGroup, referralCode, profilePhoto, idProofPhoto
        } = booking;
        
        try {
            // Attempt to create columns if they don't exist (hacky migration for dev)
            try { await db.query(`ALTER TABLE bookings ADD COLUMN booking_date VARCHAR(50)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN gym_slot VARCHAR(50)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN status VARCHAR(50) DEFAULT 'Pending'`); } catch(e){}

            try { await db.query(`ALTER TABLE bookings ADD COLUMN age VARCHAR(10)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN gender VARCHAR(20)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN address TEXT`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN medical_condition VARCHAR(10)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN medical_details TEXT`); } catch(e){}
            
            try { await db.query(`ALTER TABLE bookings ADD COLUMN amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending'`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE`); } catch(e){}

            // NEW FIELDS
            try { await db.query(`ALTER TABLE bookings ADD COLUMN firstName VARCHAR(100)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN lastName VARCHAR(100)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN dateOfBirth VARCHAR(50)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN whatsappNumber VARCHAR(50)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN city VARCHAR(100)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN state VARCHAR(100)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN pincode VARCHAR(20)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN emergencyContactName VARCHAR(150)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN emergencyContactNumber VARCHAR(50)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN occupation VARCHAR(100)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN idProofType VARCHAR(50)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN idProofNumber VARCHAR(100)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN height VARCHAR(20)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN weight VARCHAR(20)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN bloodGroup VARCHAR(10)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN referralCode VARCHAR(50)`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN profilePhoto LONGTEXT`); } catch(e){}
            try { await db.query(`ALTER TABLE bookings ADD COLUMN idProofPhoto LONGTEXT`); } catch(e){}

            const [result] = await db.query(
                `INSERT INTO bookings (
                    full_name, email, phone, plan_type, booking_date, gym_slot, status, age, gender, address, medical_condition, medical_details, amount, payment_status, terms_accepted,
                    firstName, lastName, dateOfBirth, whatsappNumber, city, state, pincode, emergencyContactName, emergencyContactNumber, occupation, idProofType, idProofNumber, height, weight, bloodGroup, referralCode, profilePhoto, idProofPhoto
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    full_name, email, phone, plan_type, booking_date, gym_slot || 'Morning', status || 'Pending', age, gender, address, medical_condition, medical_details, amount, payment_status || 'Pending', terms_accepted || false,
                    firstName, lastName, dateOfBirth, whatsappNumber, city, state, pincode, emergencyContactName, emergencyContactNumber, occupation, idProofType, idProofNumber, height, weight, bloodGroup, referralCode, profilePhoto, idProofPhoto
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error("DB Error in create, falling back to memory:", error.message);
            const newBooking = { 
                id: nextId++, full_name, email, phone, plan_type, booking_date, gym_slot: gym_slot || 'Morning', status: status || 'Pending', age, gender, address, medical_condition, medical_details, amount, payment_status: payment_status || 'Pending', terms_accepted: terms_accepted || false,
                firstName, lastName, dateOfBirth, whatsappNumber, city, state, pincode, emergencyContactName, emergencyContactNumber, occupation, idProofType, idProofNumber, height, weight, bloodGroup, referralCode, profilePhoto, idProofPhoto
            };
            fallbackBookings.push(newBooking);
            return newBooking.id;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
            if (rows && rows.length > 0) return rows[0];
            return fallbackBookings.find(b => b.id === Number(id)) || null;
        } catch (error) {
            console.error("DB Error in findById, returning fallback:", error.message);
            return fallbackBookings.find(b => b.id === Number(id)) || null;
        }
    }

    static async findAll(query = {}) {
        try {
            let sql = 'SELECT * FROM bookings WHERE 1=1';
            let params = [];
            
            if (query.name) {
                sql += ' AND full_name LIKE ?';
                params.push(`%${query.name}%`);
            }
            if (query.status && query.status !== 'All') {
                sql += ' AND status = ?';
                params.push(query.status);
            }
            
            sql += ' ORDER BY id DESC'; // Assuming id is auto-increment
            
            const [rows] = await db.query(sql, params);
            
            // Merge with fallbackBookings
            let fallbackResults = fallbackBookings;
            if (query.name) {
                fallbackResults = fallbackResults.filter(b => b.full_name.toLowerCase().includes(query.name.toLowerCase()));
            }
            if (query.status && query.status !== 'All') {
                fallbackResults = fallbackResults.filter(b => b.status === query.status);
            }
            
            // Combine both arrays and sort by id descending
            const combined = [...rows, ...fallbackResults];
            combined.sort((a, b) => b.id - a.id);
            return combined;
        } catch (error) {
            console.error("DB Error in findAll, returning fallback:", error.message);
            let results = fallbackBookings;
            if (query.name) {
                results = results.filter(b => b.full_name.toLowerCase().includes(query.name.toLowerCase()));
            }
            if (query.status && query.status !== 'All') {
                results = results.filter(b => b.status === query.status);
            }
            return results;
        }
    }

    static async update(id, data) {
        try {
            const keys = Object.keys(data);
            if (keys.length === 0) return false;

            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const values = Object.values(data);
            
            const [result] = await db.query(`UPDATE bookings SET ${setClause} WHERE id = ?`, [...values, id]);
            if (result.affectedRows > 0) return true;
            
            // If 0 rows affected, it might be in fallbackBookings
            const index = fallbackBookings.findIndex(b => b.id === Number(id));
            if (index !== -1) {
                fallbackBookings[index] = { ...fallbackBookings[index], ...data };
                return true;
            }
            return false;
        } catch (error) {
            console.error("DB Error in update, using fallback:", error.message);
            const index = fallbackBookings.findIndex(b => b.id === Number(id));
            if (index !== -1) {
                fallbackBookings[index] = { ...fallbackBookings[index], ...data };
                return true;
            }
            return false;
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM bookings WHERE id = ?', [id]);
            if (result.affectedRows > 0) return true;
            
            // Check fallback if not found in DB
            const initialLength = fallbackBookings.length;
            fallbackBookings = fallbackBookings.filter(b => b.id !== Number(id));
            return fallbackBookings.length < initialLength;
        } catch (error) {
            console.error("DB Error in delete, using fallback:", error.message);
            const initialLength = fallbackBookings.length;
            fallbackBookings = fallbackBookings.filter(b => b.id !== Number(id));
            return fallbackBookings.length < initialLength;
        }
    }
}

module.exports = BookingModel;
