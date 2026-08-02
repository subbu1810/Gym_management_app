import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiChevronRight, FiCreditCard, FiLock, FiZap, FiHeadphones, FiCheck, FiFileText } from 'react-icons/fi';

const WalletSettings = () => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [totalAdded, setTotalAdded] = useState(0);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const currency = '₹';

  useEffect(() => {
    fetchWalletBalance();
    fetchTransactions();
    
    // Dynamically load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const res = await settingsAPI.getSettings();
      if (res.success && res.data) {
        setWalletBalance(parseFloat(res.data.wallet_balance || 0));
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load wallet balance');
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await settingsAPI.getWalletTransactions();
      if (res.success && res.data) {
        setTransactions(res.data);
        
        // Calculate Total Added
        const total = res.data
          .filter(t => t.type === 'credit')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        setTotalAdded(total);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    if (!rechargeAmount || isNaN(rechargeAmount) || rechargeAmount < 100) {
      toast.error('Minimum recharge amount is ' + currency + ' 100');
      return;
    }

    setLoading(true);
    try {
      const orderRes = await settingsAPI.createWalletOrder({ amount: rechargeAmount });
      if (!orderRes.success) {
        toast.error(orderRes.message || 'Failed to create order');
        setLoading(false);
        return;
      }

      const { order, key } = orderRes;

      const options = {
        key: key || 'rzp_test_mock_key',
        amount: order.amount,
        currency: order.currency,
        name: 'Gym Wallet Recharge',
        description: 'Recharge your gym wallet',
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await settingsAPI.verifyWalletRecharge({
              amount: rechargeAmount,
              razorpay_payment_id: response.razorpay_payment_id || 'mock_payment_id',
              razorpay_order_id: response.razorpay_order_id || order.id,
              razorpay_signature: response.razorpay_signature || 'mock_signature'
            });

            if (verifyRes.success) {
              toast.success('Wallet recharged successfully!');
              setWalletBalance(parseFloat(verifyRes.wallet_balance));
              setRechargeAmount('');
              fetchTransactions(); // Refresh list after recharge
            } else {
              toast.error(verifyRes.message || 'Payment verification failed');
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: 'Gym Owner',
          email: 'admin@gym.com',
          contact: '9999999999'
        },
        theme: {
          color: '#ea580c'
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error('Razorpay SDK failed to load');
      }

    } catch (err) {
      console.error(err);
      toast.error('Recharge failed');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#1e293b' }}>
      
      {/* Top Section */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
        
        {/* Orange Balance Card */}
        <div style={{ 
          flex: 1.1, 
          minWidth: '320px',
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
          borderRadius: '16px', 
          padding: '24px 28px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(234, 88, 12, 0.4)'
        }}>
          {/* Background circles */}
          <div style={{ position: 'absolute', right: '-10%', top: '-20%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', right: '15%', bottom: '-30%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, marginBottom: '4px' }}>
                  Available Balance
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.75rem', opacity: 0.8 }}>{currency}</span>
                  {walletBalance.toFixed(2)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', opacity: 0.9 }}>
                  <FiCheckCircle /> Your wallet is ready to use
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                💳
              </div>
            </div>

            <div style={{ display: 'flex', marginTop: '20px', gap: '32px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '2px' }}>Total Added</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{currency} {totalAdded.toFixed(2)} <span style={{ color: '#86efac', fontSize: '0.8rem' }}>↗</span></div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '2px' }}>Total Spent</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{currency} 0.00 <span style={{ color: '#fca5a5', fontSize: '0.8rem' }}>↘</span></div>
              </div>
            </div>

            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                 onClick={() => {
                   const section = document.getElementById('transactions-section');
                   if (section) {
                     const adminMain = document.querySelector('.admin-main');
                     if (adminMain) {
                       adminMain.scrollTo({
                         top: adminMain.scrollTop + section.getBoundingClientRect().top - 100,
                         behavior: 'smooth'
                       });
                     } else {
                       window.scrollTo({
                         top: window.scrollY + section.getBoundingClientRect().top - 100,
                         behavior: 'smooth'
                       });
                     }
                   }
                 }}
                 onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                 onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
              <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>View Transaction History</span>
              <FiChevronRight />
            </div>
          </div>
        </div>

        {/* Add Funds Card */}
        <div style={{ 
          flex: 1, 
          minWidth: '320px',
          background: 'white', 
          borderRadius: '16px', 
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: '#0f172a' }}>Add Funds</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 24px 0' }}>Enter amount to add to your wallet</p>
          
          <form onSubmit={handleRecharge}>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem' }}>
                {currency}
              </div>
              <input
                type="number"
                min="100"
                step="0.01"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Enter amount"
                required
                style={{ 
                  width: '100%', 
                  padding: '16px 16px 16px 40px', 
                  fontSize: '1.1rem', 
                  borderRadius: '12px', 
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {quickAmounts.map(amt => (
                <div 
                  key={amt}
                  onClick={() => setRechargeAmount(amt.toString())}
                  style={{ 
                    padding: '8px 16px', 
                    background: '#fff7ed', 
                    color: '#ea580c', 
                    border: '1px solid #fed7aa',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flex: '1',
                    textAlign: 'center',
                    minWidth: '70px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#ffedd5'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#fff7ed'}
                >
                  {currency} {amt.toLocaleString()}
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '16px', 
                background: '#ea580c', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#c2410c')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#ea580c')}
            >
              {loading ? 'Processing...' : <><FiZap /> Pay via Razorpay</>}
            </button>
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FiLock /> Secure payments powered by Razorpay
            </div>
          </form>
        </div>
      </div>

      {/* Feature Strip */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        background: '#fffaf5', 
        border: '1px solid #ffedd5',
        borderRadius: '16px', 
        padding: '24px 32px',
        marginBottom: '24px',
        gap: '24px'
      }}>
        {[
          { icon: <FiZap color="#ea580c" />, title: 'Instant Top-up', sub: 'Funds added instantly' },
          { icon: <FiLock color="#ea580c" />, title: 'Secure Payments', sub: '100% secure transactions' },
          { icon: <FiCreditCard color="#ea580c" />, title: 'Multiple Payments', sub: 'UPI, Cards, Netbanking' },
          { icon: <FiHeadphones color="#ea580c" />, title: '24/7 Support', sub: "We're here to help" }
        ].map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '200px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              {feature.icon}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#0f172a' }}>{feature.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{feature.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Recent Transactions */}
        <div id="transactions-section" style={{ 
          flex: 2, 
          minWidth: '400px',
          background: 'white', 
          borderRadius: '16px', 
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Recent Transactions</h3>
            <span style={{ color: '#ea580c', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>View All</span>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '0.8rem', fontWeight: '600' }}>DATE & TIME</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '0.8rem', fontWeight: '600' }}>DESCRIPTION</th>
                <th style={{ textAlign: 'right', padding: '12px', color: '#64748b', fontSize: '0.8rem', fontWeight: '600' }}>AMOUNT</th>
                <th style={{ textAlign: 'right', padding: '12px', color: '#64748b', fontSize: '0.8rem', fontWeight: '600' }}>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '60px 0', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 16px' }}>
                      <FiFileText />
                    </div>
                    <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>No transactions yet</div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Your wallet transactions will appear here</div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 12px', fontSize: '0.9rem', color: '#475569' }}>
                      {new Date(tx.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>
                      {tx.description || (tx.type === 'credit' ? 'Wallet Recharge' : 'Wallet Deduction')}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '0.9rem', textAlign: 'right', fontWeight: 'bold', color: tx.type === 'credit' ? '#10b981' : '#ef4444' }}>
                      {tx.type === 'credit' ? '+' : '-'}{currency}{parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '0.9rem', textAlign: 'right', color: '#475569', fontWeight: '500' }}>
                      {currency}{parseFloat(tx.balance_after).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Why add funds? */}
        <div style={{ 
          flex: 1, 
          minWidth: '300px',
          background: '#fffaf5', 
          borderRadius: '16px', 
          padding: '32px',
          border: '1px solid #ffedd5',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ea580c' }}>💎</span> Why add funds?
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'Send WhatsApp messages instantly',
              'Access premium templates',
              'Get detailed delivery reports',
              'Automate your communications'
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#475569' }}>
                <div style={{ color: '#ea580c' }}><FiCheck /></div>
                {text}
              </div>
            ))}
          </div>

          {/* Decorative wallet illustration */}
          <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.8 }}>
            <div style={{ 
              width: '120px', 
              height: '90px', 
              background: '#f97316', 
              borderRadius: '16px',
              position: 'relative',
              boxShadow: '0 10px 15px -3px rgba(234, 88, 12, 0.3)'
            }}>
              <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '12px', background: '#ffedd5', borderRadius: '4px' }}></div>
              <div style={{ position: 'absolute', top: '-15px', right: '30px', width: '40px', height: '40px', background: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', border: '3px solid white' }}>
                ₹
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default WalletSettings;
