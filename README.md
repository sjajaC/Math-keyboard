# @mathpad/keyboard

Draggable math keyboard for education apps — **React** & **React Native**

[**Live Demo**](https://sjajac.github.io/Math-keyboard/demo/index.html)

![7×5 Grid Layout](https://img.shields.io/badge/layout-7%C3%975_grid-6366F1)
![Fractions](https://img.shields.io/badge/feature-fractions-A16207)
![Responsive](https://img.shields.io/badge/feature-responsive-22C55E)

## Features

- 🔢 **7×5 customizable grid** — numbers, operators, fractions, exponents
- 📐 **Fraction builder** — step-by-step fraction & mixed number input
- ⬆️ **Exponent builder** — base + power input with superscript display
- 🔤 **ABC keyboard** — staggered layout (iOS/Android style) with unified token ordering
- 🎨 **Clean color palette** — 5 color groups (Tailwind-based)
- 📱 **Cross-platform** — React DOM + React Native
- 📏 **Responsive** — auto-scales height, font sizes and layout based on container width
- ✅ **Operator validation** — prevents consecutive operators, smart unary minus support

## Layout

### Math Keyboard (7×5 grid)

```
 √    (    )   │ AC   ⌫    ↵   │  ÷
 π    <    >   │  7    8    9   │  ×
 ½    ¼    ¾   │  4    5    6   │  −
a/b  n·   ⅓   │  1    2    3   │  +
abc   xⁿ  x²  │  %    0    .   │  =
```

### ABC Keyboard (staggered)

```
  q  w  e  r  t  y  u  i  o  p
   a  s  d  f  g  h  j  k  l
      z  x  c  v  b  n  m  ⌫
  123      space        =   ↵
```

## Usage — React (Web)

```jsx
import { MathKeyboard, ExpressionLine } from "@mathpad/keyboard";
import { useState } from "react";

function App() {
  const [lines, setLines] = useState([]);

  return (
    <div>
      {/* Saved answers */}
      {lines.map((tokens, i) => (
        <ExpressionLine key={i} tokens={tokens} />
      ))}

      {/* Keyboard */}
      <MathKeyboard
        onCommit={(tokens) => setLines((p) => [...p, tokens])}
        height={280}
      />
    </div>
  );
}
```

## Usage — React Native

```jsx
import { MathKeyboard } from "@mathpad/keyboard/native";
import { useState } from "react";
import { View } from "react-native";

function App() {
  const [lines, setLines] = useState([]);

  return (
    <View style={{ flex: 1 }}>
      <MathKeyboard
        onCommit={(tokens) => setLines((p) => [...p, tokens])}
        height={280}
      />
    </View>
  );
}
```

## Using Core Hooks Only

Build your own UI with the shared logic:

```jsx
import { useMathExpression, useDragReorder, createDefaultButtons } from "@mathpad/keyboard/core";
import { useState } from "react";

function CustomKeyboard() {
  const [buttons, setButtons] = useState(createDefaultButtons);
  const engine = useMathExpression();
  const drag = useDragReorder(buttons, setButtons);

  // engine.executeAction(btn) — handle button press
  // engine.commitLine()       — get tokens & clear
  // engine.expr               — current expression tokens (all types: n, o, fr, mx, ex, txt)
  // engine.mode               — "math" | "abc"
  // engine.building           — true if in fraction/exponent builder
  // engine.addText(ch)        — add text character (merges consecutive txt tokens)
  // engine.switchToMath()     — switch to math mode
  // engine.switchToAbc()      — switch to ABC mode
  // drag.editMode             — toggle with drag.toggleEdit()
}
```

## Token Types

All tokens live in a single `expr` array, preserving insertion order across mode switches.

| Type | Shape | Example |
|------|-------|---------|
| `n`  | `{ type:"n", v:"42" }` | Number |
| `o`  | `{ type:"o", v:"+" }` | Operator |
| `fr` | `{ type:"fr", n:"1", d:"4" }` | Fraction ¼ |
| `mx` | `{ type:"mx", w:"2", n:"1", d:"3" }` | Mixed 2⅓ |
| `ex` | `{ type:"ex", b:"5", p:"3" }` | Exponent 5³ |
| `txt`| `{ type:"txt", v:"hello" }` | Text (from ABC keyboard) |

## Operator Validation

The `op()` function enforces mathematical correctness:

- **No consecutive operators** — pressing `+` then `−` replaces `+` with `−`
- **No leading operators** — only unary `−` allowed at start or after `(`
- **Decimal handling** — `.` appends to current number or creates `0.`
- **Brackets** — `(`, `)`, `√(` can be placed freely

## Responsive Scaling

The keyboard auto-adapts based on container width:

| Container Width | Height | Font Scale |
|----------------|--------|------------|
| < 320px | 220px | 0.7× |
| 320–399px | 260px | 0.85× |
| 400–599px | 280px | 1× |
| ≥ 600px | 300px | 1.1× |

## Color Palette

| Group | Background | Foreground | Keys |
|-------|-----------|------------|------|
| Numbers | `#FFFFFF` | `#1E293B` | 0-9, ., % |
| Functions | `#F1F5F9` | `#475569` | ( ) √ π < > = x² xⁿ |
| Fractions | `#FEF9C3` | `#A16207` | ½ ¼ ¾ ⅓ a/b n·a/b |
| Tools | `#CBD5E1` | `#334155` | ⌫ ↵ AC abc |
| Arithmetic | `#6366F1` | `#FFFFFF` | ÷ × − + |

## Customization

Override the default buttons:

```jsx
import { createDefaultButtons } from "@mathpad/keyboard/core";

const myButtons = createDefaultButtons();
// Swap, remove, or add buttons as needed
// Each button: { id, label, bg, fg, fs, act, val? }
```

## Demo

Open `demo/index.html` in a browser to see the responsive demo with device previews (phone, tablet, desktop, full-width).

## License

MIT
