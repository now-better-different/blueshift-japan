/*
 * Blueshift Gmail Logo
 * -------------------------------------------------------------------------
 * Gmail画面左上の Google / Gmail ロゴを、拡張機能に同梱した自社ロゴ
 * (logo.png) に置き換えます。
 *
 * Gmailはページを再読み込みせずに中身が書き換わる SPA（シングルページ
 * アプリ）なので、一度だけ置換しても元に戻ってしまいます。そのため
 * MutationObserver でDOMの変化を監視し、ロゴが再描画されるたびに
 * 置き換え直します。
 * -------------------------------------------------------------------------
 */
(() => {
  "use strict";

  // 同梱した自社ロゴのURL（chrome-extension://<id>/logo.png に解決されます）
  const LOGO_URL = chrome.runtime.getURL("logo.png");

  // 表示サイズ。ロゴの見え方に合わせて調整してください。
  const LOGO_HEIGHT = "40px";
  const LOGO_MIN_WIDTH = "120px";

  // 一度処理した要素を示す目印
  const MARK = "blueshiftLogo";

  // ロゴのラッパー（クリックできるリンク領域）を狙うセレクタ。
  // Googleはクラス名を頻繁に変えるため、比較的安定している
  // aria-label / alt / href を手がかりにしています。
  const CONTAINER_SELECTORS = [
    'a[aria-label="Gmail"]',
    'a[aria-label="Google Mail"]',
    'header a[href^="https://mail.google.com/mail/"]'
  ];

  // ロゴ画像そのもの（img要素）を狙うセレクタ。
  const IMAGE_SELECTORS = [
    'img[alt="Gmail"]',
    'img[alt="Google Mail"]',
    'img[src*="logo_gmail"]'
  ];

  // リンク領域を背景画像で自社ロゴに差し替える
  function replaceContainer(el) {
    if (el.dataset[MARK]) return;

    // 中の元ロゴ（img / svg）を隠す
    el.querySelectorAll("img, svg").forEach((child) => {
      child.style.setProperty("display", "none", "important");
    });

    el.style.setProperty("background-image", `url("${LOGO_URL}")`, "important");
    el.style.setProperty("background-repeat", "no-repeat", "important");
    el.style.setProperty("background-position", "left center", "important");
    el.style.setProperty("background-size", "contain", "important");
    el.style.setProperty("min-width", LOGO_MIN_WIDTH, "important");
    el.style.setProperty("height", LOGO_HEIGHT, "important");
    el.style.setProperty("display", "inline-block", "important");

    el.dataset[MARK] = "1";
  }

  // img要素そのもののsrcを自社ロゴに差し替える
  function replaceImage(img) {
    if (img.dataset[MARK]) return;
    if (img.src === LOGO_URL) return;

    img.src = LOGO_URL;
    img.removeAttribute("srcset");
    img.style.setProperty("height", LOGO_HEIGHT, "important");
    img.style.setProperty("width", "auto", "important");
    img.dataset[MARK] = "1";
  }

  function apply() {
    CONTAINER_SELECTORS.forEach((sel) => {
      document.querySelectorAll(sel).forEach(replaceContainer);
    });
    IMAGE_SELECTORS.forEach((sel) => {
      document.querySelectorAll(sel).forEach(replaceImage);
    });
  }

  // 初回実行
  apply();

  // Gmailの再描画に追従する（連続発火を間引くため軽くデバウンス）
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
