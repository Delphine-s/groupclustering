/* ==========================================
   FEATURE: 2. Picker Wheel Controller (picker-wheel.js)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    initPickerWheel();
});

function initPickerWheel() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const namesInput = document.getElementById('picker-names-input');
    const btnSync = document.getElementById('btn-sync-names');
    const btnClear = document.getElementById('btn-clear-picker-names');
    const btnSpin = document.getElementById('btn-spin-wheel');
    const chkExclude = document.getElementById('chk-exclude-winner');
    const chkSound = document.getElementById('chk-sound-effect');
    const historyList = document.getElementById('picker-history-list');
    const btnResetHistory = document.getElementById('btn-reset-history');
    
    // Winner Modal Elements
    const winnerModal = document.getElementById('winner-modal');
    const winnerNameDisplay = document.getElementById('winner-name-display');
    const btnCloseWinner = document.getElementById('btn-close-winner');
    const confettiContainer = document.getElementById('confetti-canvas-container');

    let candidates = [];
    let history = [];
    
    // Physics variables for wheel rotation
    let currentAngle = 0;
    let isSpinning = false;
    let spinVelocity = 0;
    const friction = 0.983; // Smooth deceleration rate
    let lastTickedIndex = -1;

    // Confetti state variables
    let confettiActive = false;
    let confettiParticles = [];
    const confettiCanvas = document.createElement('canvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    
    // Default list
    const defaultCandidates = ["김민준", "이서준", "박예준", "최도윤", "정시우", "서서아", "한이서", "오아윤"];
    namesInput.value = defaultCandidates.join('\n');
    parseNames();

    // Listeners
    namesInput.addEventListener('input', parseNames);
    
    // Synchronize with Group Maker names input
    btnSync.addEventListener('click', () => {
        const groupInputVal = document.getElementById('student-input').value;
        if (groupInputVal.trim().length === 0) {
            alert('모둠 구성기에 입력된 학생 명단이 없습니다.');
            return;
        }
        // Normalize commas to newlines
        namesInput.value = groupInputVal.split(',').map(n => n.trim()).filter(n => n.length > 0).join('\n');
        parseNames();
        window.EduSound.playBeep(700, 0.1);
    });

    btnClear.addEventListener('click', () => {
        namesInput.value = '';
        candidates = [];
        drawWheel();
        window.EduSound.playBeep(450, 0.1);
    });

    btnResetHistory.addEventListener('click', () => {
        history = [];
        renderHistory();
        window.EduSound.playBeep(500, 0.1);
    });

    btnSpin.addEventListener('click', spinWheel);
    btnCloseWinner.addEventListener('click', closeWinnerModal);

    // Watch for view changes to resize or redraw canvas
    window.addEventListener('viewChanged', (e) => {
        if (e.detail.view === 'tool-picker-wheel') {
            setTimeout(drawWheel, 100);
        }
    });

    function parseNames() {
        const text = namesInput.value;
        candidates = text.split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0);
        
        drawWheel();
    }

    // Colors list for roulette segments
    const segmentColors = [
        '#8b5cf6', // Violet
        '#06b6d4', // Cyan
        '#ec4899', // Pink
        '#eab308', // Yellow
        '#10b981', // Emerald
        '#f97316', // Orange
        '#ef4444', // Red
        '#3b82f6'  // Blue
    ];

    function drawWheel() {
        const width = canvas.width;
        const height = canvas.height;
        const radius = width / 2 - 15;
        const cx = width / 2;
        const cy = height / 2;

        ctx.clearRect(0, 0, width, height);

        if (candidates.length === 0) {
            // Draw empty wheel message
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = "bold 1.1rem 'Noto Sans KR'";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("후보자를 입력해 주세요", cx, cy);
            ctx.restore();
            return;
        }

        const numSegments = candidates.length;
        const sliceAngle = (2 * Math.PI) / numSegments;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(currentAngle);

        for (let i = 0; i < numSegments; i++) {
            const startAngle = i * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            const color = segmentColors[i % segmentColors.length];

            // 1. Draw Pie Segment
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(22, 28, 45, 0.5)';
            ctx.stroke();

            // 2. Draw Text on segment
            ctx.save();
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            
            // Adjust color of text based on theme or segment contrast (light color gets dark text)
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 4;

            // Make font size responsive to candidates count
            let fontSize = 1.2;
            if (numSegments > 20) fontSize = 0.85;
            else if (numSegments > 12) fontSize = 1.0;
            
            ctx.font = `bold ${fontSize}rem 'Noto Sans KR'`;
            
            // Draw text starting from near the outer edge
            ctx.fillText(candidates[i], radius - 30, 0);
            ctx.restore();
        }
        ctx.restore();

        // 3. Draw Center Circle Rim
        ctx.beginPath();
        ctx.arc(cx, cy, 38, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(22, 28, 45, 0.8)';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();
    }

    function spinWheel() {
        if (isSpinning || candidates.length === 0) return;

        isSpinning = true;
        btnSpin.disabled = true;
        
        // Random initial velocity to make output unpredictable
        spinVelocity = 0.2 + Math.random() * 0.15; // Random range 0.2 to 0.35
        lastTickedIndex = -1;
        
        animateSpin();
    }

    function animateSpin() {
        if (spinVelocity > 0.001) {
            currentAngle += spinVelocity;
            spinVelocity *= friction;
            
            // Pointer sound tick logic
            if (chkSound.checked) {
                const numSegments = candidates.length;
                const sliceAngle = (2 * Math.PI) / numSegments;
                
                // Pointer is at -Math.PI / 2 (top of the wheel)
                // Normalize angle relative to pointer direction
                const normalizedAngle = (Math.PI / 2 - currentAngle) % (2 * Math.PI);
                const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
                const currentIndex = Math.floor(positiveAngle / sliceAngle) % numSegments;
                
                if (currentIndex !== lastTickedIndex) {
                    window.EduSound.playTick();
                    lastTickedIndex = currentIndex;
                }
            }

            drawWheel();
            requestAnimationFrame(animateSpin);
        } else {
            // Spinning stopped
            isSpinning = false;
            btnSpin.disabled = false;
            
            // Calculate final winner index
            const numSegments = candidates.length;
            const sliceAngle = (2 * Math.PI) / numSegments;
            const normalizedAngle = (Math.PI / 2 - currentAngle) % (2 * Math.PI);
            const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
            const winnerIndex = Math.floor(positiveAngle / sliceAngle) % numSegments;
            
            announceWinner(candidates[winnerIndex], winnerIndex);
        }
    }

    function announceWinner(winner, index) {
        winnerNameDisplay.textContent = winner;
        
        // Play Win Chime
        if (chkSound.checked) {
            window.EduSound.playWinChime();
        }

        // Add to history
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        history.unshift({ name: winner, time: time });
        renderHistory();

        // Remove from list if checkbox is checked
        if (chkExclude.checked) {
            candidates.splice(index, 1);
            namesInput.value = candidates.join('\n');
            setTimeout(drawWheel, 800); // Redraw shortly after announcement
        }

        // Show Modal & Start Confetti
        winnerModal.classList.add('active');
        startConfetti();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<li class="empty-history">아직 당첨자가 없습니다.</li>';
            return;
        }

        history.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${item.name}</strong>
                <span class="text-muted" style="font-size:0.75rem;">${item.time}</span>
            `;
            historyList.appendChild(li);
        });
    }

    function closeWinnerModal() {
        winnerModal.classList.remove('active');
        stopConfetti();
        window.EduSound.playBeep(800, 0.1);
    }

    // 5. Dynamic Confetti Particle Animation
    function startConfetti() {
        if (confettiActive) return;
        
        confettiActive = true;
        confettiContainer.innerHTML = '';
        
        confettiCanvas.width = confettiContainer.clientWidth || 450;
        confettiCanvas.height = confettiContainer.clientHeight || 450;
        confettiCanvas.style.position = 'absolute';
        confettiCanvas.style.top = '0';
        confettiCanvas.style.left = '0';
        confettiCanvas.style.width = '100%';
        confettiCanvas.style.height = '100%';
        confettiCanvas.style.pointerEvents = 'none';
        
        confettiContainer.appendChild(confettiCanvas);
        
        confettiParticles = [];
        const colors = ['#f472b6', '#a78bfa', '#22d3ee', '#fde047', '#34d399', '#60a5fa'];
        
        for (let i = 0; i < 80; i++) {
            confettiParticles.push({
                x: Math.random() * confettiCanvas.width,
                y: Math.random() * -100 - 20, // Start above viewport
                size: Math.random() * 8 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: Math.random() * 4 - 2,
                speedY: Math.random() * 3 + 2,
                angle: Math.random() * 360,
                rotationSpeed: Math.random() * 4 - 2
            });
        }
        
        requestAnimationFrame(animateConfetti);
    }

    function animateConfetti() {
        if (!confettiActive) return;
        
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        let activeParticles = 0;
        
        confettiParticles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.angle += p.rotationSpeed;
            
            // Loop particles back to top if they fall off bottom, or stop spawning if modal closed
            if (p.y > confettiCanvas.height) {
                p.y = -20;
                p.x = Math.random() * confettiCanvas.width;
            }
            
            activeParticles++;
            
            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate(p.angle * Math.PI / 180);
            confettiCtx.fillStyle = p.color;
            // Draw rectangle particle
            confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            confettiCtx.restore();
        });
        
        if (activeParticles > 0 && confettiActive) {
            requestAnimationFrame(animateConfetti);
        }
    }

    function stopConfetti() {
        confettiActive = false;
        confettiParticles = [];
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
}
