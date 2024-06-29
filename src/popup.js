'use strict';

import './popup.css';
import CodeFlask from 'codeflask';
import Prism from 'prismjs';

(function () {
  const flask = new CodeFlask('#editor', {
    language: 'json',
    lineNumbers: true,
    tabSize: 2,
  });
  flask.addLanguage('json', Prism.languages['json']);

  async function toggleEditorView() {
    const editorContainerDOM = document.getElementById('editor-container');
    const saveButtonDOM = document.getElementById('saveButton');
    editorContainerDOM.classList.toggle('visible');
    saveButtonDOM.classList.toggle('visible');
    // Fill the editor container with the data
    if (!editorContainerDOM.classList.contains('visible')) {
      const key = document.getElementById('formSelect').value;
      const values = await chrome.storage.local.get(key);
      flask.updateCode(JSON.stringify(values[key], null, '  '));
    }
  }
  async function updateEditorView() {
    const editorContainerDOM = document.getElementById('editor-container');
    if (!editorContainerDOM.classList.contains('visible')) {
      const key = document.getElementById('formSelect').value;
      const values = await chrome.storage.local.get(key);
      flask.updateCode(JSON.stringify(values[key], null, '  '));
    }
  }
  function updateData() {
    const key = document.getElementById('formSelect').value;
    const code = flask.getCode();
    console.log('code i s', code);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const value = document.getElementById('formSelect').value;
      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'UPDATE',
          payload: {
            form: value,
            data: code,
          },
        },
        (response) => {
          // console.log('Current count value passed to contentScript file');
        }
      );
    });
  }
  async function populateSelectOptions() {
    const selectedValue = document.getElementById('formSelect').value;
    const data = await chrome.storage.local.get();
    const options = Object.keys(data);
    const selectDOM = document.getElementById('formSelect');
    selectDOM.innerHTML = '';
    options.forEach((option) => {
      const optionDOM = document.createElement('option');
      optionDOM.value = option;
      optionDOM.innerText = option;
      selectDOM.appendChild(optionDOM);
    });
    selectDOM.value = selectedValue;
  }
  populateSelectOptions();
  function fillForm() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const value = document.getElementById('formSelect').value;
      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'STARTFILL',
          payload: {
            form: value,
          },
        },
        (response) => {
          // console.log('Current count value passed to contentScript file');
        }
      );
    });
  }
  function generateData() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const name = document.getElementById('nameInput').value;
      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'GENERATEDATA',
          payload: {
            form: name,
          },
        },
        (response) => {
          if (response.succeeded) {
            populateSelectOptions();
          }
        }
      );
    });
  }

  async function downloadData() {
    try {
      const data = await chrome.storage.local.get();

      const jsonString = JSON.stringify(data, null, 2);

      const blob = new Blob([jsonString], { type: 'application/json' });

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'data.json';

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Data downloaded successfully.');
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  }
  async function setNewObjectToLocalStorage(object) {
    for (const [key, value] of Object.entries(object)) {
      await chrome.storage.local.set({ [key]: value }, function () {
        if (chrome.runtime.lastError) {
          console.error(
            `Error setting data for ${key}: `,
            chrome.runtime.lastError
          );
        } else {
          console.log(`Data for ${key} successfully saved to local storage`);
        }
      });
    }
  }
  async function deleteAllData() {
    const result = confirm('Are you sure you want to delete all data');
    if (result) {
      await chrome.storage.local.clear();
      populateSelectOptions();
    }
  }
  async function generateDataFromFile() {
    async function onReaderLoad(event) {
      try {
        const newData = JSON.parse(event.target.result);
        const oldaData = await chrome.storage.local.get();
        const updatedData = { ...newData, ...oldaData };
        await setNewObjectToLocalStorage(updatedData);
        populateSelectOptions();
      } catch (error) {}
    }
    function onReaderError(event) {}
    const file = document.getElementById('uploadFileInput').files[0];
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.onerror = onReaderError;
    reader.readAsText(file);
  }
  function triggerfileUpload() {
    document.getElementById('uploadFileInput').click();
  }
  document.getElementById('fillButton').addEventListener('click', fillForm);
  document
    .getElementById('generateButton')
    .addEventListener('click', generateData);
  document
    .getElementById('viewDataButton')
    .addEventListener('click', toggleEditorView);
  document.getElementById('saveButton').addEventListener('click', updateData);
  document
    .getElementById('formSelect')
    .addEventListener('change', updateEditorView);

  document
    .getElementById('downloadButton')
    .addEventListener('click', downloadData);
  document
    .getElementById('uploadButton')
    .addEventListener('click', triggerfileUpload);

  document
    .getElementById('uploadFileInput')
    .addEventListener('input', generateDataFromFile);
  document
    .getElementById('deleteButton')
    .addEventListener('click', deleteAllData);
})();
