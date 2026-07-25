// App State
const state = {
    mode: 'mcq',
    questions: [],
    results: null,
    history: [], // Storing multiple results for analytics
    theoryFile: null,
    backendUrl: (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:') && window.location.port !== '8000' ? 'http://127.0.0.1:8000' : '',
    cropper: null,
    capturePurpose: 'student', // 'student', 'master', 'theory'
    batchStep: 1,
    mcqStep: 1
};

window.saveState = function() {
    const dataToSave = {
        questions: state.questions,
        history: state.history,
        batchStep: state.batchStep || 1,
        mcqStep: state.mcqStep || 1
    };
    localStorage.setItem('evalApp_batchState', JSON.stringify(dataToSave));
};

window.loadState = function() {
    const saved = localStorage.getItem('evalApp_batchState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.questions = parsed.questions || [];
            state.history = parsed.history || [];
            state.batchStep = parsed.batchStep || 1;
            state.mcqStep = parsed.mcqStep || 1;
        } catch(e) {}
    }
};


let currentConfirmAction = null;

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalMessage').innerText = message;
    currentConfirmAction = onConfirm;
    document.getElementById('confirmModal').style.display = 'flex';
}

document.getElementById('confirmModalCancelBtn').onclick = () => {
    document.getElementById('confirmModal').style.display = 'none';
    currentConfirmAction = null;
};

document.getElementById('confirmModalConfirmBtn').onclick = () => {
    document.getElementById('confirmModal').style.display = 'none';
    if (currentConfirmAction) {
        currentConfirmAction();
    }
};

window.resetBatch = () => {
    showConfirmModal(
        "Start New Batch?",
        "Are you sure you want to clear all batch evaluation data? This action cannot be undone.",
        () => {
            state.history = [];
            state.questions = [];
            state.batchStep = 1;
            state.results = null;
            window.saveState();
            if(elements.batchResultsBody) elements.batchResultsBody.innerHTML = '';
            switchMode('batch');
            showNotification("Batch data reset successfully", "success");
        }
    );
};

// UI Elements
const elements = {
    navItems: document.querySelectorAll('.nav-item'),
    views: document.querySelectorAll('.view'),
    mcqInit: document.getElementById('mcqInit'),
    mcqConfig: document.getElementById('mcqConfig'),
    theoryInput: document.getElementById('theoryInput'),
    theoryContext: document.getElementById('theoryContext'),
    batchView: document.getElementById('batchView'),
    analyticsView: document.getElementById('analyticsView'),
    dashboard: document.getElementById('dashboard'),
    questionRows: document.getElementById('questionRows'),
    totalQuestionsInput: document.getElementById('totalQuestionsInput'),
    generateKeyBtn: document.getElementById('generateKeyBtn'),
    scanMasterKeyBtn: document.getElementById('scanMasterKeyBtn'),
    negativeStat: document.getElementById('negativeStat'),
    mcqStatsGrid: document.getElementById('mcqStatsGrid'),
    modeIndicator: document.getElementById('modeIndicator'),
    breakdownContainer: document.getElementById('breakdownContainer'),
    masterKeyFile: document.getElementById('masterKeyFile'),
    resetMcqBtn: document.getElementById('resetMcqBtn'),
    questionCountLabel: document.getElementById('questionCountLabel'),
    batchUploadZone: document.getElementById('batchUploadZone'),
    batchFiles: document.getElementById('batchFiles'),
    batchResultsBody: document.getElementById('batchResultsBody'),
    batchProgressBar: document.getElementById('batchProgressBar'),
    batchPercent: document.getElementById('batchPercent'),
    batchStatusText: document.getElementById('batchStatusText'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    video: document.getElementById('video'),
    canvas: document.getElementById('canvas'),
    captureBtn: document.getElementById('captureBtn'),
    uploadAltBtn: document.getElementById('uploadAltBtn'),
    mcqFile: document.getElementById('mcqFile'),
    theoryFile: document.getElementById('theoryFile'),
    theoryUploadZone: document.getElementById('theoryUploadZone'),
    startTheoryBtn: document.getElementById('startTheoryEvalBtn'),
    sharedNextToStep2: document.getElementById('sharedNextToStep2'),
    mcqStep2BackBtn: document.getElementById('wizardBackToStep1'),
    downloadReportBtn: document.getElementById('downloadReportBtn'),
    // Wizard specific
    mcqWizard: document.getElementById('mcqWizard'),
    wizardStep1: document.getElementById('wizardStep1'),
    wizardStep2: document.getElementById('wizardStep2'),
    pendingImagePreview: document.getElementById('pendingImagePreview'),
    imageReview: document.getElementById('imageReview'),
    submitSection: document.getElementById('submitSection'),
    finalSubmitMcq: document.getElementById('finalSubmitMcq'),
    startCameraBtn: document.getElementById('startCameraBtn'),
    captureControls: document.getElementById('captureControls'),
    stepperSteps: document.querySelectorAll('.step'),
    batchStepperSteps: document.querySelectorAll('.batch-step-indicator'),
    sharedKeySetupContainer: document.getElementById('sharedKeySetupContainer'),
    mcqKeySetupHost: document.getElementById('mcqKeySetupHost'),
    batchKeySetupHost: document.getElementById('batchKeySetupHost'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    sidebar: document.querySelector('.sidebar'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    initialKeyControls: document.getElementById('initialKeyControls'),
    // Unified Camera Modal
    cameraModal: document.getElementById('cameraModal'),
    sharedVideo: document.getElementById('sharedVideo'),
    sharedCanvas: document.getElementById('sharedCanvas'),
    shutterBtn: document.getElementById('shutterBtn'),
    closeCameraBtn: document.getElementById('closeCameraBtn'),
    cameraPurposeText: document.getElementById('cameraPurposeText'),
    // Theory Camera & Crop
    theoryActionControls: document.getElementById('theoryActionControls'),
    startTheoryCameraBtn: document.getElementById('startTheoryCameraBtn'),
    uploadQPaperBtn: document.getElementById('uploadQPaperBtn'),
    qPaperFile: document.getElementById('qPaperFile'),
    qPaperPreviewContainer: document.getElementById('qPaperPreviewContainer'),
    qPaperPreviewImg: document.getElementById('qPaperPreviewImg'),
    qPaperPreviewPdfIcon: document.getElementById('qPaperPreviewPdfIcon'),
    removeQPaperBtn: document.getElementById('removeQPaperBtn'),
    cropModal: document.getElementById('cropModal'),
    cropperImage: document.getElementById('cropperImage'),
    applyCropBtn: document.getElementById('applyCropBtn'),
    cancelCropBtn: document.getElementById('cancelCropBtn'),
    rotateLeftBtn: document.getElementById('rotateLeftBtn'),
    rotateRightBtn: document.getElementById('rotateRightBtn'),
    // Notifications
    notificationOverlay: document.getElementById('notificationOverlay'),
    notificationIcon: document.getElementById('notificationIcon'),
    notificationTitle: document.getElementById('notificationTitle'),
    notificationMessage: document.getElementById('notificationMessage'),
    closeNotificationBtn: document.getElementById('closeNotificationBtn')
};

// Initialize
function init() {
    window.loadState();
    setupEventListeners();
    
    const inDashboard = localStorage.getItem('evalApp_inDashboard');
    const savedMode = localStorage.getItem('evalApp_activeMode');
    
    if (inDashboard === 'true') {
        window.startApp();
    }
    
    if (savedMode) {
        switchMode(savedMode);
    } else {
        switchMode('mcq');
    }
}

window.startApp = function() {
    document.getElementById('appLanding').style.display = 'none';
    document.getElementById('appDashboard').style.display = 'flex';
    localStorage.setItem('evalApp_inDashboard', 'true');
};

window.goToLanding = function() {
    document.getElementById('appDashboard').style.display = 'none';
    document.getElementById('appLanding').style.display = 'flex';
    localStorage.removeItem('evalApp_inDashboard');
};

window.openModal = function(id, event) {
    if (event) event.preventDefault();
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

// Global click to close modals when clicking outside modal-content
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        e.target.classList.remove('active');
    }
});

// Navigation
window.switchMode = switchMode;
function switchMode(mode) {
    state.mode = mode;
    localStorage.setItem('evalApp_activeMode', mode);
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.mode === mode);
    });

    hideAllViews();

    if (mode === 'mcq' || mode === 'batch') {
        const host = mode === 'mcq' ? elements.mcqKeySetupHost : elements.batchKeySetupHost;
        if (elements.sharedKeySetupContainer && host && elements.sharedKeySetupContainer.parentElement !== host) {
            host.appendChild(elements.sharedKeySetupContainer);
        }
    }

    if (mode === 'mcq') {
        elements.mcqWizard.style.display = 'block';
        if (state.questions.length > 0) {
            elements.mcqInit.style.display = 'none';
            elements.mcqConfig.style.display = 'block';
            renderQuestions();
            elements.questionCountLabel.innerText = `Configuring ${state.questions.length} questions`;
        } else {
            elements.mcqInit.style.display = 'block';
            elements.mcqConfig.style.display = 'none';
        }
        window.switchWizardStep(state.mcqStep || 1);
    } else if (mode === 'batch') {
        elements.batchView.style.display = 'block';
        if (state.questions.length > 0) {
            elements.mcqInit.style.display = 'none';
            elements.mcqConfig.style.display = 'block';
            renderQuestions();
            elements.questionCountLabel.innerText = `Configuring ${state.questions.length} questions`;
        } else {
            elements.mcqInit.style.display = 'block';
            elements.mcqConfig.style.display = 'none';
        }
        window.switchBatchStep(state.batchStep || 1);
    } else if (mode === 'analytics') {
        elements.analyticsView.style.display = 'block';
        updateAnalytics();
    } else {
        elements.theoryInput.style.display = 'block';
    }
}

