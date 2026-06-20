/* ==========================================
   FEATURE: 3. Visual Timer & Stopwatch Controller (timer.js)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    initTimer();
});

function initTimer() {
    // Mode Switch Tab Buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Countdown Input fields
    const inputMin = document.getElementById('input-minutes');
    const inputSec = document.getElementById('input-seconds');
    const btnMinUp = document.getElementById('btn-min-up');
    const btnMinDown = document.getElementById('btn-min-down');
    const btnSecUp = document.getElementById('btn-sec-up');
    const btnSecDown = document.getElementById('btn-sec-down');
    const presetBtns = document.querySelectorAll('.preset-btn');
    
    // Display elements
    const digitsDisplay = document.getElementById('timer-digits');
    const statusDisplay = document.getElementById('timer-status');
    const progressBar = document.getElementById('timer-bar');
    
    // Core Buttons
    const btnStart = document.getElementById('btn-timer-start');
    const btnReset = document.getElementById('btn-timer-reset');
    const btnLap = document.getElementById('btn-timer-lap');
    
    // Sound & Lap Elements
    const soundSelect = document.getElementById('timer-sound-select');
    const lapList = document.getElementById('lap-list');
    const btnClearLaps = document.getElementById('btn-clear-laps');

    // State Variables
    let currentMode = 'countdown'; // 'countdown' | 'stopwatch'
    let isRunning = false;
    let timerInterval = null;
    
    // Countdown time trackers
    let totalSeconds = 180; // default 3 minutes
    let remainingSeconds = 180;
    
    // Stopwatch trackers
    let stopwatchStartMs = 0;
    let stopwatchElapsedMs = 0;
    let laps = [];

    const circumference = 534; // 2 * PI * r (r=85)

    // Set SVG Gradient definition programmatically for premium visual styling
    injectSvgGradient();

    // 1. Navigation Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isRunning) {
                stopTimer();
            }
            
            window.EduSound.playBeep(750, 0.08);
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            currentMode = tabId === 'countdown-pane' ? 'countdown' : 'stopwatch';
            resetTimer();
            
            // Adjust controller buttons visibility
            if (currentMode === 'stopwatch') {
                btnLap.classList.remove('hidden');
            } else {
                btnLap.classList.add('hidden');
            }
        });
    });

    // 2. Adjusting countdown minutes/seconds
    function clampInput(input, minVal, maxVal) {
        let val = parseInt(input.value, 10);
        if (isNaN(val)) val = minVal;
        if (val < minVal) val = minVal;
        if (val > maxVal) val = maxVal;
        input.value = val;
    }

    btnMinUp.addEventListener('click', () => {
        inputMin.value = parseInt(inputMin.value, 10) + 1;
        clampInput(inputMin, 0, 99);
        updateCountdownFromInputs();
    });
    btnMinDown.addEventListener('click', () => {
        inputMin.value = parseInt(inputMin.value, 10) - 1;
        clampInput(inputMin, 0, 99);
        updateCountdownFromInputs();
    });
    btnSecUp.addEventListener('click', () => {
        let val = parseInt(inputSec.value, 10) + 5; // Jump by 5s for convenience
        if (val >= 60) {
            val = 0;
            inputMin.value = parseInt(inputMin.value, 10) + 1;
            clampInput(inputMin, 0, 99);
        }
        inputSec.value = val;
        clampInput(inputSec, 0, 59);
        updateCountdownFromInputs();
    });
    btnSecDown.addEventListener('click', () => {
        let val = parseInt(inputSec.value, 10) - 5;
        if (val < 0) {
            val = 55;
            inputMin.value = Math.max(0, parseInt(inputMin.value, 10) - 1);
        }
        inputSec.value = val;
        clampInput(inputSec, 0, 59);
        updateCountdownFromInputs();
    });

    [inputMin, inputSec].forEach(input => {
        input.addEventListener('change', () => {
            clampInput(inputMin, 0, 99);
            clampInput(inputSec, 0, 59);
            updateCountdownFromInputs();
        });
    });

    function updateCountdownFromInputs() {
        if (!isRunning && currentMode === 'countdown') {
            const min = parseInt(inputMin.value, 10) || 0;
            const sec = parseInt(inputSec.value, 10) || 0;
            totalSeconds = min * 60 + sec;
            remainingSeconds = totalSeconds;
            updateDisplay();
        }
    }

    // 3. Preset Time shortcuts
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isRunning) return;
            const seconds = parseInt(btn.getAttribute('data-time'), 10);
            inputMin.value = Math.floor(seconds / 60);
            inputSec.value = seconds % 60;
            totalSeconds = seconds;
            remainingSeconds = seconds;
            updateDisplay();
            window.EduSound.playBeep(650, 0.08);
        });
    });

    // 4. Timer Controls Action Handler
    btnStart.addEventListener('click', () => {
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    btnReset.addEventListener('click', resetTimer);

    btnLap.addEventListener('click', recordLap);
    
    btnClearLaps.addEventListener('click', () => {
        laps = [];
        renderLaps();
        window.EduSound.playBeep(500, 0.1);
    });

    // Main running state toggles
    function startTimer() {
        if (currentMode === 'countdown' && remainingSeconds <= 0) {
            window.EduSound.playAlarm();
            return;
        }

        isRunning = true;
        btnStart.innerHTML = '<i class="fa-solid fa-pause"></i> 일시정지';
        btnStart.classList.replace('pink-btn', 'secondary-btn');
        statusDisplay.textContent = '진행 중';
        
        window.EduSound.playBeep(900, 0.1);

        if (currentMode === 'countdown') {
            const startTimestamp = Date.now();
            const initialRemaining = remainingSeconds;
            
            timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
                remainingSeconds = Math.max(0, initialRemaining - elapsed);
                
                updateDisplay();

                if (remainingSeconds <= 0) {
                    stopTimer();
                    triggerAlarm();
                }
            }, 100);
        } else {
            // Mode: Stopwatch
            stopwatchStartMs = Date.now() - stopwatchElapsedMs;
            
            timerInterval = setInterval(() => {
                stopwatchElapsedMs = Date.now() - stopwatchStartMs;
                updateDisplay();
            }, 30); // Higher frequency tick for centisecond display smoothness
        }
    }

    function pauseTimer() {
        isRunning = false;
        btnStart.innerHTML = '<i class="fa-solid fa-play"></i> 시작';
        btnStart.classList.replace('secondary-btn', 'pink-btn');
        statusDisplay.textContent = '일시 정지';
        clearInterval(timerInterval);
        window.EduSound.playBeep(600, 0.1);
    }

    function stopTimer() {
        isRunning = false;
        btnStart.innerHTML = '<i class="fa-solid fa-play"></i> 시작';
        btnStart.classList.replace('secondary-btn', 'pink-btn');
        clearInterval(timerInterval);
    }

    function resetTimer() {
        stopTimer();
        window.EduSound.playBeep(500, 0.1);
        
        if (currentMode === 'countdown') {
            remainingSeconds = totalSeconds;
            statusDisplay.textContent = '대기 중';
            digitsDisplay.classList.remove('alarm-flash');
        } else {
            stopwatchElapsedMs = 0;
            laps = [];
            renderLaps();
            statusDisplay.textContent = '스톱워치 대기';
        }
        updateDisplay();
    }

    // 5. Centiseconds formatting helper
    function formatTime(totalMs) {
        const ms = Math.floor((totalMs % 1000) / 10);
        const sec = Math.floor((totalMs / 1000) % 60);
        const min = Math.floor((totalMs / (1000 * 60)) % 100);
        
        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(min)}:${pad(sec)}<span style="font-size: 2.2rem; opacity: 0.6; font-weight: 500;">.${pad(ms)}</span>`;
    }

    // 6. Output display formatting
    function updateDisplay() {
        if (currentMode === 'countdown') {
            const min = Math.floor(remainingSeconds / 60);
            const sec = remainingSeconds % 60;
            const pad = (num) => String(num).padStart(2, '0');
            digitsDisplay.innerHTML = `${pad(min)}:${pad(sec)}`;
            
            // Progress bar circle calculation
            const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) : 0;
            const dashoffset = circumference * (1 - progress);
            progressBar.style.strokeDashoffset = dashoffset;
        } else {
            // Mode: Stopwatch
            digitsDisplay.innerHTML = formatTime(stopwatchElapsedMs);
            
            // Visual sweep bar (spins around every 60 seconds)
            const progress = (stopwatchElapsedMs % 60000) / 60000;
            const dashoffset = circumference * (1 - progress);
            progressBar.style.strokeDashoffset = dashoffset;
        }
    }

    // 7. Alarm triggering when countdown reaches zero
    function triggerAlarm() {
        statusDisplay.textContent = '시간 종료!';
        digitsDisplay.innerHTML = "00:00";
        digitsDisplay.classList.add('alarm-flash');
        
        const soundType = soundSelect.value;
        
        // Loop alarm sound 3 times
        let alarmTimes = 0;
        function playAlarmLoop() {
            if (alarmTimes < 3) {
                if (soundType === 'bell') window.EduSound.playBell();
                else if (soundType === 'alarm') window.EduSound.playAlarm();
                else window.EduSound.playBeep(980, 0.4);
                
                alarmTimes++;
                setTimeout(playAlarmLoop, 1500);
            }
        }
        playAlarmLoop();
    }

    // 8. Recording Lap Times
    function recordLap() {
        if (!isRunning || currentMode !== 'stopwatch') return;
        
        const lapTime = stopwatchElapsedMs;
        const lapNum = laps.length + 1;
        laps.unshift({ num: lapNum, timeMs: lapTime });
        
        window.EduSound.playBeep(1100, 0.06);
        renderLaps();
    }

    function renderLaps() {
        lapList.innerHTML = '';
        if (laps.length === 0) {
            lapList.innerHTML = '<li class="empty-laps">랩 타임 기록이 없습니다.</li>';
            return;
        }

        laps.forEach(lap => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>랩 ${lap.num}</strong>
                <span>${formatTimeRaw(lap.timeMs)}</span>
            `;
            lapList.appendChild(li);
        });
    }

    // Centiseconds text format without HTML tags for list rendering
    function formatTimeRaw(totalMs) {
        const ms = Math.floor((totalMs % 1000) / 10);
        const sec = Math.floor((totalMs / 1000) % 60);
        const min = Math.floor((totalMs / (1000 * 60)) % 100);
        
        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(min)}:${pad(sec)}.${pad(ms)}`;
    }

    // 9. CSS styles injection helper to paint SVG gradient
    function injectSvgGradient() {
        const svg = document.querySelector('.timer-svg');
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        linearGradient.setAttribute('id', 'timer-gradient');
        linearGradient.setAttribute('x1', '0%');
        linearGradient.setAttribute('y1', '0%');
        linearGradient.setAttribute('x2', '100%');
        linearGradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#f472b6'); // Pink light
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#db2777'); // Pink dark
        
        linearGradient.appendChild(stop1);
        linearGradient.appendChild(stop2);
        defs.appendChild(linearGradient);
        svg.appendChild(defs);
    }
}

// Add blinking animation for countdown completion in page CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes alarmBlink {
        0%, 100% { color: var(--text-primary); text-shadow: none; }
        50% { color: #f87171; text-shadow: 0 0 20px rgba(239, 68, 68, 0.6); }
    }
    .alarm-flash {
        animation: alarmBlink 0.6s infinite;
    }
`;
document.head.appendChild(style);
