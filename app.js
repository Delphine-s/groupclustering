/* ==========================================
   EduKit Core Logic & Global Controller (app.js)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initTheme();
    initNavigation();
    initAudio();
});

// 1. Clock Display Logic
function initClock() {
    const clockEl = document.getElementById('clock');
    
    function updateClock() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${hrs}:${mins}:${secs}`;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// 2. Dark / Light Theme Controller
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Read preference or default to dark
    const savedTheme = localStorage.getItem('edukit-theme') || 'dark';
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
    
    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.replace('dark-theme', 'light-theme');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            localStorage.setItem('edukit-theme', 'light');
        } else {
            body.classList.replace('light-theme', 'dark-theme');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem('edukit-theme', 'dark');
        }
    });
}

// 3. SPA Routing & View Controller
function initNavigation() {
    const logoBtn = document.getElementById('logo-btn');
    const toolCards = document.querySelectorAll('.tool-card');
    const backBtns = document.querySelectorAll('.back-btn');
    const sections = document.querySelectorAll('.view-section');
    
    function navigateTo(targetId) {
        // Slide down current view, show target view with fade in
        sections.forEach(sec => {
            sec.classList.remove('active');
            sec.style.display = 'none';
        });
        
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
            // Force reflow for CSS transition
            targetSection.offsetHeight;
            targetSection.classList.add('active');
            
            // Dispatch custom event when view changes
            window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: targetId } }));
        }
    }
    
    // Dashboard Cards Event
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-target');
            navigateTo(`tool-${target}`);
        });
    });
    
    // Back to Dashboard Button Event
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo('dashboard');
        });
    });
    
    // Click logo to go home
    logoBtn.addEventListener('click', () => {
        navigateTo('dashboard');
    });
}

// 4. Web Audio API synthesized sound generator (Offline friendly & high quality)
let audioCtx = null;

function initAudio() {
    // Audio Context is initialized on first user interaction to comply with browser safety
    const startAudioContext = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    };
    
    document.addEventListener('click', startAudioContext, { once: true });
    document.addEventListener('touchstart', startAudioContext, { once: true });
}

// Sound effects exposed globally
window.EduSound = {
    // 1. Polite Classroom Bell
    playBell: function() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        
        // Dynamic FM synthesis bell
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1174.66, now); // D6
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc1.start(now);
        osc2.start(now);
        
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);
    },
    
    // 2. High attention Buzzer
    playAlarm: function() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const duration = 1.0;
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sawtooth';
        // Alternating siren sound
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(450, now + 0.25);
        osc.frequency.linearRampToValueAtTime(350, now + 0.5);
        osc.frequency.linearRampToValueAtTime(450, now + 0.75);
        osc.frequency.linearRampToValueAtTime(350, now + 1.0);
        
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.setValueAtTime(0.15, now + 0.85);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    // 3. Electronic beep
    playBeep: function(pitch = 880, length = 0.15) {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now);
        
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + length);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + length + 0.05);
    },
    
    // 4. Tick countdown marker
    playTick: function() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, now);
        
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.08);
    },
    
    // 5. Celebration winner sound
    playWinChime: function() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
        
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const noteStart = now + (idx * 0.12);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteStart);
            
            gainNode.gain.setValueAtTime(0.12, noteStart);
            gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start(noteStart);
            osc.stop(noteStart + 0.7);
        });
    }
};

// Global LocalStorage Utility to share data across features
window.EduStorage = {
    getStudents: function() {
        const saved = localStorage.getItem('edukit-students');
        return saved ? JSON.parse(saved) : [];
    },
    saveStudents: function(studentsList) {
        localStorage.setItem('edukit-students', JSON.stringify(studentsList));
    }
};
