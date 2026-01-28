// --- Store Management ---
const STORE_KEY = 'attendance_app_v2';

const defaultState = {
    settings: {
        retailers: ['Xcite', 'Eureka', 'Best', 'Lulu', 'Jarir'],
        locations: ['Al Rai', 'Avenues', 'Baitak', 'Boulevard', 'Egaila', 'Fadalah', 'Fahaheel', 'Farwaniya', 'Gazzali', 'Hawally', 'Jleeb', 'Jahra', 'Kuwait City', 'Qurain', 'Salmiya', 'Salmiya Souk', 'Yaal Mall'],
        departments: ['Lenovo IT', 'Asus', 'Motorola', 'Razer', 'Steelseries', 'Toshiba', 'Logitech', 'Anker'],
        designations: ['Promoter', 'Supervisor', 'VM']
    },
    currentSheet: {
        empName: '', civilId: '', retailer: '', location: '', department: '', designation: '',
        month: new Date().getMonth(), year: new Date().getFullYear(),
        attendance: {}
    },
    savedSheets: []
};

let appState = JSON.parse(localStorage.getItem(STORE_KEY)) || defaultState;

// Repair State
['retailers', 'locations', 'departments', 'designations'].forEach(key => {
    if (!appState.settings[key] || !Array.isArray(appState.settings[key])) {
        appState.settings[key] = defaultState.settings[key];
    }
});

function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify(appState));
}

function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
}

// --- Theme ---
function initTheme() {
    const saved = localStorage.getItem('theme_preference');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (system ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme_preference', next);
    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (btn) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}"></i>`;
        refreshIcons();
    }
}

// --- Modals ---
// --- Modals ---
function showMessage(title, text, type = 'info', allowHtml = false) {
    const modal = document.getElementById('message-modal');
    document.getElementById('message-title').textContent = title;

    const textEl = document.getElementById('message-text');
    if (allowHtml) textEl.innerHTML = text;
    else textEl.textContent = text;

    const iconMap = { info: 'info', success: 'check-circle', warning: 'alert-triangle', error: 'x-circle' };
    const iconEl = document.getElementById('message-icon');
    iconEl.className = `message-icon ${type}`;
    iconEl.innerHTML = `<i data-lucide="${iconMap[type]}"></i>`;

    document.getElementById('message-buttons').innerHTML = `<button class="btn btn-primary" onclick="closeMessage()">OK</button>`;
    modal.classList.remove('hidden');
    refreshIcons();
}

function showConfirm(title, text, onConfirm) {
    const modal = document.getElementById('message-modal');
    document.getElementById('message-title').textContent = title;
    document.getElementById('message-text').textContent = text;

    const iconEl = document.getElementById('message-icon');
    iconEl.className = `message-icon warning`;
    iconEl.innerHTML = `<i data-lucide="alert-triangle"></i>`;

    document.getElementById('message-buttons').innerHTML = `
        <button class="btn btn-secondary" onclick="closeMessage()">No</button>
        <button class="btn btn-primary" onclick="window._confirmAction()">Yes</button>
    `;
    window._confirmAction = () => { onConfirm(); closeMessage(); };
    modal.classList.remove('hidden');
    refreshIcons();
}

function closeMessage() {
    document.getElementById('message-modal').classList.add('hidden');
}

// --- UI Logic ---
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Ramadan Dates (Approximate)
const RAMADAN_DATES = {
    2025: { start: '02-28', end: '03-30' },
    2026: { start: '02-17', end: '03-19' },
    2027: { start: '02-07', end: '03-08' },
    2028: { start: '01-27', end: '02-25' },
    2029: { start: '01-15', end: '02-13' },
    2030: { start: '01-05', end: '02-03' }
};

function getDaysInMonth(year, month) {
    return new Date(year, parseInt(month) + 1, 0).getDate();
}

function isRamadan(dateObj) {
    const y = dateObj.getFullYear();
    const range = RAMADAN_DATES[y];
    if (!range) return false;

    // Create Date objects for range (at midnight)
    // Date string format is MM-DD, so we append Year
    const start = new Date(`${y}-${range.start}T00:00:00`);
    const end = new Date(`${y}-${range.end}T23:59:59`);

    // Check if dateObj falls within
    return dateObj >= start && dateObj <= end;
}

function getDefaultTimes(dateObj) {
    if (isRamadan(dateObj)) {
        return { inHour: '07', inMin: '00', inAmPm: 'PM', outHour: '01', outMin: '00', outAmPm: 'AM' };
    }
    return { inHour: '01', inMin: '00', inAmPm: 'PM', outHour: '10', outMin: '00', outAmPm: 'PM' };
}

function updateAllDropdowns() {
    const s = appState.currentSheet;
    document.getElementById('retailerText').textContent = s.retailer || 'Select Retailer';
    document.getElementById('locationText').textContent = s.location || 'Select Location';
    document.getElementById('deptText').textContent = s.department || 'Select Department';
    document.getElementById('desigText').textContent = s.designation || 'Select Designation';
    document.getElementById('monthText').textContent = MONTH_NAMES[parseInt(s.month)] || 'Select Month';
    document.getElementById('yearText').textContent = s.year || 'Select Year';

    renderSettingsList('retailerList', appState.settings.retailers, 'retailers');
    renderSettingsList('locationList', appState.settings.locations, 'locations');
    renderSettingsList('deptList', appState.settings.departments, 'departments');
    renderSettingsList('desigList', appState.settings.designations, 'designations');
}

