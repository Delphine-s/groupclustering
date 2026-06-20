/* ==========================================
   FEATURE: 1. Group Maker Controller (group-maker.js)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    initGroupMaker();
});

function initGroupMaker() {
    const studentInput = document.getElementById('student-input');
    const btnLoadSample = document.getElementById('btn-load-sample');
    const btnClearList = document.getElementById('btn-clear-list');
    const btnGenerate = document.getElementById('btn-generate-groups');
    const btnSaveCurrent = document.getElementById('btn-save-current');
    const btnFullscreen = document.getElementById('btn-fullscreen-group');
    const groupsContainer = document.getElementById('groups-container');
    
    const modeToggle = document.getElementById('group-mode-toggle');
    const groupNumInput = document.getElementById('group-number');
    const groupNumLabel = document.getElementById('group-number-label');
    const labelModeCount = document.getElementById('label-mode-count');
    const labelModeSize = document.getElementById('label-mode-size');
    const btnDec = document.getElementById('btn-group-dec');
    const btnInc = document.getElementById('btn-group-inc');

    // Default sample students
    const sampleStudents = [
        "김민준", "이서준", "박예준", "최도윤", "정시우", 
        "강주원", "조하준", "윤지호", "장윤우", "임준우", 
        "서서아", "한이서", "오아윤", "서지아", "신하윤", 
        "정지우", "황지유", "안채원", "송민서", "유채아", 
        "이동현", "박준영", "최재원", "정성민", "강건우", 
        "조민재", "윤지민", "장현우", "임도현", "한준서"
    ];

    // Load saved list if exists
    const savedStudents = window.EduStorage.getStudents();
    if (savedStudents && savedStudents.length > 0) {
        studentInput.value = savedStudents.join(', ');
    }

    // Load sample names
    btnLoadSample.addEventListener('click', () => {
        studentInput.value = sampleStudents.join(', ');
        window.EduSound.playBeep(600, 0.1);
    });

    // Clear input
    btnClearList.addEventListener('click', () => {
        studentInput.value = '';
        window.EduSound.playBeep(400, 0.1);
    });

    // Handle Mode Toggle (Group Count vs Group Size)
    modeToggle.addEventListener('change', () => {
        window.EduSound.playBeep(700, 0.08);
        const isSizeMode = modeToggle.checked;
        if (isSizeMode) {
            groupNumLabel.textContent = "모둠별 인원수:";
            groupNumInput.value = "4";
            groupNumInput.min = "1";
            groupNumInput.max = "10";
            labelModeCount.classList.remove('active');
            labelModeSize.classList.add('active');
        } else {
            groupNumLabel.textContent = "원하는 모둠 개수:";
            groupNumInput.value = "4";
            groupNumInput.min = "2";
            groupNumInput.max = "20";
            labelModeCount.classList.add('active');
            labelModeSize.classList.remove('active');
        }
    });

    // Increment/Decrement helper listeners to ensure sound is played
    btnDec.addEventListener('click', () => window.EduSound.playBeep(800, 0.05));
    btnInc.addEventListener('click', () => window.EduSound.playBeep(800, 0.05));

    // Save current student list
    btnSaveCurrent.addEventListener('click', () => {
        const list = parseStudentInput();
        if (list.length === 0) {
            alert('저장할 학생 명단이 비어 있습니다.');
            return;
        }
        window.EduStorage.saveStudents(list);
        window.EduSound.playWinChime();
        alert(`학생 ${list.length}명의 명단이 성공적으로 저장되었습니다.`);
    });

    // Fullscreen Toggle
    btnFullscreen.addEventListener('click', () => {
        window.EduSound.playBeep(900, 0.05);
        const rightPanel = document.querySelector('#tool-group-maker .panel-right');
        if (!document.fullscreenElement) {
            rightPanel.requestFullscreen().catch(err => {
                console.error(`Error enabling fullscreen: ${err.message}`);
            });
            btnFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i>';
        } else {
            document.exitFullscreen();
            btnFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    });

    // Reset button design when exiting fullscreen via ESC key
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            btnFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    });

    // Parse input into clean list
    function parseStudentInput() {
        const rawText = studentInput.value;
        // Split by comma, newline or space
        return rawText.split(/[,\n]/)
            .map(name => name.trim())
            .filter(name => name.length > 0);
    }

    // Shuffle array (Fisher-Yates)
    function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Generate groups action
    btnGenerate.addEventListener('click', () => {
        const students = parseStudentInput();
        if (students.length === 0) {
            window.EduSound.playAlarm();
            alert('학생 이름을 먼저 입력해 주세요.');
            return;
        }

        const isSizeMode = modeToggle.checked;
        const targetValue = parseInt(groupNumInput.value, 10);
        
        if (isNaN(targetValue) || targetValue <= 0) {
            alert('올바른 편성 값을 입력해 주세요.');
            return;
        }

        window.EduSound.playBell();

        // Shuffle students
        const shuffled = shuffleArray(students);
        let groups = [];

        if (isSizeMode) {
            // Mode: Group Size (e.g. S students per group)
            const groupSize = targetValue;
            const numGroups = Math.ceil(shuffled.length / groupSize);
            
            for (let i = 0; i < numGroups; i++) {
                groups.push({
                    name: `${i + 1}모둠`,
                    members: shuffled.slice(i * groupSize, (i + 1) * groupSize)
                });
            }
        } else {
            // Mode: Group Count (N groups)
            const numGroups = targetValue;
            for (let i = 0; i < numGroups; i++) {
                groups.push({
                    name: `${i + 1}모둠`,
                    members: []
                });
            }
            
            // Distribute students cyclically
            shuffled.forEach((student, idx) => {
                const targetGroupIdx = idx % numGroups;
                groups[targetGroupIdx].members.push(student);
            });
        }

        renderGroups(groups);
    });

    // Render group cards
    function renderGroups(groups) {
        groupsContainer.innerHTML = '';
        
        const grid = document.createElement('div');
        grid.className = 'groups-grid';
        
        groups.forEach((group, groupIdx) => {
            const card = document.createElement('div');
            card.className = 'group-card';
            card.dataset.groupId = groupIdx;
            
            const header = document.createElement('div');
            header.className = 'group-card-header';
            
            const title = document.createElement('div');
            title.className = 'group-card-title';
            title.innerHTML = `<i class="fa-solid fa-users text-purple"></i> <span>${group.name}</span>`;
            
            const count = document.createElement('span');
            count.className = 'group-member-count';
            count.textContent = `${group.members.length}명`;
            
            header.appendChild(title);
            header.appendChild(count);
            card.appendChild(header);
            
            const membersList = document.createElement('div');
            membersList.className = 'group-members-list';
            membersList.dataset.listId = groupIdx;
            
            group.members.forEach(member => {
                const badge = createStudentBadge(member);
                membersList.appendChild(badge);
            });
            
            card.appendChild(membersList);
            grid.appendChild(card);
            
            // Setup Drag & Drop handlers on list container
            setupDropZone(membersList, count);
        });
        
        groupsContainer.appendChild(grid);
    }

    // Helper to create draggable student badge
    function createStudentBadge(name) {
        const badge = document.createElement('div');
        badge.className = 'student-badge';
        badge.draggable = true;
        badge.innerHTML = `<i class="fa-solid fa-grip-vertical text-muted"></i> ${name}`;
        
        badge.addEventListener('dragstart', (e) => {
            badge.classList.add('dragging');
            e.dataTransfer.setData('text/plain', name);
            // Keep track of the original parent
            window.draggedBadge = badge;
            window.EduSound.playBeep(1200, 0.05);
        });
        
        badge.addEventListener('dragend', () => {
            badge.classList.remove('dragging');
            window.draggedBadge = null;
        });
        
        return badge;
    }

    // Setup dragover & drop listeners on target lists
    function setupDropZone(listEl, countEl) {
        listEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            listEl.classList.add('drag-over');
        });
        
        listEl.addEventListener('dragleave', () => {
            listEl.classList.remove('drag-over');
        });
        
        listEl.addEventListener('drop', (e) => {
            e.preventDefault();
            listEl.classList.remove('drag-over');
            
            const badge = window.draggedBadge;
            if (badge && badge.parentNode !== listEl) {
                const sourceList = badge.parentNode;
                const sourceCard = sourceList.closest('.group-card');
                
                // Append badge to the new group list
                listEl.appendChild(badge);
                window.EduSound.playBeep(900, 0.08);
                
                // Update student counts on both groups
                updateMemberCount(listEl, countEl);
                if (sourceCard) {
                    const sourceCountEl = sourceCard.querySelector('.group-member-count');
                    updateMemberCount(sourceList, sourceCountEl);
                }
            }
        });
    }

    // Update list count badge text
    function updateMemberCount(listEl, countEl) {
        const count = listEl.querySelectorAll('.student-badge').length;
        countEl.textContent = `${count}명`;
    }
}
