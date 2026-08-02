import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { attendanceAPI, trainersAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiUsers, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiSmartphone, FiMonitor, FiDownload, FiPlus, FiBarChart2, FiUserX, FiFilter, FiChevronDown, FiCamera, FiUserCheck, FiEye, FiMoreVertical } from 'react-icons/fi';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, CartesianGrid, XAxis, YAxis, Area } from 'recharts';
import '../../styles/dashboard/AttendanceSection.css';

const AttendanceSection = ({ 

  attendances,
  fetchAttendances,
  activeAttendanceTab = 'overview',
  processedMembers = []
}) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [viewAttendance, setViewAttendance] = useState(null);
  const [editAttendance, setEditAttendance] = useState(null);
  const [openActionId, setOpenActionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeMethodFilter, setActiveMethodFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [selectedTrainer, setSelectedTrainer] = useState('All Trainers');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualId, setManualId] = useState('');
  const [manualRole, setManualRole] = useState('member');
  const [trainersList, setTrainersList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (showManualModal && manualRole === 'trainer' && trainersList.length === 0) {
        trainersAPI.getAll().then(res => {
            setTrainersList(res.data || res || []);
        }).catch(err => console.error(err));
    }
  }, [showManualModal, manualRole, trainersList.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentList = manualRole === 'member' ? (processedMembers || []) : (trainersList || []);
  const filteredList = currentList.filter(item => {
      const name = (item.full_name || item.name || '').toLowerCase();
      const idStr = item.id ? item.id.toString() : '';
      const prefixId = (manualRole === 'member' ? 'm-' : 't-') + idStr;
      const search = searchTerm.toLowerCase();
      return name.includes(search) || idStr.includes(search) || prefixId.includes(search);
  });

  const handleManualSubmit = async () => {
    if (!manualId) return toast.error('Please enter an ID');
    
    let parsedId = manualId.trim();
    if (parsedId.toUpperCase().startsWith('M-')) parsedId = parsedId.substring(2);
    if (parsedId.toUpperCase().startsWith('T-')) parsedId = parsedId.substring(2);

    const numericId = parseInt(parsedId);
    if (isNaN(numericId)) return toast.error('Invalid ID format');
    
    let finalId = numericId;
    if (numericId > 1000) finalId = numericId - 1000;

    try {
        const payload = {
            date: new Date().toISOString().split('T')[0],
            method: 'Manual',
            role: manualRole,
            [manualRole === 'trainer' ? 'trainer_id' : 'user_id']: finalId
        };
        const res = await attendanceAPI.create(payload);
        if (res.success) {
            toast.success(res.message);
            setShowManualModal(false);
            setManualId('');
            if (fetchAttendances) fetchAttendances();
        } else {
            toast.error(res.message || 'Failed to record attendance');
        }
    } catch (e) {
        toast.error(e.response?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = async (id) => {
    setOpenActionId(null);
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      const res = await attendanceAPI.delete(id);
      if (res.success || res.message) {
        toast.success('Attendance deleted');
        if (fetchAttendances) fetchAttendances();
      }
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        check_in_time: editAttendance.a_in,
        check_out_time: editAttendance.a_out,
        status: editAttendance.a_status,
        method: editAttendance.a_method
      };
      const res = await attendanceAPI.update(editAttendance.id, payload);
      if (res.success || res.message) {
        toast.success('Attendance updated');
        setEditAttendance(null);
        if (fetchAttendances) fetchAttendances();
      }
    } catch (e) {
      toast.error('Failed to update attendance');
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeAttendanceTab, activeMethodFilter, selectedDate, selectedBranch, selectedTrainer]);

  const activePillStyle = { padding: '6px 16px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' };
  const inactivePillStyle = { padding: '6px 16px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' };

  const gymId = localStorage.getItem('gymId') || '1'; // Defaulting to 1 if not set
  const qrUrl = `${window.location.origin}/checkin/${gymId}`;

  const dataList = attendances && attendances.length > 0 ? attendances.map(a => ({
    id: a.role === 'trainer' ? a.trainer_id : a.user_id,
    full_name: a.role === 'trainer' ? (a.trainer?.name || 'Trainer') : (a.user?.full_name || 'Member'),
    plan_type: a.role === 'trainer' ? 'Staff' : (a.user?.plan_type || 'Monthly Plan'),
    date: a.date,
    a_in: a.check_in_time,
    a_out: a.check_out_time || '-',
    a_method: a.method,
    a_status: a.status,
    a_trainer: a.role === 'trainer' ? 'N/A' : (a.trainer?.name || 'N/A'),
    branch: a.branch_id || 'Main Branch',
    raw_id: a.id,
    role: a.role || 'member',
    profilePhoto: a.role === 'trainer' ? (a.trainer?.profilePhoto || null) : (a.user?.profilePhoto || null)
  })) : [];

  // Compute analytics dynamically based on current dataList
  const {
    a_donutData,
    a_sparklineCheckins,
    a_sparklineWeek,
    a_sparklineMonth,
    a_sparklineAvg,
    a_sparklineAbsent,
    a_peakHoursData
  } = React.useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;

    const hourCounts = { '6 AM': 0, '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 };

    dataList.forEach(item => {
      if (item.a_status === 'Present') present++;
      else if (item.a_status === 'Late') late++;
      else absent++;

      if (item.a_in && typeof item.a_in === 'string') {
          let hourStr = item.a_in.split(':')[0];
          let hour = parseInt(hourStr) || 6;
          if (item.a_in.toLowerCase().includes('pm') && hour !== 12) hour += 12;
          if (item.a_in.toLowerCase().includes('am') && hour === 12) hour = 0;
          
          if (hour >= 6 && hour < 9) hourCounts['6 AM']++;
          else if (hour >= 9 && hour < 12) hourCounts['9 AM']++;
          else if (hour >= 12 && hour < 15) hourCounts['12 PM']++;
          else if (hour >= 15 && hour < 18) hourCounts['3 PM']++;
          else if (hour >= 18) hourCounts['6 PM']++;
      }
    });

    const peakHours = Object.keys(hourCounts).map(k => ({ name: k, value: hourCounts[k] }));

    const donut = [
      { name: 'Present', value: present, color: '#22c55e' },
      { name: 'Late', value: late, color: '#eab308' },
      { name: 'Absent', value: absent, color: '#ef4444' }
    ].filter(d => d.value > 0);
    if (donut.length === 0) donut.push({ name: 'No Data', value: 1, color: '#cbd5e1' });

    // Calculate real historical sparkline data based on dataList
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const checkinsSpark = last7Days.map((dateStr, i) => {
      const dayData = dataList.filter(item => item.date === dateStr);
      const count = dayData.filter(item => item.a_status === 'Present' || item.a_status === 'Checked In' || item.a_status === 'Checked Out').length;
      return { name: `Day ${i+1}`, value: count };
    });

    const absentSpark = last7Days.map((dateStr, i) => {
      const dayData = dataList.filter(item => item.date === dateStr);
      const count = dayData.filter(item => item.a_status === 'Absent').length;
      return { name: `Day ${i+1}`, value: count };
    });
    
    // For weekly/monthly we just use the checkins Spark for now as placeholder for real longer-term aggregation
    const weekSpark = [...checkinsSpark];
    const monthSpark = [...checkinsSpark];
    const avgSpark = [...checkinsSpark];

    return {
      a_donutData: donut,
      a_sparklineCheckins: checkinsSpark,
      a_sparklineWeek: weekSpark,
      a_sparklineMonth: monthSpark,
      a_sparklineAvg: avgSpark,
      a_sparklineAbsent: absentSpark,
      a_peakHoursData: peakHours
    };
  }, [dataList]);

  const uniqueBranches = ['All Branches', ...new Set(dataList.map(item => item.branch))];
  const uniqueTrainers = ['All Trainers', ...new Set(dataList.map(item => item.a_trainer).filter(t => t && t !== 'N/A'))];

  const filteredDataList = dataList.filter(m => {
     const role = m.role || 'member';
     let roleMatch = true;
     if (activeAttendanceTab === 'members') roleMatch = (role === 'member');
     if (activeAttendanceTab === 'trainers') roleMatch = (role === 'trainer');
     
     let methodMatch = true;
     if (activeMethodFilter === 'Biometric') methodMatch = (m.a_method === 'Biometric');
     if (activeMethodFilter === 'QR Code') methodMatch = (m.a_method === 'QR Code');
     if (activeMethodFilter === 'Manual') methodMatch = (m.a_method === 'Manual');

     let branchMatch = true;
     if (selectedBranch !== 'All Branches') branchMatch = (m.branch === selectedBranch);

     let trainerMatch = true;
     if (selectedTrainer !== 'All Trainers') trainerMatch = (m.a_trainer === selectedTrainer);

     let dateMatch = true;
     if (selectedDate) {
        if (m.date) {
            dateMatch = m.date === selectedDate;
        } else {
            // For dummy data that doesn't have a date property
            dateMatch = true;
        }
     }

     return roleMatch && methodMatch && branchMatch && trainerMatch && dateMatch;
  });

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Member ID,Member Name,Plan Type,Check-in Time,Check-out Time,Method,Trainer,Branch,Status\n"
      + filteredDataList.map(e => `M-${1000 + e.id},${e.full_name},${e.plan_type},${e.a_in},${e.a_out},${e.a_method},${e.a_trainer},${e.branch},${e.a_status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const gymName = localStorage.getItem('gymName') || 'POWER GYM';

  const handleDownloadPDF = () => {
    const canvas = document.getElementById('qr-canvas');
    if (canvas) {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Add Gym Name
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(gymName.toUpperCase(), pageWidth / 2, 40, { align: 'center' });
      
      // Add Title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "normal");
      pdf.text('Attendance QR Code', pageWidth / 2, 50, { align: 'center' });
      
      // Add QR Code
      const qrSize = 100; // mm
      pdf.addImage(imgData, 'PNG', (pageWidth - qrSize) / 2, 70, qrSize, qrSize);
      
      // Add instructions
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Scan this code to check in and check out.', pageWidth / 2, 185, { align: 'center' });
      
      pdf.save(`${gymName.replace(/\s+/g, '_')}_Attendance_QR.pdf`);
    }
  };

  const generateHeatmapData = () => {
    const buckets = Array(42).fill(0);
    
    filteredDataList.forEach(m => {
      if (!m.a_in) return;
      
      let dayIndex = 0;
      let hour = 0;
      
      const dateObj = new Date(m.a_in);
      if (!isNaN(dateObj.getTime()) && m.a_in.includes('-')) {
         const jsDay = dateObj.getDay(); 
         dayIndex = jsDay === 0 ? 6 : jsDay - 1; 
         hour = dateObj.getHours();
      } else {
         dayIndex = (m.id || 0) % 7; 
         const timeStr = m.a_in.toLowerCase();
         if (timeStr.includes('am') || timeStr.includes('pm')) {
            const [time, period] = timeStr.split(' ');
            if (time) {
                let [h, min] = time.split(':');
                hour = parseInt(h);
                if (period === 'pm' && hour !== 12) hour += 12;
                if (period === 'am' && hour === 12) hour = 0;
            }
         } else {
            hour = parseInt(m.a_in.split(':')[0]) || 6;
         }
      }
      
      let rowIndex = 0;
      if (hour >= 6 && hour < 9) rowIndex = 0;
      else if (hour >= 9 && hour < 12) rowIndex = 1;
      else if (hour >= 12 && hour < 15) rowIndex = 2;
      else if (hour >= 15 && hour < 18) rowIndex = 3;
      else if (hour >= 18 && hour < 21) rowIndex = 4;
      else rowIndex = 5; 
      
      const index = rowIndex * 7 + dayIndex;
      if (index >= 0 && index < 42) {
         buckets[index]++;
      }
    });
    return buckets;
  };

  const heatmapData = generateHeatmapData();
  const maxHeat = Math.max(...heatmapData, 1); 

  const getColorForHeat = (val, max) => {
      if (val === 0) return '#f1f5f9'; 
      const ratio = val / max;
      if (ratio < 0.2) return '#dcfce7'; 
      if (ratio < 0.4) return '#bbf7d0';
      if (ratio < 0.6) return '#86efac';
      if (ratio < 0.8) return '#4ade80';
      return '#15803d'; 
  };


  return (
    <>
      {activeAttendanceTab === 'overview' && (
        <div className="attendance-layout" style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* TOP STAT CARDS */}
                   <div className="stats-container col-5">
                      <div className="stat-card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                           <div>
                             <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>TODAY'S CHECK-INS</div>
                             <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>186</div>
                           </div>
                           <div className="stat-icon" style={{width:32, height:32, fontSize:'1rem', background: '#dcfce7', color: '#22c55e', marginLeft: 'auto'}}><FiUsers /></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                           <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 18.5% <span style={{fontSize: '0.65rem'}}>vs yesterday</span></div>
                           <div style={{ width: '60px', height: '24px' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={a_sparklineCheckins}>
                                   <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{r: 1, fill: '#22c55e'}} />
                                </LineChart>
                             </ResponsiveContainer>
                           </div>
                        </div>
                      </div>

                      <div className="stat-card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                           <div>
                             <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>THIS WEEK</div>
                             <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>1,248</div>
                           </div>
                           <div className="stat-icon" style={{width:32, height:32, fontSize:'1rem', background: '#eff6ff', color: '#3b82f6', marginLeft: 'auto'}}><FiCalendar /></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                           <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 12.4% <span style={{fontSize: '0.65rem'}}>vs last week</span></div>
                           <div style={{ width: '60px', height: '24px' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={a_sparklineWeek}>
                                   <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{r: 1, fill: '#3b82f6'}} />
                                </LineChart>
                             </ResponsiveContainer>
                           </div>
                        </div>
                      </div>

                      <div className="stat-card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                           <div>
                             <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>THIS MONTH</div>
                             <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>4,562</div>
                           </div>
                           <div className="stat-icon" style={{width:32, height:32, fontSize:'1rem', background: '#f3e8ff', color: '#a855f7', marginLeft: 'auto'}}><FiBarChart2 /></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                           <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 15.6% <span style={{fontSize: '0.65rem'}}>vs last month</span></div>
                           <div style={{ width: '60px', height: '24px' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={a_sparklineMonth}>
                                   <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={{r: 1, fill: '#a855f7'}} />
                                </LineChart>
                             </ResponsiveContainer>
                           </div>
                        </div>
                      </div>

                      <div className="stat-card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                           <div>
                             <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>AVG. DAILY CHECK-INS</div>
                             <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>152</div>
                           </div>
                           <div className="stat-icon" style={{width:32, height:32, fontSize:'1rem', background: '#fff7ed', color: '#f97316', marginLeft: 'auto'}}><FiClock /></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                           <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 9.3% <span style={{fontSize: '0.65rem'}}>vs last month</span></div>
                           <div style={{ width: '60px', height: '24px' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={a_sparklineAvg}>
                                   <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={{r: 1, fill: '#f97316'}} />
                                </LineChart>
                             </ResponsiveContainer>
                           </div>
                        </div>
                      </div>

                      <div className="stat-card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                           <div>
                             <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>MEMBERS ABSENT TODAY</div>
                             <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>64</div>
                           </div>
                           <div className="stat-icon" style={{width:32, height:32, fontSize:'1rem', background: '#fef2f2', color: '#ef4444', marginLeft: 'auto'}}><FiUserX /></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                           <div className="stat-trend negative" style={{fontSize: '0.7rem'}}>↓ 6.2% <span style={{fontSize: '0.65rem'}}>vs yesterday</span></div>
                           <div style={{ width: '60px', height: '24px' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={a_sparklineAbsent}>
                                   <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{r: 1, fill: '#ef4444'}} />
                                </LineChart>
                             </ResponsiveContainer>
                           </div>
                        </div>
                      </div>
                   </div>

                   
            {/* BOTTOM ROW (HEATMAP, CALENDAR, ABSENTEES) */}
                   <div className="attendance-bottom-row" style={{ display: 'flex', gap: '24px' }}>
                      <div className="chart-card" style={{ flex: 1, padding: '24px' }}>
                         <div className="chart-card-header"><h3 style={{fontSize: '1rem'}}>Attendance Heatmap</h3></div>
                         <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '20px', paddingTop: '20px', fontSize: '0.65rem', color: '#64748b' }}>
                               <span>6 AM</span><span>9 AM</span><span>12 PM</span><span>3 PM</span><span>6 PM</span><span>9 PM</span>
                            </div>
                            <div style={{ flex: 1 }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingLeft: '12px', paddingRight: '12px', fontSize: '0.65rem', color: '#64748b' }}>
                                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                               </div>
                               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', gap: '4px', height: '160px' }}>
                                  {heatmapData.map((val, i) => (
                                     <div key={i} title={`${val} check-ins`} style={{ background: getColorForHeat(val, maxHeat), borderRadius: '4px' }}></div>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.7rem', color: '#94a3b8' }}>
                            <span>Low</span>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', width: '200px', height: '8px', background: 'linear-gradient(to right, #dcfce7, #15803d)', borderRadius: '4px' }}></div>
                            <span>High</span>
                         </div>
                      </div>

                      <div className="chart-card" style={{ flex: 1, padding: '24px' }}>
                         <div className="chart-card-header" style={{ marginBottom: '8px' }}><h3 style={{fontSize: '1rem'}}>Attendance Calendar</h3></div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>‹</button>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>May 2024</span>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                               <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>›</button>
                               <span style={{ fontSize: '0.75rem', color: '#64748b', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>Today</span>
                            </div>
                         </div>
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                         </div>
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontSize: '0.85rem', color: '#0f172a', fontWeight: '500' }}>
                            <span style={{color: '#94a3b8'}}>29</span><span style={{color: '#94a3b8'}}>30</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                            <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span>
                            <span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span>
                            <span>20</span><span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span>
                            <span>27</span><span>28</span><span>29</span><span>30</span>
                            <span style={{ background: '#0f172a', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>31</span>
                            <span style={{color: '#94a3b8'}}>1</span><span style={{color: '#94a3b8'}}>2</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '24px', fontSize: '0.7rem', color: '#64748b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></div> Present</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316' }}></div> Late</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}></div> Absent</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1' }}></div> No Data</div>
                         </div>
                      </div>

                      <div className="list-card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                         <div className="list-header" style={{ marginBottom: '16px' }}>
                           <h3 style={{ fontSize: '1rem' }}>Absentees Today (10)</h3>
                           <span style={{ fontSize: '0.75rem', color: '#64748b', cursor: 'pointer' }}>View All</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
                            <span>Member</span><span style={{marginRight: '20px'}}>Last Check-in</span>
                         </div>
                         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {['Rohit Verma', 'Pooja Mehta', 'Manish Singh', 'Kavya Nair', 'Suresh Patel'].map((name, i) => (
                               <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                     <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} alt="user" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                     <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>{name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{i%2===0?'Monthly Plan':'Quarterly Plan'}</div>
                                     </div>
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>
                                     {31 - (i+2)} May 2024
                                  </div>
                                  <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#ef4444' }}>
                                     {i+2} Days
                                  </div>
                               </div>
                            ))}
                         </div>
                         <button style={{ width: '100%', padding: '10px', marginTop: '16px', background: 'transparent', border: 'none', color: '#0f172a', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                           View All Absentees →
                         </button>
                       </div>
                    </div>
                 
          </div>
          {/* RIGHT SIDEBAR */}
                <div className="attendance-sidebar" style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                   
                   {/* Summary Donut */}
                   <div className="chart-card" style={{ padding: '24px' }}>
                      <div className="chart-card-header"><h3 style={{fontSize: '0.9rem'}}>Today's Check-in Summary</h3></div>
                      <div style={{ position: 'relative', height: '160px', marginTop: '12px' }}>
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie data={a_donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                               {a_donutData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                             </Pie>
                             <Tooltip />
                           </PieChart>
                         </ResponsiveContainer>
                         <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a' }}>186</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total</div>
                         </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                         {a_donutData.slice(0,3).map((item, i) => (
                           <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }}></div> <span style={{ color: '#475569', fontWeight: '500' }}>{item.name}</span></div>
                             <div style={{fontWeight: '700', color: '#0f172a'}}>{item.value} <span style={{fontSize: '0.65rem', color: '#94a3b8', fontWeight: 'normal'}}>({Math.round((item.value/186)*100)}%)</span></div>
                           </div>
                         ))}
                         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#94a3b8' }}></div> <span style={{ color: '#475569', fontWeight: '500' }}>Not Marked</span></div>
                           <div style={{fontWeight: '700', color: '#0f172a'}}>0 <span style={{fontSize: '0.65rem', color: '#94a3b8', fontWeight: 'normal'}}>(0%)</span></div>
                         </div>
                      </div>
                   </div>

                   {/* Peak Hours */}
                   <div className="chart-card" style={{ padding: '24px' }}>
                      <div className="chart-card-header"><h3 style={{fontSize: '0.9rem'}}>Peak Hours</h3></div>
                      <div style={{ width: '100%', height: '140px', marginTop: '16px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={a_peakHoursData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} interval="preserveStartEnd" />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorPeak)" activeDot={{ r: 4 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   {/* Attendance Devices */}
                   <div className="chart-card" style={{ padding: '24px', flex: 1 }}>
                      <div className="chart-card-header" style={{ marginBottom: '16px' }}>
                        <h3 style={{fontSize: '0.9rem'}}>Attendance Devices</h3>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', cursor: 'pointer' }}>View All</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                         <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                               <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '1.2rem' }}>
                                  <FiMonitor />
                               </div>
                               <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>Main Gate Device</div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Biometric</div>
                               </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '600', color: '#10b981' }}>
                               Online <span>›</span>
                            </div>
                         </div>

                         <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                               <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '1.2rem' }}>
                                  <FiMonitor />
                               </div>
                               <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>Cardio Area Device</div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Biometric</div>
                               </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '600', color: '#10b981' }}>
                               Online <span>›</span>
                            </div>
                         </div>

                         <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                               <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '1.2rem' }}>
                                  <FiSmartphone />
                               </div>
                               <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>Studio Device</div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>QR Scanner</div>
                               </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '600', color: '#ef4444' }}>
                                  Offline <span>›</span>
                               </div>
                               <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>2h ago</span>
                            </div>
                         </div>

                         <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                               <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '1.2rem' }}>
                                  <FiMonitor />
                               </div>
                               <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>Yoga Area Device</div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Biometric</div>
                               </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '600', color: '#10b981' }}>
                               Online <span>›</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             
      )}

      {(activeAttendanceTab === 'members' || activeAttendanceTab === 'trainers') && (
        <div className="attendance-layout" style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* MAIN DATA GRID & TOOLBAR */}
                   <div className="list-card" style={{ padding: '0', overflowX: 'auto' }}>
                      <div className="filter-toolbar" style={{ borderBottom: '1px solid #e2e8f0', margin: 0, padding: '16px 20px', borderRadius: '16px 16px 0 0', boxShadow: 'none' }}>
                         <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input 
                                  type="date" 
                                  className="filter-date filter-select" 
                                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', background: '#fff', cursor: 'pointer', outline: 'none' }}
                                  value={selectedDate}
                                  onChange={(e) => setSelectedDate(e.target.value)}
                                />
                                <select
                                  className="filter-select"
                                  value={activeMethodFilter}
                                  onChange={(e) => setActiveMethodFilter(e.target.value)}
                                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', background: '#fff', outline: 'none' }}
                                >
                                  <option value="All">All Check-ins</option>
                                  <option value="Biometric">Biometric</option>
                                  <option value="QR Code">QR Check-in</option>
                                  <option value="Manual">Manual</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn-export" onClick={handleExport}><FiDownload /> Export</button>
                                <button className="btn-primary" style={{ background: '#3b82f6', border: 'none' }} onClick={() => setShowQRModal(true)}><FiSmartphone /> Show QR Code</button>
                                <button className="btn-primary" style={{ background: '#f97316', border: 'none' }} onClick={() => setShowManualModal(true)}><FiPlus /> Manual Check-in</button>
                            </div>
                         </div>
                      </div>

                       <div style={{ maxHeight: '65vh', overflow: 'auto' }}>
                          <table className="attendance-table" style={{ minWidth: '1000px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                             <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
                               <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                 <th style={{ padding: '10px 16px', width: '40px' }}><input type="checkbox" /></th>
                              <th style={{ padding: '10px 16px' }}>{activeAttendanceTab === 'trainers' ? 'TRAINER ID' : 'MEMBER ID'} <FiChevronDown style={{display:'inline', verticalAlign:'middle'}}/></th>
                              <th style={{ padding: '10px 16px' }}>{activeAttendanceTab === 'trainers' ? 'TRAINER' : 'MEMBER'}</th>
                              <th style={{ padding: '10px 16px' }}>CHECK-IN TIME</th>
                              <th style={{ padding: '10px 16px' }}>CHECK-OUT TIME</th>
                              <th style={{ padding: '10px 16px' }}>METHOD</th>
                              <th style={{ padding: '10px 16px' }}>{activeAttendanceTab === 'trainers' ? '-' : 'TRAINER'}</th>
                              <th style={{ padding: '10px 16px' }}>BRANCH</th>
                              <th style={{ padding: '10px 16px' }}>STATUS</th>
                              <th style={{ padding: '10px 16px' }}>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDataList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((m, i) => {
                              const isPresent = m.a_status === 'Present';
                              const isLate = m.a_status === 'Late';
                              const isAbsent = m.a_status === 'Absent';

                              return (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 16px' }}><input type="checkbox" /></td>
                                <td style={{ padding: '10px 16px', color: '#64748b' }}>{activeAttendanceTab === 'trainers' ? `T-${m.id}` : `M-${1000 + m.id}`}</td>
                                <td style={{ padding: '10px 16px' }}>
                                  <div className="user-info-wrapper" style={{ gap: '8px' }}>
                                    <img src={m.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name || 'Member')}&background=random`} alt="user" className="user-avatar" style={{width: 28, height: 28, objectFit: 'cover'}}/>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <h4 style={{fontSize: '0.8rem', margin: 0, fontWeight: '600', color: '#0f172a'}}>{m.full_name || 'Member'}</h4>
                                      <span style={{fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px'}}>{m.plan_type || 'Monthly Plan'}</span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '10px 16px', fontWeight: '600', color: isPresent ? '#22c55e' : (isLate ? '#f59e0b' : '#64748b') }}>{m.a_in}</td>
                                <td style={{ padding: '10px 16px', fontWeight: '500', color: '#64748b' }}>{m.a_out}</td>
                                <td style={{ padding: '10px 16px' }}>
                                  {m.a_method === 'Biometric' && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}><FiMonitor /> <span style={{fontSize: '0.75rem', color: '#64748b'}}>Biometric</span></div>}
                                  {m.a_method === 'QR Code' && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6' }}><FiCamera /> <span style={{fontSize: '0.75rem', color: '#64748b'}}>QR Code</span></div>}
                                  {m.a_method === 'Manual' && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f97316' }}><FiUserCheck /> <span style={{fontSize: '0.75rem', color: '#64748b'}}>Manual</span></div>}
                                </td>
                                <td style={{ padding: '10px 16px', color: '#475569' }}>
                                   {m.a_trainer && m.a_trainer !== 'N/A' ? (
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img src={m.trainerProfilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.a_trainer)}&background=random`} alt="trainer" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                        <span style={{ fontSize: '0.75rem' }}>{m.a_trainer}</span>
                                     </div>
                                   ) : (
                                     <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>
                                   )}
                                </td>
                                <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '0.75rem' }}>Main Branch</td>
                                <td style={{ padding: '10px 16px' }}>
                                  <span className={isPresent ? 'text-green' : (isLate ? 'text-orange' : 'text-red')} style={{fontSize: '0.75rem', padding: '4px 10px', background: isPresent ? '#dcfce7' : (isLate ? '#fff7ed' : '#fef2f2'), borderRadius: '12px'}}>{m.a_status}</span>
                                </td>
                                <td style={{ padding: '10px 16px', position: 'relative' }}>
                                  <div className="action-icons" style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                                    <FiEye style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setViewAttendance(m)} />
                                    <FiMoreVertical style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setOpenActionId(openActionId === m.id ? null : m.id)} />
                                    {openActionId === m.id && (
                                      <div style={{ position: 'absolute', right: 0, top: '24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 100, width: '120px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <button onClick={() => { setEditAttendance({...m}); setOpenActionId(null); }} style={{ padding: '8px 12px', border: 'none', background: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', color: '#334155', borderBottom: '1px solid #f1f5f9' }}>Edit</button>
                                        <button onClick={() => handleDelete(m.id)} style={{ padding: '8px 12px', border: 'none', background: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', color: '#ef4444' }}>Delete</button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )})}
                         </tbody>
                      </table>
                       </div>

                      <div className="pagination" style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
                        <div>
                          Showing {filteredDataList.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDataList.length)} of {filteredDataList.length} {activeAttendanceTab === 'trainers' ? 'trainers' : 'members'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <select 
                            value={itemsPerPage} 
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#475569', background: '#fff' }}
                          >
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                          </select>
                          <div className="page-controls">
                            <button 
                              className="page-btn" 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                              disabled={currentPage === 1}
                              style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                              ‹
                            </button>
                            
                            {Array.from({ length: Math.max(1, Math.ceil(filteredDataList.length / itemsPerPage)) }, (_, i) => i + 1)
                              .filter(page => {
                                const total = Math.max(1, Math.ceil(filteredDataList.length / itemsPerPage));
                                if (total <= 5) return true;
                                if (page === 1 || page === total) return true;
                                if (Math.abs(currentPage - page) <= 1) return true;
                                return false;
                              })
                              .map((page, index, array) => {
                                return (
                                  <React.Fragment key={page}>
                                    {index > 0 && array[index - 1] !== page - 1 && (
                                      <span style={{ padding: '4px', color: '#94a3b8' }}>...</span>
                                    )}
                                    <button 
                                      className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                      onClick={() => setCurrentPage(page)}
                                    >
                                      {page}
                                    </button>
                                  </React.Fragment>
                                );
                              })
                            }

                            <button 
                              className="page-btn" 
                              onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredDataList.length / itemsPerPage), p + 1))} 
                              disabled={currentPage === Math.max(1, Math.ceil(filteredDataList.length / itemsPerPage))}
                              style={{ opacity: currentPage === Math.max(1, Math.ceil(filteredDataList.length / itemsPerPage)) ? 0.5 : 1, cursor: currentPage === Math.max(1, Math.ceil(filteredDataList.length / itemsPerPage)) ? 'not-allowed' : 'pointer' }}
                            >
                              ›
                            </button>
                          </div>
                        </div>
                      </div>
                   </div>

                   
          </div>
        </div>
      )}

      {showQRModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                   <div className="modal-content" style={{ background: '#fff', padding: '32px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '1.25rem' }}>Gym Attendance QR Code</h2>
                      <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.9rem' }}>Members and Trainers can scan this code to check in and check out.</p>
                      
                      <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', display: 'inline-block', marginBottom: '24px' }}>
                         <QRCodeCanvas id="qr-canvas" value={qrUrl} size={200} level={"H"} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                         <button onClick={() => setShowQRModal(false)} className="btn-primary" style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 24px' }}>Close</button>
                         <button onClick={handleDownloadPDF} className="btn-primary" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 24px' }}>Download PDF</button>
                      </div>
                   </div>
                </div>
             )}

      {showManualModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
           <div className="modal-content" style={{ background: '#fff', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '1.25rem' }}>Manual Check-in</h2>
              <div style={{ marginBottom: '16px' }}>
                 <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Role</label>
                 <select 
                    value={manualRole} 
                    onChange={(e) => {
                       setManualRole(e.target.value);
                       setSearchTerm('');
                       setManualId('');
                    }} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                 >
                    <option value="member">Member</option>
                    <option value="trainer">Trainer</option>
                 </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                 <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{manualRole === 'trainer' ? 'Trainer' : 'Member'}</label>
                 <div style={{ position: 'relative' }} ref={dropdownRef}>
                     <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowDropdown(true);
                          setManualId('');
                        }} 
                        onFocus={() => setShowDropdown(true)}
                        placeholder={`Search ${manualRole} by ID or Name...`} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} 
                     />
                     
                     {showDropdown && (
                        <ul style={{ position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '200px', overflowY: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 10, listStyle: 'none', padding: 0, margin: '4px 0 0 0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            {filteredList.map(item => (
                                <li 
                                  key={item.id} 
                                  style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem' }}
                                  onClick={() => {
                                      setManualId(item.id.toString());
                                      setSearchTerm(`${manualRole === 'member' ? 'M' : 'T'}-${item.id} - ${item.full_name || item.name}`);
                                      setShowDropdown(false);
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                  onMouseLeave={(e) => e.target.style.background = '#fff'}
                                >
                                  <span style={{ fontWeight: '600', color: '#3b82f6', marginRight: '8px' }}>{manualRole === 'member' ? 'M' : 'T'}-{item.id}</span>
                                  {item.full_name || item.name}
                                </li>
                            ))}
                            {filteredList.length === 0 && <li style={{ padding: '10px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No results found (Trainers: {trainersList.length})</li>}
                        </ul>
                     )}
                 </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                 <button onClick={() => {setShowManualModal(false); setManualId(''); setSearchTerm('');}} className="btn-primary" style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 24px' }}>Cancel</button>
                 <button onClick={handleManualSubmit} className="btn-primary" style={{ background: '#f97316', color: '#fff', border: 'none', padding: '10px 24px' }}>Submit</button>
              </div>
           </div>
        </div>
      )}

      {viewAttendance && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Attendance Details</h3>
              <FiXCircle style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }} onClick={() => setViewAttendance(null)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={viewAttendance.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewAttendance.full_name || 'User')}&background=random`} alt="user" style={{width: 50, height: 50, borderRadius: '50%', objectFit: 'cover'}}/>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>{viewAttendance.full_name || viewAttendance.name || 'User'}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>ID: {viewAttendance.id}</p>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Check-in</p>
                  <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{viewAttendance.a_in}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Check-out</p>
                  <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{viewAttendance.a_out || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Status</p>
                  <p style={{ margin: 0, fontWeight: '600', color: viewAttendance.a_status === 'Present' ? '#22c55e' : (viewAttendance.a_status === 'Late' ? '#f59e0b' : '#ef4444') }}>{viewAttendance.a_status}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Method</p>
                  <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{viewAttendance.a_method}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setViewAttendance(null)} className="btn-primary" style={{ width: '100%', marginTop: '24px', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {editAttendance && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Edit Attendance</h3>
              <FiXCircle style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }} onClick={() => setEditAttendance(null)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>Check-in Time</label>
                <input type="time" step="1" value={editAttendance.a_in || ''} onChange={(e) => setEditAttendance({...editAttendance, a_in: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>Check-out Time</label>
                <input type="time" step="1" value={editAttendance.a_out || ''} onChange={(e) => setEditAttendance({...editAttendance, a_out: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>Status</label>
                <select value={editAttendance.a_status || ''} onChange={(e) => setEditAttendance({...editAttendance, a_status: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>Method</label>
                <select value={editAttendance.a_method || ''} onChange={(e) => setEditAttendance({...editAttendance, a_method: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                  <option value="QR Code">QR Code</option>
                  <option value="Biometric">Biometric</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setEditAttendance(null)} style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ flex: 1, padding: '12px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
           </>
  );
};

export default AttendanceSection;
