chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'search') {
    chrome.storage.local.get({ searchUrl: '' }, (items) => {
      let url = items.searchUrl;
      if (!url) {
        // Fallback search URL if not configured
        url = 'https://www.google.com/search?q=%s';
      }
      url = url.replace('%s', encodeURIComponent(request.text));
      chrome.tabs.create({ url: url });
    });
    return true;
  }

  if (request.type === 'ai_request') {
    handleAIRequest(request, sender.tab.id);
    return true;
  }
});

async function handleAIRequest(request, tabId) {
  const { baseUrl, apiKey } = await chrome.storage.local.get({
    baseUrl: '',
    apiKey: ''
  });
  
  const modelName = request.modelName || 'gpt-3.5-turbo';

  if (!baseUrl || !apiKey) {
    chrome.tabs.sendMessage(tabId, { type: 'ai_error', error: '请先在插件选项中配置 Base URL 和 API Key' });
    return;
  }

  let prompt = '';
  const text = request.text;
  
  switch(request.action) {
    case 'explain':
      prompt = `请准确解释以下内容，保持输出格式和原文一致，使用 markdown 语法渲染：\n\n${text}`;
      break;
    case 'translate':
      prompt = `请准确翻译以下内容，如果原文是汉语则翻译成专业英语，如果原文是英语则翻译成专业汉语，保持输出格式和原文一致，使用 markdown 语法渲染：\n\n${text}`;
      break;
    case 'code':
      prompt = `这是一个功能或问题，请写出解决思路，并提供 Python 和 C++ 的实现代码，使用 markdown 语法渲染：\n\n${text}`;
      break;
    case 'explain_code':
      prompt = `请详细解释以下代码的功能、所用算法、容器、复杂度，使用 markdown 语法渲染：\n\n${text}`;
      break;
    case 'flowchart':
      prompt = `请将以下内容转换为 mermaid 格式的流程图代码，只需输出 mermaid 代码块即可：\n\n${text}`;
      break;
    case 'ask':
      prompt = `已知内容：\n${text}\n\n问题：\n${request.question}\n\n请结合已知内容给出精准、详细的回答，使用 markdown 语法渲染：`;
      break;
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.trim().substring(6));
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                chrome.tabs.sendMessage(tabId, { type: 'ai_chunk', chunk: data.choices[0].delta.content });
              }
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
        }
      }
    }
    chrome.tabs.sendMessage(tabId, { type: 'ai_finish' });

  } catch (error) {
    chrome.tabs.sendMessage(tabId, { type: 'ai_error', error: error.message });
  }
}