// 共有ハーネス：index.html を jsdom で丸ごと実行する。
// 引き継ぎ資料「3. テスト資産／テストの書き方」の手順を再現。
//   - canvas は drawImage を記録するダミー ctx に差し替え
//   - AudioContext はダミー
//   - requestAnimationFrame は no-op（ゲームループを自動で回さず、更新は手で呼ぶ）
// 当たり判定はグリッド越しなので、更新系を呼ぶ前に必ず grid を作り直すこと（資料の注意）。
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = path.join(__dirname, '..', 'index.html');

// 何でも受けるダミー。プロパティ読みも呼び出しも new も全部自分を返す。
function deepStub() {
  const f = function () {};
  return new Proxy(f, {
    get(t, p) {
      if (p === 'currentTime' || p === 'value') return 0;
      if (p === 'sampleRate') return 44100;
      if (p === Symbol.toPrimitive) return () => 0;
      return deepStub();
    },
    set() { return true; },
    apply() { return deepStub(); },
    construct() { return deepStub(); },
  });
}

function makeCtx(canvas, rec) {
  const grad = { addColorStop() {} };
  const target = { canvas };
  return new Proxy(target, {
    get(t, p) {
      if (p === 'canvas') return canvas;
      if (p === 'drawImage') return (img) => { rec.drawImage.push((img && img.__key) || (img && img.src ? 'src' : '?')); };
      // 幅は文字数比例にする。定数を返すと「収まるまで削る」ループが止まらない。
      if (p === 'measureText') return (s) => ({ width: (String(s == null ? '' : s)).length * 6 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern' || p === 'createConicGradient') return () => grad;
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p in t) return t[p];
      return () => {};
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}

let LAST_DOM = null;
// index.html を読み込み、{ dom, win, ev, ctxRec, errors } を返す。
function load() {
  const errors = [];
  const ctxRec = { drawImage: [] };
  const html = fs.readFileSync(HTML, 'utf8');

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(win) {
      // canvas
      win.HTMLCanvasElement.prototype.getContext = function () {
        if (!this.__ctx) this.__ctx = makeCtx(this, ctxRec);
        return this.__ctx;
      };
      // 画像：jsdom は data URI をデコードしないので naturalWidth が 0 のまま。
      // SPR_OK = complete && naturalWidth を満たすよう、読み込み済みとして振る舞わせる。
      win.Image = class {
        constructor() { this._src = ''; this.__key = null; this.onload = null; this.onerror = null; this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; }
        set src(v) { this._src = v; this.complete = true; this.naturalWidth = 32; this.naturalHeight = 32; }
        get src() { return this._src; }
      };
      // audio
      win.AudioContext = function () { return deepStub(); };
      win.webkitAudioContext = win.AudioContext;
      // ループを自動で回さない（決定的にするため）
      win.requestAnimationFrame = function () { return 0; };
      win.cancelAnimationFrame = function () {};
      // 実行時エラーを拾う（事故③対策：宣言漏れの const 等は実行時に落ちる）
      win.addEventListener('error', (e) => { errors.push(String(e.error || e.message)); });
      win.onerror = (m, s, l, c, err) => { errors.push(String(err || m)); return true; };
    },
  });

  const win = dom.window;
  LAST_DOM = dom;
  const ev = (code) => win.eval(code);
  return { dom, win, ev, ctxRec, errors };
}

// グリッドを作り直してから更新系を呼ぶための定型（資料より）。
const GRID = 'grid.resize(view.w,view.h); grid.build(state.camx,state.camy);';

// 簡易アサート。○ を出して数える。
function makeReporter(title) {
  let pass = 0, fail = 0;
  function ok(cond, label) {
    if (cond) { pass++; console.log('  ○ ' + label); }
    else { fail++; console.log('  ✗ ' + label); }
  }
  function eq(a, b, label) { ok(a === b, `${label}  (${JSON.stringify(a)} === ${JSON.stringify(b)})`); }
  function near(a, b, eps, label) { ok(Math.abs(a - b) <= eps, `${label}  (${a} ≈ ${b})`); }
  function done() {
    console.log(`\n[${title}] ${pass} 通過 / ${fail} 失敗`);
    if (fail === 0) console.log('すべて通りました');
    else process.exitCode = 1;
    // jsdom はタイマーを抱えて node が終わらないので、明示的に閉じて抜ける。
    try { if (LAST_DOM) LAST_DOM.window.close(); } catch (e) {}
    setImmediate(() => process.exit(fail === 0 ? 0 : 1));
    return fail === 0;
  }
  return { ok, eq, near, done };
}

module.exports = { load, GRID, makeReporter };
