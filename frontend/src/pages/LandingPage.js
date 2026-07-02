import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('isDarkMode');
        return savedTheme !== null ? JSON.parse(savedTheme) : true;
    });

    const [gymName, setGymName] = useState(localStorage.getItem('gymName') || 'POWER GYM');
    const [gymAddress, setGymAddress] = useState(localStorage.getItem('gymAddress') || '123 Fitness Street, Muscle City, MC 10101');
    const [gymEmail, setGymEmail] = useState(localStorage.getItem('gymEmail') || 'contact@powergym.com');
    const [gymMobile, setGymMobile] = useState(localStorage.getItem('gymMobile') || '(555) 123-4567');
    const [gymHoursMonFri, setGymHoursMonFri] = useState(localStorage.getItem('gymHoursMonFri') || '5:00 AM - 11:00 PM');
    const [gymHoursSatSun, setGymHoursSatSun] = useState(localStorage.getItem('gymHoursSatSun') || '7:00 AM - 9:00 PM');

    useEffect(() => {
        const handleUpdate = () => {
            setGymName(localStorage.getItem('gymName') || 'POWER GYM');
            setGymAddress(localStorage.getItem('gymAddress') || '123 Fitness Street, Muscle City, MC 10101');
            setGymEmail(localStorage.getItem('gymEmail') || 'contact@powergym.com');
            setGymMobile(localStorage.getItem('gymMobile') || '(555) 123-4567');
            setGymHoursMonFri(localStorage.getItem('gymHoursMonFri') || '5:00 AM - 11:00 PM');
            setGymHoursSatSun(localStorage.getItem('gymHoursSatSun') || '7:00 AM - 9:00 PM');
        };
        window.addEventListener('gymSettingsUpdated', handleUpdate);
        return () => window.removeEventListener('gymSettingsUpdated', handleUpdate);
    }, []);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('isDarkMode', JSON.stringify(newMode));
        if (!newMode) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    };

    return (
        <div className="container">
            <button className="theme-toggle" onClick={toggleTheme}>
                {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
            {/* Hero Section */}
            <div className="heroSection">
                <div className="heroOverlay"></div>
                <div className="heroContent">
                    <h1 className="title">{gymName}</h1>
                    <p className="subtitle">ELEVATE YOUR FITNESS JOURNEY</p>
                    <p className="description">
                        Experience the ultimate training environment. State-of-the-art equipment, elite trainers, and an unstoppable community.
                    </p>
                    <button
                        className="registerBtn"
                        onClick={() => navigate('/book')}
                    >
                        START NOW
                    </button>
                </div>
            </div>

            {/* Features Section */}
            <div className="featuresSection">
                <h1 className="featuresTitle">WHY CHOOSE US?</h1>
                <div className="featuresGrid">
                    <div className="featureCard">
                        <div className="featureIcon">🏋️‍♂️</div>
                        <h3 className="featureCardTitle">Top-Tier Equipment</h3>
                        <p className="featureCardText">Access to the latest and greatest in fitness technology.</p>
                    </div>
                    <div className="featureCard">
                        <div className="featureIcon">🧘‍♀️</div>
                        <h3 className="featureCardTitle">Diverse Classes</h3>
                        <p className="featureCardText">From high-intensity interval training to relaxing yoga flows.</p>
                    </div>
                    <div className="featureCard">
                        <div className="featureIcon">💪</div>
                        <h3 className="featureCardTitle">Expert Trainers</h3>
                        <p className="featureCardText">Personalized guidance to help you smash your goals.</p>
                    </div>
                </div>
            </div>



            {/* Membership Plans Section */}
            <div className="plansSection">
                <h1 className="plansSectionTitle">MEMBERSHIP PLANS</h1>
                <div className="plansGrid">
                    <div className="planCard">
                        <h3 className="planTitle">Basic</h3>
                        <p className="planPrice">₹1000<span>/mo</span></p>
                        <ul className="planFeatures">
                            <li>Access to gym floor</li>
                            <li>Locker room access</li>
                            <li>Free Wi-Fi</li>
                        </ul>
                    </div>
                    <div className="planCard">
                        <h3 className="planTitle">Pro</h3>
                        <p className="planPrice">₹1300<span>/mo</span></p>
                        <ul className="planFeatures">
                            <li>All Basic features</li>
                            <li>Unlimited group classes</li>
                            <li>1 Personal training session</li>
                        </ul>
                    </div>
                    <div className="planCard">
                        <h3 className="planTitle">Elite</h3>
                        <p className="planPrice">₹1500<span>/mo</span></p>
                        <ul className="planFeatures">
                            <li>All Pro features</li>
                            <li>Unlimited personal training</li>
                            <li>Nutrition consultation</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="infoSection">
                <div className="infoBlock">
                    <h1 className="infoTitle">LOCATION & CONTACT</h1>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{gymAddress}</p>
                    <p>Email: {gymEmail}</p>
                    <p>Phone: {gymMobile}</p>
                </div>
                <div className="infoBlock">
                    <h1 className="infoTitle">HOURS</h1>
                    <p>Mon-Fri: {gymHoursMonFri}</p>
                    <p>Sat-Sun: {gymHoursSatSun}</p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
