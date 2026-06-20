/* ==========================================
   FEATURE: 4. Quiz & Flashcard Controller (quiz-card.js)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    initQuizCard();
});

function initQuizCard() {
    // Nav Tabs
    const tabBtns = document.querySelectorAll('.tab-btn-quiz');
    const tabPanes = document.querySelectorAll('.tab-pane-quiz');
    
    // Config controls
    const setSelect = document.getElementById('quiz-set-select');
    const modeRadios = document.querySelectorAll('input[name="quiz-mode"]');
    
    // Stats Displays
    const progressText = document.getElementById('quiz-progress-text');
    const progressBarFill = document.getElementById('quiz-progress-bar');
    const scoreRow = document.getElementById('quiz-score-row');
    const scoreText = document.getElementById('quiz-score-text');

    // Display Arenas
    const flashcardContainer = document.getElementById('flashcard-container');
    const quizGameContainer = document.getElementById('quiz-game-container');
    
    // Flashcard UI elements
    const flashcardElement = document.getElementById('flashcard-element');
    const frontText = document.getElementById('card-front-text');
    const backText = document.getElementById('card-back-text');
    const btnCardPrev = document.getElementById('btn-card-prev');
    const btnCardFlip = document.getElementById('btn-card-flip');
    const btnCardNext = document.getElementById('btn-card-next');
    
    // Quiz Game UI elements
    const gameQuestionText = document.getElementById('game-question-text');
    const gameOptionsContainer = document.getElementById('game-options-container');
    const btnGameNext = document.getElementById('btn-game-next');
    const btnGameRestart = document.getElementById('btn-game-restart');
    
    // Custom Quiz Builder Editor elements
    const builderTbody = document.getElementById('quiz-builder-tbody');
    const btnAddRow = document.getElementById('btn-add-quiz-row');
    const btnSaveCustom = document.getElementById('btn-save-custom-quiz');

    // 1. Core Default Data Sets
    const defaultSets = {
        english: [
            { q: "Apple", a: "사과", options: ["사과", "바나나", "오렌지", "포도"] },
            { q: "Banana", a: "바나나", options: ["사과", "바나나", "메론", "수박"] },
            { q: "Computer", a: "컴퓨터", options: ["컴퓨터", "텔레비전", "라디오", "스마트폰"] },
            { q: "Elephant", a: "코끼리", options: ["호랑이", "사자", "코끼리", "기린"] },
            { q: "School", a: "학교", options: ["공원", "학교", "병원", "도서관"] },
            { q: "Teacher", a: "선생님", options: ["학생", "선생님", "의사", "소방관"] },
            { q: "Library", a: "도서관", options: ["도서관", "미술관", "체육관", "교실"] },
            { q: "Tomorrow", a: "내일", options: ["어제", "오늘", "내일", "모레"] }
        ],
        science: [
            { q: "지구에서 가장 가까운 항성(별)은 무엇일까요?", a: "태양", options: ["태양", "달", "금성", "북극성"] },
            { q: "물이 1기압에서 끓는 온도는 몇 도(°C)일까요?", a: "100도", options: ["0도", "50도", "100도", "200도"] },
            { q: "식물이 광합성을 통해 대기 중으로 배출하는 기체는?", a: "산소", options: ["이산화탄소", "산소", "질소", "수소"] },
            { q: "지구의 자연 위성은 몇 개일까요?", a: "1개", options: ["0개", "1개", "2개", "3개"] },
            { q: "빛이 1초에 이동하는 거리는 약 몇 만 km일까요?", a: "30만 km", options: ["10만 km", "20만 km", "30만 km", "50만 km"] },
            { q: "우리 몸에서 혈액을 온몸으로 순환시키는 펌프 기관은?", a: "심장", options: ["간", "폐", "심장", "위"] },
            { q: "공기 성분 중 가장 많은 비율(약 78%)을 차지하는 기체는?", a: "질소", options: ["산소", "이산화탄소", "질소", "아르곤"] }
        ]
    };

    // State parameters
    let activeSet = [];
    let currentIndex = 0;
    let currentMode = 'flashcard'; // 'flashcard' | 'game'
    let score = 0;
    let answered = false;

    // Load saved custom quiz from localStorage
    let customSet = getSavedCustomQuiz();

    // 2. Initial Setup
    loadActiveSet();
    initEditorTable();
    updateArena();

    // 3. Tab Switches (Play vs Editor)
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.EduSound.playBeep(700, 0.08);
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetPaneId = btn.getAttribute('data-quiz-tab');
            document.getElementById(targetPaneId).classList.add('active');
        });
    });

    // 4. Input Configuration changes
    setSelect.addEventListener('change', () => {
        window.EduSound.playBeep(750, 0.08);
        loadActiveSet();
        resetArenaState();
        updateArena();
    });

    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            window.EduSound.playBeep(800, 0.06);
            currentMode = e.target.value;
            
            // Adjust radio parent visual state
            document.querySelectorAll('.radio-btn').forEach(lbl => lbl.classList.remove('active'));
            radio.closest('.radio-btn').classList.add('active');
            
            resetArenaState();
            updateArena();
        });
    });

    function getSavedCustomQuiz() {
        const saved = localStorage.getItem('edukit-custom-quiz');
        return saved ? JSON.parse(saved) : [
            { q: "사과", a: "Apple" },
            { q: "책", a: "Book" },
            { q: "학생", a: "Student" }
        ];
    }

    function loadActiveSet() {
        const selected = setSelect.value;
        if (selected === 'custom') {
            activeSet = customSet;
        } else {
            activeSet = defaultSets[selected];
        }
    }

    function resetArenaState() {
        currentIndex = 0;
        score = 0;
        answered = false;
        flashcardElement.classList.remove('flipped');
        
        if (currentMode === 'game') {
            scoreRow.classList.remove('hidden');
        } else {
            scoreRow.classList.add('hidden');
        }
    }

    // 5. Arena UI Render Engine
    function updateArena() {
        if (activeSet.length === 0) {
            frontText.textContent = "카드가 비어 있습니다.";
            backText.textContent = "편집기에서 카드를 추가해 주세요.";
            return;
        }

        // Update stats progress bar
        const total = activeSet.length;
        const progressPercent = ((currentIndex + 1) / total) * 100;
        progressText.textContent = `${currentIndex + 1} / ${total}`;
        progressBarFill.style.width = `${progressPercent}%`;

        if (currentMode === 'flashcard') {
            flashcardContainer.classList.remove('hidden');
            quizGameContainer.classList.add('hidden');
            renderFlashcard();
        } else {
            flashcardContainer.classList.add('hidden');
            quizGameContainer.classList.remove('hidden');
            renderQuizGame();
        }
    }

    // Flashcard Render
    function renderFlashcard() {
        const card = activeSet[currentIndex];
        frontText.textContent = card.q;
        backText.textContent = card.a;
    }

    // Quiz Game Render
    function renderQuizGame() {
        const card = activeSet[currentIndex];
        gameQuestionText.textContent = card.q;
        gameOptionsContainer.innerHTML = '';
        
        btnGameNext.classList.add('hidden');
        btnGameRestart.classList.add('hidden');
        answered = false;

        // Score display
        const percent = score > 0 ? Math.round((score / activeSet.length) * 100) : 0;
        scoreText.innerHTML = `${score} / ${activeSet.length} (${percent}%)`;

        // Generate options (custom sets require dynamic selection from other cards)
        let options = [];
        if (card.options) {
            options = [...card.options];
        } else {
            // Dynamic option generator for custom cards
            options.push(card.a); // correct answer
            
            // Gather incorrect answers
            const otherAnswers = activeSet
                .filter(item => item.a !== card.a)
                .map(item => item.a);
            
            // Shuffle and pick up to 3 incorrect ones
            const shuffledOthers = shuffleArray(otherAnswers);
            options.push(...shuffledOthers.slice(0, 3));
            
            // Re-shuffle combined answers
            options = shuffleArray(options);
        }

        // Render option buttons
        const optionLabels = ["A", "B", "C", "D"];
        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            
            const badge = document.createElement('div');
            badge.className = 'option-badge';
            badge.textContent = optionLabels[idx] || (idx + 1);
            
            const textSpan = document.createElement('span');
            textSpan.textContent = opt;
            
            btn.appendChild(badge);
            btn.appendChild(textSpan);
            
            btn.addEventListener('click', () => handleOptionClick(btn, opt, card.a));
            gameOptionsContainer.appendChild(btn);
        });
    }

    function handleOptionClick(selectedBtn, chosenOpt, correctOpt) {
        if (answered) return; // Prevent multiple choices
        answered = true;

        const optionButtons = gameOptionsContainer.querySelectorAll('.option-btn');
        optionButtons.forEach(btn => {
            const btnText = btn.querySelector('span').textContent;
            
            if (btnText === correctOpt) {
                btn.classList.add('correct');
            } else if (btn === selectedBtn) {
                btn.classList.add('wrong');
            }
        });

        if (chosenOpt === correctOpt) {
            score++;
            window.EduSound.playBeep(980, 0.12);
        } else {
            window.EduSound.playAlarm(); // Buzz
        }

        // Show score update
        const percent = score > 0 ? Math.round((score / activeSet.length) * 100) : 0;
        scoreText.innerHTML = `${score} / ${activeSet.length} (${percent}%)`;

        // Check if finished
        if (currentIndex < activeSet.length - 1) {
            btnGameNext.classList.remove('hidden');
        } else {
            btnGameRestart.classList.remove('hidden');
            setTimeout(() => {
                window.EduSound.playWinChime();
            }, 600);
        }
    }

    // 6. Navigation Controls
    // Flip flashcard actions
    flashcardElement.addEventListener('click', flipCard);
    btnCardFlip.addEventListener('click', flipCard);
    
    function flipCard() {
        flashcardElement.classList.toggle('flipped');
        window.EduSound.playBeep(850, 0.05);
    }

    btnCardPrev.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            flashcardElement.classList.remove('flipped');
            updateArena();
            window.EduSound.playBeep(700, 0.06);
        }
    });

    btnCardNext.addEventListener('click', () => {
        if (currentIndex < activeSet.length - 1) {
            currentIndex++;
            flashcardElement.classList.remove('flipped');
            updateArena();
            window.EduSound.playBeep(700, 0.06);
        }
    });

    // Game view navigation
    btnGameNext.addEventListener('click', () => {
        if (currentIndex < activeSet.length - 1) {
            currentIndex++;
            updateArena();
            window.EduSound.playBeep(750, 0.06);
        }
    });

    btnGameRestart.addEventListener('click', () => {
        resetArenaState();
        updateArena();
        window.EduSound.playBeep(900, 0.08);
    });

    // 7. Custom Quiz Table Editor
    function initEditorTable() {
        builderTbody.innerHTML = '';
        customSet.forEach(card => {
            addEditorRow(card.q, card.a);
        });
    }

    function addEditorRow(frontVal = '', backVal = '') {
        const tr = document.createElement('tr');
        
        const tdFront = document.createElement('td');
        const inputFront = document.createElement('input');
        inputFront.type = 'text';
        inputFront.placeholder = '단어 또는 질문';
        inputFront.value = frontVal;
        tdFront.appendChild(inputFront);
        
        const tdBack = document.createElement('td');
        const inputBack = document.createElement('input');
        inputBack.type = 'text';
        inputBack.placeholder = '뜻 또는 정답';
        inputBack.value = backVal;
        tdBack.appendChild(inputBack);
        
        const tdDel = document.createElement('td');
        const btnDel = document.createElement('button');
        btnDel.className = 'btn-delete-row';
        btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
        btnDel.addEventListener('click', () => {
            tr.remove();
            window.EduSound.playBeep(450, 0.08);
        });
        tdDel.appendChild(btnDel);
        
        tr.appendChild(tdFront);
        tr.appendChild(tdBack);
        tr.appendChild(tdDel);
        builderTbody.appendChild(tr);
    }

    // Add row button trigger
    btnAddRow.addEventListener('click', () => {
        addEditorRow();
        window.EduSound.playBeep(800, 0.05);
        
        // Auto scroll to bottom of container
        const container = document.querySelector('.quiz-builder-table-container');
        container.scrollTop = container.scrollHeight;
    });

    // Save customized set
    btnSaveCustom.addEventListener('click', () => {
        const rows = builderTbody.querySelectorAll('tr');
        const newCustomList = [];

        rows.forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            const qVal = inputs[0].value.trim();
            const aVal = inputs[1].value.trim();

            if (qVal.length > 0 && aVal.length > 0) {
                newCustomList.push({ q: qVal, a: aVal });
            }
        });

        if (newCustomList.length === 0) {
            alert('저장할 카드를 최소 1개 이상 입력해 주세요.');
            return;
        }

        customSet = newCustomList;
        localStorage.setItem('edukit-custom-quiz', JSON.stringify(customSet));
        
        window.EduSound.playWinChime();
        alert(`커스텀 카드 ${customSet.length}개가 저장 및 적용되었습니다.`);
        
        // Select custom in select dropdown and load it
        setSelect.value = 'custom';
        loadActiveSet();
        resetArenaState();
        updateArena();

        // Switch back to "Play" tab pane
        tabBtns[0].click();
    });

    // Array Shuffle utility (Fisher-Yates)
    function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
