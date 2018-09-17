import { createContext, createSlangContext, runInContext } from "js-slang";

import { toString } from "js-slang/dist/interop";

import { Value } from "js-slang/dist/types";

window.source_runtime = {
  codeMap: {},
  codeIndex: 0,
  displays: []
};

function new_context() {
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
}
window.source_runtime.context = new_context();

export function clearCodeMap() {
  window.source_runtime.codeMap = {};
  window.source_runtime.codeIndex = 0;
}

export function registerCode(code) {
  window.source_runtime.codeMap[window.source_runtime.codeIndex] = code;
  return window.source_runtime.codeIndex++;
}

export function execButton(codeIndex, button, reset_env = false) {
  const code = window.source_runtime.codeMap[codeIndex];
  if(reset_env) {
    clearAll();
  }
  return runInContext(code, window.source_runtime.context).then(result => {
    if (result.status == "error") {
      appendResult(parseErrors(window.source_runtime.context.errors), button);
    } else if (result.status == "finished") {
      window.source_runtime.displays.push(toString(result.value));
      appendResult(window.source_runtime.displays, button);
    }
    window.source_runtime.displays = [];
    return Promise.resolve();
  });
}
// Result: array of strings
function appendResult(result, button) {
  const resultsPane = $(button).parents('.block_feature').siblings(".results");
  resultsPane.children("code").html(result.join("\n"));
  resultsPane.show();
}

function parseErrors(errors) {
  return errors.map(error => {
    const line = error.location ? error.location.start.line : "<unknown>";
    const explanation = error.explain();
    return `<span class='error'>Line ${line}: ${explanation}</span>`;
  });
}

function runAll() {
  clearAll();
  const buttons = $(".exec_button").toArray();
  forEachPromise(
    btn => execButton($(btn).parent().attr("data-code-index"), btn),
    buttons
  );
}

// waits for each promise to finish before running the next one
function forEachPromise(fn, ary) {
  function helper(i) {
    if (i == ary.length) {
      return;
    } else {
      fn(ary[i]).then((res) => {
        helper(i + 1)
      });
    }
  }
  helper(0);
}

function clearAll() {
  $(".markdown-body pre code .results").hide();
  window.source_runtime.context = new_context();
}

export function addHeaderHandler() {
  $(".run-all").click(runAll);
  $(".reset-env").click(clearAll);
}
addHeaderHandler();

export function addCodeHandlers() {
  function addHandler(buttonSelector,reset_context) {
    $(buttonSelector).each(function(index, button) {
      const codeIndex = $(button).parent().attr("data-code-index");
      $(button).click(function(e) {
        execButton(codeIndex, button, reset_context);
      });
    });
  }
  addHandler('.exec_button', true);
  addHandler('.eval_button', false);
}
