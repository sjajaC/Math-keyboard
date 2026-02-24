import React, { useState, useRef, useCallback, useEffect } from "react";
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
 * Compute responsive scale factor from container width.
 * Returns a multiplier (0.7 – 1.1) for font sizes and spacing.
 */
function getResponsiveScale(width) {
  if (width < 320) return 0.7;
  if (width < 400) return 0.85;
  if (width < 600) return 1;
  return 1.1;
}

/**
 * Compute responsive keyboard height when no explicit height is provided.
 */
function getResponsiveHeight(width) {
  if (width < 360) return 220;
  if (width < 500) return 260;
  if (width < 768) return 280;
  return 300;
}

/**
 * MathKeyboard — full math keyboard with drag-and-drop reordering
 *
 * Props:
 *   onCommit(tokens)  — called when user presses Enter (↵)
 *   height            — keyboard height (default: auto-scaled by container width)
 *   style             — extra container style
 */
export function MathKeyboard({ onCommit, height, style }) {
  const [buttons, setButtons] = useState(createDefaultButtons);
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const engine = useMathExpression();
  const drag = useDragReorder(buttons, setButtons);

  /* ── Measure container width for responsive scaling ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.round(entry.contentRect.width));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = getResponsiveScale(containerWidth);
  const resolvedHeight = height || getResponsiveHeight(containerWidth);

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
    if (btn.isFrac) return <Fraction top="a" bottom="b" size={Math.round(9 * scale)} topColor={btn.fg} bottomColor={btn.fg} />;
    if (btn.isMx) return (
      <span style={{ display: "flex", alignItems: "center", gap: 1 }}>
        n<Fraction top="a" bottom="b" size={Math.round(7 * scale)} topColor={btn.fg} bottomColor={btn.fg} />
      </span>
    );
    return btn.label;
  };

  const compactPadding = containerWidth < 360 ? "4px 4px 3px" : "6px 8px 5px";

  return (
    <div
      ref={containerRef}
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
        fontSize: Math.round(11 * scale), fontWeight: 700, cursor: "pointer",
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
          gap: GAP, height: resolvedHeight, background: COLORS.KB_BG,
          padding: compactPadding, touchAction: "none",
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
                  fontSize: Math.round((btn.fs || 18) * scale), color: btn.fg,
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
        /* ABC keyboard — staggered like real iOS/Android */
        <div style={{
          display: "flex", flexDirection: "column", gap: containerWidth < 400 ? 5 : 6,
          height: resolvedHeight, padding: containerWidth < 360 ? "6px 3px 4px" : "8px 4px 5px",
          background: COLORS.KB_BG,
          justifyContent: "center", boxSizing: "border-box",
        }}>
          {/* Row 1: qwertyuiop — full width, 10 keys */}
          <div style={{ display: "flex", gap: containerWidth < 400 ? 4 : 5, flex: 1, padding: "0 1px" }}>
            {"qwertyuiop".split("").map((ch) => (
              <button key={ch} onClick={() => engine.addText(ch)} style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 6, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500,
                fontSize: Math.round((containerWidth < 400 ? 15 : 17) * scale),
                color: "#1E293B", background: "#FFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>{ch}</button>
            ))}
          </div>

          {/* Row 2: asdfghjkl — 9 keys, centered */}
          <div style={{ display: "flex", gap: containerWidth < 400 ? 4 : 5, flex: 1, padding: "0 5%" }}>
            {"asdfghjkl".split("").map((ch) => (
              <button key={ch} onClick={() => engine.addText(ch)} style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 6, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500,
                fontSize: Math.round((containerWidth < 400 ? 15 : 17) * scale),
                color: "#1E293B", background: "#FFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>{ch}</button>
            ))}
          </div>

          {/* Row 3: zxcvbnm — 7 keys with backspace */}
          <div style={{ display: "flex", gap: containerWidth < 400 ? 4 : 5, flex: 1, padding: "0 1px" }}>
            <div style={{ flex: 1.4 }} />
            {"zxcvbnm".split("").map((ch) => (
              <button key={ch} onClick={() => engine.addText(ch)} style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 6, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500,
                fontSize: Math.round((containerWidth < 400 ? 15 : 17) * scale),
                color: "#1E293B", background: "#FFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>{ch}</button>
            ))}
            <button onClick={engine.back} style={{
              flex: 1.4,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 6, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 600,
              fontSize: Math.round(17 * scale),
              color: "#334155", background: COLORS.TOOL.bg,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}>⌫</button>
          </div>

          {/* Row 4: bottom — 123, space, =, enter */}
          <div style={{ display: "flex", gap: containerWidth < 400 ? 4 : 5, flex: 1, padding: "0 1px" }}>
            <button onClick={() => engine.switchToMath()} style={{
              flex: containerWidth < 400 ? 1.5 : 1.8,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 6, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 700,
              fontSize: Math.round(13 * scale),
              color: "#334155", background: COLORS.TOOL.bg,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}>123</button>
            <button onClick={() => engine.addText(" ")} style={{
              flex: 5,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 6, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 400,
              fontSize: Math.round(14 * scale),
              color: "#64748B", background: "#FFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}>space</button>
            <button onClick={() => engine.addText("=")} style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 6, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 500,
              fontSize: Math.round(17 * scale),
              color: "#334155", background: COLORS.TOOL.bg,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}>=</button>
            <button onClick={() => {
                const result = engine.executeAction({ act: "enter" });
                if (result === "commit" && onCommit) {
                  const tokens = engine.commitLine();
                  if (tokens) onCommit(tokens);
                }
              }} style={{
              flex: containerWidth < 400 ? 1.5 : 1.8,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 6, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 700,
              fontSize: Math.round(16 * scale),
              color: "#FFF", background: COLORS.ARITH.bg,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}>↵</button>
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
          fontSize: Math.round(buttons[drag.dragIdx].fs * scale), fontWeight: 600, fontFamily: "inherit",
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
