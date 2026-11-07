// ページに入れるスクリプト（ポップアップから chrome.scripting で注入される）。
// 先に src/vendor/dom-accessibility-api.js が読み込まれている前提。
// 仕様：docs/spec.md

(() => {
  if (globalThis.__altTextViewer) {
    return; // すでに注入済み
  }

  const HOST_TAG = "alt-text-viewer-label";
  const MODE_HIDE = "hide";
  const MODE_OVERLAY = "overlay";

  // オンの間だけ使う状態
  let current = null; // { mode, hosts: Element[], hidden: { el, style }[] }

  // ---- 対象要素 ----------------------------------------------------------

  function hasRole(el, roles) {
    const role = (el.getAttribute("role") || "").trim().split(/\s+/)[0];
    return roles.includes(role);
  }

  function isTarget(el) {
    return el.localName === "img" || hasRole(el, ["img"]);
  }

  // 画面に表示されているか（display:none、visibility:hidden、大きさ0 を除く）
  function isDisplayed(el) {
    if (typeof el.checkVisibility === "function" && !el.checkVisibility()) {
      return false;
    }
    if (getComputedStyle(el).visibility !== "visible") {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findTargets() {
    const candidates = document.querySelectorAll("img, [role]");
    const targets = [];
    for (const el of candidates) {
      if (!isTarget(el)) continue;
      // role="img" の中の要素は、外側の要素と一緒に扱う
      if (isInsideTarget(el)) continue;
      if (!isDisplayed(el)) continue;
      targets.push(el);
    }
    return targets;
  }

  function isInsideTarget(el) {
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (hasRole(p, ["img"])) return true;
    }
    return false;
  }

  // ---- 代替テキストの求め方（docs/spec.md 3章） ----------------------------

  function nonEmpty(value) {
    return value !== null && value.trim() !== "";
  }

  // 代替テキストを返す。なければ null。
  function getAltText(el) {
    // 1. 自身または祖先に aria-hidden="true"
    if (el.closest('[aria-hidden="true"]')) return null;

    // 2. role="presentation" / "none"（aria-label / aria-labelledby がある場合は除く）
    if (
      hasRole(el, ["presentation", "none"]) &&
      !nonEmpty(el.getAttribute("aria-label")) &&
      !nonEmpty(el.getAttribute("aria-labelledby"))
    ) {
      return null;
    }

    // 3〜6. aria-labelledby → aria-label → alt → title（ライブラリで計算）
    const name = globalThis.domAccessibilityApi
      .computeAccessibleName(el)
      .replace(/\s+/g, " ")
      .trim();
    return name === "" ? null : name;
  }

  // ---- 表示 --------------------------------------------------------------

  const LABEL_CSS = `
    :host { all: initial; }
    .label {
      display: inline-block;
      box-sizing: border-box;
      max-width: 100%;
      margin: 0;
      padding: 2px 6px;
      border-radius: 3px;
      background: #1f1f1f;
      color: #ffffff;
      font: 14px/1.4 system-ui, sans-serif;
      text-align: start;
      white-space: normal;
      overflow-wrap: anywhere;
    }
  `;

  function createLabel(text, isMessage, mode, width) {
    const host = document.createElement(HOST_TAG);
    const base = [
      "all: initial",
      "display: inline-block",
      "vertical-align: top",
      "max-width: 100%",
    ];
    if (mode === MODE_OVERLAY) {
      // top / left を指定しない絶対配置＝本来の位置（対象要素の左上）に重なり、
      // レイアウトを変えず、スクロールにも追従する
      base.push(
        "position: absolute",
        "z-index: 2147483647",
        `max-width: max(${Math.round(width)}px, 12em)`
      );
    }
    for (const decl of base) {
      const [prop, ...rest] = decl.split(":");
      host.style.setProperty(prop.trim(), rest.join(":").trim(), "important");
    }

    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = LABEL_CSS;
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = text;
    if (isMessage) {
      label.lang = chrome.i18n.getUILanguage();
    }
    root.append(style, label);
    return host;
  }

  function hideElement(el, state) {
    state.hidden.push({ el, style: el.getAttribute("style") });
    el.style.setProperty("display", "none", "important");
  }

  function render(mode) {
    const state = { mode, hosts: [], hidden: [] };
    const noNameMessage = chrome.i18n.getMessage("labelNoName");

    // 先にすべて調べてから、まとめてページを書き換える
    // （書き換えながら調べると、レイアウトの変化で判定がずれるため）
    const items = findTargets().map((el) => ({
      el,
      altText: getAltText(el),
      width: el.getBoundingClientRect().width,
    }));

    for (const { el, altText, width } of items) {
      const host = createLabel(altText ?? noNameMessage, altText === null, mode, width);
      // <picture> の中の <img> は、<picture> の前に入れる
      const anchor = el.parentElement && el.parentElement.localName === "picture"
        ? el.parentElement
        : el;
      anchor.before(host);
      state.hosts.push(host);
      if (mode === MODE_HIDE) {
        hideElement(el, state);
      }
    }
    return state;
  }

  function restore(state) {
    for (const host of state.hosts) {
      host.remove();
    }
    for (const { el, style } of state.hidden) {
      if (style === null) {
        el.removeAttribute("style");
      } else {
        el.setAttribute("style", style);
      }
    }
  }

  // ---- ポップアップから呼ばれる操作 --------------------------------------------

  globalThis.__altTextViewer = {
    isOn() {
      return current !== null;
    },
    on(mode) {
      if (current) restore(current);
      current = render(mode === MODE_OVERLAY ? MODE_OVERLAY : MODE_HIDE);
      return true;
    },
    off() {
      if (current) restore(current);
      current = null;
      return false;
    },
  };
})();
