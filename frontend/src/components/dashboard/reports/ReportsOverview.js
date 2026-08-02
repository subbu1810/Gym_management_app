import React from 'react';
import { FiTrendingUp, FiUsers, FiCalendar, FiCreditCard, FiCheckSquare, FiUserPlus } from 'react-icons/fi';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const ReportsOverview = ({ 
  r_revenueSparkline,
  r_membersSparkline,
  r_newMembersSparkline,
  p_totalCollection,
  m_total,
  displayPayments,
  p_pending,
  p_statusCounts
}) => {
  return (
    <>
      <div className="stats-container col-5">
        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
             <div className="stat-icon" style={{width:40, height:40, fontSize:'1.2rem', background: '#f0fdf4', color: '#22c55e'}}><strong>₹</strong></div>
             <div>
               <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>TOTAL REVENUE</div>
               <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>₹{p_totalCollection.toLocaleString()}</div>
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
             <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 15.3% <span>vs Apr 2024</span></div>
             <div style={{ width: '60px', height: '30px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={r_revenueSparkline} margin={{top:0, right:0, left:0, bottom:0}}>
                     <Area type="monotone" dataKey="value" stroke="#22c55e" fill="#dcfce7" strokeWidth={2} />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
             <div className="stat-icon" style={{width:40, height:40, fontSize:'1.2rem', background: '#eff6ff', color: '#3b82f6'}}><FiUsers /></div>
             <div>
               <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>TOTAL MEMBERS</div>
               <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>{m_total}</div>
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
             <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 12.5% <span>vs Apr 2024</span></div>
             <div style={{ width: '60px', height: '30px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={r_membersSparkline} margin={{top:0, right:0, left:0, bottom:0}}>
                     <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
             <div className="stat-icon" style={{width:40, height:40, fontSize:'1.2rem', background: '#fdf4ff', color: '#a855f7'}}><FiUserPlus /></div>
             <div>
               <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>NEW MEMBERS</div>
               <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>126</div>
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
             <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 18.7% <span>vs Apr 2024</span></div>
             <div style={{ width: '60px', height: '30px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={r_newMembersSparkline} margin={{top:0, right:0, left:0, bottom:0}}>
                     <Area type="monotone" dataKey="value" stroke="#a855f7" fill="#f3e8ff" strokeWidth={2} />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
             <div className="stat-icon" style={{width:40, height:40, fontSize:'1.2rem', background: '#fff7ed', color: '#f97316'}}><FiCheckSquare /></div>
             <div>
               <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>ATTENDANCE RATE</div>
               <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>78.4%</div>
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
             <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 8.2% <span>vs Apr 2024</span></div>
             <div style={{ width: '60px', height: '30px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={r_revenueSparkline} margin={{top:0, right:0, left:0, bottom:0}}>
                     <Area type="monotone" dataKey="value" stroke="#f97316" fill="#ffedd5" strokeWidth={2} />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
             <div className="stat-icon" style={{width:40, height:40, fontSize:'1.2rem', background: '#f0fdf4', color: '#10b981'}}><FiCreditCard /></div>
             <div>
               <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>TOTAL PAYMENTS</div>
               <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>{displayPayments.length}</div>
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
             <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 10.7% <span>vs Apr 2024</span></div>
             <div style={{ width: '60px', height: '30px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={r_membersSparkline} margin={{top:0, right:0, left:0, bottom:0}}>
                     <Area type="monotone" dataKey="value" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
        <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '16px' }}>Quick Insights</h3>
        <div style={{ display: 'flex', gap: '16px' }}>
           <div style={{ flex: 1, padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}><FiTrendingUp /></div>
              <div>
                 <div style={{ fontSize: '0.75rem', color: '#334155' }}>Revenue is up by <span style={{ color: '#22c55e', fontWeight: '700' }}>15.3%</span></div>
                 <div style={{ fontSize: '0.7rem', color: '#64748b' }}>compared to last month.</div>
              </div>
           </div>
           <div style={{ flex: 1, padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}><FiUsers /></div>
              <div>
                 <div style={{ fontSize: '0.75rem', color: '#334155' }}><span style={{ color: '#3b82f6', fontWeight: '700' }}>126</span> new members joined</div>
                 <div style={{ fontSize: '0.7rem', color: '#64748b' }}>this month.</div>
              </div>
           </div>
           <div style={{ flex: 1, padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}><FiCalendar /></div>
              <div>
                 <div style={{ fontSize: '0.75rem', color: '#334155' }}>Peak hours are</div>
                 <div style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '700' }}>6 PM - 9 PM.</div>
              </div>
           </div>
           <div style={{ flex: 1, padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f3e8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}><FiCreditCard /></div>
              <div>
                 <div style={{ fontSize: '0.75rem', color: '#334155' }}>Pending payments</div>
                 <div style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '700' }}>₹{p_pending.toLocaleString()} <span style={{fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal'}}>from {p_statusCounts['Pending'] || 0} members.</span></div>
              </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default ReportsOverview;
