import React from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { FiDollarSign, FiDownload, FiClock, FiRefreshCcw, FiMoreVertical } from 'react-icons/fi';

const RevenueReport = ({
  lineData,
  r_revenueSourcePie,
  p_totalCollection,
  p_received,
  p_pending,
  p_refunded,
  recentTransactions
}) => {
  
  // Red, Black, White, Gray theme palette
  const COLORS = ['#dc2626', '#171717', '#737373', '#e5e5e5', '#991b1b'];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return { color: '#059669', background: '#d1fae5', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' };
      case 'Pending': return { color: '#d97706', background: '#fef3c7', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' };
      default: return { color: '#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top 4 Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        
        {/* Total Revenue */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            <FiDollarSign />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#525252', fontWeight: '500' }}>Total Revenue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#171717' }}>₹{p_totalCollection.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>↑ 18.5% vs Last 14 Days</div>
          </div>
        </div>

        {/* Received */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            <FiDownload />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#525252', fontWeight: '500' }}>Received</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#171717' }}>₹{p_received.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>↑ 12.7% vs Last 14 Days</div>
          </div>
        </div>

        {/* Pending */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            <FiClock />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#525252', fontWeight: '500' }}>Pending</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#171717' }}>₹{p_pending.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>↑ 8.3% vs Last 14 Days</div>
          </div>
        </div>

        {/* Refunded */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            <FiRefreshCcw />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#525252', fontWeight: '500' }}>Refunded</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#171717' }}>₹{p_refunded.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>↓ 3.6% vs Last 14 Days</div>
          </div>
        </div>

      </div>

      {/* Middle Row Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Area Chart */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e5e5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#171717', fontWeight: '600' }}>Revenue Overview</h3>
            <select style={{ border: '1px solid #e5e5e5', color: '#525252', fontSize: '0.8rem', outline: 'none', background: '#fff', padding: '6px 12px', borderRadius: '6px' }}>
              <option>This Month</option>
            </select>
          </div>
          
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenueRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373' }} tickFormatter={(val) => `${val/1000}K`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#a3a3a3', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenueRed)" activeDot={{ r: 6, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#171717', fontWeight: '600', marginBottom: '20px' }}>Revenue by Source</h3>
          
          <div style={{ width: '100%', position: 'relative', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={r_revenueSourcePie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {r_revenueSourcePie?.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#171717' }}>₹{p_totalCollection.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#737373' }}>Total</div>
            </div>
          </div>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px', flex: 1 }}>
            {r_revenueSourcePie?.map((item, index) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div> 
                  <span style={{ color: '#525252', fontWeight: '500' }}>{item.name}</span>
                </div>
                <div style={{fontWeight: '700', color: '#171717'}}>₹{item.value.toLocaleString()} <span style={{color: '#a3a3a3', fontWeight: 'normal', fontSize: '0.75rem'}}>({p_totalCollection ? Math.round((item.value/p_totalCollection)*100) : 0}%)</span></div>
              </div>
            ))}
          </div>
          
          <div style={{ width: '100%', textAlign: 'left', marginTop: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: '#dc2626', cursor: 'pointer', fontWeight: '600' }}>View Details →</span>
          </div>
        </div>
      </div>

      {/* Bottom Table */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e5e5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#171717', fontWeight: '600' }}>Recent Revenue Transactions</h3>
          <button style={{ background: '#fff', border: '1px solid #e5e5e5', color: '#525252', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}>View All Transactions</button>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e5e5', color: '#737373', fontWeight: '600' }}>
              <th style={{ padding: '12px 0' }}>Date</th>
              <th style={{ padding: '12px 0' }}>Description</th>
              <th style={{ padding: '12px 0' }}>Amount</th>
              <th style={{ padding: '12px 0' }}>Status</th>
              <th style={{ padding: '12px 0' }}>Payment Mode</th>
              <th style={{ padding: '12px 0', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions?.map(tx => (
              <tr key={tx.id} style={{ borderBottom: '1px solid #f5f5f5', color: '#404040' }}>
                <td style={{ padding: '16px 0' }}>{formatDate(tx.created_at)}</td>
                <td style={{ padding: '16px 0' }}>{tx.plan_type ? `Membership - ${tx.plan_type}` : 'Other'}</td>
                <td style={{ padding: '16px 0', fontWeight: '600', color: '#171717' }}>₹{tx.amount?.toLocaleString()}</td>
                <td style={{ padding: '16px 0' }}><span style={getStatusStyle(tx.payment_status || tx.p_status)}>{tx.payment_status || tx.p_status}</span></td>
                <td style={{ padding: '16px 0' }}>{tx.payment_method || 'UPI'}</td>
                <td style={{ padding: '16px 0', textAlign: 'right', color: '#a3a3a3', cursor: 'pointer' }}><FiMoreVertical /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default RevenueReport;