function hideAllViews() {
    elements.views.forEach(view => view.style.display = 'none');
    stopCamera();
}

window.switchWizardStep = (step) => {
    state.mcqStep = step;
    window.saveState();
    
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`wizardStep${step}`).classList.add('active');

    elements.stepperSteps.forEach(s => {
        const stepNum = parseInt(s.dataset.step);
        s.classList.toggle('active', stepNum === step);
        s.classList.toggle('completed', stepNum < step);
    });

    // Scroll back to the top of the page smoothly when changing steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.switchBatchStep = (step) => {
    state.batchStep = step;
    window.saveState();

    document.querySelectorAll('.batch-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`batchStep${step}`).classList.add('active');

    elements.batchStepperSteps.forEach(s => {
        const stepNum = parseInt(s.dataset.step);
        s.classList.toggle('active', stepNum === step);
        s.classList.toggle('completed', stepNum < step);
    });

    if (step === 3 && state.history.length > 0) {
        document.getElementById('batchProgressContainer').style.display = 'none';
        document.getElementById('batchResultsTableContainer').style.display = 'block';
        elements.batchResultsBody.innerHTML = '';
        state.history.forEach(h => {
            addBatchRow(h.filename, h);
        });
    }

    if (step !== 3) {
        document.getElementById('batchResultsTableContainer').style.display = 'none';
        document.getElementById('batchProgressContainer').style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// MCQ Logic
function initMCQ() {
    const count = parseInt(elements.totalQuestionsInput.value);
    if (isNaN(count) || count < 1 || count > 100) {
        return showNotification('Please enter a valid number of questions (1-100)', 'error');
    }

    state.questions = Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        correct: 'A',
        marks: 1,
        negativeEnabled: true,
        negativeValue: 0.25
    }));

    renderQuestions();
    elements.mcqInit.style.display = 'none';
    elements.mcqConfig.style.display = 'block';
    elements.questionCountLabel.innerText = `Configuring ${count} questions`;
    window.saveState();
}

