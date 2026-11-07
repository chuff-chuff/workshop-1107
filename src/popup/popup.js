// ポップアップ画面のスクリプト
// 仕様：docs/spec.md 6章

const CONTENT_FILES = [
  "src/vendor/dom-accessibility-api.js",
  "src/content/content.js",
];
const DEFAULT_MODE = "hide";

const toggleButton = document.getElementById("toggle");
const modeFieldset = document.getElementById("mode");
const unsupportedMessage = document.getElementById("unsupported");

let tabId = null;

// ---- 文言（_locales） ------------------------------------------------------

function localize() {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  for (const el of document.querySelectorAll("[data-i18n]")) {
    const message = chrome.i18n.getMessage(el.dataset.i18n);
    if (message) el.textContent = message;
  }
}

// ---- タブ内のスクリプトの呼び出し ----------------------------------------------

// タブ内のスクリプトの操作を呼ぶ。表示する時は、先にスクリプトを注入する（二重には注入されない）。
async function callContent(action, mode) {
  if (action === "on") {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: CONTENT_FILES,
    });
  }
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (action, mode) => {
      const api = globalThis.__altTextViewer;
      if (action === "getState") return api ? api.isOn() : false;
      return api[action](mode);
    },
    args: [action, mode ?? null],
  });
  return result.result;
}

// ---- 画面の状態 -------------------------------------------------------------

function setPressed(isOn) {
  toggleButton.setAttribute("aria-pressed", String(isOn));
}

function getSelectedMode() {
  return modeFieldset.querySelector('input[name="mode"]:checked').value;
}

function showUnsupported() {
  toggleButton.disabled = true;
  modeFieldset.disabled = true;
  unsupportedMessage.hidden = false;
}

// ---- 初期化 ----------------------------------------------------------------

async function init() {
  localize();

  const { mode } = await chrome.storage.local.get({ mode: DEFAULT_MODE });
  const radio = modeFieldset.querySelector(`input[value="${mode === "overlay" ? "overlay" : "hide"}"]`);
  radio.checked = true;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    showUnsupported();
    return;
  }
  tabId = tab.id;

  try {
    setPressed(await callContent("getState"));
  } catch {
    // chrome:// のページやウェブストアなど、スクリプトを入れられないページ
    showUnsupported();
    return;
  }

  toggleButton.disabled = false;
  modeFieldset.disabled = false;
  toggleButton.focus();
}

toggleButton.addEventListener("click", async () => {
  const isOn = toggleButton.getAttribute("aria-pressed") === "true";
  try {
    setPressed(await callContent(isOn ? "off" : "on", getSelectedMode()));
  } catch {
    showUnsupported();
  }
});

modeFieldset.addEventListener("change", async () => {
  const mode = getSelectedMode();
  await chrome.storage.local.set({ mode });
  if (toggleButton.getAttribute("aria-pressed") === "true") {
    try {
      await callContent("on", mode); // 表示中なら新しいモードで表示し直す
    } catch {
      showUnsupported();
    }
  }
});

init();
