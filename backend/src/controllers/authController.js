const AdminModel = require('../models/adminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        const admin = await AdminModel.findByUsername(username);
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET || 'your_super_secret_key',
            { expiresIn: '1h' }
        );

        res.json({ token, username: admin.username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.requestPasswordResetOtp = async (req, res) => {
    try {
        const { identifier } = req.body;
        const admin = await AdminModel.findByIdentifier(identifier);

        if (!admin) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60000);

        await AdminModel.saveOtp(admin.id, otp, expiry);

        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            await transporter.sendMail({
                from: '"SsquareGtech Solutions" <ssquaregtechsolutions@gmail.com>',
                to: identifier,
                subject: 'GYM Booking Admin - Password Reset',
                html: `
                    <div style="font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif; max-width: 600px; margin: 0 auto; background-color: #f6f8fa; padding: 40px 20px; text-align: center;">
                        <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(27,31,35,0.12);">
                            <h1 style="color: #24292e; font-size: 24px; margin-bottom: 24px; font-weight: 500;">Reset your GYM Admin password</h1>
                            <p style="color: #586069; font-size: 16px; margin-bottom: 24px; line-height: 1.5;">
                                We received a request to reset your admin password. Please use the following One-Time Password (OTP) to complete the process:
                            </p>
                            <div style="background-color: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                                <h2 style="margin: 0; font-size: 36px; letter-spacing: 6px; color: #24292e;">${otp}</h2>
                            </div>
                            <p style="color: #586069; font-size: 14px; margin-bottom: 0; line-height: 1.5;">
                                This OTP is valid for 10 minutes.<br>
                                If you did not request this, please ignore this email.
                            </p>
                        </div>
                    </div>
                `
            });
            console.log(`[Email] OTP sent to ${identifier}`);
        } catch (emailErr) {
            console.log(`[Email Mock Fallback] OTP for ${identifier} is ${otp}`);
            console.error('(Email sending failed because credentials are not configured properly)');
        }

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

exports.verifyPasswordResetOtp = async (req, res) => {
    try {
        const { identifier, otp } = req.body;
        const admin = await AdminModel.findByIdentifier(identifier);

        if (!admin) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (admin.reset_otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > new Date(admin.reset_otp_expiry)) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resetAdminPassword = async (req, res) => {
    try {
        const { identifier, otp, newPassword } = req.body;
        const admin = await AdminModel.findByIdentifier(identifier);

        if (!admin || admin.reset_otp !== otp) {
            return res.status(400).json({ message: 'Invalid request or OTP' });
        }

        if (new Date() > new Date(admin.reset_otp_expiry)) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await AdminModel.updatePassword(admin.id, newHash);
        await AdminModel.clearOtp(admin.id);

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
