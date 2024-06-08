'use strict';
const storage = {
  set: async (key, values) => {
    await chrome.storage.local.set({
      [key]: values,
    });
  },
  get: async (key) => {
    const values = await chrome.storage.local.get();
    if (values) {
      const res = values[key] ?? null;
      return res;
    }
    return null;
  },
  log: async () => {
    const values = await chrome.storage.local.get();
    console.log(values);
  },
  clear: async () => {
    await chrome.storage.local.clear();
  },
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'STARTFILL') {
    fillForm(request.payload.form);
  }
  if (request.type === 'GENERATEDATA') {
    const result = generateData(request.payload.form);
    if (result) {
      sendResponse({
        message: 'Start event recieved',
        form: request.payload.form,
        succeeded: true,
      });
    }
  }
  if (request.type === 'UPDATE') {
    updateData(request.payload.form, request.payload.data);
  }

  sendResponse({
    message: 'Start event recieved',
  });
  return true;
});

function updateData(key, values) {
  try {
    const data = JSON.parse(values);
    storage.set(key, data);
  } catch (error) {
    console.log('Could not parse updated data: ' + error);
  }
  console.log(JSON.parse(values));
  console.log('Values: ' + JSON.stringify(values));
}

function getElements() {
  const inputElements = document.getElementsByTagName('input');
  const result = [];
  for (let index = 0; index < inputElements.length; index++) {
    const element = inputElements[index];
    if (element.name) {
      result.push(element);
    }
  }
  return result;
}
function fillTextInputs(inputElements, values) {
  for (let index = 0; index < inputElements.length; index++) {
    const element = inputElements[index];
    if (element.name) {
      if (values[element.name]) {
        element.value = values[element.name];
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }
}
function fillSpecialInputs(inputElements, values) {
  for (let index = 0; index < inputElements.length; index++) {
    const element = inputElements[index];
    if (element.name) {
      if (element.type === 'checkbox') {
        if (values[element.name] === true) {
          element.click();
        }
      }
    }
  }
}

async function fillForm(name) {
  const inputElements = getElements();
  const values = await storage.get(name);
  // console.log(name, values);
  fillSpecialInputs(inputElements, values);
  setTimeout(() => {
    fillTextInputs(inputElements, values);
  }, 500);
}

function getValues(inputElements) {
  const result = {};
  for (let index = 0; index < inputElements.length; index++) {
    const element = inputElements[index];
    if (element.name) {
      result[element.name] = element.value;
    }
  }
  return result;
}

async function generateData(name) {
  try {
    const inputElements = getElements();
    const result = getValues(inputElements);
    await storage.set(name, result);
    return true;
  } catch (error) {
    console.log('Error while generating data', error);
    return false;
  }
}