// --- Audio ---
let audioCtx = null;
function playTick() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // "Tik" Sound Synthesis
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.03);
}

// --- Picker ---
function openPicker(type, currentVal, callback) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const modal = document.getElementById('picker-modal');
    const body = document.getElementById('picker-body');
    const title = document.getElementById('picker-title');

    body.innerHTML = '';
    modal.classList.remove('hidden');
    document.body.classList.add('no-scroll');

    let options = [];
    if (type === 'retailer') options = appState.settings.retailers.map(x => ({ label: x, value: x }));
    else if (type === 'location') options = appState.settings.locations.map(x => ({ label: x, value: x }));
    else if (type === 'department') options = appState.settings.departments.map(x => ({ label: x, value: x }));
    else if (type === 'designation') options = appState.settings.designations.map(x => ({ label: x, value: x }));
    else if (type === 'month') options = MONTH_NAMES.map((m, i) => ({ label: m, value: i.toString() }));
    else if (type === 'year') { for (let i = 2025; i <= 2036; i++) options.push({ label: i.toString(), value: i.toString() }); }
    else if (type === 'ampm') options = [{ label: 'AM', value: 'AM' }, { label: 'PM', value: 'PM' }];
    else if (type === 'remarks') options = ['', 'Weekly Off', 'Comp Off', 'Vacation', 'Emergency Leave', 'Sick Leave', 'Umrah Leave', 'Unpaid Leave', 'Not Joined'].map(x => ({ label: x || 'None', value: x }));
    else if (type === 'time') {
        const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        for (let h of hours) {
            for (let m = 0; m < 60; m += 15) {
                let t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                options.push({ label: t, value: t });
            }
        }
    }

    title.textContent = 'Select ' + type;

    let selectedValue = currentVal || (options[0] ? options[0].value : '');

    options.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'picker-option';
        div.textContent = opt.label;
        div.dataset.value = opt.value;
        div.onclick = () => {
            // Just scroll to item on click
            const index = Array.from(body.children).indexOf(div);
            body.scrollTop = index * 50;
        };
        body.appendChild(div);
    });

    // Scroll Logic for Active State
    let lastIndex = -1;
    const updateActive = () => {
        const center = body.scrollTop + 130;
        const index = Math.floor(center / 50) - 2;

        if (index !== lastIndex) {
            if (lastIndex !== -1) playTick();
            lastIndex = index;
        }

        Array.from(body.children).forEach((child, i) => {
            if (i === index) {
                child.classList.add('picker-option-active');
                selectedValue = child.dataset.value;
            } else {
                child.classList.remove('picker-option-active');
            }
        });
    };

    body.onscroll = updateActive;

    // Confirm Button Logic
    const confirmBtn = document.getElementById('pickerConfirmBtn');
    // Remove old listener to avoid duplicates
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.onclick = () => {
        callback(selectedValue);
        modal.classList.add('hidden');
        document.body.classList.remove('no-scroll');
    };

    // Ensure icon is visible after clone
    refreshIcons();

    if (currentVal) {
        setTimeout(() => {
            const found = Array.from(body.children).find(el => el.textContent === (options.find(o => o.value === currentVal)?.label || currentVal));
            if (found) {
                found.scrollIntoView({ block: 'center' });
                setTimeout(updateActive, 50);
            } else {
                updateActive();
            }
        }, 50);
    } else {
        setTimeout(updateActive, 50);
    }
}

window.openHeaderPicker = (type) => {
    let val = appState.currentSheet[type];
    if (type === 'month') val = appState.currentSheet.month.toString();

    openPicker(type, val, (newVal) => {
        if (type === 'month') appState.currentSheet.month = parseInt(newVal);
        else appState.currentSheet[type] = newVal;

        if (type === 'month' || type === 'year') renderAttendanceGrid();
        saveState();
        updateAllDropdowns();
    });
}

window.openGridTimePicker = (dateKey, hField, mField, hVal, mVal) => {
    let cur = (hVal && mVal) ? `${hVal}:${mVal}` : '';
    openPicker('time', cur, (val) => {
        const [h, m] = val.split(':');
        updateAttendance(dateKey, hField, h);
        updateAttendance(dateKey, mField, m);
    });
}

window.openGridPicker = (dateKey, field, type, val) => {
    openPicker(type, val, (newVal) => updateAttendance(dateKey, field, newVal));
}

