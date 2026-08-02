'use client';

/**
 * CodeEditor — interaktiv kod mashqi vidjeti
 * -------------------------------------------------
 * Ikki rejim:
 *  - "web"    : HTML / CSS / JS — natija shu yerdagi iframe'da darhol ko'rinadi
 *  - "python" : Pyodide orqali brauzerda to'g'ridan-to'g'ri Python bajariladi
 *
 * Bu yerda o'quvchi ATTESTATSIYA darajasidagi har qanday kodni (nafaqat
 * tayyor xato kodni tuzatish, balki noldan yozish) yozib, xatosiz javobini
 * olishi mumkin. input() bilan ishlaydigan masalalar ham to'liq qo'llab-
 * quvvatlanadi.
 *
 * XAVFSIZLIK (cheksiz sikldan himoya):
 *  - JS: for/while sikllariga avtomatik hisoblagich in'ektsiya qilinadi —
 *    juda ko'p aylansa (~2 mln marta) xato bilan to'xtaydi.
 *  - Python: sys.settrace() orqali har bir qator sanaladi; agar bajarilish
 *    8 soniyadan oshsa, kod avtomatik va xavfsiz to'xtatiladi. Bu asosiy
 *    oqimda ishlagani uchun input() (window.prompt orqali) TO'LIQ ishlaydi.
 *
 * O'rnatish (loyiha papkasida):
 *   npm install @uiw/react-codemirror @codemirror/lang-html @codemirror/lang-css @codemirror/lang-javascript @codemirror/lang-python @uiw/codemirror-theme-tokyo-night
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { Maximize2, X } from 'lucide-react';

type WebTab = 'html' | 'css' | 'js';
type Mode = 'web' | 'python';

interface ConsoleLine {
  type: 'log' | 'error' | 'warn' | 'result';
  text: string;
}

interface CodeEditorProps {
  lessonId: string;
  mode?: Mode;
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  initialPython?: string;
  /** ikkala rejimni ham ko'rsatish (dars turi noaniq bo'lsa) */
  showModeSwitch?: boolean;
}

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL: string }) => Promise<any>;
  }
}

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
const PYTHON_TIMEOUT_SECONDS = 8;

// ---------------------------------------------------------------------------
// JS uchun "sikl himoyasi": for(...) va while(...) dan keyingi { ... } blokiga
// hisoblagich in'ektsiya qiladi. Qavslar ichma-ich bo'lsa ham (masalan
// while (check(a, b))) to'g'ri ishlashi uchun regex emas, mos qavsni qo'lda
// qidiramiz.
// ---------------------------------------------------------------------------
function injectLoopGuard(source: string): string {
  const guard = '__ce_loop_guard__';
  const keywordRe = /\b(for|while)\s*\(/g;
  let out = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = keywordRe.exec(source))) {
    const parenOpen = match.index + match[0].length - 1;
    let depth = 1;
    let j = parenOpen + 1;
    while (j < source.length && depth > 0) {
      if (source[j] === '(') depth++;
      else if (source[j] === ')') depth--;
      j++;
    }
    let k = j;
    while (k < source.length && /\s/.test(source[k])) k++;

    if (source[k] === '{') {
      out += source.slice(lastIndex, k + 1);
      out += `if(++${guard}.n>${guard}.max){throw new Error("Juda ko'p iteratsiya - cheksiz sikl bo'lishi mumkin");}`;
      lastIndex = k + 1;
      keywordRe.lastIndex = k + 1;
    } else {
      lastIndex = j;
      keywordRe.lastIndex = j;
    }
  }
  out += source.slice(lastIndex);
  return `let ${guard} = { n: 0, max: 2000000 };\n${out}`;
}

// ---------------------------------------------------------------------------
// Python: sys.settrace() bilan har bir qatorni sanab, PYTHON_TIMEOUT_SECONDS
// dan oshsa maxsus (BaseException'dan meros) xato bilan to'xtatadigan
// "himoyalovchi" wrapper. BaseException'dan meros bo'lgani uchun talabaning
// "except Exception:" kodi buni tasodifan ushlab qolmaydi.
// ---------------------------------------------------------------------------
function buildPythonWrapper(timeoutSeconds: number): string {
  return `
import sys, io, time, traceback

sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

class __CEStop(BaseException):
    pass

__ce_start = time.time()
__ce_n = 0

def __ce_trace(frame, event, arg):
    global __ce_n
    if event == "line":
        __ce_n += 1
        if __ce_n % 300 == 0 and (time.time() - __ce_start) > ${timeoutSeconds}:
            raise __CEStop()
    return __ce_trace

__ce_timeout_hit = False
sys.settrace(__ce_trace)
try:
    exec(__ce_user_code, {"__name__": "__main__", "input": input})
except __CEStop:
    __ce_timeout_hit = True
except BaseException:
    traceback.print_exc()
finally:
    sys.settrace(None)
`;
}

