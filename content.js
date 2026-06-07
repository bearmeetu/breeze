let popupMenu = null;
let resultDialog = null;
let sidebar = null;
let selectedText = '';
let currentConfig = { models: ['gpt-3.5-turbo'], currentModel: 'gpt-3.5-turbo' };

// Load config
chrome.storage.local.get({ models: ['gpt-3.5-turbo'], currentModel: 'gpt-3.5-turbo' }, res => {
  currentConfig = res;
  if (!currentConfig.currentModel && currentConfig.models.length > 0) {
    currentConfig.currentModel = currentConfig.models[0];
  }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.models) {
      currentConfig.models = changes.models.newValue;
      updateSelects();
    }
    if (changes.currentModel) {
      currentConfig.currentModel = changes.currentModel.newValue;
      if (popupMenu) {
        const pSel = document.getElementById('breeze-popup-model-select');
        if (pSel) pSel.value = currentConfig.currentModel;
      }
      if (sidebar) {
        const sSel = document.getElementById('breeze-sidebar-model-select');
        if (sSel) sSel.value = currentConfig.currentModel;
      }
    }
  }
});

function updateSelects() {
  const pSelect = document.getElementById('breeze-popup-model-select');
  if (pSelect) populateSelect(pSelect);
  const sSelect = document.getElementById('breeze-sidebar-model-select');
  if (sSelect) populateSelect(sSelect);
}

function populateSelect(select) {
  select.innerHTML = '';
  currentConfig.models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
  if (!currentConfig.models.includes(currentConfig.currentModel) && currentConfig.models.length > 0) {
    currentConfig.currentModel = currentConfig.models[0];
    chrome.storage.local.set({currentModel: currentConfig.currentModel});
  }
  select.value = currentConfig.currentModel;
}

// Configure marked with highlight.js
if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
  marked.setOptions({
    langPrefix: 'hljs language-'
  });
}

const copyIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
const checkIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';

function addCopyButtonsToPres(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const pres = container.querySelectorAll('pre');
  pres.forEach(pre => {
    if (pre.querySelector('.breeze-copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'breeze-copy-btn';
    btn.innerHTML = copyIcon + ' 复制代码';
    btn.onclick = () => {
      const code = pre.querySelector('code');
      navigator.clipboard.writeText(code ? code.innerText : pre.innerText);
      btn.innerHTML = checkIcon + ' 已复制';
      setTimeout(() => {
        btn.innerHTML = copyIcon + ' 复制代码';
      }, 2000);
    };
    pre.appendChild(btn);
  });
}
const icons = {
  explain: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
  translate: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="M22 22l-5-10-5 10"></path><path d="M14 18h6"></path></svg>',
  code: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
  explain_code: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
  flowchart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>',
  ask: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>'
};

document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  // Ignore clicks inside our own UI
  if (e.target.closest('#breeze-popup-menu') || 
      e.target.closest('#breeze-result-dialog') || 
      e.target.closest('#breeze-sidebar')) {
    return;
  }

  if (text.length > 0) {
    selectedText = text;
    showPopupMenu(e.pageX, e.pageY);
  } else {
    hidePopupMenu();
  }
});

function showPopupMenu(x, y) {
  if (!popupMenu) {
    createPopupMenu();
  }
  
  popupMenu.style.display = 'flex';
  
  let left = x;
  let top = y - 50;
  
  const menuWidth = popupMenu.offsetWidth;
  if (left + menuWidth > window.innerWidth + window.scrollX - 20) {
    left = window.innerWidth + window.scrollX - menuWidth - 20;
  }
  if (left < window.scrollX + 20) {
    left = window.scrollX + 20;
  }
  if (top < window.scrollY + 20) {
    top = y + 20;
  }

  // Position the menu
  popupMenu.style.left = `${left}px`;
  popupMenu.style.top = `${top}px`;
}

function hidePopupMenu() {
  if (popupMenu) {
    popupMenu.style.display = 'none';
  }
}