// --- Attendance Grid ---
function renderAttendanceGrid() {
    const container = document.getElementById('attendance-list');
    container.innerHTML = '';
    const s = appState.currentSheet;
    const days = getDaysInMonth(s.year, s.month);

    for (let i = 1; i <= days; i++) {
        const dateKey = `${s.year}-${String(parseInt(s.month) + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dateObj = new Date(s.year, s.month, i);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const isFri = dayName === 'Fri';

        // Defaults
        // Normal: 01:00 PM - 10:00 PM
        // Ramadan: 07:00 PM - 01:00 AM
        let defInH = '01', defInAmPm = 'PM', defOutH = '10', defOutAmPm = 'PM';

        if (isRamadan(dateObj)) {
            defInH = '07';
            defOutH = '01'; defOutAmPm = 'AM';
        }

        let d = s.attendance[dateKey] || { inHour: defInH, inMin: '00', inAmPm: defInAmPm, outHour: defOutH, outMin: '00', outAmPm: defOutAmPm, remarks: '' };

        if (!s.attendance[dateKey]) d = { ...d };

        const row = document.createElement('div');
        row.className = `attendance-day ${isFri ? 'weekend' : ''}`;

        const timeHTML = (h, m, ap, hKey, mKey, apKey) => {
            const dis = !!d.remarks;
            return `
            <div class="select-box time-box${dis ? ' disabled' : ''}" ${dis ? '' : `onclick="openGridTimePicker('${dateKey}', '${hKey}', '${mKey}', '${h}', '${m}')"`}><span>${(h && m) ? h + ':' + m : '--:--'}</span></div>
            <div class="select-box ampm-box${dis ? ' disabled' : ''}" ${dis ? '' : `onclick="openGridPicker('${dateKey}', '${apKey}', 'ampm', '${ap}')"`}><span>${ap || '--'}</span></div>
        `;
        };

        row.innerHTML = `
            <div class="row-top">
                <div class="day-info"><span>${i}</span><small>${dayName}</small></div>
                <div class="time-group">${timeHTML(d.inHour, d.inMin, d.inAmPm, 'inHour', 'inMin', 'inAmPm')}</div>
                <div class="time-group">${timeHTML(d.outHour, d.outMin, d.outAmPm, 'outHour', 'outMin', 'outAmPm')}</div>
                <div class="select-box remark-select" onclick="openGridPicker('${dateKey}', 'remarks', 'remarks', '${d.remarks}')">
                    <span>${d.remarks || '-'}</span><i data-lucide="chevron-down" class="select-icon"></i>
                </div>
            </div>
        `;
        container.appendChild(row);
    }
    refreshIcons();
}

function updateAttendance(key, field, val) {
    if (!appState.currentSheet.attendance[key]) {
        appState.currentSheet.attendance[key] = { inHour: '01', inMin: '00', inAmPm: 'PM', outHour: '10', outMin: '00', outAmPm: 'PM', remarks: '' };
    }
    appState.currentSheet.attendance[key][field] = val;

    if (field === 'remarks') {
        const d = appState.currentSheet.attendance[key];
        if (val) {
            // Clear times if remark is selected
            d.inHour = ''; d.inMin = ''; d.inAmPm = '';
            d.outHour = ''; d.outMin = ''; d.outAmPm = '';
        } else {
            // Restore defaults if remark is cleared
            // Check Ramadan again
            const parts = key.split('-');
            const dateObj = new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);

            if (isRamadan(dateObj)) {
                d.inHour = '07'; d.inMin = '00'; d.inAmPm = 'PM';
                d.outHour = '01'; d.outMin = '00'; d.outAmPm = 'AM';
            } else {
                d.inHour = '01'; d.inMin = '00'; d.inAmPm = 'PM';
                d.outHour = '10'; d.outMin = '00'; d.outAmPm = 'PM';
            }
        }
    }

    saveState();
    renderAttendanceGrid();
}

// --- Settings ---
function renderSettingsList(id, arr, key) {
    const ul = document.getElementById(id);
    ul.innerHTML = '';
    arr.forEach((item, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${item}</span><button class="delete-btn" onclick="delSetting('${key}', ${idx})"><i data-lucide="trash-2"></i></button>`;
        ul.appendChild(li);
    });
    refreshIcons();
}

window.delSetting = (key, idx) => {
    const map = { retailers: 'Retailer', locations: 'Location', departments: 'Department', designations: 'Designation' };
    const label = map[key] || 'Option';
    showConfirm('Delete', `Remove this ${label}?`, () => {
        appState.settings[key].splice(idx, 1);
        saveState();
        updateAllDropdowns();
    });
}

function setupAddSetting(btnId, inpId, key) {
    const btn = document.getElementById(btnId);
    const inp = document.getElementById(inpId);
    if (!btn) return;

    const add = () => {
        const val = inp.value.trim();
        if (!val) return inp.focus();
        let clean;
        // Special logic for Designations: <= 3 chars -> Uppercase (e.g. HR, VM, CEO)
        if (key === 'designations' && val.length <= 3) {
            clean = val.toUpperCase();
        } else {
            clean = val.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        }
        if (appState.settings[key].includes(clean)) return showMessage('Error', 'Exists already', 'warning');
        appState.settings[key].push(clean);
        inp.value = '';
        saveState();
        updateAllDropdowns();
    };
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = add;
    inp.onkeypress = (e) => { if (e.key === 'Enter') add(); };
}

function resetToDefaults(confirm) {
    const run = () => {
        appState.currentSheet.attendance = {};
        renderAttendanceGrid();
        saveState();
        if (confirm) showMessage('Reset', 'Attendance cleared.', 'success');
    };
    if (confirm) showConfirm('Reset', 'Clear all attendance?', run);
    else run();
}

