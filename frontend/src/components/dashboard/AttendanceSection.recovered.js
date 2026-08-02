const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\DELL\\Desktop\\All Projects\\Gym App\\frontend\\src\\components\\dashboard\\AttendanceSection.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Find TOP STAT CARDS block
// 2. Find MAIN DATA GRID & TOOLBAR block
// 3. Find BOTTOM ROW block
// 4. Find RIGHT SIDEBAR block

const topStatsStart = content.indexOf('{/* TOP STAT CARDS */}');
const mainDataGridStart = content.indexOf('{/* MAIN DATA GRID & TOOLBAR */}');
const bottomRowStart = content.indexOf('{/* BOTTOM ROW (HEATMAP, CALENDAR, ABSENTEES) */}');
const rightSidebarStart = content.indexOf('{/* RIGHT SIDEBAR */}');

// First, we extract each chunk:
const preLayoutEnd = content.indexOf('<div className="attendance-layout"');
const layoutStart = content.substring(preLayoutEnd, topStatsStart);
const topStatsCode = content.substring(topStatsStart, mainDataGridStart);
const mainDataGridCode = content.substring(mainDataGridStart, bottomRowStart);

// The bottom row ends when the flex: 1 div closes. That's right before RIGHT SIDEBAR, minus the closing div of flex: 1.
let bottomRowCode = content.substring(bottomRowStart, rightSidebarStart);
// Trim the last </div> which belongs to flex: 1 wrapper.
const lastDivIndex = bottomRowCode.lastIndexOf('</div>');
if (lastDivIndex !== -1) {
    bottomRowCode = bottomRowCode.substring(0, lastDivIndex);
}

// Right sidebar starts at rightSidebarStart and ends at the closing of attendance-layout.
let rightSidebarCodeAndModal = content.substring(rightSidebarStart);

// Let's assemble the new return:

const newReturn = `
    <>
      {activeAttendanceTab === 'overview' && (
        <div className="attendance-layout" style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            ${topStatsCode}
            ${bottomRowCode}
          </div>
          ${rightSidebarCodeAndModal.split('{showQRModal && (')[0]}
      )}

      {(activeAttendanceTab === 'members' || activeAttendanceTab === 'trainers') && (
        <div className="attendance-layout" style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            ${mainDataGridCode.replace('dataList.slice(0, 8)', 'filteredDataList')}
          </div>
        </div>
      )}

      {showQRModal && (${rightSidebarCodeAndModal.split('{showQRModal && (')[1]}
`;

const finalContent = content.substring(0, preLayoutEnd) + newReturn;

// Add filteredDataList logic near dataList definition
const dataListDefEnd = finalContent.indexOf('a_processedAttendance;') + 'a_processedAttendance;'.length;
const filteredDataListLogic = `

  const filteredDataList = dataList.filter(m => {
     if (activeAttendanceTab === 'members') return m.a_trainer === 'N/A' || !m.a_trainer; // Approximate check
     if (activeAttendanceTab === 'trainers') return m.a_trainer !== 'N/A' && m.a_trainer; // Approximate check
     return true;
  });
`;

let veryFinalContent = finalContent.substring(0, dataListDefEnd) + filteredDataListLogic + finalContent.substring(dataListDefEnd);

fs.writeFileSync(filePath, veryFinalContent);
console.log('Done!');