function createPopupMenu() {
  popupMenu = document.createElement('div');
  popupMenu.id = 'breeze-popup-menu';
  // Prevent selection from clearing when interacting with popup
  popupMenu.addEventListener('mousedown', (e) => {
    // Only prevent default if it's not the input field to still allow text typing/selection in input
    if (e.target.tagName !== 'INPUT') {
      e.preventDefault();
    }
  });
  
  const buttons = [
    { id: 'explain', label: '解释', icon: icons.explain },
    { id: 'translate', label: '翻译', icon: icons.translate },
    { id: 'code', label: '写代码', icon: icons.code },
    { id: 'explain_code', label: '逐行代码解释', icon: icons.explain_code },
    { id: 'flowchart', label: '流程图', icon: icons.flowchart },
    { id: 'search', label: 'AI 搜索', icon: icons.search }
  ];
  
  buttons.forEach(btn => {
    const el = document.createElement('button');
    el.className = 'breeze-btn';
    el.innerHTML = `${btn.icon}&nbsp;${btn.label}`;
    el.onclick = () => handleAction(btn.id);
    popupMenu.appendChild(el);
  });
  
  const divider = document.createElement('div');
  divider.className = 'breeze-divider';
  popupMenu.appendChild(divider);
  
  const select = document.createElement('select');
  select.id = 'breeze-popup-model-select';
  select.className = 'breeze-select';
  select.onchange = (e) => chrome.storage.local.set({currentModel: e.target.value});
  popupMenu.appendChild(select);
  populateSelect(select);

  const divider2 = document.createElement('div');
  divider2.className = 'breeze-divider';
  popupMenu.appendChild(divider2);
  
  const inputContainer = document.createElement('div');
  inputContainer.className = 'breeze-input-container';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = '问问 AI...';
  input.id = 'breeze-ask-input';
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      handleAction('ask', input.value);
      input.value = '';
    }
  };
  
  const askBtn = document.createElement('button');
  askBtn.className = 'breeze-ask-btn';
  askBtn.innerHTML = icons.ask;
  askBtn.onclick = () => {
    handleAction('ask', input.value);
    input.value = '';
  };
  
  inputContainer.appendChild(input);
  inputContainer.appendChild(askBtn);
  popupMenu.appendChild(inputContainer);
  
  document.body.appendChild(popupMenu);
}

function handleAction(action, question = '') {
  hidePopupMenu();
  
  if (action === 'search') {
    chrome.runtime.sendMessage({ type: 'search', text: selectedText });
    return;
  }
  
  if (action === 'ask') {
    openSidebar(question);
    requestAI(action, question, selectedText, (chunk) => appendToSidebar(chunk), () => finishSidebar());
  } else {
    let title = '';
    switch(action) {
      case 'explain': title = '解释'; break;
      case 'translate': title = '翻译'; break;
      case 'code': title = '写代码'; break;
      case 'explain_code': title = '逐行代码解释'; break;
      case 'flowchart': title = '流程图'; break;
    }
    openDialog(title);
    requestAI(action, '', selectedText, (chunk) => appendToDialog(chunk), () => finishDialog(action));
  }
}

function requestAI(action, question, text, onChunk, onFinish) {
  chrome.runtime.sendMessage({
    type: 'ai_request',
    action: action,
    question: question,
    text: text,
    modelName: currentConfig.currentModel
  });
  
  // We'll receive chunks via message listener
  const listener = (request, sender, sendResponse) => {
    if (request.type === 'ai_chunk') {
      onChunk(request.chunk);
    } else if (request.type === 'ai_finish') {
      onFinish();
      chrome.runtime.onMessage.removeListener(listener);
    } else if (request.type === 'ai_error') {
      onChunk(`\n\n**Error**: ${request.error}`);
      onFinish();
      chrome.runtime.onMessage.removeListener(listener);
    }
  };
  chrome.runtime.onMessage.addListener(listener);
}

// Dialog Logic
let currentDialogContent = '';
let isFlowchartResult = false;

function highlightCodeBlocks(containerId) {
  const container = document.getElementById(containerId);
  if (!container || typeof hljs === 'undefined') return;
  container.querySelectorAll('pre code[class*="language-"]').forEach(el => {
    hljs.highlightElement(el);
  });
}