// --- Validation ---
function validateRequiredFields() {
    const s = appState.currentSheet;
    const missing = [];

    if (!s.empName || !s.empName.trim()) missing.push('Employee Name');
    if (!s.civilId || !s.civilId.trim()) missing.push('Civil ID');
    if (!s.retailer || !s.retailer.trim()) missing.push('Retailer');
    if (!s.location || !s.location.trim()) missing.push('Location');
    if (!s.department || !s.department.trim()) missing.push('Department');
    if (!s.designation || !s.designation.trim()) missing.push('Designation');

    if (missing.length > 0) {
        let msg = '<ul style="text-align: left; margin-top: 0.5rem; padding-left: 1.5rem;">';
        missing.forEach(field => msg += `<li>${field}</li>`);
        msg += '</ul>';
        showMessage('Missing Information', `Please fill the following fields:<br>${msg}`, 'warning', true);
        return false;
    }
    return true;
}

// --- 1. HANDLE SAVE PDF (Standalone) ---
// Accepts optional 'data' to print specific saved sheet.
// If data is passed (and is valid), it's a DIRECT DOWNLOAD (no save to history).
// If no data (or event object), it uses currentSheet and SAVES TO HISTORY.
function handleSavePDF(optionalData = null) {
    // Check if optionalData is a real data object (has 'attendance'), not an Event
    const isDirect = optionalData && optionalData.attendance;

    // Validate if creating new save (not downloading history)
    if (!isDirect && !validateRequiredFields()) return;

    const s = isDirect ? optionalData : appState.currentSheet;

    // IF Save from Main Tab (not direct download) -> Save to History
    if (!isDirect) {
        saveToHistory(s);
    }

    const btn = document.getElementById('saveBtn');
    const oldText = btn ? btn.innerHTML : '';
    if (btn && !isDirect) {
        btn.innerHTML = 'Saving...';
        btn.disabled = true;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ format: 'a4', unit: 'pt' });
        const days = getDaysInMonth(s.year, s.month);

        // --- HEADER ---
        // --- HEADER ---
        // Light Blue Background Stripe (Moved Down +15pt)
        doc.setFillColor(220, 230, 241); // Business Light Blue
        doc.rect(40, 55, 515, 30, 'F');

        // Title (Moved Down +15pt)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Monthly Timesheet", 50, 75);

        // --- INFO SECTION (Left & Right Groups) ---
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");

        const labelX_L = 40;
        const valX_L = 130;
        // SHIFTED RIGHT (+50pts total)
        const labelX_R = 350;
        const valX_R = 430;

        const startY = 115; // Moved Down +15pt
        const gap = 15;

        // Helper to draw row
        const drawRow = (y, l1, v1, l2, v2) => {
            doc.setFont("helvetica", "bold");
            doc.text(l1, labelX_L, y);
            doc.text(l2, labelX_R, y);

            doc.setFont("helvetica", "normal");
            doc.text(v1 || '', valX_L, y);
            doc.text(v2 || '', valX_R, y);
        };

        const workLoc = [s.retailer, s.location].filter(Boolean).join(' ');

        drawRow(startY, "Employee Name:", s.empName, "Location:", workLoc);
        drawRow(startY + gap, "Civil ID No.:", s.civilId, "Department:", s.department);
        drawRow(startY + gap * 2, "Month:", `${MONTH_NAMES[s.month]} ${s.year}`, "Designation:", s.designation);

        // --- TABLE ---
        const tableBody = [];
        for (let i = 1; i <= days; i++) {
            const k = `${s.year}-${String(parseInt(s.month) + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dateObj = new Date(s.year, s.month, i);
            const defs = getDefaultTimes(dateObj);
            // Use defaults if missing
            let d = s.attendance[k] || { ...defs, remarks: '' };
            const dateStr = `${String(i).padStart(2, '0')}-${MONTH_NAMES[s.month].substr(0, 3)}-${s.year}`;

            let tIn = '';
            if (d.inHour) tIn = `${d.inHour}:${d.inMin || '00'} ${d.inAmPm || 'AM'}`;

            let tOut = '';
            if (d.outHour) tOut = `${d.outHour}:${d.outMin || '00'} ${d.outAmPm || 'PM'}`;

            tableBody.push([dateStr, dateObj.toLocaleDateString('en-US', { weekday: 'long' }), tIn, tOut, d.remarks || '']);
        }

        doc.autoTable({
            startY: 175, // Moved Down +15pt
            head: [['Date', 'Day', 'Login Time', 'Logout Time', 'Remarks']],
            body: tableBody,
            theme: 'grid',
            // REDUCED PADDING HERE (3 -> 1.5)
            // REDUCED FONT SIZE (10 -> 9)
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.5, textColor: 0, valign: 'middle' },
            // INCREASED HEADER HEIGHT (minCellHeight: 25)
            headStyles: { fillColor: [64, 64, 64], textColor: 255, fontStyle: 'bold', lineColor: 255, lineWidth: 0.5, halign: 'center', minCellHeight: 25, valign: 'middle' },
            columnStyles: {
                0: { cellWidth: 103, halign: 'left' },
                1: { cellWidth: 103, halign: 'left' },
                2: { cellWidth: 103, halign: 'left' },
                3: { cellWidth: 103, halign: 'left' },
                4: { cellWidth: 103, halign: 'left' }
            },
            margin: { left: 40, right: 40 },
            tableWidth: 515
        });

        // --- FOOTER ---
        const finalY = doc.lastAutoTable.finalY + 40;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Verified by:", 40, finalY);

        const fname = `${s.empName.replace(/\s/g, '_')}_${MONTH_NAMES[s.month]}_Timesheet.pdf`;

        // --- SHARE LOGIC ---
        // Generate Blob
        const blob = doc.output('blob');
        const file = new File([blob], fname, { type: 'application/pdf' });

        // Check for Web Share API support
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                files: [file],
                title: 'Monthly Timesheet',
                text: `Here is the timesheet for ${MONTH_NAMES[s.month]} ${s.year}.`,
            })
                .then(() => {
                    if (!isDirect) showMessage('Success', 'PDF Shared & Data Stored!', 'success');
                })
                .catch((error) => {
                    console.log('Sharing failed or cancelled', error);
                    // Fallback to simpler save on simple cancellation or error
                    if (error.name !== 'AbortError') {
                        doc.save(fname);
                        if (!isDirect) showMessage('Saved', 'Sharing failed, PDF downloaded instead.', 'success');
                    } else {
                        // Even if cancelled, we saved data to history already.
                        if (!isDirect) showMessage('Success', 'Data Stored (Share Cancelled).', 'success');
                    }
                })
                .finally(() => {
                    if (btn && !isDirect) {
                        btn.innerHTML = oldText;
                        btn.disabled = false;
                    }
                });
        } else {
            // Fallback for Desktop / No Share Support
            doc.save(fname);
            if (btn && !isDirect) {
                btn.innerHTML = oldText;
                btn.disabled = false;
            }
            if (!isDirect) showMessage('Success', 'PDF Saved & Data Stored!', 'success');
        }

    } catch (e) {
        console.error(e);
        if (btn && !isDirect) {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
        if (!isDirect) showMessage('Error', 'PDF Failed', 'error');
    }
}

function saveToHistory(current) {
    if (!appState.savedSheets) appState.savedSheets = [];

    // Create Deep Copy
    const entry = JSON.parse(JSON.stringify(current));
    entry.id = Date.now().toString(); // Simple ID
    entry.createdDate = new Date().toISOString();

    // Check if exists for same Month/Year? Logic: User said "Save just override".
    // We will find if we already saved this exact month/year for this person TODAY? 
    // Simplified: Just add new one for now, or match logic.
    // User Requirement: "Once the user make a save PDF need to save a full data"

    // Let's look for an existing entry for this Month/Year to update it, 
    // to avoid infinite duplicate entries if they click save multiple times.
    const existingIdx = appState.savedSheets.findIndex(x =>
        x.month == entry.month &&
        x.year == entry.year &&
        x.civilId == entry.civilId
    );

    if (existingIdx >= 0) {
        // Update existing (Keep original createdDate or update? Let's update data)
        entry.id = appState.savedSheets[existingIdx].id; // Keep ID
        entry.createdDate = new Date().toISOString(); // Update timestamp
        appState.savedSheets[existingIdx] = entry;
    } else {
        appState.savedSheets.unshift(entry); // Add to top
    }

    saveState();
    renderDataTab();
}

// --- 2. HANDLE PRINT (Standalone) ---
function handlePrint() {
    if (!validateRequiredFields()) return;

    const s = appState.currentSheet;
    const days = getDaysInMonth(s.year, s.month);
    const workLoc = [s.retailer, s.location].filter(Boolean).join(' ');

    let rows = '';
    for (let i = 1; i <= days; i++) {
        const k = `${s.year}-${String(parseInt(s.month) + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dateObj = new Date(s.year, s.month, i);
        const defs = getDefaultTimes(dateObj);
        // Use defaults if missing
        let d = s.attendance[k] || { ...defs, remarks: '' };
        const dateStr = `${String(i).padStart(2, '0')}-${MONTH_NAMES[s.month].substr(0, 3)}-${s.year}`;

        let tIn = '';
        if (d.inHour) tIn = `${d.inHour}:${d.inMin || '00'} ${d.inAmPm || 'AM'}`;
        let tOut = '';
        if (d.outHour) tOut = `${d.outHour}:${d.outMin || '00'} ${d.outAmPm || 'PM'}`;

        rows += `
            <tr>
                <td>${dateStr}</td>
                <td>${dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                <td>${tIn}</td>
                <td>${tOut}</td>
                <td>${d.remarks || ''}</td>
            </tr>`;
    }

    const styles = `
        <style>
            @page { size: A4; margin: 0; } 
            html, body { width: 100%; height: 100%; margin: 0 !important; padding: 0 !important; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; color: #000; }
            
            .container { 
                width: 100%; 
                max-width: 210mm; 
                margin: 0 auto; 
                padding: 15mm 15mm 10mm 15mm; /* Reduced Top Padding (25->15mm) to fit on one page */
                box-sizing: border-box;
            }

            .header-strip { background-color: #dce6f1; padding: 10px 15px; margin-bottom: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header-title { font-size: 14pt; font-weight: bold; margin: 0; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 70px; margin-bottom: 10px; padding: 0 10px; }
            .info-row { display: flex; margin-bottom: 6px; }
            .label { font-weight: bold; width: 120px; }
            .value { flex: 1; }
            
            /* REDUCED FONT SIZE (10pt -> 9pt) */
            table { width: 100%; border-collapse: collapse; font-size: 9pt; table-layout: fixed; }
            
            /* ADJUSTED HEADER (Padding 7px) */
            th { background-color: #404040 !important; color: white !important; font-weight: bold; padding: 7px 6px; border: 1px solid #ffffff; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            /* REDUCED HEIGHT (18px -> 16px) to ensure single page fit */
            td { border: 1px solid #d9d9d9; padding: 2px 4px; text-align: left; height: 16px; overflow: hidden; white-space: nowrap; }
            .footer { margin-top: 40px; font-weight: bold; padding-left: 10px; }
        </style>
    `;

    const content = `
        <html><head><title>Timesheet</title>${styles}</head><body>
            <div class="container">
                <div class="header-strip"><h1 class="header-title">Monthly Timesheet</h1></div>
                <div class="info-grid">
                    <div class="left-group">
                        <div class="info-row"><span class="label">Employee Name:</span><span class="value">${s.empName}</span></div>
                        <div class="info-row"><span class="label">Civil ID No.:</span><span class="value">${s.civilId}</span></div>
                        <div class="info-row"><span class="label">Month:</span><span class="value">${MONTH_NAMES[s.month]} ${s.year}</span></div>
                    </div>
                    <div class="right-group">
                        <div class="info-row"><span class="label">Location:</span><span class="value">${workLoc}</span></div>
                        <div class="info-row"><span class="label">Department:</span><span class="value">${s.department}</span></div>
                        <div class="info-row"><span class="label">Designation:</span><span class="value">${s.designation}</span></div>
                    </div>
                </div>
                <table>
                    <thead><tr><th width="20%">Date</th><th width="20%">Day</th><th width="20%">Login Time</th><th width="20%">Logout Time</th><th width="20%">Remarks</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="footer">Verified by:</div>
            </div>
        </body></html>
    `;

    let iframe = document.getElementById('print-iframe');
    if (iframe) document.body.removeChild(iframe);
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(content);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => iframe.contentWindow.print(), 500);
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateAllDropdowns();
    renderAttendanceGrid();
    refreshIcons();

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) saveBtn.onclick = () => handleSavePDF();

    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.onclick = handlePrint;

    document.getElementById('clearBtn').onclick = () => resetToDefaults(true);
    document.getElementById('themeToggle').onclick = toggleTheme;
    document.getElementById('closePickerBtn').onclick = () => {
        document.getElementById('picker-modal').classList.add('hidden');
        document.body.classList.remove('no-scroll');
    };

    ['empName', 'civilId'].forEach(id => {
        const el = document.getElementById(id);
        el.value = appState.currentSheet[id];

        el.oninput = (e) => {
            if (id === 'civilId') {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12);
            }
            appState.currentSheet[id] = e.target.value;
            saveState();
        };
    });

    document.querySelectorAll('.tab-btn').forEach(b => {
        b.onclick = () => {
            document.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
            b.classList.add('active');
            document.getElementById(b.dataset.tab).classList.add('active');
        };
    });

    setupAddSetting('addRetailerBtn', 'newRetailer', 'retailers');
    setupAddSetting('addLocationBtn', 'newLocation', 'locations');
    setupAddSetting('addDeptBtn', 'newDept', 'departments');
    setupAddSetting('addDesigBtn', 'newDesig', 'designations');

    let startY = 0, ptr = document.getElementById('ptr-indicator');
    window.ontouchstart = e => {
        // Disable PTR if modal is open (body stuck)
        if (document.body.classList.contains('no-scroll')) return;
        if (window.scrollY <= 5) startY = e.touches[0].clientY;
    };
    window.ontouchmove = e => {
        // Disable PTR if modal is open
        if (document.body.classList.contains('no-scroll')) return;
        if (startY && window.scrollY <= 5) {
            let diff = e.touches[0].clientY - startY;
            if (diff > 0) ptr.style.transform = `translateY(${Math.min(diff / 2, 80)}px)`;
            if (diff > 120) ptr.classList.add('release');
        }
    };
    window.ontouchend = e => {
        if (ptr.classList.contains('release')) location.reload();
        ptr.style.transform = ''; ptr.classList.remove('release'); startY = 0;
    };

    // Data Tab Listeners
    document.getElementById('clearAllDataBtn').onclick = () => {
        showConfirm('Delete All', 'Really delete all saved data?', () => {
            appState.savedSheets = [];
            saveState();
            renderDataTab();
            showMessage('Deleted', 'All data cleared.', 'success');
        });
    };

    document.getElementById('closePreviewBtn').onclick = () => document.getElementById('preview-modal').classList.add('hidden');

    // Initial Render
    renderDataTab();
});

