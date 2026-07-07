const db = require('../config/db');

class BookingModel {
    static async create(booking) {
        const { 
            full_name, email, phone, plan_type, booking_date, gym_slot, status, age, gender, address, medical_condition, medical_details, amount, payment_status, terms_accepted,
            firstName, lastName, dateOfBirth, whatsappNumber, city, state, pincode, emergencyContactName, emergencyContactNumber, occupation, idProofType, idProofNumber, height, weight, bloodGroup, referralCode, profilePhoto, idProofPhoto
        } = booking;
        
        try {
            // 1. Insert into Users table
            // We use INSERT IGNORE or check if user exists. We will check if email exists.
            let user_id;
            const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existingUsers.length > 0) {
                user_id = existingUsers[0].id;
                // Update user details just in case
                await db.query(
                    `UPDATE users SET firstName=?, lastName=?, full_name=?, phone=?, dateOfBirth=?, whatsappNumber=?, gender=?, age=?, address=?, city=?, state=?, pincode=?, emergencyContactName=?, emergencyContactNumber=?, occupation=?, idProofType=?, idProofNumber=?, height=?, weight=?, bloodGroup=?, medical_condition=?, medical_details=?, profilePhoto=?, idProofPhoto=? WHERE id=?`,
                    [firstName, lastName, full_name, phone, dateOfBirth, whatsappNumber, gender, age, address, city, state, pincode, emergencyContactName, emergencyContactNumber, occupation, idProofType, idProofNumber, height, weight, bloodGroup, medical_condition, medical_details, profilePhoto, idProofPhoto, user_id]
                );
            } else {
                const [userResult] = await db.query(
                    `INSERT INTO users (
                        firstName, lastName, full_name, email, phone, dateOfBirth, whatsappNumber, gender, age, address, city, state, pincode, emergencyContactName, emergencyContactNumber, occupation, idProofType, idProofNumber, height, weight, bloodGroup, medical_condition, medical_details, profilePhoto, idProofPhoto
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [firstName, lastName, full_name, email, phone, dateOfBirth, whatsappNumber, gender, age, address, city, state, pincode, emergencyContactName, emergencyContactNumber, occupation, idProofType, idProofNumber, height, weight, bloodGroup, medical_condition, medical_details, profilePhoto, idProofPhoto]
                );
                user_id = userResult.insertId;
            }

            // 2. Insert into Bookings table
            const [bookingResult] = await db.query(
                `INSERT INTO bookings (user_id, plan_type, booking_date, gym_slot, status, referralCode, terms_accepted) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user_id, plan_type, booking_date, gym_slot || 'Morning', status || 'Pending', referralCode, terms_accepted || false]
            );
            const booking_id = bookingResult.insertId;

            // 3. Insert into Payments table
            await db.query(
                `INSERT INTO payments (booking_id, amount, payment_status) VALUES (?, ?, ?)`,
                [booking_id, amount || 0, payment_status || 'Pending']
            );

            return booking_id;
        } catch (error) {
            console.error("DB Error in create:", error.message);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const sql = `
                SELECT 
                    b.id, b.plan_type, b.booking_date, b.gym_slot, b.status, b.referralCode, b.terms_accepted, b.created_at,
                    u.firstName, u.lastName, u.full_name, u.email, u.phone, u.dateOfBirth, u.whatsappNumber, u.gender, u.age, u.address, u.city, u.state, u.pincode, u.emergencyContactName, u.emergencyContactNumber, u.occupation, u.idProofType, u.idProofNumber, u.height, u.weight, u.bloodGroup, u.medical_condition, u.medical_details, u.profilePhoto, u.idProofPhoto,
                    p.amount, p.payment_status, p.transaction_id, p.currency
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                LEFT JOIN payments p ON b.id = p.booking_id
                WHERE b.id = ?
            `;
            const [rows] = await db.query(sql, [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error("DB Error in findById:", error.message);
            throw error;
        }
    }

    static async findAll(query = {}) {
        try {
            let sql = `
                SELECT 
                    b.id, b.plan_type, b.booking_date, b.gym_slot, b.status, b.referralCode, b.terms_accepted, b.created_at,
                    u.firstName, u.lastName, u.full_name, u.email, u.phone, u.dateOfBirth, u.whatsappNumber, u.gender, u.age, u.address, u.city, u.state, u.pincode, u.emergencyContactName, u.emergencyContactNumber, u.occupation, u.idProofType, u.idProofNumber, u.height, u.weight, u.bloodGroup, u.medical_condition, u.medical_details,
                    p.amount, p.payment_status, p.transaction_id, p.currency
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                LEFT JOIN payments p ON b.id = p.booking_id
                WHERE 1=1
            `;
            let params = [];
            
            if (query.name) {
                sql += ' AND u.full_name LIKE ?';
                params.push(`%${query.name}%`);
            }
            if (query.status && query.status !== 'All') {
                sql += ' AND b.status = ?';
                params.push(query.status);
            }
            
            sql += ' ORDER BY b.id DESC';
            
            const [rows] = await db.query(sql, params);
            return rows;
        } catch (error) {
            console.error("DB Error in findAll:", error.message);
            throw error;
        }
    }

    static async update(id, data) {
        // If data contains payment info, we update payment table.
        // For simplicity, we can just look for specific keys or update tables if fields match.
        try {
            let bookingUpdated = false;
            let paymentUpdated = false;
            let userUpdated = false;

            const bookingKeys = ['plan_type', 'booking_date', 'gym_slot', 'status', 'referralCode', 'terms_accepted'];
            const paymentKeys = ['amount', 'payment_status', 'transaction_id', 'currency'];
            const userKeys = ['firstName', 'lastName', 'full_name', 'email', 'phone', 'dateOfBirth', 'whatsappNumber', 'gender', 'age', 'address', 'city', 'state', 'pincode', 'emergencyContactName', 'emergencyContactNumber', 'occupation', 'idProofType', 'idProofNumber', 'height', 'weight', 'bloodGroup', 'medical_condition', 'medical_details', 'profilePhoto', 'idProofPhoto'];

            const bookingData = {};
            const paymentData = {};
            const userData = {};

            for (const key in data) {
                if (bookingKeys.includes(key)) bookingData[key] = data[key];
                else if (paymentKeys.includes(key)) paymentData[key] = data[key];
                else if (userKeys.includes(key)) userData[key] = data[key];
            }

            if (Object.keys(bookingData).length > 0) {
                const setClause = Object.keys(bookingData).map(k => `${k} = ?`).join(', ');
                const values = Object.values(bookingData);
                await db.query(`UPDATE bookings SET ${setClause} WHERE id = ?`, [...values, id]);
                bookingUpdated = true;
            }

            if (Object.keys(paymentData).length > 0) {
                const setClause = Object.keys(paymentData).map(k => `${k} = ?`).join(', ');
                const values = Object.values(paymentData);
                await db.query(`UPDATE payments SET ${setClause} WHERE booking_id = ?`, [...values, id]);
                paymentUpdated = true;
            }

            if (Object.keys(userData).length > 0) {
                // Get user_id from booking
                const [bRows] = await db.query('SELECT user_id FROM bookings WHERE id = ?', [id]);
                if (bRows.length > 0) {
                    const user_id = bRows[0].user_id;
                    const setClause = Object.keys(userData).map(k => `${k} = ?`).join(', ');
                    const values = Object.values(userData);
                    await db.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, user_id]);
                    userUpdated = true;
                }
            }

            return bookingUpdated || paymentUpdated || userUpdated;
        } catch (error) {
            console.error("DB Error in update:", error.message);
            throw error;
        }
    }

    static async delete(id) {
        try {
            // Get the user_id before deleting the booking
            const [bRows] = await db.query('SELECT user_id FROM bookings WHERE id = ?', [id]);
            
            // Because of ON DELETE CASCADE on foreign keys, deleting booking will delete payments too
            const [result] = await db.query('DELETE FROM bookings WHERE id = ?', [id]);
            
            // If the booking had a user, check if they have other bookings. If not, delete the user.
            if (bRows.length > 0) {
                const user_id = bRows[0].user_id;
                const [otherBookings] = await db.query('SELECT id FROM bookings WHERE user_id = ?', [user_id]);
                if (otherBookings.length === 0) {
                    await db.query('DELETE FROM users WHERE id = ?', [user_id]);
                }
            }
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error("DB Error in delete:", error.message);
            throw error;
        }
    }
}

module.exports = BookingModel;
