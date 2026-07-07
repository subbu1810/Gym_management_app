const nodemailer = require('nodemailer');

// Configure Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendEmailNotification = async (booking) => {
    try {
        if (!process.env.EMAIL_USER) {
            console.log('Skipping email notification, no EMAIL credentials provided.');
            return;
        }

        const mailOptions = {
            from: '"SsquareGtech Solutions" <ssquaregtechsolutions@gmail.com>',
            to: booking.email,
            subject: 'GYM Booking - Payment Receipt',
            html: `
                <div style="font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif; max-width: 600px; margin: 0 auto; background-color: #f6f8fa; padding: 40px 20px; text-align: center;">
                    <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(27,31,35,0.12);">
                        <h1 style="color: #24292e; font-size: 24px; margin-bottom: 24px; font-weight: 500;">Gym Booking Confirmed</h1>
                        <p style="color: #586069; font-size: 16px; margin-bottom: 24px; line-height: 1.5;">
                            Hello ${booking.full_name},<br>
                            Your gym booking has been successfully confirmed. Below are your receipt details:
                        </p>
                        <div style="background-color: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 20px; margin-bottom: 24px; text-align: left;">
                            <p style="margin: 5px 0; color: #24292e;"><strong>Booking ID:</strong> ${booking.id}</p>
                            <p style="margin: 5px 0; color: #24292e;"><strong>Plan Type:</strong> ${booking.plan_type}</p>
                            <p style="margin: 5px 0; color: #24292e;"><strong>Amount Paid:</strong> ₹${booking.amount}</p>
                        </div>
                        <p style="color: #586069; font-size: 14px; margin-bottom: 0; line-height: 1.5;">
                            Thank you for choosing us!<br>
                            SsquareGtech Solutions
                        </p>
                    </div>
                </div>
            `
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