// --- Data Tab Logic ---

function renderDataTab() {
    const container = document.getElementById('data-list-container');
    container.innerHTML = '';

    if (!appState.savedSheets || appState.savedSheets.length === 0) {
        container.innerHTML = '<div class="empty-state" style="text-align: center; color: var(--text-muted); padding: 2rem;">No saved records found.</div>';
        return;
    }

    // Sort by Date Descending
    const sorted = [...appState.savedSheets].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

    sorted.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.margin = '0 0 1rem 0';
        div.style.padding = '1rem';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.gap = '0.5rem';

        const date = new Date(item.createdDate).toLocaleDateString() + ' ' + new Date(item.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary);">${MONTH_NAMES[item.month]} ${item.year}</h3>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Created: ${date}</div>
                    <div style="font-size: 0.9rem; margin-top: 4px;"><strong>${item.empName || 'No Name'}</strong></div>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <button class="btn btn-secondary" onclick="openDataPreview('${item.id}')" style="flex: 1; font-size: 0.9rem; padding: 0.5rem;"><i data-lucide="eye"></i> View</button>
                <button class="btn btn-primary" onclick="downloadSaved('${item.id}')" style="flex: 1; font-size: 0.9rem; padding: 0.5rem;"><i data-lucide="download"></i> Download</button>
            </div>
        `;
        container.appendChild(div);
    });
    refreshIcons();
}

window.downloadSaved = (id) => {
    const item = appState.savedSheets.find(x => x.id === id);
    if (item) handleSavePDF(item);
}

// Temporary State for Edit Preview
let previewState = null;

window.openDataPreview = (id) => {
    const item = appState.savedSheets.find(x => x.id === id);
    if (!item) return;

    previewState = JSON.parse(JSON.stringify(item)); // Copy for editing

    const modal = document.getElementById('preview-modal');
    const body = document.getElementById('preview-body');
    const saveBtn = document.getElementById('previewSaveBtn');

    // Render Preview
    renderPreviewBody(body, previewState);

    // Wire Save
    saveBtn.onclick = () => {
        // Find index to update
        const idx = appState.savedSheets.findIndex(x => x.id === id);
        if (idx !== -1) {
            appState.savedSheets[idx] = previewState;
            saveState();
            renderDataTab();
            modal.classList.add('hidden');
            document.body.classList.remove('no-scroll');
            showMessage('Success', 'Entry updated.', 'success');
        }
    };

    modal.classList.remove('hidden');
    document.body.classList.add('no-scroll');

    // Safety close handler
    const closeBtn = document.getElementById('closePreviewBtn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
            document.body.classList.remove('no-scroll');
        }
    }
}

// Header Picker for Preview
window.openPreviewHeader = (type) => {
    let val = previewState[type];
    if (type === 'month') val = previewState.month.toString();

    openPicker(type, val, (newVal) => {
        if (type === 'month') previewState.month = parseInt(newVal);
        else previewState[type] = newVal;

        // If Month/Year changes, we technically should regenerate the grid blank structure? 
        // For now user just wants to edit text fields usually. 
        // If they change month/year, the days count might change. 
        // Let's re-render body completely.
        renderPreviewBody(document.getElementById('preview-body'), previewState);
    });
}

function renderPreviewBody(container, data) {
    // Header Info (Editable) - Replicating Main UI Layout
    const infoHTML = `
        <div style="padding: 1rem;">
            
            <div class="form-group-row">
                <div class="form-group">
                    <label>Employee Name</label>
                    <input type="text" value="${data.empName}" oninput="previewState.empName = this.value">
                </div>
                <div class="form-group">
                    <label>Civil ID No.</label>
                    <input type="text" value="${data.civilId}" inputmode="numeric" maxlength="12" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0,12); previewState.civilId = this.value">
                </div>
            </div>

            <div class="form-group-row">
                <div class="form-group">
                    <label>Retailer</label>
                    <div class="select-box" onclick="openPreviewHeader('retailer')">
                        <span>${data.retailer || 'Select'}</span><i data-lucide="chevron-down" class="select-icon"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <div class="select-box" onclick="openPreviewHeader('location')">
                        <span>${data.location || 'Select'}</span><i data-lucide="chevron-down" class="select-icon"></i>
                    </div>
                </div>
            </div>

            <div class="form-group-row">
                <div class="form-group">
                    <label>Department</label>
                    <div class="select-box" onclick="openPreviewHeader('department')">
                         <span>${data.department || 'Select'}</span><i data-lucide="chevron-down" class="select-icon"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label>Designation</label>
                    <div class="select-box" onclick="openPreviewHeader('designation')">
                        <span>${data.designation || 'Select'}</span><i data-lucide="chevron-down" class="select-icon"></i>
                    </div>
                </div>
            </div>

             <div class="form-group-row">
                <div class="form-group">
                    <label>Month</label>
                    <div class="select-box" onclick="openPreviewHeader('month')">
                        <span>${MONTH_NAMES[parseInt(data.month)] || 'Select'}</span><i data-lucide="chevron-down" class="select-icon"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label>Year</label>
                    <div class="select-box" onclick="openPreviewHeader('year')">
                        <span>${data.year || 'Select'}</span><i data-lucide="chevron-down" class="select-icon"></i>
                    </div>
                </div>
        </div>
    </div>
    `;

    // Grid - Maximized Width
    // Removed side margins to use full modal width.
    const gridCols = '44px 100px 100px 1fr';

    let gridHTML = `
    <!-- Grid Wrapper inside Modal Body -->
    <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; border-top: 1px solid var(--border);">
        
        <!-- Header -->
        <div style="
            display: grid; 
            grid-template-columns: ${gridCols}; 
            gap: 0.25rem; 
            padding: 0.75rem 0.5rem; 
            background: var(--bg-card); 
            border-bottom: 1px solid var(--border);
            font-size: 0.7rem; 
            font-weight: 700; 
            color: var(--text-muted); 
            text-transform: uppercase; 
            text-align: center;
            align-items: center;
            flex-shrink: 0;
            z-index: 10;
        ">
            <span>Day</span><span>Login</span><span>Logout</span><span>Remarks</span>
        </div>

        <!-- Scrollable List -->
        <div class="attendance-list" style="
            overflow-y: auto; 
            padding: 0; 
            margin: 0; 
            display: flex; 
            flex-direction: column;
            gap: 0; 
            background: var(--bg-surface);
        ">`;

    // Safety check for dates
    const m = parseInt(data.month);
    const y = parseInt(data.year);
    // Handle invalid month/year gracefully
    const days = (m >= 0 && m < 12 && y > 2000) ? new Date(y, m + 1, 0).getDate() : 0;

    for (let i = 1; i <= days; i++) {
        const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dateObj = new Date(y, m, i);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const isFri = dayName === 'Fri';

        const defs = getDefaultTimes(dateObj);
        let d = data.attendance[k] || { ...defs, remarks: '' };

        gridHTML += `
            <div class="attendance-day ${isFri ? 'weekend' : ''}" style="
                border-bottom: 1px solid var(--border); 
                display: grid; 
                grid-template-columns: ${gridCols}; 
                gap: 0.25rem; 
                align-items: center; 
                padding: 0.5rem; 
                background: ${isFri ? 'rgba(239, 68, 68, 0.05)' : 'transparent'};
            ">
                <div class="day-info" style="min-width: 0; width: 100%;"><span>${i}</span><small>${dayName}</small></div>
                
                <div class="time-group" style="width: 100%;">
                    <div class="select-box time-box${d.remarks ? ' disabled' : ''}" style="padding: 4px;" ${d.remarks ? '' : `onclick="openPreviewTime('${k}', 'inHour', 'inMin', '${d.inHour}', '${d.inMin}')"`}><span style="font-size:0.85rem;">${(d.inHour && d.inMin) ? d.inHour + ':' + d.inMin : '--:--'}</span></div>
                    <div class="select-box ampm-box${d.remarks ? ' disabled' : ''}" style="flex: 0 0 38px; padding: 0;" ${d.remarks ? '' : `onclick="openPreviewSingle('${k}', 'inAmPm', 'ampm', '${d.inAmPm}')"`}><span style="font-size:0.7rem;">${d.inAmPm || '-'}</span></div>
                </div>

                <div class="time-group" style="width: 100%;">
                    <div class="select-box time-box${d.remarks ? ' disabled' : ''}" style="padding: 4px;" ${d.remarks ? '' : `onclick="openPreviewTime('${k}', 'outHour', 'outMin', '${d.outHour}', '${d.outMin}')"`}><span style="font-size:0.85rem;">${(d.outHour && d.outMin) ? d.outHour + ':' + d.outMin : '--:--'}</span></div>
                    <div class="select-box ampm-box${d.remarks ? ' disabled' : ''}" style="flex: 0 0 38px; padding: 0;" ${d.remarks ? '' : `onclick="openPreviewSingle('${k}', 'outAmPm', 'ampm', '${d.outAmPm}')"`}><span style="font-size:0.7rem;">${d.outAmPm || '-'}</span></div>
                </div>

                <div class="select-box remark-select" style="min-width: 0; width: 100%; padding: 4px 8px;" onclick="openPreviewSingle('${k}', 'remarks', 'remarks', '${d.remarks}')">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem;">${d.remarks || '-'}</span><i data-lucide="chevron-down" class="select-icon" style="width: 14px; height: 14px;"></i>
                </div>
            </div>
        `;
    }
    gridHTML += '</div></div>';

    container.innerHTML = infoHTML + gridHTML;
    refreshIcons();
}

