document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);
document.getElementById('addModelBtn').addEventListener('click', addModel);

let models = [];

function renderModels() {
  const list = document.getElementById('modelList');
  list.innerHTML = '';
  models.forEach((model, index) => {
    const li = document.createElement('li');
    li.textContent = model;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '删除';
    removeBtn.onclick = () => {
      models.splice(index, 1);
      renderModels();
    };
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

function addModel() {
  const input = document.getElementById('newModelInput');
  const val = input.value.trim();
  if (val && !models.includes(val)) {
    models.push(val);
    input.value = '';
    renderModels();
  }
}

function saveOptions() {
  const baseUrl = document.getElementById('baseUrl').value;
  const apiKey = document.getElementById('apiKey').value;
  const searchUrl = document.getElementById('searchUrl').value;

  chrome.storage.local.set({
    baseUrl: baseUrl,
    apiKey: apiKey,
    models: models,
    searchUrl: searchUrl
  }, () => {
    const status = document.getElementById('status');
    status.textContent = '配置已保存';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
}

function restoreOptions() {
  chrome.storage.local.get({
    baseUrl: '',
    apiKey: '',
    models: ['gpt-3.5-turbo'],
    searchUrl: ''
  }, (items) => {
    document.getElementById('baseUrl').value = items.baseUrl;
    document.getElementById('apiKey').value = items.apiKey;
    document.getElementById('searchUrl').value = items.searchUrl;
    models = items.models;
    renderModels();
  });
}