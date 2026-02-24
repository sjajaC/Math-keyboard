import { useState, useCallback } from "react";

/**
 * useMathExpression — shared state engine for math keyboard
 *
 * Returns expression tokens, builder state, and action handlers.
 * Platform-agnostic: works in both React DOM and React Native.
 *
 * Token types:
 *   { type:"n",  v:"42" }           — number
 *   { type:"o",  v:"+" }            — operator
 *   { type:"fr", n:"1", d:"4" }     — fraction
 *   { type:"mx", w:"2", n:"1", d:"3" } — mixed number
 *   { type:"ex", b:"5", p:"3" }     — exponent
 *   { type:"txt", v:"hello" }       — text
 */
export function useMathExpression() {
  const [expr, setExpr] = useState([]);
  const [abcTxt, setAbcTxt] = useState("");
  const [mode, setMode] = useState("math"); // "math" | "abc"

  // Fraction builder
  const [fStep, setFStep] = useState(null);    // null | "num" | "den"
  const [fBuf, setFBuf] = useState({ n: "", d: "" });
  const [mxW, setMxW] = useState("");
  const [mxOn, setMxOn] = useState(false);

  // Exponent builder
  const [exOn, setExOn] = useState(false);
  const [exB, setExB] = useState("");
  const [exP, setExP] = useState("");

  const building = fStep || mxOn || exOn;

  const push = useCallback((item) => {
    setExpr((p) => [...p, item]);
  }, []);

  /* ── Number input ── */
  const num = useCallback((n) => {
    if (fStep === "num") return setFBuf((p) => ({ ...p, n: p.n + n }));
    if (fStep === "den") return setFBuf((p) => ({ ...p, d: p.d + n }));
    if (mxOn) return setMxW((p) => p + n);
    if (exOn && !exB) return setExB(n);
    if (exOn) return setExP((p) => p + n);
    setExpr((prev) => {
      const last = prev[prev.length - 1];
      if (last?.type === "n") return [...prev.slice(0, -1), { type: "n", v: last.v + n }];
      return [...prev, { type: "n", v: n }];
    });
  }, [fStep, mxOn, exOn, exB]);

  /* ── Operators that act as brackets/prefix and can follow other operators ── */
  const BRACKET_OPS = new Set(["(", ")", "\u221A("]);

  /* ── Operator ── */
  const op = useCallback((o) => {
    if (building) return;
    setExpr((prev) => {
      const last = prev[prev.length - 1];

      /* Allow brackets and √( freely */
      if (BRACKET_OPS.has(o)) return [...prev, { type: "o", v: o }];

      /* Allow "." if last token is a number without a dot already */
      if (o === ".") {
        if (last?.type === "n" && !last.v.includes(".")) {
          return [...prev.slice(0, -1), { type: "n", v: last.v + "." }];
        }
        if (!last || last.type === "o") {
          return [...prev, { type: "n", v: "0." }];
        }
        return prev;
      }

      /* First token: only allow unary minus */
      if (prev.length === 0) {
        if (o === "\u2212") return [{ type: "o", v: "\u2212" }];
        return prev;
      }

      /* After opening bracket: allow unary minus */
      if (last?.type === "o" && last.v === "(") {
        if (o === "\u2212") return [...prev, { type: "o", v: "\u2212" }];
        return prev;
      }

      /* Prevent consecutive operators: replace previous operator */
      if (last?.type === "o" && !BRACKET_OPS.has(last.v)) {
        return [...prev.slice(0, -1), { type: "o", v: o }];
      }

      return [...prev, { type: "o", v: o }];
    });
  }, [building]);

  /* ── Fraction builder ── */
  const startFr = useCallback(() => {
    setFStep("num"); setFBuf({ n: "", d: "" }); setMxW(""); setMxOn(false);
  }, []);

  const startMx = useCallback(() => {
    setMxOn(true); setMxW(""); setFBuf({ n: "", d: "" }); setFStep(null);
  }, []);

  const fracNext = useCallback(() => {
    if (mxOn && mxW) { setMxOn(false); setFStep("num"); return; }
    if (fStep === "num" && fBuf.n) { setFStep("den"); return; }
    if (fStep === "den" && fBuf.d && fBuf.d !== "0") {
      const token = mxW
        ? { type: "mx", w: mxW, n: fBuf.n, d: fBuf.d }
        : { type: "fr", n: fBuf.n, d: fBuf.d };
      push(token);
      setFStep(null); setFBuf({ n: "", d: "" }); setMxW("");
    }
  }, [mxOn, mxW, fStep, fBuf, push]);

  /* ── Exponent builder ── */
  const startEx = useCallback(() => {
    setExpr((prev) => {
      const last = prev[prev.length - 1];
      if (last?.type === "n") {
        setExB(last.v);
        return prev.slice(0, -1);
      }
      setExB("");
      return prev;
    });
    setExOn(true); setExP("");
  }, []);

  const quickExp2 = useCallback(() => {
    setExpr((prev) => {
      const last = prev[prev.length - 1];
      if (last?.type === "n") {
        return [...prev.slice(0, -1), { type: "ex", b: last.v, p: "2" }];
      }
      return prev;
    });
  }, []);

  const confirmEx = useCallback(() => {
    if (exB && exP) {
      push({ type: "ex", b: exB, p: exP });
      setExOn(false); setExB(""); setExP("");
    }
  }, [exB, exP, push]);

  /* ── Cancel any builder ── */
  const cancelBuild = useCallback(() => {
    setFStep(null); setMxW(""); setMxOn(false);
    setExOn(false); setExB(""); setExP("");
  }, []);

  /* ── Backspace ── */
  const back = useCallback(() => {
    if (mode === "abc") { setAbcTxt((p) => p.slice(0, -1)); return; }
    if (fStep === "den" && fBuf.d) { setFBuf((p) => ({ ...p, d: p.d.slice(0, -1) })); return; }
    if (fStep === "den") { setFStep("num"); return; }
    if (fStep === "num" && fBuf.n) { setFBuf((p) => ({ ...p, n: p.n.slice(0, -1) })); return; }
    if (fStep === "num") { if (mxW) { setMxOn(true); setFStep(null); } else setFStep(null); return; }
    if (mxOn && mxW) { setMxW((p) => p.slice(0, -1)); return; }
    if (mxOn) { setMxOn(false); return; }
    if (exOn && exP) { setExP((p) => p.slice(0, -1)); return; }
    if (exOn && exB) { setExB(""); return; }
    if (exOn) { setExOn(false); return; }
    setExpr((prev) => {
      const last = prev[prev.length - 1];
      if (last?.type === "n" && last.v.length > 1)
        return [...prev.slice(0, -1), { type: "n", v: last.v.slice(0, -1) }];
      return prev.slice(0, -1);
    });
  }, [mode, fStep, fBuf, mxOn, mxW, exOn, exB, exP]);

  /* ── Clear all ── */
  const clear = useCallback(() => {
    setExpr([]); setAbcTxt(""); cancelBuild();
  }, [cancelBuild]);

  /* ── Commit current line ── */
  const commitLine = useCallback(() => {
    const tokens = [];
    if (abcTxt) tokens.push({ type: "txt", v: abcTxt });
    tokens.push(...expr);
    if (tokens.length === 0) return null;
    setExpr([]); setAbcTxt(""); cancelBuild();
    return tokens;
  }, [abcTxt, expr, cancelBuild]);

  /* ── Mode switching with token flush ── */
  const switchToAbc = useCallback(() => {
    setMode("abc");
  }, []);

  const switchToMath = useCallback(() => {
    setAbcTxt((txt) => {
      if (txt) {
        setExpr((prev) => [...prev, { type: "txt", v: txt }]);
      }
      return "";
    });
    setMode("math");
  }, []);

  /* ── Execute a button action ── */
  const executeAction = useCallback((btn) => {
    if (!btn) return;
    switch (btn.act) {
      case "num":     num(btn.val); break;
      case "op":      op(btn.val); break;
      case "sqrt":    push({ type: "o", v: "√(" }); break;
      case "exp2":    quickExp2(); break;
      case "expn":    startEx(); break;
      case "back":    back(); break;
      case "enter":   return "commit";
      case "clear":   clear(); break;
      case "frac":    push({ type: "fr", n: btn.n, d: btn.d }); break;
      case "startFr": startFr(); break;
      case "startMx": startMx(); break;
      case "abc":     switchToAbc(); break;
      default: break;
    }
    return null;
  }, [num, op, push, quickExp2, startEx, back, clear, startFr, startMx, switchToAbc]);

  return {
    // State
    expr, abcTxt, mode, building,
    fStep, fBuf, mxW, mxOn,
    exOn, exB, exP,

    // Actions
    num, op, push, back, clear,
    startFr, startMx, fracNext,
    startEx, quickExp2, confirmEx,
    cancelBuild, commitLine, executeAction,
    switchToAbc, switchToMath,

    // Setters
    setMode, setAbcTxt,
  };
}