function openDialog(title) {
  if (!resultDialog) {
    resultDialog = document.createElement('div');
    resultDialog.id = 'breeze-result-dialog';
    
    const header = document.createElement('div');
    header.className = 'breeze-header';
    
    const titleEl = document.createElement('span');
    titleEl.id = 'breeze-dialog-title';
    header.appendChild(titleEl);
    
    const actions = document.createElement('div');
    actions.className = 'breeze-header-actions';
    
    const copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'breeze-icon-btn';
    copyAllBtn.title = '复制全部';
    copyAllBtn.innerHTML = copyIcon;
    copyAllBtn.onclick = () => {
      let text;
      if (isFlowchartResult) {
        text = currentDialogContent;
      } else {
        text = document.getElementById('breeze-dialog-content').innerText;
      }
      navigator.clipboard.writeText(text);
      copyAllBtn.innerHTML = checkIcon;
      setTimeout(() => copyAllBtn.innerHTML = copyIcon, 2000);
    };
    actions.appendChild(copyAllBtn);
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'breeze-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => { resultDialog.style.display = 'none'; };
    actions.appendChild(closeBtn);
    
    header.appendChild(actions);
    
    const content = document.createElement('div');
    content.className = 'breeze-content breeze-md-content';
    content.id = 'breeze-dialog-content';
    
    resultDialog.appendChild(header);
    resultDialog.appendChild(content);
    document.body.appendChild(resultDialog);
  }
  
  document.getElementById('breeze-dialog-title').innerText = title;
  const contentEl = document.getElementById('breeze-dialog-content');
  contentEl.innerHTML = '<div style="text-align:center; color:#999;">正在思考...</div>';
  currentDialogContent = '';
  resultDialog.style.display = 'flex';
}

function appendToDialog(chunk) {
  if (currentDialogContent === '') {
    document.getElementById('breeze-dialog-content').innerHTML = ''; // Clear loading
  }
  currentDialogContent += chunk;
  renderMarkdown('breeze-dialog-content', currentDialogContent);
}

function finishDialog(action) {
  if (action === 'flowchart') {
    const container = document.getElementById('breeze-dialog-content');
    let chartDef = currentDialogContent;
    const match = currentDialogContent.match(/```[a-z]*\s*([\s\S]*?)```/);
    if (match) {
      chartDef = match[1];
    }
    chartDef = chartDef.trim();
    
    // Clear innerHTML completely before injecting mermaid div to avoid rendering conflicts
    container.innerHTML = `<div class="mermaid">${chartDef}</div>`;
    
    try {
      if (typeof mermaid !== 'undefined') {
        mermaid.init(undefined, container.querySelectorAll('.mermaid'));
      }
    } catch (e) {
      container.innerHTML = `<div><div style="color:red;">渲染流程图失败:</div><pre><code>${chartDef}</code></pre></div>`;
    }
    isFlowchartResult = true;
  } else {
    isFlowchartResult = false;
  }
}

// Sidebar Logic
let chatHistory = [];
let currentSidebarMsgId = null;

function openSidebar(question) {
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'breeze-sidebar';
    
    const header = document.createElement('div');
    header.className = 'breeze-header';

    const titleArea = document.createElement('div');
    titleArea.style.display = 'flex';
    titleArea.style.alignItems = 'center';
    titleArea.innerHTML = '<span>Breeze 助手</span>';
    
    const sSelect = document.createElement('select');
    sSelect.id = 'breeze-sidebar-model-select';
    sSelect.className = 'breeze-select';
    sSelect.style.marginLeft = '10px';
    sSelect.onchange = (e) => chrome.storage.local.set({currentModel: e.target.value});
    titleArea.appendChild(sSelect);
    
    header.appendChild(titleArea);
    populateSelect(sSelect);

    const closeBtn = document.createElement('span');
    closeBtn.className = 'breeze-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => { document.getElementById('breeze-sidebar').classList.remove('open'); };
    header.appendChild(closeBtn);
    
    const historyContainer = document.createElement('div');
    historyContainer.className = 'breeze-chat-history';
    historyContainer.id = 'breeze-chat-history';
    
    const inputArea = document.createElement('div');
    inputArea.className = 'breeze-input-area';
    const input = document.createElement('textarea');
    input.placeholder = '继续提问...';
    input.rows = 1;
    input.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (input.value.trim() !== '') {
          const q = input.value;
          input.value = '';
          addSidebarMessage('user', q);
          startSidebarAIMessage();
          requestAI('ask', q, selectedText, (chunk) => appendToSidebar(chunk), () => finishSidebar());
        }
      }
    };
    inputArea.appendChild(input);
    
    sidebar.appendChild(header);
    sidebar.appendChild(historyContainer);
    sidebar.appendChild(inputArea);
    document.body.appendChild(sidebar);
  }
  
  sidebar.classList.add('open');
  chatHistory = [];
  document.getElementById('breeze-chat-history').innerHTML = '';
  
  addSidebarMessage('user', question);
  startSidebarAIMessage();
}

