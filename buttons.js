/**
 * Color palette & button layout definitions
 * Shared between Web and React Native
 */

export const COLORS = {
  NUM:        { bg: "#FFFFFF", fg: "#1E293B" },
  FUNC:       { bg: "#F1F5F9", fg: "#475569" },
  FRAC:       { bg: "#FEF9C3", fg: "#A16207" },
  TOOL:       { bg: "#CBD5E1", fg: "#334155" },
  ARITH:      { bg: "#6366F1", fg: "#FFFFFF" },
  ACCENT:     "#6366F1",
  ACCENT_LIGHT: "#EEF2FF",
  KB_BG:      "#E2E8F0",
  DRAG_HIGHLIGHT: "rgba(99,102,241,0.2)",
  DRAG_RING:  "#6366F1",
};

export const COLS = 7;
export const ROWS = 5;
export const GAP = 4;
export const KB_HEIGHT = 280;
export const BORDER_RADIUS = 8;

/**
 * Creates the default 7×5 button layout.
 * Each button: { id, label, bg, fg, fs, act, val?, n?, d?, isFrac?, isMx? }
 */
export const createDefaultButtons = () => {
  const { NUM: N, FUNC: F, FRAC: FR, TOOL: T, ARITH: A } = COLORS;
  return [
    // Row 0:  √  (  )  AC  ⌫  ↵  ÷
    { id:"sq", label:"√",   ...F,  fs:20, act:"sqrt" },
    { id:"p1", label:"(",   ...F,  fs:18, act:"op",      val:"(" },
    { id:"p2", label:")",   ...F,  fs:18, act:"op",      val:")" },
    { id:"AC", label:"AC",  ...T,  fs:14, act:"clear" },
    { id:"BK", label:"⌫",  ...T,  fs:17, act:"back" },
    { id:"NL", label:"↵",  ...T,  fs:16, act:"enter" },
    { id:"dv", label:"÷",   ...A,  fs:22, act:"op",      val:"÷" },

    // Row 1:  π  <  >  7  8  9  ×
    { id:"pi", label:"π",   ...F,  fs:19, act:"op",      val:"π" },
    { id:"LT", label:"<",   ...F,  fs:18, act:"op",      val:"<" },
    { id:"GT", label:">",   ...F,  fs:18, act:"op",      val:">" },
    { id:"N7", label:"7",   ...N,  fs:22, act:"num",     val:"7" },
    { id:"N8", label:"8",   ...N,  fs:22, act:"num",     val:"8" },
    { id:"N9", label:"9",   ...N,  fs:22, act:"num",     val:"9" },
    { id:"mu", label:"×",   ...A,  fs:22, act:"op",      val:"×" },

    // Row 2:  ½  ¼  ¾  4  5  6  −
    { id:"H1", label:"½",   ...FR, fs:17, act:"frac",    n:"1", d:"2" },
    { id:"H2", label:"¼",   ...FR, fs:17, act:"frac",    n:"1", d:"4" },
    { id:"H3", label:"¾",   ...FR, fs:17, act:"frac",    n:"3", d:"4" },
    { id:"N4", label:"4",   ...N,  fs:22, act:"num",     val:"4" },
    { id:"N5", label:"5",   ...N,  fs:22, act:"num",     val:"5" },
    { id:"N6", label:"6",   ...N,  fs:22, act:"num",     val:"6" },
    { id:"MI", label:"−",   ...A,  fs:24, act:"op",      val:"−" },

    // Row 3:  a/b  n·a/b  ⅓  1  2  3  +
    { id:"FR", label:"a/b", ...FR, fs:12, act:"startFr", isFrac:true },
    { id:"MX", label:"n·",  ...FR, fs:12, act:"startMx", isMx:true },
    { id:"H4", label:"⅓",   ...FR, fs:17, act:"frac",    n:"1", d:"3" },
    { id:"N1", label:"1",   ...N,  fs:22, act:"num",     val:"1" },
    { id:"N2", label:"2",   ...N,  fs:22, act:"num",     val:"2" },
    { id:"N3", label:"3",   ...N,  fs:22, act:"num",     val:"3" },
    { id:"PL", label:"+",   ...A,  fs:24, act:"op",      val:"+" },

    // Row 4:  abc  xⁿ  x²  %  0  .  =
    { id:"ab", label:"abc", ...T,  fs:13, act:"abc" },
    { id:"en", label:"xⁿ",  ...F,  fs:15, act:"expn" },
    { id:"s2", label:"x²",  ...F,  fs:15, act:"exp2" },
    { id:"PC", label:"%",   ...N,  fs:17, act:"op",      val:"%" },
    { id:"N0", label:"0",   ...N,  fs:22, act:"num",     val:"0" },
    { id:"DT", label:".",   ...N,  fs:22, act:"op",      val:"." },
    { id:"EQ", label:"=",   ...F,  fs:20, act:"op",      val:"=" },
  ];
};