export default function CodeEditor({
  lessonId,
  mode: initialMode = 'web',
  initialHtml = '<h1>Salom, Dunyo!</h1>\n<p>Bu yerni tahrirlang.</p>',
  initialCss = 'h1 {\n  color: #f0a83b;\n  font-family: sans-serif;\n}',
  initialJs = 'console.log("Konsolga xush kelibsiz!");',
  initialPython = 'ism = "Dunyo"\nprint(f"Salom, {ism}!")',
  showModeSwitch = true,
}: CodeEditorProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [webTab, setWebTab] = useState<WebTab>('html');

  const [htmlCode, setHtmlCode] = useState(initialHtml);
  const [cssCode, setCssCode] = useState(initialCss);
  const [jsCode, setJsCode] = useState(initialJs);
  const [pyCode, setPyCode] = useState(initialPython);

  const [srcDoc, setSrcDoc] = useState('');
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [running, setRunning] = useState(false);

  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const pyodideRef = useRef<any>(null);

  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ---------- localStorage bilan avtomatik saqlash (dars bo'yicha) ----------
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`code-exercise:${lessonId}`);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.html !== undefined) setHtmlCode(data.html);
        if (data.css !== undefined) setCssCode(data.css);
        if (data.js !== undefined) setJsCode(data.js);
        if (data.py !== undefined) setPyCode(data.py);
      }
      // eslint-disable-next-line no-empty
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useEffect(() => {
    const data = { html: htmlCode, css: cssCode, js: jsCode, py: pyCode };
    try {
      localStorage.setItem(`code-exercise:${lessonId}`, JSON.stringify(data));
      // eslint-disable-next-line no-empty
    } catch {}
  }, [lessonId, htmlCode, cssCode, jsCode, pyCode]);

  // ---------- iframe'dan kelgan konsol xabarlarini tinglash ----------
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data || e.data.__from !== 'code-exercise-iframe') return;
      setConsoleLines((prev) => [...prev, { type: e.data.level, text: e.data.text }]);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const runWeb = useCallback(() => {
    setConsoleLines([]);
    setRunning(true);

    const guardScript = [
      '<script>',
      '(function () {',
      '  function send(level, args) {',
      '    try {',
      '      var text = args.map(function (a) {',
      '        if (a instanceof Error) return a.message;',
      '        if (typeof a === "object") { try { return JSON.stringify(a); } catch (e) { return String(a); } }',
      '        return String(a);',
      '      }).join(" ");',
      '      parent.postMessage({ __from: "code-exercise-iframe", level: level, text: text }, "*");',
      '    } catch (e) {}',
      '  }',
      '  var orig = { log: console.log, warn: console.warn, error: console.error };',
      '  console.log = function () { send("log", Array.prototype.slice.call(arguments)); orig.log.apply(console, arguments); };',
      '  console.warn = function () { send("warn", Array.prototype.slice.call(arguments)); orig.warn.apply(console, arguments); };',
      '  console.error = function () { send("error", Array.prototype.slice.call(arguments)); orig.error.apply(console, arguments); };',
      '  window.addEventListener("error", function (e) {',
      '    send("error", [e.message + " (qator: " + e.lineno + ")"]);',
      '  });',
      '  window.addEventListener("unhandledrejection", function (e) {',
      '    send("error", ["Promise xatosi: " + e.reason]);',
      '  });',
      '})();',
      '<' + '/script>',
    ].join('\n');

    let guardedJs = jsCode;
    try {
      guardedJs = injectLoopGuard(jsCode);
    } catch {
      guardedJs = jsCode;
    }

    const doc = [
      '<!DOCTYPE html>',
      '<html>',
      '<head><meta charset="utf-8" />',
      guardScript,
      '<style>' + cssCode + '</style>',
      '</head>',
      '<body>',
      htmlCode,
      '<script>' + guardedJs + '<' + '/script>',
      '</body>',
      '</html>',
    ].join('\n');

    setSrcDoc(doc);
    setTimeout(() => setRunning(false), 300);
  }, [htmlCode, cssCode, jsCode]);

  // ---------- Pyodide ----------
  const ensurePyodide = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;
    setPyodideLoading(true);
    try {
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = PYODIDE_CDN + 'pyodide.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Pyodide skriptini yuklab bo\'lmadi'));
          document.head.appendChild(script);
        });
      }
      const pyodide = await window.loadPyodide!({ indexURL: PYODIDE_CDN });
      pyodideRef.current = pyodide;
      setPyodideReady(true);
      return pyodide;
    } finally {
      setPyodideLoading(false);
    }
  }, []);

  const runPython = useCallback(async () => {
    setConsoleLines([]);
    setRunning(true);
    try {
      const pyodide = await ensurePyodide();

      // input() ni brauzerning window.prompt() ga bog'laymiz (sinxron)
      pyodide.globals.set('__js_prompt', (msg: string) => window.prompt(msg ?? '') ?? '');
      pyodide.runPython(`
import builtins
def input(prompt=""):
    return __js_prompt(prompt)
builtins.input = input
`);
      pyodide.globals.set('__ce_user_code', pyodide.runPython(`compile(${JSON.stringify(pyCode)}, "<student>", "exec")`));

      await pyodide.runPythonAsync(buildPythonWrapper(PYTHON_TIMEOUT_SECONDS));

      const timeoutHit: boolean = pyodide.globals.get('__ce_timeout_hit');
      const stdoutText: string = pyodide.runPython('sys.stdout.getvalue()');
      const stderrText: string = pyodide.runPython('sys.stderr.getvalue()');

      if (stdoutText) {
        setConsoleLines((prev) => [...prev, { type: 'log', text: stdoutText.replace(/\n$/, '') }]);
      }
      if (timeoutHit) {
        setConsoleLines((prev) => [
          ...prev,
          {
            type: 'error',
            text: "Kod juda uzoq ishladi (cheksiz sikl bo'lishi mumkin) - bajarish avtomatik to'xtatildi.",
          },
        ]);
      } else if (stderrText) {
        setConsoleLines((prev) => [...prev, { type: 'error', text: stderrText.trim() }]);
      } else if (!stdoutText) {
        setConsoleLines((prev) => [...prev, { type: 'result', text: "(chiqish yo'q - print() ishlatib ko'ring)" }]);
      }

      // qayta ishlatish uchun sys.stdout/stderr ni tozalab qo'yamiz
      pyodide.runPython('sys.stdout.truncate(0); sys.stdout.seek(0); sys.stderr.truncate(0); sys.stderr.seek(0)');
    } catch (err: any) {
      setConsoleLines((prev) => [...prev, { type: 'error', text: err?.message || String(err) }]);
    } finally {
      setRunning(false);
    }
  }, [pyCode, ensurePyodide]);

  const handleRun = () => {
    if (mode === 'web') runWeb();
    else runPython();
  };

  // Python rejimiga birinchi marta o'tilganda Pyodide'ni oldindan yuklab qo'yamiz
  useEffect(() => {
    if (mode === 'python' && !pyodideRef.current && !pyodideLoading) {
      ensurePyodide().catch((e) => {
        setConsoleLines((prev) => [...prev, { type: 'error', text: e.message }]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="ce-root">
      <div className="ce-topbar">
        {showModeSwitch && (
          <div className="ce-mode-switch">
            <button
              className={mode === 'web' ? 'active' : ''}
              onClick={() => setMode('web')}
              type="button"
            >
              🌐 Web
            </button>
            <button
              className={mode === 'python' ? 'active' : ''}
              onClick={() => setMode('python')}
              type="button"
            >
              🐍 Python
            </button>
          </div>
        )}

        <button className="ce-run-btn" onClick={handleRun} disabled={running || pyodideLoading} type="button">
          {pyodideLoading ? 'Muhit yuklanmoqda…' : running ? 'Bajarilmoqda…' : '▶ Ishga tushirish'}
        </button>
      </div>

      <div className="ce-body">
        <div className="ce-editor-pane">
          {mode === 'web' && (
            <>
              <div className="ce-tabs">
                {(['html', 'css', 'js'] as WebTab[]).map((t) => (
                  <button
                    key={t}
                    className={webTab === t ? 'active' : ''}
                    onClick={() => setWebTab(t)}
                    type="button"
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="ce-cm-wrap">
                {webTab === 'html' && (
                  <CodeMirror
                    value={htmlCode}
                    height="100%"
                    theme={tokyoNight}
                    extensions={[html()]}
                    onChange={setHtmlCode}
                  />
                )}
                {webTab === 'css' && (
                  <CodeMirror
                    value={cssCode}
                    height="100%"
                    theme={tokyoNight}
                    extensions={[css()]}
                    onChange={setCssCode}
                  />
                )}
                {webTab === 'js' && (
                  <CodeMirror
                    value={jsCode}
                    height="100%"
                    theme={tokyoNight}
                    extensions={[javascript()]}
                    onChange={setJsCode}
                  />
                )}
              </div>
            </>
          )}

          {mode === 'python' && (
            <div className="ce-cm-wrap ce-cm-wrap-full">
              <CodeMirror
                value={pyCode}
                height="100%"
                theme={tokyoNight}
                extensions={[python()]}
                onChange={setPyCode}
              />
            </div>
          )}
        </div>

        <div className="ce-output-pane">
          {mode === 'web' && (
            <div className="ce-preview">
              <div className="ce-panel-label ce-panel-label-row">
                <span>Natija</span>
                <button
                  type="button"
                  className="ce-expand-btn"
                  onClick={() => setPreviewFullscreen(true)}
                  title="To'liq ekranda ko'rish"
                >
                  <Maximize2 size={13} /> To'liq ekran
                </button>
              </div>
              <iframe
                title="preview"
                sandbox="allow-scripts"
                srcDoc={srcDoc}
                className="ce-iframe"
              />
            </div>
          )}

          {mounted && previewFullscreen && mode === 'web' &&
            createPortal(
              <div className="ce-fullscreen-overlay">
                <div className="ce-fullscreen-bar">
                  <span>Natija — to'liq ekran</span>
                  <button type="button" onClick={() => setPreviewFullscreen(false)}>
                    <X size={16} /> Yopish
                  </button>
                </div>
                <iframe
                  title="preview-fullscreen"
                  sandbox="allow-scripts"
                  srcDoc={srcDoc}
                  className="ce-fullscreen-iframe"
                />
              </div>,
              document.body
            )}

          <div className="ce-console">
            <div className="ce-panel-label">Konsol</div>
            <div className="ce-console-body">
              {consoleLines.length === 0 && <div className="ce-console-empty">— hali chiqish yo'q —</div>}
              {consoleLines.map((line, i) => (
                <div key={i} className={`ce-console-line ce-console-${line.type}`}>
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ce-root {
          --bg: #0f1720;
          --panel: #151f2b;
          --border: #24313f;
          --text: #dbe4ee;
          --muted: #7b8ba0;
          --accent: #f0a83b;
          --accent-2: #8b7fd1;
          --danger: #ff6b6b;
          --warn: #f0c93b;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--text);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
        }
        .ce-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--panel);
          border-bottom: 1px solid var(--border);
        }
        .ce-mode-switch button {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 6px 14px;
          border-radius: 8px;
          margin-right: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ce-mode-switch button.active {
          background: var(--accent-2);
          color: #0f1720;
          border-color: var(--accent-2);
          font-weight: 600;
        }
        .ce-run-btn {
          background: var(--accent);
          color: #1a1204;
          font-weight: 700;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: transform 0.1s ease, opacity 0.1s ease;
        }
        .ce-run-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .ce-run-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ce-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 420px;
        }
        @media (max-width: 800px) {
          .ce-body {
            grid-template-columns: 1fr;
          }
        }
        .ce-editor-pane {
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border);
        }
        .ce-tabs {
          display: flex;
          background: var(--panel);
          border-bottom: 1px solid var(--border);
        }
        .ce-tabs button {
          background: transparent;
          border: none;
          color: var(--muted);
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        .ce-tabs button.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }
        .ce-cm-wrap {
          flex: 1;
          min-height: 280px;
        }
        .ce-cm-wrap :global(.cm-editor) {
          height: 100%;
          font-size: 13px;
        }
        .ce-output-pane {
          display: flex;
          flex-direction: column;
        }
        .ce-preview {
          flex: 1.4;
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid var(--border);
        }
        .ce-iframe {
          flex: 1;
          width: 100%;
          border: none;
          background: #fff;
        }
        .ce-console {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 120px;
        }
        .ce-panel-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          padding: 6px 12px;
          background: var(--panel);
          border-bottom: 1px solid var(--border);
        }
        .ce-panel-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ce-expand-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 10.5px;
          text-transform: none;
          letter-spacing: normal;
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
        }
        .ce-expand-btn:hover {
          color: var(--accent);
          border-color: var(--accent);
        }
        @media (max-width: 800px) {
          .ce-mode-switch button,
          .ce-run-btn,
          .ce-tabs button {
            padding-top: 10px;
            padding-bottom: 10px;
          }
        }
        .ce-console-body {
          flex: 1;
          overflow-y: auto;
          padding: 8px 12px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 12.5px;
          background: #0b121a;
        }
        .ce-console-empty {
          color: var(--muted);
          font-style: italic;
        }
        .ce-console-line {
          padding: 2px 0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .ce-console-log {
          color: var(--text);
        }
        .ce-console-warn {
          color: var(--warn);
        }
        .ce-console-error {
          color: var(--danger);
        }
        .ce-console-result {
          color: var(--muted);
        }
        .ce-fullscreen-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #ffffff;
          display: flex;
          flex-direction: column;
        }
        .ce-fullscreen-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: var(--panel);
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
        }
        .ce-fullscreen-bar button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--accent);
          color: #1a1204;
          font-weight: 700;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
        }
        .ce-fullscreen-iframe {
          flex: 1;
          width: 100%;
          border: none;
          background: #fff;
        }
      `}</style>
    </div>
  );
}
