const nodemailer = require('nodemailer');

// Configure Email Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

exports.sendEmailNotification = async (booking) => {
    try {
        if (!process.env.SMTP_USER) {
            console.log('Skipping email notification, no SMTP credentials provided.');
            return;
        }

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: booking.email,
            subject: 'Gym Booking Confirmation',
            text: `Hello ${booking.full_name},\n\nYour gym booking for the ${booking.plan_type} plan has been confirmed.\nAmount Paid: ₹${booking.amount}\nBooking ID: ${booking.id}\n\nThank you!`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};

exports.sendWhatsAppNotification = async (booking) => {
    try {
        // Mock implementation for WhatsApp
        // To implement real WhatsApp messaging, you'd use Twilio API, Meta Graph API, etc.
        console.log(`[MOCK WHATSAPP] Sending message to ${booking.phone}: Your ${booking.plan_type} gym booking is confirmed. ID: ${booking.id}`);
        // Example Twilio Implementation:
        /*
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
            body: `Gym Booking Confirmed for ${booking.full_name}. Plan: ${booking.plan_type}`,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:+91${booking.phone}` // Assuming India numbers
        });
        */
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        throw error;
    }
};