function renderQuestions() {
    elements.questionRows.innerHTML = '';
    state.questions.forEach((q, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${q.id}</td>
            <td>
                <select onchange="updateQuestion(${index}, 'correct', this.value)" style="width: 100%;">
                    <option value="A" ${q.correct === 'A' ? 'selected' : ''}>A</option>
                    <option value="B" ${q.correct === 'B' ? 'selected' : ''}>B</option>
                    <option value="C" ${q.correct === 'C' ? 'selected' : ''}>C</option>
                    <option value="D" ${q.correct === 'D' ? 'selected' : ''}>D</option>
                    <option value="E" ${q.correct === 'E' ? 'selected' : ''}>E</option>
                </select>
            </td>
            <td><input type="number" value="${q.marks}" step="0.5" min="0.5" oninput="updateQuestion(${index}, 'marks', parseFloat(this.value) || 0)"></td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" ${q.negativeEnabled ? 'checked' : ''} onchange="updateQuestion(${index}, 'negativeEnabled', this.checked)">
                    <input type="number" value="${q.negativeValue}" step="0.25" min="0" style="width: 80px;" 
                           ${!q.negativeEnabled ? 'disabled' : ''}
                           oninput="updateQuestion(${index}, 'negativeValue', parseFloat(this.value) || 0)">
                </div>
            </td>
        `;
        elements.questionRows.appendChild(row);
    });
}

window.updateQuestion = (index, field, value) => {
    state.questions[index][field] = value;
    window.saveState();
    if (field === 'negativeEnabled') renderQuestions();
};

window.applyWeightageToAll = () => {
    if (state.questions.length < 1) return;
    const firstWeightage = state.questions[0].marks;
    state.questions.forEach((q, i) => {
        q.marks = firstWeightage;
    });
    window.saveState();
    renderQuestions();
};

window.applyNegativeToAll = () => {
    if (state.questions.length < 1) return;
    const firstEnabled = state.questions[0].negativeEnabled;
    const firstValue = state.questions[0].negativeValue;
    state.questions.forEach((q, i) => {
        q.negativeEnabled = firstEnabled;
        q.negativeValue = firstValue;
    });
    window.saveState();
    renderQuestions();
};

// Event Listeners
function setupEventListeners() {
    elements.navItems.forEach(item => {
        item.onclick = () => switchMode(item.dataset.mode);
    });

    elements.generateKeyBtn.onclick = initMCQ;
    elements.scanMasterKeyBtn.onclick = () => {
        elements.cameraPurposeText.innerText = "Scanning Master Key...";
        startCamera('master');
    };
    elements.masterKeyFile.onchange = (e) => {
        const file = e.target.files[0];
        if (file) handleMasterKey(file);
    };

    elements.resetMcqBtn.onclick = () => {
        state.questions = [];
        state.mcqStep = 1;
        window.saveState();
        switchMode('mcq');
    };

    elements.batchUploadZone.onclick = () => elements.batchFiles.click();
    elements.batchFiles.onchange = (e) => handleBatch(Array.from(e.target.files));
    
    // Add Directory selection event
    const batchDirFiles = document.getElementById('batchDirFiles');
    if (batchDirFiles) {
        batchDirFiles.onchange = (e) => handleBatch(Array.from(e.target.files));
    }

    elements.sharedNextToStep2.onclick = () => {
        if (state.mode === 'mcq') switchWizardStep(2);
        else if (state.mode === 'batch') switchBatchStep(2);
    };
    elements.mcqStep2BackBtn.onclick = () => {
        clearPendingImage();
        switchWizardStep(1);
    };

    // Theory Captures
    elements.qPaperFile.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            state.qPaperFile = file;
            elements.qPaperPreviewContainer.style.display = 'block';
            
            if (file.type.startsWith('image/')) {
                elements.qPaperPreviewPdfIcon.style.display = 'none';
                elements.qPaperPreviewImg.style.display = 'block';
                elements.qPaperPreviewImg.src = URL.createObjectURL(file);
            } else {
                elements.qPaperPreviewImg.style.display = 'none';
                elements.qPaperPreviewPdfIcon.style.display = 'flex';
            }
        }
    };

    elements.removeQPaperBtn.onclick = () => {
        state.qPaperFile = null;
        elements.qPaperFile.value = '';
        elements.qPaperPreviewContainer.style.display = 'none';
        elements.qPaperPreviewImg.src = '';
    };

    elements.startTheoryCameraBtn.onclick = () => {
        elements.cameraPurposeText.innerText = "Capturing Theory Answer...";
        startCamera('theory'); 
    };

    elements.theoryUploadZone.onclick = () => elements.theoryFile.click();
    elements.theoryFile.onchange = (e) => {
        const file = e.target.files[0];
        if (file) openCropper(file);
    };

    elements.applyCropBtn.onclick = applyCrop;
    elements.cancelCropBtn.onclick = () => elements.cropModal.style.display = 'none';
    elements.rotateLeftBtn.onclick = () => state.cropper?.rotate(-90);
    elements.rotateRightBtn.onclick = () => state.cropper?.rotate(90);

    elements.startCameraBtn.onclick = () => {
        elements.cameraPurposeText.innerText = "Scanning Student OMR...";
        startCamera('student');
    };

    elements.closeCameraBtn.onclick = stopCamera;
    elements.shutterBtn.onclick = captureImage;

    elements.closeNotificationBtn.onclick = () => {
        elements.notificationOverlay.style.display = 'none';
        elements.notificationOverlay.classList.remove('active');
    };

    elements.uploadAltBtn.onclick = () => elements.mcqFile.click();
    elements.mcqFile.onchange = (e) => handlePendingImage(e.target.files[0]);

    elements.startTheoryBtn.onclick = () => {
        if (!state.theoryFile) return showNotification('Please select a student sheet first', 'error');
        processTheoryFinal();
    };

    elements.finalSubmitMcq.onclick = () => {
        if (state.pendingImage) processMCQ(state.pendingImage);
    };

    elements.downloadReportBtn.onclick = downloadPDF;

    elements.mobileMenuBtn.onclick = () => {
        elements.sidebar.classList.toggle('active');
        document.body.classList.toggle('sidebar-open', elements.sidebar.classList.contains('active'));
    };

    // Close sidebar when clicking outside (on the dark overlay)
    document.addEventListener('click', (e) => {
        if (elements.sidebar.classList.contains('active') && 
            !elements.sidebar.contains(e.target) && 
            e.target !== elements.mobileMenuBtn &&
            !elements.mobileMenuBtn.contains(e.target)) {
            elements.sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    });

    // Close sidebar on nav item click (mobile)
    elements.navItems.forEach(item => {
        const origHandler = item.onclick;
        item.onclick = (e) => {
            elements.sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            if (origHandler) origHandler(e);
        };
    });

    // Settings Modal
    elements.settingsBtn.onclick = () => {
        elements.apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
        elements.settingsModal.style.display = 'flex';
    };

    elements.closeSettingsBtn.onclick = () => {
        elements.settingsModal.style.display = 'none';
    };

    elements.saveSettingsBtn.onclick = () => {
        const key = elements.apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('gemini_api_key', key);
            showNotification('API Key saved successfully!', 'success');
            elements.settingsModal.style.display = 'none';
        } else {
            showNotification('Please enter a valid API key', 'error');
        }
    };

    window.onclick = (event) => {
        if (event.target === elements.settingsModal) {
            elements.settingsModal.style.display = 'none';
        }
    };
}

window.clearPendingImage = () => {
    state.pendingImage = null;
    elements.imageReview.style.display = 'none';
    elements.submitSection.style.display = 'none';
    elements.captureControls.style.display = 'flex';
    elements.pendingImagePreview.src = '';
    // If coming back from preview, reveal the "Start Camera" button again
    elements.startCameraBtn.style.display = 'block';
};

window.retakeMCQ = () => {
    clearPendingImage();
    switchWizardStep(2);
};

function handlePendingImage(blob) {
    if (!blob) return;
    state.pendingImage = blob;
    const url = URL.createObjectURL(blob);
    elements.pendingImagePreview.src = url;
    elements.imageReview.style.display = 'flex';
    elements.submitSection.style.display = 'block';
    elements.captureControls.style.display = 'none';
    stopCamera();

    // Jump to Step 3 in stepper (Review & Submit)
    switchWizardStep(3);
}

// Master Key Logic
async function handleMasterKey(file) {
    if (!file) return;
    showLoading('Scanning Master Key OMR...');
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${state.backendUrl}/evaluate/master-key`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.status === 'success') {
            state.questions = data.detectedKey;
            window.saveState();
            renderQuestions();
            elements.mcqInit.style.display = 'none';
            elements.mcqConfig.style.display = 'block';
            elements.questionCountLabel.innerText = `Auto-configured ${state.questions.length} questions`;
        }
    } catch (err) { showNotification('Error scanning master key', 'error'); }
    finally { hideLoading(); }
}