function addSidebarMessage(role, text) {
  chatHistory.push({ role: role, content: text });
  renderChatHistory();
}

function startSidebarAIMessage() {
  currentSidebarMsgId = 'msg-' + Date.now();
  chatHistory.push({ role: 'ai', content: '', id: currentSidebarMsgId });
  renderChatHistory();
}

function appendToSidebar(chunk) {
  const msg = chatHistory.find(m => m.id === currentSidebarMsgId);
  if (msg) {
    msg.content += chunk;
    const el = document.getElementById(currentSidebarMsgId);
    if (el) {
      if (typeof marked !== 'undefined') {
        el.innerHTML = marked.parse(msg.content);
        addCopyButtonsToPres(currentSidebarMsgId);
        highlightCodeBlocks(currentSidebarMsgId);
        // Add/refresh bubble copy button
        const existingBtn = el.querySelector('.breeze-bubble-copy-btn');
        if (!existingBtn) {
          const bubbleCopyBtn = document.createElement('button');
          bubbleCopyBtn.className = 'breeze-bubble-copy-btn';
          bubbleCopyBtn.innerHTML = copyIcon;
          bubbleCopyBtn.title = '复制回答';
          bubbleCopyBtn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(msg.content || '');
            bubbleCopyBtn.innerHTML = checkIcon;
            setTimeout(() => bubbleCopyBtn.innerHTML = copyIcon, 2000);
          };
          el.appendChild(bubbleCopyBtn);
        }
      } else {
        el.innerText = msg.content;
      }
      scrollToBottomSidebar();
    }
  }
}

function renderChatHistory() {
  const container = document.getElementById('breeze-chat-history');
  container.innerHTML = '';
  
  chatHistory.forEach(msg => {
    const div = document.createElement('div');
    div.className = msg.role === 'user' ? 'breeze-msg-user' : 'breeze-msg-ai breeze-md-content';
    if (msg.role === 'ai') {
      div.id = msg.id;
      if (typeof marked !== 'undefined') {
        div.innerHTML = marked.parse(msg.content || '正在思考...');
        addCopyButtonsToPres(msg.id);
        highlightCodeBlocks(msg.id);
      } else {
        div.innerText = msg.content || '正在思考...';
      }
      // Add copy button to AI message bubble
      const bubbleCopyBtn = document.createElement('button');
      bubbleCopyBtn.className = 'breeze-bubble-copy-btn';
      bubbleCopyBtn.innerHTML = copyIcon;
      bubbleCopyBtn.title = '复制回答';
      bubbleCopyBtn.onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(msg.content || '');
        bubbleCopyBtn.innerHTML = checkIcon;
        setTimeout(() => bubbleCopyBtn.innerHTML = copyIcon, 2000);
      };
      div.appendChild(bubbleCopyBtn);
    } else {
      div.innerText = msg.content;
    }
    container.appendChild(div);
  });
  scrollToBottomSidebar();
}

function scrollToBottomSidebar() {
  const container = document.getElementById('breeze-chat-history');
  container.scrollTop = container.scrollHeight;
}

function finishSidebar() {
  // Done
}

function renderMarkdown(elementId, text) {
  const el = document.getElementById(elementId);
  if (typeof marked !== 'undefined') {
    el.innerHTML = marked.parse(text);
    addCopyButtonsToPres(elementId);
    highlightCodeBlocks(elementId);
  } else {
    el.innerText = text; // Fallback
  }
}

// Initialize mermaid
if (typeof mermaid !== 'undefined') {
  mermaid.initialize({ startOnLoad: false, theme: 'default' });
}