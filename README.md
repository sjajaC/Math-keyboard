# @mathpad/keyboard

Draggable math keyboard for education apps — **React** & **React Native**

![7×5 Grid Layout](https://img.shields.io/badge/layout-7%C3%975_grid-6366F1)
![Drag & Drop](https://img.shields.io/badge/feature-drag_%26_drop-F59E0B)
![Fractions](https://img.shields.io/badge/feature-fractions-A16207)

## Features

- 🔢 **7×5 customizable grid** — numbers, operators, fractions, exponents
- 🎯 **Drag & drop** — rearrange buttons with edit mode
- 📐 **Fraction builder** — step-by-step fraction & mixed number input
- ⬆️ **Exponent builder** — base + power input
- 🔤 **ABC keyboard** — switch to text input mode
- 🎨 **Clean color palette** — 5 color groups (Tailwind-based)
- 📱 **Cross-platform** — React DOM + React Native

## Layout

```
 √    (    )   │ AC   ⌫    ↵   │  ÷
 π    <    >   │  7    8    9   │  ×
 ½    ¼    ¾   │  4    5    6   │  −
a/b  n·   ⅓   │  1    2    3   │  +
abc   xⁿ  x²  │  %    0    .   │  =
```

## Install

```bash
npm install @mathpad/keyboard
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
  // engine.expr               — current expression tokens
  // engine.building            — true if in fraction/exponent builder
  // drag.editMode             — toggle with drag.toggleEdit()
}
```

## Token Types

| Type | Shape | Example |
|------|-------|---------|
| `n`  | `{ type:"n", v:"42" }` | Number |
| `o`  | `{ type:"o", v:"+" }` | Operator |
| `fr` | `{ type:"fr", n:"1", d:"4" }` | Fraction ¼ |
| `mx` | `{ type:"mx", w:"2", n:"1", d:"3" }` | Mixed 2⅓ |
| `ex` | `{ type:"ex", b:"5", p:"3" }` | Exponent 5³ |
| `txt`| `{ type:"txt", v:"hello" }` | Text |

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

## License

MIT
