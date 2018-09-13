import {
  createContext,
  createSlangContext,
  runInContext
} from 'js-slang'

import { toString } from 'js-slang/dist/interop'

import { Value } from 'js-slang/dist/types'

window.source_runtime = {
  codeMap: {},
  codeIndex: 0,
}

window.source_runtime.context =  createContext(3);

export function clearCodeMap() {
  window.source_runtime.codeMap = {};
  window.source_runtime.codeIndex = 0;
}

export function registerCode(code) {
  window.source_runtime.codeMap[window.source_runtime.codeIndex] = code;
  return window.source_runtime.codeIndex++;
}

export function execIndex(index)  {
  const code = window.source_runtime.codeMap[index];
}
window.execIndex = execIndex;

export function addCodeHandlers() {
  $('.exec_button').each(function(index, button) {
    const codeIndex = $(button).attr('data-code-index');
    $(button).click(function(e) {
      const code = window.source_runtime.codeMap[codeIndex];
      runInContext(code, window.source_runtime.context).then(result => {
        if(result.status == 'error') {
          console.log(window.source_runtime.context.errors);
        } else if(result.status == 'finished') {
          console.log('finished running with value', result.value);
        }
      })
    })
  });
}
