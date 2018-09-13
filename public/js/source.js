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
      console.log(window.source_runtime.context.errors);
    } else if (result.status == "finished") {
      console.log("logged", window.source_runtime.displays);
      console.log("finished running with value", result.value);
    }
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