// Batch Processing Logic
async function handleBatch(rawFiles) {
    if (state.questions.length === 0) return showNotification('Please set Answer Key first!', 'error');

    switchBatchStep(3);

    document.getElementById('batchProgressContainer').style.display = 'block';
    document.getElementById('batchResultsTableContainer').style.display = 'block';
    // Remove element clearing so we can append newly processed files
    // elements.batchResultsBody.innerHTML = '';
    
    elements.batchStatusText.innerText = "Extracting files...";
    const processableFiles = [];

    for (let file of rawFiles) {
        if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
            try {
                const zip = new JSZip();
                const contents = await zip.loadAsync(file);
                for (let filename of Object.keys(contents.files)) {
                    const zipEntry = contents.files[filename];
                    if (zipEntry.dir) continue;
                    if (!filename.match(/\.(jpg|jpeg|png|webp)$/i)) continue;
                    
                    const blob = await zipEntry.async('blob');
                    const ext = filename.split('.').pop().toLowerCase();
                    const mime = ext === 'jpg' ? 'jpeg' : ext;
                    const extractedFile = new File([blob], filename, { type: `image/${mime}` });
                    processableFiles.push(extractedFile);
                }
            } catch (err) {
                console.error("Failed to extract zip", err);
                showNotification(`Failed to extract ${file.name}`, 'error');
            }
        } else if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
            processableFiles.push(file);
        }
    }

    if (processableFiles.length === 0) {
        elements.batchStatusText.innerText = "No valid images found.";
        return showNotification('No valid images found in the selection.', 'error');
    }

    const total = processableFiles.length;
    for (let i = 0; i < total; i++) {
        const file = processableFiles[i];
        const percent = Math.round(((i + 1) / total) * 100);
        elements.batchProgressBar.style.width = `${percent}%`;
        elements.batchPercent.innerText = `${percent}%`;
        elements.batchStatusText.innerText = `Processing ${i + 1}/${total}: ${file.name}`;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('config', JSON.stringify(state.questions));

            const customKey = localStorage.getItem('gemini_api_key');
            const headers = {};
            if (customKey) headers['X-Gemini-API-Key'] = customKey;

            const response = await fetch(`${state.backendUrl}/evaluate/mcq`, { 
                method: 'POST', 
                body: formData,
                headers: headers
            });
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: 'Server error' }));
                throw new Error(errData.detail || 'Server error');
            }
            
            const data = await response.json();
            if (data.status === 'success') {
                const res = calculateMCQScore(data.results, state.questions);
                state.history.push({ filename: file.name, ...res, isError: false });
                addBatchRow(file.name, res);
                window.saveState();
            } else {
                throw new Error('Evaluation failed');
            }
        } catch (err) { 
            console.error("Batch processing error:", err);
            const errRes = calculateMCQScore([], state.questions);
            errRes.isError = true;
            errRes.errorMessage = err.message || 'ERROR';
            state.history.push({ filename: file.name, ...errRes });
            addBatchRow(file.name, errRes); 
            window.saveState();
        }
    }
}

function addBatchRow(filename, res) {
    const row = document.createElement('tr');
    if (res.isError) {
        row.innerHTML = `<td>${filename}</td><td>${res.score}/${res.maxScore}</td><td style="color:var(--danger)">${res.errorMessage || 'ERROR'}</td><td><button class="btn btn-outline" onclick="viewDetail('${filename}')">View</button></td>`;
    } else {
        row.innerHTML = `<td>${filename}</td><td>${res.score}/${res.maxScore}</td><td style="color:${res.score >= res.maxScore / 2 ? 'var(--success)' : 'var(--danger)'}">${res.score >= res.maxScore / 2 ? 'PASS' : 'FAIL'}</td><td><button class="btn btn-outline" onclick="viewDetail('${filename}')">View</button></td>`;
    }
    elements.batchResultsBody.appendChild(row);
}

window.viewDetail = (filename) => {
    const res = state.history.find(h => h.filename === filename);
    if (res) { state.results = res; renderDashboard('mcq'); }
};

// Analytics Logic
let distChart = null, accChart = null, topChart = null, weakChart = null;

function updateAnalytics() {
    const validHistory = state.history.filter(h => !h.isError && h.score !== 'Err');
    if (validHistory.length === 0) {
        document.getElementById('avgScoreStat').innerText = '0';
        document.getElementById('passingRateStat').innerText = '0%';
        if (document.getElementById('highestScoreStat')) document.getElementById('highestScoreStat').innerText = '0';
        if (document.getElementById('lowestScoreStat')) document.getElementById('lowestScoreStat').innerText = '0';
        if (document.getElementById('attemptAccuracyStat')) document.getElementById('attemptAccuracyStat').innerText = '0%';
        return;
    }
    
    const currentMaxScore = state.questions.reduce((sum, q) => sum + (parseFloat(q.marks) || 1), 0);
    // Ensure we don't accidentally count legacy history batches that had different configurations
    const matchingHistory = validHistory.filter(h => h.maxScore === currentMaxScore);
    const useHistory = matchingHistory.length > 0 ? matchingHistory : validHistory;

    const scores = useHistory.map(h => parseFloat(h.score));
    const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    
    // Pass rate evaluates against 50% of the possible max score for correctness
    const passRate = Math.round((useHistory.filter(h => parseFloat(h.score) >= (h.maxScore / 2)).length / useHistory.length) * 100);
    
    // Clamp the highest score strictly to the active max score threshold to prevent anomalous > 100% bugs from prior polluted caches
    let highestScoreRaw = Math.max(...scores);
    if (highestScoreRaw > currentMaxScore && currentMaxScore > 0) highestScoreRaw = currentMaxScore;
    const highestScore = highestScoreRaw.toFixed(1);
    
    const lowestScore = Math.min(...scores).toFixed(1);

    document.getElementById('avgScoreStat').innerText = avg;
    document.getElementById('passingRateStat').innerText = `${passRate}%`;
    if (document.getElementById('highestScoreStat')) document.getElementById('highestScoreStat').innerText = highestScore;
    if (document.getElementById('lowestScoreStat')) document.getElementById('lowestScoreStat').innerText = lowestScore;

    const qStats = {};
    let totalAttempted = 0;
    let totalCorrect = 0;
    
    useHistory.forEach(h => h.detailed.forEach(d => {
        if (!qStats[d.q]) qStats[d.q] = { correct: 0, attempted: 0, total: 0 };
        qStats[d.q].total++; 
        
        // Count for global attempt accuracy
        if (d.selected) {
            totalAttempted++;
            qStats[d.q].attempted++;
            if (d.isCorrect) {
                totalCorrect++;
                qStats[d.q].correct++;
            }
        }
    }));

    const attemptAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
    if (document.getElementById('attemptAccuracyStat')) document.getElementById('attemptAccuracyStat').innerText = `${attemptAccuracy}%`;

    renderCharts(scores, qStats, useHistory, currentMaxScore);
}

