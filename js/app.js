/**
 * 引き継いでみよう。ツール - UI コントローラー (app.js)
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const stepItems = document.querySelectorAll('.step-item');
  const stepContents = document.querySelectorAll('.step-content');
  const progressBar = document.getElementById('progressBar');
  
  // Form Inputs
  const inputProject = document.getElementById('inputProject');
  const inputHistory = document.getElementById('inputHistory');
  const inputStatus = document.getElementById('inputStatus');
  const inputNext = document.getElementById('inputNext');
  
  // Output & Control Elements
  const promptOutput = document.getElementById('promptOutput');
  const charCountBadge = document.getElementById('charCountBadge');
  const copyBtn = document.getElementById('copyBtn');
  const modeTabs = document.querySelectorAll('.mode-tab');
  const tuningInput = document.getElementById('tuningInput');
  const applyTuningBtn = document.getElementById('applyTuningBtn');
  const resetBtn = document.getElementById('resetBtn');

  // State
  let currentStep = 1;
  let currentMode = 'standard';
  let currentTuning = '';
  let saveTimeout = null;
  const STORAGE_KEY = 'hikitsugi_tool_draft_v1';

  // Init
  initChips();
  loadSavedData();
  bindEvents();
  updateStepView();

  function initChips() {
    if (!window.CHIPS_DATA) return;
    ['step1', 'step2', 'step3', 'step4'].forEach((stepId, index) => {
      const listEl = document.getElementById(`chipsList${index + 1}`);
      if (!listEl) return;
      const chips = window.CHIPS_DATA[stepId] || [];
      listEl.innerHTML = '';
      chips.forEach(chipText => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip-btn';
        btn.textContent = `+ ${chipText}`;
        btn.addEventListener('click', () => appendChipToInput(index + 1, chipText));
        listEl.appendChild(btn);
      });
    });
  }

  function appendChipToInput(stepNumber, text) {
    const targetInput = getInputByStep(stepNumber);
    if (!targetInput) return;
    const currentVal = targetInput.value.trim();
    
    if (!currentVal) {
      targetInput.value = text;
    } else {
      const lines = currentVal.split('\n').map(l => l.replace(/^[・\s]+/, '').trim());
      if (!lines.includes(text)) {
        targetInput.value = `${currentVal}\n・${text}`;
      }
    }
    
    targetInput.dispatchEvent(new Event('input'));
    targetInput.focus();
    window.UIUtils.showToast(`「${text}」を追加しました`, 'info');
  }

  function getInputByStep(stepNumber) {
    switch (stepNumber) {
      case 1: return inputProject;
      case 2: return inputHistory;
      case 3: return inputStatus;
      case 4: return inputNext;
      default: return null;
    }
  }

  function bindEvents() {
    stepItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetStep = parseInt(item.dataset.step, 10);
        if (targetStep <= 5) goToStep(targetStep);
      });
    });

    document.querySelectorAll('[data-action="next"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (currentStep < 5) goToStep(currentStep + 1);
      });
    });

    document.querySelectorAll('[data-action="prev"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (currentStep > 1) goToStep(currentStep - 1);
      });
    });

    [inputProject, inputHistory, inputStatus, inputNext].forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => {
        debouncedSaveData();
        updateCharCounters();
      });
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (promptOutput) window.UIUtils.copyToClipboard(promptOutput.textContent);
      });
    }

    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modeTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        currentMode = tab.dataset.mode || 'standard';
        renderPrompt();
        window.UIUtils.showToast(`表示形式を「${tab.textContent}」に切り替えました`);
      });
    });

    document.querySelectorAll('.tuning-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.dataset.tune || chip.textContent;
        tuningInput.value = text;
        currentTuning = text;
        renderPrompt();
        window.UIUtils.showToast(`調整指示「${text}」を適用しました`);
      });
    });

    if (applyTuningBtn) {
      applyTuningBtn.addEventListener('click', () => {
        currentTuning = tuningInput.value.trim();
        renderPrompt();
        window.UIUtils.showToast('調整内容をプロンプトに反映しました');
      });
    }

    if (resetBtn) resetBtn.addEventListener('click', handleReset);

    document.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (currentStep < 5) {
          goToStep(currentStep + 1);
        } else if (currentStep === 5 && promptOutput) {
          window.UIUtils.copyToClipboard(promptOutput.textContent);
        }
      }
    });
  }

  function goToStep(step) {
    currentStep = step;
    updateStepView();
    if (currentStep === 5) renderPrompt();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateStepView() {
    const progressPercent = ((currentStep - 1) / 4) * 100;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;

    stepItems.forEach(item => {
      const step = parseInt(item.dataset.step, 10);
      item.classList.remove('active', 'completed');
      if (step === currentStep) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'step');
      } else {
        item.removeAttribute('aria-current');
        if (step < currentStep) item.classList.add('completed');
      }
    });

    stepContents.forEach(content => {
      const step = parseInt(content.dataset.step, 10);
      if (step === currentStep) content.classList.add('active');
      else content.classList.remove('active');
    });

    updateCharCounters();
  }

  function updateCharCounters() {
    [
      { input: inputProject, badge: document.getElementById('countProject') },
      { input: inputHistory, badge: document.getElementById('countHistory') },
      { input: inputStatus, badge: document.getElementById('countStatus') },
      { input: inputNext, badge: document.getElementById('countNext') }
    ].forEach(({ input, badge }) => {
      if (input && badge) badge.textContent = `${input.value.length} 文字`;
    });
  }

  function renderPrompt() {
    const data = {
      project: inputProject ? inputProject.value : '',
      history: inputHistory ? inputHistory.value : '',
      status: inputStatus ? inputStatus.value : '',
      next: inputNext ? inputNext.value : ''
    };
    const promptText = window.PromptGenerator.generate(data, currentMode, currentTuning);
    if (promptOutput) promptOutput.textContent = promptText;
    if (charCountBadge) charCountBadge.textContent = `${promptText.length} 文字`;
  }

  function handleReset() {
    if (confirm('入力した内容をすべてクリアして最初から作成しますか？')) {
      if (inputProject) inputProject.value = '';
      if (inputHistory) inputHistory.value = '';
      if (inputStatus) inputStatus.value = '';
      if (inputNext) inputNext.value = '';
      if (tuningInput) tuningInput.value = '';
      currentTuning = '';
      if (saveTimeout) clearTimeout(saveTimeout);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to clear state in localStorage:', e);
      }
      goToStep(1);
      window.UIUtils.showToast('入力内容をクリアしました');
    }
  }

  function debouncedSaveData() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveData();
    }, 300);
  }

  function saveData() {
    const data = {
      project: inputProject ? inputProject.value : '',
      history: inputHistory ? inputHistory.value : '',
      status: inputStatus ? inputStatus.value : '',
      next: inputNext ? inputNext.value : ''
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }

  function loadSavedData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data.project && inputProject) inputProject.value = data.project;
      if (data.history && inputHistory) inputHistory.value = data.history;
      if (data.status && inputStatus) inputStatus.value = data.status;
      if (data.next && inputNext) inputNext.value = data.next;
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
  }
});
