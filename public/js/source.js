import { createContext, createSlangContext, runInContext } from "js-slang";

import { toString } from "js-slang/dist/interop";

import { Value } from "js-slang/dist/types";

window.source_runtime = {
  codeMap: {},
  codeIndex: 0,
  displays: []
};

window.source_runtime.context = (() => {
  // Define our builtins as in cadet-frontend/src/utils/slangHelper
  function display(t) {
    window.source_runtime.displays.push(toString(t));
  }
  display.__SOURCE__ = "display(a)";

  function cadetPrompt(any) {
    return prompt(toString(value));
  }
  cadetPrompt.__SOURCE__ = "prompt(a)";

  function cadetAlert(value) {
    alert(toString(value));
  }
  cadetAlert.__SOURCE__ = "alert(a)";

  function visualiseList(list) {
    if (window.ListVisualizer) {
      window.ListVisualizer.draw(list);
    } else {
      return list;
    }
  }
  visualiseList.__SOURCE__ = "draw_list(a)";

  const externalBuiltIns = {
    display,
    prompt: cadetPrompt,
    alert: cadetAlert,
    visualiseList
  };

  return createContext(3, [], null, externalBuiltIns);
})();

export function clearCodeMap() {
  window.source_runtime.codeMap = {};
  window.source_runtime.codeIndex = 0;
}

export function registerCode(code) {
  window.source_runtime.codeMap[window.source_runtime.codeIndex] = code;
  return window.source_runtime.codeIndex++;
}

export function execButton(codeIndex, button) {
  const code = window.source_runtime.codeMap[codeIndex];
  const result = runInContext(
    code,
    window.source_runtime.context
  ).then(result => {
    if (result.status == "error") {
      appendResult(parseErrors(window.source_runtime.context.errors), button);
    } else if (result.status == "finished") {
      window.source_runtime.displays.push(toString(result.value));
      appendResult(window.source_runtime.displays, button);
    }
    window.source_runtime.displays = [];
  });
}
// Result: array of strings
function appendResult(result, button) {
  const resultsPane = $(button).parent().siblings('.results');
  resultsPane.children('code').html(result.join('\n'));
  resultsPane.slideDown();
}

function parseErrors(errors) {
  return errors.map(error => {
    const line = error.location ? error.location.start.line : '<unknown>'
    const explanation = error.explain()
    return `<span class='error'>Line ${line}: ${explanation}</span>`
  });
}

export function addCodeHandlers() {
  $(".exec_button").each(function(index, button) {
    const codeIndex = $(button).attr("data-code-index");
    $(button).click(function(e) {
      execButton(codeIndex, button);
    });
  });
}