function renderCharts(scores, qStats, validHistory, currentMaxScore) {
    if (distChart) distChart.destroy();
    if (accChart) accChart.destroy();
    if (topChart) topChart.destroy();
    if (weakChart) weakChart.destroy();

    distChart = new Chart(document.getElementById('scoreDistChart'), {
        type: 'bar',
        data: { 
            labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'], 
            datasets: [{ 
                label: 'Students', 
                data: getBins(scores, currentMaxScore), 
                backgroundColor: '#6366f1',
                barPercentage: 1.0,
                categoryPercentage: 1.0
            }] 
        },
        options: {
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });

    accChart = new Chart(document.getElementById('questAccuracyChart'), {
        type: 'line',
        data: { 
            labels: Object.keys(qStats).map(q => `Q${q}`), 
            datasets: [{ 
                label: 'Accuracy %', 
                data: Object.keys(qStats).map(q => qStats[q].attempted > 0 ? (qStats[q].correct / qStats[q].attempted) * 100 : 0), 
                borderColor: '#a855f7', 
                fill: true 
            }] 
        },
        options: {
            scales: {
                y: {
                    min: 0,
                    max: 100
                }
            }
        }
    });

    // 1. Top Performers Chart
    const sortedStudents = [...validHistory].sort((a, b) => parseFloat(b.score) - parseFloat(a.score)).slice(0, 5);
    const topLabels = sortedStudents.map(s => s.filename.split('/').pop().replace(/\.[^/.]+$/, ""));
    const topScores = sortedStudents.map(s => parseFloat(s.score));

    topChart = new Chart(document.getElementById('topPerformersChart'), {
        type: 'bar',
        data: {
            labels: topLabels,
            datasets: [{ label: 'Scores', data: topScores, backgroundColor: '#10b981' }]
        },
        options: { indexAxis: 'y' }
    });

    // 2. Weak vs Strong Questions Chart
    let weakCount = 0; let strongCount = 0;
    Object.values(qStats).forEach(q => {
        if ((q.correct / q.total) * 100 >= 50) strongCount++; else weakCount++;
    });

    weakChart = new Chart(document.getElementById('weakStrongChart'), {
        type: 'doughnut',
        data: {
            labels: ['Strong (≥50%)', 'Weak (<50%)'],
            datasets: [{ data: [strongCount, weakCount], backgroundColor: ['#10b981', '#f43f5e'] }]
        }
    });

}

function getBins(scores, currentMaxScore) {
    const bins = [0, 0, 0, 0, 0];
    const max = currentMaxScore > 0 ? currentMaxScore : 1;
    scores.forEach(s => {
        // Calculate true percentage instead of charting the raw score integer directly!
        const p = (s / max) * 100;
        if (p <= 20) bins[0]++; else if (p <= 40) bins[1]++; else if (p <= 60) bins[2]++; else if (p <= 80) bins[3]++; else bins[4]++;
    });
    return bins;
}

let expandedChart = null;

window.expandChart = function(chartId, title) {
    const originalCanvas = document.getElementById(chartId);
    if (!originalCanvas) return;
    
    // Get original chart instance
    const originalChart = Chart.getChart(originalCanvas);
    if (!originalChart) return;

    document.getElementById('chartModalTitle').innerText = title;
    document.getElementById('chartModal').style.display = 'flex';

    const modalCanvas = document.getElementById('expandedChartCanvas');
    
    if (expandedChart) {
        expandedChart.destroy();
    }
    
    // Create new chart instance for modal based on original chart config
    const config = {
        type: originalChart.config.type,
        data: JSON.parse(JSON.stringify(originalChart.data)), // Deep copy data
        options: JSON.parse(JSON.stringify(originalChart.options))
    };
    
    config.options.maintainAspectRatio = false;
    config.options.responsive = true;
    
    // Slightly adjust font sizes for larger view
    config.options.plugins = config.options.plugins || {};
    config.options.plugins.legend = config.options.plugins.legend || {};
    config.options.plugins.legend.labels = config.options.plugins.legend.labels || {};
    config.options.plugins.legend.labels.font = { size: 16 };
    
    expandedChart = new Chart(modalCanvas, config);
};

// Theory Logic
window.clearTheoryFile = (e) => {
    e.stopPropagation();
    state.theoryFile = null;
    elements.theoryFile.value = '';
    elements.theoryUploadZone.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
            style="margin-bottom: 1rem; opacity: 0.5;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p>Click or drop to upload student sheet</p>
    `;
};

async function handleTheoryOCR(file) {
    state.theoryFile = file;
    const url = URL.createObjectURL(file);
    elements.theoryUploadZone.innerHTML = `
        <div style="width: 100%; max-width: 200px; margin: 0 auto; position: relative;">
            <img src="${url}" style="width: 100%; border-radius: 8px; border: 1px solid var(--primary);">
            <button type="button" class="remove-btn" onclick="clearTheoryFile(event)" style="position: absolute; top: -10px; right: -10px; background: var(--danger); color: white; border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-weight: bold; z-index: 10; display: flex; align-items: center; justify-content: center; padding: 0;">×</button>
            <p style="margin-top: 0.5rem; font-size: 0.8rem;">Cropped Answer Ready</p>
        </div>
        <p class="text-dim" style="margin-top: 1rem;">Click to change image</p>
    `;
}

function openCropper(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.cropperImage.src = e.target.result;
        elements.cropModal.style.display = 'flex';
        
        if (state.cropper) state.cropper.destroy();
        
        state.cropper = new Cropper(elements.cropperImage, {
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    };
    reader.readAsDataURL(file);
}

function applyCrop() {
    if (!state.cropper) return;
    
    state.cropper.getCroppedCanvas({
        maxWidth: 2048,
        maxHeight: 2048,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    }).toBlob((blob) => {
        const croppedFile = new File([blob], "cropped_answer.jpg", { type: "image/jpeg" });
        handleTheoryOCR(croppedFile);
        elements.cropModal.style.display = 'none';
        state.cropper.destroy();
        state.cropper = null;
    }, 'image/jpeg', 0.9);
}

async function processTheoryFinal() {
    const context = document.getElementById('theoryContext').value;
    const maxMarksInput = document.getElementById('theoryMaxMarks');
    const maxMarksVal = maxMarksInput ? maxMarksInput.value : '';

    if (!maxMarksVal || isNaN(maxMarksVal) || Number(maxMarksVal) <= 0) {
        if (document.getElementById('theoryMaxMarksError')) document.getElementById('theoryMaxMarksError').style.display = 'block';
        return showNotification('Please enter the maximum marks for this question.', 'error');
    } else {
        if (document.getElementById('theoryMaxMarksError')) document.getElementById('theoryMaxMarksError').style.display = 'none';
    }

    if (!context) return showNotification('Please provide a Model Answer or Question Context', 'error');

    showLoading('AI evaluating handwritten sheet...');
    try {
        const formData = new FormData();
        formData.append('file', state.theoryFile);
        formData.append('context', context);
        formData.append('max_marks', maxMarksVal);

        const customKey = localStorage.getItem('gemini_api_key');
        const headers = {};
        if (customKey) headers['X-Gemini-API-Key'] = customKey;

        const response = await fetch(`${state.backendUrl}/evaluate/theory`, {
            method: 'POST',
            body: formData,
            headers: headers
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({ detail: 'Evaluation failed' }));
            throw new Error(errData.detail || 'Evaluation failed');
        }

        const data = await response.json();
        state.results = { mode: 'theory', ...data };
        renderDashboard('theory');
    } catch (err) {
        console.error(err);
        showNotification('Evaluation failed: ' + err.message + '\n\nEnsure server is running and your Gemini API key is valid.', 'error');
    } finally {
        hideLoading();
    }
}

// CORE API & UI
async function processMCQ(imageBlob) {
    showLoading('Processing OMR...');
    try {
        const formData = new FormData();
        formData.append('file', imageBlob);
        formData.append('config', JSON.stringify(state.questions));

        const customKey = localStorage.getItem('gemini_api_key');
        const headers = {};
        if (customKey) headers['X-Gemini-API-Key'] = customKey;

        const response = await fetch(`${state.backendUrl}/evaluate/mcq`, {
            method: 'POST',
            body: formData,
            headers: headers
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({ detail: 'Server error' }));
            throw new Error(errData.detail || 'Server error');
        }

        const data = await response.json();
        if (data.status === 'success') {
            state.results = { mode: 'mcq', ...calculateMCQScore(data.results, state.questions) };
            state.history.push({ filename: 'Scan_' + Date.now(), ...state.results });
            window.saveState();
            renderDashboard('mcq');
        } else {
            throw new Error(data.detail || 'OMR processing failed');
        }
    } catch (err) {
        console.error('OMR Error:', err);
        showNotification('Error processing OMR: ' + err.message, 'error');
    }
    finally { hideLoading(); }
}

// Camera/Video
let stream = null;
async function startCamera(purpose = 'student') {
    try {
        state.capturePurpose = purpose;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        elements.sharedVideo.srcObject = stream;
        elements.cameraModal.style.display = 'flex';
    } catch (err) {
        console.error('Camera Error:', err);
        showNotification('Could not access camera. Please ensure you have given permission.', 'error');
    }
}

function stopCamera() { 
    if (stream) { 
        stream.getTracks().forEach(t => t.stop()); 
        stream = null; 
    } 
    elements.cameraModal.style.display = 'none';
}

function captureImage() {
    const context = elements.sharedCanvas.getContext('2d');
    elements.sharedCanvas.width = elements.sharedVideo.videoWidth;
    elements.sharedCanvas.height = elements.sharedVideo.videoHeight;
    context.drawImage(elements.sharedVideo, 0, 0);
    
    elements.sharedCanvas.toBlob(blob => {
        const purpose = state.capturePurpose;
        stopCamera();
        
        if (purpose === 'master') {
            handleMasterKey(blob);
        } else if (purpose === 'theory') {
            openCropper(new File([blob], "capture.jpg", { type: "image/jpeg" }));
        } else {
            handlePendingImage(blob);
        }
    }, 'image/jpeg', 0.9);
}

async function handleImageInput(file) {
    if (file) handlePendingImage(file);
}

function calculateMCQScore(apiResults, keys) {
    let totalMarks = 0, maxMarks = 0, correct = 0, incorrect = 0, skipped = 0, penalty = 0;
    const safeResults = Array.isArray(apiResults) ? apiResults : [];
    
    const detailed = keys.map(key => {
        const res = safeResults.find(r => r.q == key.id) || { q: key.id, selected: null, isCorrect: false };
        maxMarks += key.marks;
        
        const isActuallyCorrect = (res.selected && res.selected.toUpperCase() === key.correct.toUpperCase());
        let marksGained = 0;
        
        if (isActuallyCorrect) { 
            totalMarks += key.marks; correct++; marksGained = key.marks;
        } else if (res.selected) { 
            const p = key.negativeEnabled ? key.negativeValue : 0; 
            totalMarks -= p; penalty += p; incorrect++; marksGained = -p;
        } else {
            skipped++;
            marksGained = 0;
        }
        
        return { q: key.id, selected: res.selected, isCorrect: isActuallyCorrect, correctAnswer: key.correct, marksGained: marksGained };
    });
    
    return { mode: 'mcq', score: Math.max(0, totalMarks).toFixed(2), maxScore: maxMarks, correctCount: correct, incorrectCount: incorrect, skippedCount: skipped, penalty: penalty.toFixed(2), detailed };
}

function renderDashboard(mode) {
    hideAllViews();
    elements.dashboard.style.display = 'block';
    elements.downloadReportBtn.style.display = 'flex';
    
    const actionBtn = document.getElementById('newEvalBtn');
    if (actionBtn) {
        if (state.mode === 'batch') {
            actionBtn.innerText = 'Back to Batch';
            actionBtn.onclick = () => switchMode('batch');
        } else {
            actionBtn.innerText = 'New Evaluation';
            actionBtn.onclick = () => {
                if (state.mode === 'mcq') {
                    state.questions = [];
                    state.mcqStep = 1;
                    window.saveState();
                    state.results = null;
                    if (window.clearPendingImage) window.clearPendingImage();
                    if (elements.mcqFile) elements.mcqFile.value = '';
                    switchMode('mcq');
                } else if (state.mode === 'theory') {
                    state.results = null;
                    if (window.clearTheoryFile) window.clearTheoryFile({ stopPropagation: () => {} });
                    
                    const theoryMaxMarks = document.getElementById('theoryMaxMarks');
                    if (theoryMaxMarks) theoryMaxMarks.value = '';
                    
                    if (elements.theoryContext) elements.theoryContext.value = '';
                    if (elements.removeQPaperBtn) elements.removeQPaperBtn.click();
                    
                    switchMode('theory');
                }
            };
        }
    }

    // Ensure state.results has at least empty values to avoid 'undefined'
    const r = {
        score: 0,
        maxScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        skippedCount: 0,
        penalty: 0,
        detailed: [],
        extractedText: 'No text extracted',
        feedback: 'No feedback available',
        ...state.results
    };

    if (mode === 'mcq') {
        elements.modeIndicator.innerText = 'MCQ Evaluation Summary';
        elements.mcqStatsGrid.style.display = 'grid';

        const percentage = (r.score / r.maxScore * 100) || 0;
        const statusBadge = document.getElementById('statusBadge');
        statusBadge.innerText = percentage >= 50 ? 'PASSED' : 'FAILED';
        statusBadge.className = `status-badge ${percentage >= 50 ? 'status-passed' : 'status-failed'}`;

        animateValue(document.getElementById('scoreDisplay'), 0, r.score, 1000, ` / ${r.maxScore}`);
        document.getElementById('totalQuestionsStat').innerText = (r.detailed || []).length;
        document.getElementById('correctStat').innerText = r.correctCount;
        document.getElementById('incorrectStat').innerText = r.incorrectCount;
        document.getElementById('skippedStat').innerText = r.skippedCount || 0;
        document.getElementById('negativeStat').innerText = r.penalty;

        elements.breakdownContainer.innerHTML = (r.detailed || []).map(d => `
            <div class="mcq-result-card">
                <div class="mcq-result-info">
                    <div style="font-weight: 600;">Question #${d.q}</div>
                    <div style="font-size: 0.9rem; color: var(--text-dim);">
                        Selected: <span style="color: var(--text);">${d.selected || 'None'}</span> 
                        | Correct: <span style="color: var(--primary);">${d.correctAnswer}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="mcq-badge ${d.isCorrect ? 'badge-correct' : (d.selected ? 'badge-incorrect' : 'badge-empty')}">
                        ${d.isCorrect ? 'Correct' : (d.selected ? 'Incorrect' : 'Skipped')}
                    </span>
                    <div style="font-weight: 700; color: ${d.isCorrect ? 'var(--success)' : (d.selected && parseFloat(d.marksGained) < 0 ? 'var(--danger)' : 'var(--text-dim)')}">
                        ${d.isCorrect ? '+' : ''}${parseFloat(d.marksGained).toFixed(2)}
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        elements.modeIndicator.innerText = 'Theory Evaluation Summary';
        elements.mcqStatsGrid.style.display = 'none';

        const percentage = (r.score / r.maxScore * 100) || 0;
        const statusBadge = document.getElementById('statusBadge');
        statusBadge.innerText = percentage >= 50 ? 'PASSED' : 'FAILED';
        statusBadge.className = `status-badge ${percentage >= 50 ? 'status-passed' : 'status-failed'}`;

        animateValue(document.getElementById('scoreDisplay'), 0, r.score, 1000, ` / ${r.maxScore}`);

        const f = typeof r.feedback === 'object' ? r.feedback : { strengths: r.feedback, deductions: '', improvements: '' };

        elements.breakdownContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--mock-card-bg);">
                    <span style="color: var(--text-dim); font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem;">Maximum Marks</span>
                    <span style="font-size: 1.5rem; font-weight: 700; color: var(--text);">${r.maxScore}</span>
                </div>
                <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--mock-card-bg);">
                    <span style="color: var(--text-dim); font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem;">Obtained Marks</span>
                    <span style="font-size: 1.5rem; font-weight: 700; color: var(--text);">${r.score}</span>
                </div>
                <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--mock-card-bg);">
                    <span style="color: var(--text-dim); font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem;">Percentage</span>
                    <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${percentage.toFixed(1)}%</span>
                </div>
                <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--mock-card-bg);">
                    <span style="color: var(--text-dim); font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem;">Result</span>
                    <span style="font-size: 1.5rem; font-weight: 700; color: ${percentage >= 50 ? 'var(--success)' : 'var(--danger)'};">${percentage >= 50 ? 'PASS' : 'FAIL'}</span>
                </div>
            </div>

            <div class="card">
                <h4 style="color: var(--primary); margin-bottom: 1rem;">Transcription</h4>
                <p style="margin: 1rem 0; font-style: italic; color: var(--text-dim); border-left: 3px solid var(--primary); padding-left: 1rem; background: rgba(255,255,255,0.02); padding: 1rem;">"${r.extractedText}"</p>
                
                <div class="feedback-container">
                    <div class="feedback-section feedback-strengths">
                        <h5><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Strengths</h5>
                        <p>${f.strengths || 'N/A'}</p>
                    </div>
                    <div class="feedback-section feedback-deductions">
                        <h5><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Deduction Rationale</h5>
                        <p>${f.deductions || 'None'}</p>
                    </div>
                    <div class="feedback-section feedback-improvements">
                        <h5><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg> Improvement Path</h5>
                        <p>${f.improvements || 'See strengths to maintain quality'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (parseFloat(r.score) >= r.maxScore * 0.8) {
        setTimeout(triggerConfetti, 500);
    }
}