// Preview Edit Logic checkers
window.openPreviewSingle = (key, field, type, cur) => {
    // Re-use openPicker but intercept callback
    openPicker(type, cur, (val) => {
        // Derive date from key for defaults
        const parts = key.split('-');
        const dateObj = new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);
        const defs = getDefaultTimes(dateObj);

        if (!previewState.attendance[key]) previewState.attendance[key] = { ...defs, remarks: '' };

        previewState.attendance[key][field] = val;

        // Logic for remarks clearing times
        if (field === 'remarks') {
            if (val) {
                previewState.attendance[key].inHour = ''; previewState.attendance[key].inMin = ''; previewState.attendance[key].inAmPm = '';
                previewState.attendance[key].outHour = ''; previewState.attendance[key].outMin = ''; previewState.attendance[key].outAmPm = '';
            } else {
                previewState.attendance[key].inHour = defs.inHour; previewState.attendance[key].inMin = defs.inMin; previewState.attendance[key].inAmPm = defs.inAmPm;
                previewState.attendance[key].outHour = defs.outHour; previewState.attendance[key].outMin = defs.outMin; previewState.attendance[key].outAmPm = defs.outAmPm;
            }
        }

        // Re-render the body to show changes
        renderPreviewBody(document.getElementById('preview-body'), previewState);
    });
}

window.openPreviewTime = (key, hField, mField, curH, curM) => {
    let cur = (curH && curM) ? `${curH}:${curM}` : '';
    openPicker('time', cur, (val) => {
        const [h, m] = val.split(':');

        const parts = key.split('-');
        const dateObj = new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);
        const defs = getDefaultTimes(dateObj);

        if (!previewState.attendance[key]) previewState.attendance[key] = { ...defs, remarks: '' };

        previewState.attendance[key][hField] = h;
        previewState.attendance[key][mField] = m;

        renderPreviewBody(document.getElementById('preview-body'), previewState);
    });
}