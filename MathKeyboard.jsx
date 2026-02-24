import React, { useState, useRef, useCallback } from "react";
import { COLORS, COLS, ROWS, GAP, KB_HEIGHT, BORDER_RADIUS, createDefaultButtons } from "../core/buttons.js";
import { useMathExpression } from "../core/useExpression.js";
import { useDragReorder } from "../core/useDragReorder.js";
import { Fraction } from "./Fraction.jsx";
import { ExpressionRenderer } from "./ExpressionRenderer.jsx";
import { FractionBuilder, ExponentBuilder } from "./BuilderBar.jsx";

const CSS = `
@keyframes mathkb-blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes mathkb-jiggle{0%{transform:rotate(-1.5deg)}100%{transform:rotate(1.5deg)}}
`;

/**
 * MathKeyboard — full math keyboard with drag-and-drop reordering
 *
 * Props:
 *   onCommit(tokens)  — called when user presses Enter (↵)
 *   height            — keyboard height (default 280)
 *   style             — extra container style
 */
export function MathKeyboard({ onCommit, height = KB_HEIGHT, style }) {
  const [buttons, setButtons] = useState(createDefaultButtons);
  const gridRef = useRef(null);

  const engine = useMathExpression();
  const drag = useDragReorder(buttons, setButtons);

  const handleAction = useCallback((btn) => {
    if (drag.editMode) return;
    const result = engine.executeAction(btn);
    if (result === "commit" && onCommit) {
      const tokens = engine.commitLine();
      if (tokens) onCommit(tokens);
    }
  }, [drag.editMode, engine, onCommit]);

  const onPointerDown = useCallback((e, idx) => {
    if (!drag.editMode) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    drag.startDrag(idx, pt.clientX, pt.clientY);
  }, [drag]);

  const onPointerMove = useCallback((e) => {
    if (drag.dragIdx === null) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const rect = gridRef.current?.getBoundingClientRect();
    drag.moveDrag(pt.clientX, pt.clientY, rect);
  }, [drag]);

  const onPointerUp = useCallback(() => {
    drag.endDrag();
  }, [drag]);

  const renderLabel = (btn) => {
    if (btn.isFrac) return <Fraction top="a" bottom="b" size={9} topColor={btn.fg} bottomColor={btn.fg} />;
    if (btn.isMx) return (
      <span style={{ display: "flex", alignItems: "center", gap: 1 }}>
        n<Fraction top="a" bottom="b" size={7} topColor={btn.fg} bottomColor={btn.fg} />
      </span>
    );
    return btn.label;
  };

  return (
    <div
      style={{ position: "relative", ...style }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      <style>{CSS}</style>

      {/* Builder bars */}
      {(engine.mxOn || engine.fStep) && (
        <FractionBuilder
          mxOn={engine.mxOn} mxW={engine.mxW}
          fStep={engine.fStep} fBuf={engine.fBuf}
          onNext={engine.fracNext} onCancel={engine.cancelBuild}
        />
      )}
      {engine.exOn && (
        <ExponentBuilder
          exB={engine.exB} exP={engine.exP}
          onConfirm={engine.confirmEx} onCancel={engine.cancelBuild}
        />
      )}

      {/* Edit toggle */}
      <button onClick={drag.toggleEdit} style={{
        position: "absolute", top: -28, right: 10, zIndex: 10,
        padding: "3px 10px", borderRadius: 6, border: "none",
        background: drag.editMode ? "#EF4444" : COLORS.ACCENT, color: "#FFF",
        fontSize: 11, fontWeight: 700, cursor: "pointer",
        fontFamily: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
      }}>
        {drag.editMode ? "✓ Bitti" : "⚙ Düzenle"}
      </button>

      {/* Keyboard grid */}
      {engine.mode === "math" ? (
        <div ref={gridRef} style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: GAP, height, background: COLORS.KB_BG,
          padding: "6px 8px 5px", touchAction: "none",
          boxSizing: "border-box",
        }}>
          {buttons.map((btn, idx) => {
            const isDragging = drag.dragIdx === idx;
            const isTarget = drag.hoverIdx === idx && drag.dragIdx !== null && drag.dragIdx !== idx;
            return (
              <div key={idx}
                onPointerDown={(e) => drag.editMode ? onPointerDown(e, idx) : null}
                onTouchStart={(e) => drag.editMode ? onPointerDown(e, idx) : null}
                onClick={() => handleAction(btn)}
                style={{
                  borderRadius: BORDER_RADIUS,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "none", cursor: drag.editMode ? "grab" : "pointer",
                  fontFamily: "inherit", fontWeight: 600,
                  fontSize: btn.fs || 18, color: btn.fg,
                  background: isDragging ? COLORS.DRAG_HIGHLIGHT : btn.bg,
                  boxShadow: isTarget
                    ? `0 0 0 3px ${COLORS.DRAG_RING}, 0 2px 8px rgba(99,102,241,0.3)`
                    : "0 1px 2px rgba(0,0,0,0.06)",
                  opacity: isDragging ? 0.35 : 1,
                  transform: isTarget ? "scale(1.06)" : "none",
                  transition: "transform 0.15s, box-shadow 0.15s, opacity 0.1s",
                  animation: drag.editMode ? "mathkb-jiggle 0.3s infinite alternate" : "none",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}>
                {renderLabel(btn)}
              </div>
            );
          })}
        </div>
      ) : (
        /* ABC keyboard */
        <div style={{
          display: "flex", flexDirection: "column", gap: GAP,
          height, padding: "6px 8px 5px", background: COLORS.KB_BG,
          justifyContent: "center", boxSizing: "border-box",
        }}>
          {["qwertyuiop", "asdfghjkl", "zxcvbnm"].map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 3, justifyContent: "center", flex: 1 }}>
              {row.split("").map((ch) => (
                <button key={ch} onClick={() => engine.setAbcTxt((p) => p + ch)} style={{
                  flex: 1, maxWidth: 42,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: BORDER_RADIUS, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 400, fontSize: 17,
                  color: "#1E293B", background: "#FFF",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                }}>{ch}</button>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", gap: GAP, flex: 1 }}>
            {[
              { l: "123", a: () => engine.setMode("math"), w: 62, bg: COLORS.TOOL.bg, fs: 14, fw: 700 },
              { l: "space", a: () => engine.setAbcTxt((p) => p + " "), flex: 1, bg: "#FFF", fs: 14 },
              { l: "=", a: () => engine.setAbcTxt((p) => p + "="), w: 42, bg: COLORS.TOOL.bg, fs: 17 },
              { l: "⌫", a: engine.back, w: 62, bg: COLORS.TOOL.bg, fs: 18 },
            ].map((k, i) => (
              <button key={i} onClick={k.a} style={{
                width: k.w, flex: k.flex,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: BORDER_RADIUS, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: k.fw || 500, fontSize: k.fs || 17,
                color: "#334155", background: k.bg,
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
              }}>{k.l}</button>
            ))}
          </div>
        </div>
      )}

      {/* Drag ghost */}
      {drag.dragIdx !== null && drag.ghostPos && buttons[drag.dragIdx] && (
        <div style={{
          position: "fixed",
          left: drag.ghostPos.x - 30, top: drag.ghostPos.y - 24,
          width: 60, height: 48, borderRadius: BORDER_RADIUS,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: buttons[drag.dragIdx].bg, color: buttons[drag.dragIdx].fg,
          fontSize: buttons[drag.dragIdx].fs, fontWeight: 600, fontFamily: "inherit",
          boxShadow: `0 8px 24px rgba(0,0,0,0.2), 0 0 0 2px ${COLORS.DRAG_RING}`,
          pointerEvents: "none", zIndex: 999,
          transform: "scale(1.1)", opacity: 0.95,
        }}>
          {renderLabel(buttons[drag.dragIdx])}
        </div>
      )}
    </div>
  );
}