async function downloadPDF() {
    if (!state.results) return showNotification('No evaluation results to download', 'info');

    showLoading('Generating PDF Report...');
    try {
        const response = await fetch(`${state.backendUrl}/generate-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...state.results,
                score: state.results.score || 0,
                maxScore: state.results.maxScore || 10
            })
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok || (contentType && contentType.includes('application/json'))) {
            const errData = await response.json().catch(() => ({ detail: 'Unknown Error' }));
            throw new Error(errData.detail || 'PDF Generation failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.download = `EvalAI_Report_${timestamp}.pdf`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    } catch (err) {
        console.error('PDF Error:', err);
        showNotification('Failed to download PDF: ' + err.message, 'error');
    } finally {
        hideLoading();
    }
}

function showNotification(message, type = 'info') {
    const icons = {
        success: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="notification-icon-success"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="notification-icon-error"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="notification-icon-info"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    elements.notificationIcon.innerHTML = icons[type] || icons.info;
    elements.notificationTitle.innerText = type.charAt(0).toUpperCase() + type.slice(1);
    elements.notificationMessage.innerText = message;
    elements.notificationOverlay.style.display = 'flex';
    elements.notificationOverlay.classList.add('active');
    
    // Auto-dismiss success after 3s
    if (type === 'success') {
        setTimeout(() => {
            elements.notificationOverlay.style.display = 'none';
            elements.notificationOverlay.classList.remove('active');
        }, 3000);
    }
}

function showLoading(text) { elements.loadingText.innerText = text; elements.loadingOverlay.style.display = 'flex'; }
function hideLoading() { elements.loadingOverlay.style.display = 'none'; }

function animateValue(obj, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = (progress * (end - start) + start).toFixed(1);
        obj.innerHTML = val + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function triggerConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#f43f5e'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

/* =============================================
   HEADER CONTROLS MODULE
   Theme Toggle | Notifications | Profile Menu
   ============================================= */
(function initHeaderControls() {

    /* ---- Elements ---- */
    const themeToggleBtn  = document.getElementById('themeToggleBtn');
    const iconMoon        = document.getElementById('iconMoon');
    const iconSun         = document.getElementById('iconSun');

    const notifBtn        = document.getElementById('notifBtn');
    const notifDropdown   = document.getElementById('notifDropdown');
    const notifBadge      = document.getElementById('notifBadge');
    const clearNotifBtn   = document.getElementById('clearNotifBtn');

    const profileBtn      = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileViewBtn  = document.getElementById('profileViewBtn');
    const logoutBtn       = document.getElementById('logoutBtn');

    // Mobile mirrors (inside mobile-header bar)
    const themeToggleBtnM = document.getElementById('themeToggleBtnM');
    const iconMoonM       = document.getElementById('iconMoonM');
    const iconSunM        = document.getElementById('iconSunM');
    const notifBtnM       = document.getElementById('notifBtnM');
    const notifBadgeM     = document.getElementById('notifBadgeM');
    const profileBtnM     = document.getElementById('profileBtnM');

    /* ---- Shared: close all dropdowns ---- */
    function closeAllHCDropdowns() {
        [notifDropdown, profileDropdown].forEach(d => {
            if (d) d.classList.remove('open');
        });
        if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
        if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
    }

    /* ============ THEME TOGGLE ============ */
    const THEME_KEY = 'evalai_theme';

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.classList.add('light-theme');
            document.body.classList.add('light-theme');
            if (iconMoon) iconMoon.style.display = 'none';
            if (iconSun)  iconSun.style.display  = 'block';
        } else {
            document.documentElement.classList.remove('light-theme');
            document.body.classList.remove('light-theme');
            if (iconMoon) iconMoon.style.display = 'block';
            if (iconSun)  iconSun.style.display  = 'none';
        }
    }

    // Load saved preference (default: dark)
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(savedTheme);

    const landingThemeToggleBtn = document.getElementById('landingThemeToggleBtn');
    [themeToggleBtn, themeToggleBtnM, landingThemeToggleBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                const current = localStorage.getItem(THEME_KEY) || 'dark';
                const next = current === 'dark' ? 'light' : 'dark';
                localStorage.setItem(THEME_KEY, next);
                applyTheme(next);
            });
        }
    });

    /* ============ NOTIFICATION DROPDOWN ============ */
    let unreadCount = parseInt(notifBadge ? notifBadge.textContent : '0', 10) || 0;

    function updateBadge(count) {
        unreadCount = Math.max(0, count);
        if (notifBadge) {
            if (unreadCount === 0) {
                notifBadge.classList.add('hidden');
            } else {
                notifBadge.classList.remove('hidden');
                notifBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            }
        }
    }

    if (notifBtn) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = notifDropdown.classList.contains('open');
            closeAllHCDropdowns();
            if (!isOpen) {
                notifDropdown.classList.add('open');
                notifBtn.setAttribute('aria-expanded', 'true');
                // Mark as read when opening
                document.querySelectorAll('.notif-item.notif-unread').forEach(el => {
                    el.classList.remove('notif-unread');
                    const dot = el.querySelector('.notif-dot');
                    if (dot) dot.style.opacity = '0';
                });
                updateBadge(0);
            }
        });
    }

    if (clearNotifBtn) {
        clearNotifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const notifList = document.getElementById('notifList');
            if (notifList) {
                // Fade out and show empty state
                notifList.style.transition = 'opacity 0.25s ease';
                notifList.style.opacity = '0';
                setTimeout(() => {
                    notifList.innerHTML = `
                        <div style="padding: 2rem 1.25rem; text-align: center; color: var(--text-dim); font-size: 0.82rem;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 0.75rem; display: block; opacity: 0.4;">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                            No new notifications
                        </div>`;
                    notifList.style.opacity = '1';
                }, 250);
            }
            updateBadge(0);
        });
    }

    /* ============ PROFILE DROPDOWN ============ */
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = profileDropdown.classList.contains('open');
            closeAllHCDropdowns();
            if (!isOpen) {
                profileDropdown.classList.add('open');
                profileBtn.setAttribute('aria-expanded', 'true');
            }
        });
    }

    if (profileViewBtn) {
        profileViewBtn.addEventListener('click', () => {
            closeAllHCDropdowns();
            showNotification('Profile customization coming soon!', 'info');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            closeAllHCDropdowns();
            showConfirmModal(
                'Logout',
                'Are you sure you want to logout? This will end your current session.',
                () => {
                    // 1. Clear LocalStorage Session keys (do NOT clear theme)
                    localStorage.removeItem('gemini_api_key');
                    localStorage.removeItem('evalApp_activeMode');
                    localStorage.removeItem('evalApp_inDashboard');
                    localStorage.removeItem('evalApp_batchState');
                    
                    // 2. Clear state variables
                    state.questions = [];
                    state.results = null;
                    state.history = [];
                    state.theoryFile = null;
                    state.qPaperFile = null;
                    state.batchStep = 1;
                    state.mcqStep = 1;
                    
                    // 3. Clear UI Elements
                    if (window.clearPendingImage) window.clearPendingImage();
                    if (window.clearTheoryFile) window.clearTheoryFile({ stopPropagation: () => {} });
                    if (elements.mcqFile) elements.mcqFile.value = '';
                    const theoryMaxMarks = document.getElementById('theoryMaxMarks');
                    if (theoryMaxMarks) theoryMaxMarks.value = '';
                    if (elements.theoryContext) elements.theoryContext.value = '';
                    if (elements.qPaperContext) elements.qPaperContext.value = '';
                    
                    // 4. Reset to default view internally
                    switchMode('mcq');
                    
                    // 5. Navigate to Landing
                    window.goToLanding();
                    showNotification('Logged out successfully.', 'success');
                }
            );
        });
    }

    /* ============ CLOSE ON OUTSIDE CLICK ============ */
    document.addEventListener('click', (e) => {
        const notifWrapper   = document.getElementById('notifWrapper');
        const profileWrapper = document.getElementById('profileWrapper');
        const clickedInsideNotif   = notifWrapper   && notifWrapper.contains(e.target);
        const clickedInsideProfile = profileWrapper && profileWrapper.contains(e.target);
        if (!clickedInsideNotif && !clickedInsideProfile) {
            closeAllHCDropdowns();
        }
    });

    /* ============ CLOSE ON ESC ============ */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllHCDropdowns();
    });

})();

/* =============================================
   SIDEBAR RESIZE MODULE
   ============================================= */
(function initSidebarResize() {
    const sidebar = document.getElementById('sidebar');
    const resizer = document.getElementById('sidebarResizer');
    
    if (!sidebar || !resizer) return;
    
    const minWidth = 80;
    const maxWidth = 350;
    const collapseThreshold = 100;
    
    // Load preference on start
    const savedWidth = localStorage.getItem('sidebar_width');
    if (savedWidth) {
        const w = parseInt(savedWidth, 10);
        if (w <= collapseThreshold) {
            sidebar.classList.add('collapsed');
            sidebar.style.width = '80px';
            sidebar.style.minWidth = '80px';
        } else {
            sidebar.classList.remove('collapsed');
            sidebar.style.width = w + 'px';
            sidebar.style.minWidth = w + 'px';
        }
    } else {
        sidebar.style.width = '260px';
        sidebar.style.minWidth = '260px';
    }

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('active');
        sidebar.classList.add('is-resizing');
        document.body.style.cursor = 'col-resize';
        e.preventDefault(); // prevent text selection while dragging
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        let newWidth = e.clientX;
        
        if (newWidth > maxWidth) newWidth = maxWidth;
        
        if (newWidth <= collapseThreshold) {
            sidebar.classList.add('collapsed');
            sidebar.style.width = '80px';
            sidebar.style.minWidth = '80px';
        } else {
            sidebar.classList.remove('collapsed');
            sidebar.style.width = newWidth + 'px';
            sidebar.style.minWidth = newWidth + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        
        isResizing = false;
        resizer.classList.remove('active');
        sidebar.classList.remove('is-resizing');
        document.body.style.cursor = '';
        
        let finalWidth = parseInt(sidebar.style.width, 10);
        if (sidebar.classList.contains('collapsed')) {
            finalWidth = 80;
        }
        localStorage.setItem('sidebar_width', finalWidth);
    });
})();

init();
