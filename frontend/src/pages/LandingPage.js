import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    const [gymImage1, setGymImage1] = useState(localStorage.getItem('gymImage1') || '');
    const [gymImage2, setGymImage2] = useState(localStorage.getItem('gymImage2') || '');
    const [gymImage3, setGymImage3] = useState(localStorage.getItem('gymImage3') || '');

    useEffect(() => {
        const handleUpdate = () => {
            setGymName(localStorage.getItem('gymName') || 'POWER GYM');
            setGymAddress(localStorage.getItem('gymAddress') || '123 Fitness Street, Muscle City, MC 10101');
            setGymEmail(localStorage.getItem('gymEmail') || 'contact@powergym.com');
            setGymMobile(localStorage.getItem('gymMobile') || '(555) 123-4567');
            setGymHoursMonFri(localStorage.getItem('gymHoursMonFri') || '5:00 AM - 11:00 PM');
            setGymHoursSatSun(localStorage.getItem('gymHoursSatSun') || '7:00 AM - 9:00 PM');
            setGymImage1(localStorage.getItem('gymImage1') || '');
            setGymImage2(localStorage.getItem('gymImage2') || '');
            setGymImage3(localStorage.getItem('gymImage3') || '');
        };
        window.addEventListener('gymSettingsUpdated', handleUpdate);
        return () => window.removeEventListener('gymSettingsUpdated', handleUpdate);
    }, []);

    /* ── Mouse parallax on hero ── */
    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 30;
            const y = (e.clientY / window.innerHeight - 0.5) * 30;
            setMousePos({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    /* ── Scroll-reveal ── */
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
            { threshold: 0.12 }
        );
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    /* ── 3-D tilt on plan cards ── */
    const handleTilt = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -12;
        const rotateY = ((x - cx) / cx) * 12;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    };
    const resetTilt = (e) => {
        e.currentTarget.style.transform = '';
    };

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('isDarkMode', JSON.stringify(newMode));
        document.body.classList.toggle('light-mode', !newMode);
    };

    const features = [
        {
            title: 'Member Management',
            text: 'Add, track & manage all gym members, profiles and membership status in one place.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            )
        },
        {
            title: 'Membership Plans',
            text: 'Create and manage flexible membership plans tailored to your gym\'s offerings.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
                </svg>
            )
        },
        {
            title: 'QR & Biometric',
            text: 'Instant attendance via QR scan or biometric device with real-time auto-logging.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
            )
        },
        {
            title: 'Billing & GST',
            text: 'Auto-generate GST-compliant invoices. Handle fees, discounts and dues effortlessly.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
            )
        },
        {
            title: 'Payment Reminders',
            text: 'Automated due alerts via WhatsApp & SMS to reduce defaults and boost revenue.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            )
        },
        {
            title: 'Reports & Dashboard',
            text: 'Revenue charts, member analytics and expense reports for smarter decisions.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
            )
        },
    ];

    return (
        <div className="container">
            <button className="theme-toggle" onClick={toggleTheme}>
                {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>

            {/* ── HERO ── */}
            <div className="heroSection" ref={heroRef}>
                {/* Animated floating blobs */}
                <div className="blob blob1" style={{ transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)` }} />
                <div className="blob blob2" style={{ transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px)` }} />
                <div className="blob blob3" style={{ transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.5}px)` }} />
                <div className="heroOverlay" />
                <div
                    className="heroContent"
                    style={{ transform: `translate(${mousePos.x * 0.015}px, ${mousePos.y * 0.015}px)` }}
                >
                    <div className="heroChip heroAnim heroAnim-1">
                        <span className="chipDot" />
                        Gym Management Software
                    </div>
                    <h1 className="title heroAnim heroAnim-2">
                        <span className="titleWord">{gymName}</span>
                    </h1>
                    <p className="subtitle heroAnim heroAnim-3">SMART. FAST. EFFORTLESS.</p>
                    <p className="description heroAnim heroAnim-4">
                        The all-in-one gym management platform — automate billing, track attendance, manage members and trainers, send payment reminders, and grow your fitness business from a single dashboard.
                    </p>
                    <div className="heroBtnRow heroAnim heroAnim-5">
                        <button className="registerBtn glassBtn" onClick={() => navigate('/admin')}>
                            <span>Login to Dashboard</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                    <div className="heroStats heroAnim heroAnim-6">
                        <div className="heroStat">
                            <span className="heroStatNum">1000+</span>
                            <span className="heroStatLabel">Members Managed</span>
                        </div>
                        <div className="heroStatDivider" />
                        <div className="heroStat">
                            <span className="heroStatNum">GST</span>
                            <span className="heroStatLabel">Auto Invoicing</span>
                        </div>
                        <div className="heroStatDivider" />
                        <div className="heroStat">
                            <span className="heroStatNum">24×7</span>
                            <span className="heroStatLabel">Support</span>
                        </div>
                    </div>
                </div>
                {/* Scroll indicator */}
                <div className="scrollIndicator">
                    <div className="scrollDot" />
                </div>
            </div>

            {/* ── FEATURES ── */}
            <div className="featuresSection">
                <div className="featuresSectionHeader reveal">
                    <h1 className="featuresTitle">EVERYTHING YOU NEED TO RUN YOUR GYM</h1>
                    <p className="featuresSubtitle">One powerful platform to manage members, billing, attendance &amp; more</p>
                </div>
                <div className="featuresGrid">
                    {features.map((f, i) => (
                        <div className="featureCard reveal" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                            <div className="featureIcon">{f.icon}</div>
                            <h3 className="featureCardTitle">{f.title}</h3>
                            <p className="featureCardText">{f.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gallery */}
            {(gymImage1 || gymImage2 || gymImage3) && (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <h1 className="featuresTitle">OUR GYM</h1>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '1200px', margin: '40px auto 0' }}>
                        {gymImage1 && <img src={gymImage1} alt="Gym 1" style={{ width: '350px', height: '250px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 4px 24px rgba(255,51,51,0.15)' }} />}
                        {gymImage2 && <img src={gymImage2} alt="Gym 2" style={{ width: '350px', height: '250px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 4px 24px rgba(255,51,51,0.15)' }} />}
                        {gymImage3 && <img src={gymImage3} alt="Gym 3" style={{ width: '350px', height: '250px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 4px 24px rgba(255,51,51,0.15)' }} />}
                    </div>
                </div>
            )}

            {/* ── PRICING ── */}
            <div className="plansSection">
                {/* Background orbs for pricing */}
                <div className="pricingOrb pricingOrb1" />
                <div className="pricingOrb pricingOrb2" />

                <div className="plansSectionHeader reveal">
                    <h1 className="plansSectionTitle">PRICING PLANS</h1>
                    <p className="plansSectionSubtitle">Choose the perfect plan to manage your gym efficiently</p>
                </div>
                <div className="plansGrid">
                    {/* Basic */}
                    <div className="planCard glass reveal" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
                        <div className="cardShine" />
                        <div className="planBadge">Starter</div>
                        <h3 className="planTitle">Basic</h3>
                        <div className="planUserLimit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span>Up to <strong>200</strong> Active Members</span>
                        </div>
                        <p className="planPrice">₹12,000<span>/year</span></p>
                        <p className="planPerMonth">₹1,000 / month</p>
                        <ul className="planFeatures">
                            <li>✅ Member management</li>
                            <li>✅ Membership plans</li>
                            <li>✅ Trainer management</li>
                            <li>✅ Billing &amp; GST invoices</li>
                            <li>✅ Expense management</li>
                            <li>✅ Reports &amp; dashboard</li>
                        </ul>
                        <button className="planCTA">Get Started</button>
                    </div>

                    {/* Standard */}
                    <div className="planCard planCardFeatured glass reveal" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
                        <div className="cardShine" />
                        <div className="planBadge planBadgePopular">Most Popular</div>
                        <h3 className="planTitle">Standard</h3>
                        <div className="planUserLimit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span>Up to <strong>400</strong> Active Members</span>
                        </div>
                        <p className="planPrice">₹20,000<span>/year</span></p>
                        <p className="planPerMonth">₹1,667 / month</p>
                        <ul className="planFeatures">
                            <li>✅ Member management</li>
                            <li>✅ Membership plans</li>
                            <li>✅ Attendance (QR)</li>
                            <li>✅ Trainer management</li>
                            <li>✅ Billing &amp; GST invoices</li>
                            <li>✅ Payment reminders (WhatsApp/SMS)</li>
                            <li>✅ Expense management</li>
                            <li>✅ Reports &amp; dashboard</li>
                            <li>✅ Mobile app for members</li>
                        </ul>
                        <button className="planCTA planCTAFeatured">Get Started</button>
                    </div>

                    {/* Premium */}
                    <div className="planCard glass reveal" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
                        <div className="cardShine" />
                        <div className="planBadge planBadgePremium">Enterprise</div>
                        <h3 className="planTitle">Premium</h3>
                        <div className="planUserLimit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span>Up to <strong>1000</strong> Active Members</span>
                        </div>
                        <p className="planPrice">₹29,000<span>/year</span></p>
                        <p className="planPerMonth">₹2,417 / month</p>
                        <ul className="planFeatures">
                            <li>✅ Member management</li>
                            <li>✅ Membership plans</li>
                            <li>✅ Attendance (QR + Biometric)</li>
                            <li>✅ Trainer management</li>
                            <li>✅ Billing &amp; GST invoices</li>
                            <li>✅ Payment reminders (WhatsApp/SMS)</li>
                            <li>✅ Expense management</li>
                            <li>✅ Reports &amp; dashboard</li>
                            <li>✅ Mobile app for members</li>
                            <li>✅ Diet &amp; workout plans</li>
                            <li>✅ 24x7 Customer support</li>
                        </ul>
                        <button className="planCTA">Get Started</button>
                    </div>
                </div>
            </div>

            {/* ── INFO / FOOTER ── */}
            <div className="infoSection">
                <div className="infoBlock reveal">
                    <h1 className="infoTitle">LOCATION &amp; CONTACT</h1>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{gymAddress}</p>
                    <p>Email: {gymEmail}</p>
                    <p>Phone: {gymMobile}</p>
                </div>
                <div className="infoBlock reveal">
                    <h1 className="infoTitle">HOURS</h1>
                    <p>Mon-Fri: {gymHoursMonFri}</p>
                    <p>Sat-Sun: {gymHoursSatSun}</p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
