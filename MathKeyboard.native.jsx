import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, PanResponder, Animated,
  StyleSheet, Dimensions,
} from "react-native";
import { COLORS, COLS, ROWS, GAP, KB_HEIGHT, BORDER_RADIUS, createDefaultButtons } from "../core/buttons.js";
import { useMathExpression } from "../core/useExpression.js";

/**
 * MathKeyboard for React Native
 *
 * Props:
 *   onCommit(tokens)  — called when user presses Enter
 *   height            — keyboard height (default 280)
 *   style             — extra container style
 *   editLabel         — edit button text (default "⚙ Düzenle")
 *   doneLabel         — done button text (default "✓ Bitti")
 */
export function MathKeyboard({
  onCommit,
  height = KB_HEIGHT,
  style,
  editLabel = "⚙ Düzenle",
  doneLabel = "✓ Bitti",
}) {
  const [buttons, setButtons] = useState(createDefaultButtons);
  const [editMode, setEditMode] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const gridRef = useRef(null);
  const gridLayout = useRef(null);
  const pan = useRef(new Animated.ValueXY()).current;

  const engine = useMathExpression();

  const handleAction = useCallback((btn) => {
    if (editMode) return;
    const result = engine.executeAction(btn);
    if (result === "commit" && onCommit) {
      const tokens = engine.commitLine();
      if (tokens) onCommit(tokens);
    }
  }, [editMode, engine, onCommit]);

  const getCellFromPoint = useCallback((x, y) => {
    if (!gridLayout.current) return -1;
    const gl = gridLayout.current;
    const cellW = (gl.width - GAP * (COLS - 1)) / COLS;
    const cellH = (gl.height - GAP * (ROWS - 1)) / ROWS;
    const col = Math.floor((x - gl.x) / (cellW + GAP));
    const row = Math.floor((y - gl.y) / (cellH + GAP));
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
    return row * COLS + col;
  }, []);

  const swapButtons = useCallback((from, to) => {
    setButtons((prev) => {
      const next = [...prev];
      const temp = next[from]; next[from] = next[to]; next[to] = temp;
      return next;
    });
  }, []);

  const createPanResponder = useCallback((idx) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => editMode,
      onMoveShouldSetPanResponder: () => editMode,
      onPanResponderGrant: () => {
        setDragIdx(idx);
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });
        const target = getCellFromPoint(gesture.moveX, gesture.moveY);
        if (target >= 0 && target < buttons.length) setHoverIdx(target);
      },
      onPanResponderRelease: () => {
        if (dragIdx !== null && hoverIdx !== null && dragIdx !== hoverIdx) {
          swapButtons(dragIdx, hoverIdx);
        }
        setDragIdx(null); setHoverIdx(null);
        pan.setValue({ x: 0, y: 0 });
      },
    });
  }, [editMode, dragIdx, hoverIdx, getCellFromPoint, swapButtons, pan, buttons.length]);

  const panResponders = useRef({});
  const getPanResponder = (idx) => {
    if (!panResponders.current[idx]) {
      panResponders.current[idx] = createPanResponder(idx);
    }
    return panResponders.current[idx];
  };

  // Recalculate on edit mode change
  React.useEffect(() => {
    panResponders.current = {};
  }, [editMode, buttons]);

  const onGridLayout = useCallback((e) => {
    const { x, y, width, height: h } = e.nativeEvent.layout;
    gridRef.current?.measureInWindow?.((px, py) => {
      gridLayout.current = { x: px, y: py, width, height: h };
    });
    gridLayout.current = { x, y, width, height: h };
  }, []);

  const renderLabel = (btn) => {
    if (btn.isFrac) {
      return (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 9, fontWeight: "600", color: btn.fg }}>a</Text>
          <View style={{ height: 1, width: 16, backgroundColor: btn.fg }} />
          <Text style={{ fontSize: 9, fontWeight: "600", color: btn.fg }}>b</Text>
        </View>
      );
    }
    if (btn.isMx) {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: btn.fg }}>n</Text>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 7, fontWeight: "600", color: btn.fg }}>a</Text>
            <View style={{ height: 1, width: 10, backgroundColor: btn.fg }} />
            <Text style={{ fontSize: 7, fontWeight: "600", color: btn.fg }}>b</Text>
          </View>
        </View>
      );
    }
    return (
      <Text style={{ fontSize: btn.fs, fontWeight: "600", color: btn.fg }}>
        {btn.label}
      </Text>
    );
  };

  const cellWidth = `${(100 - GAP * (COLS - 1) * 0.1) / COLS}%`;

  return (
    <View style={[{ backgroundColor: COLORS.KB_BG, padding: 6, height }, style]}>

      {/* Edit toggle */}
      <TouchableOpacity
        onPress={() => setEditMode((p) => !p)}
        style={[
          styles.editBtn,
          { backgroundColor: editMode ? "#EF4444" : COLORS.ACCENT },
        ]}
      >
        <Text style={styles.editBtnText}>{editMode ? doneLabel : editLabel}</Text>
      </TouchableOpacity>

      {/* Grid */}
      <View
        ref={gridRef}
        onLayout={onGridLayout}
        style={{
          flexDirection: "row", flexWrap: "wrap",
          gap: GAP, flex: 1,
        }}
      >
        {buttons.map((btn, idx) => {
          const isDragging = dragIdx === idx;
          const isTarget = hoverIdx === idx && dragIdx !== null && dragIdx !== idx;
          const pr = editMode ? getPanResponder(idx) : null;

          return (
            <Animated.View
              key={idx}
              {...(pr?.panHandlers || {})}
              style={[
                styles.cell,
                {
                  width: cellWidth,
                  backgroundColor: isDragging ? COLORS.DRAG_HIGHLIGHT : btn.bg,
                  opacity: isDragging ? 0.35 : 1,
                  borderWidth: isTarget ? 2 : 0,
                  borderColor: isTarget ? COLORS.DRAG_RING : "transparent",
                  transform: isDragging ? [{ translateX: pan.x }, { translateY: pan.y }] : [],
                },
                isDragging && { zIndex: 100 },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleAction(btn)}
                disabled={editMode}
                style={styles.cellInner}
                activeOpacity={0.6}
              >
                {renderLabel(btn)}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editBtn: {
    position: "absolute", top: -32, right: 10, zIndex: 10,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6,
  },
  editBtnText: {
    color: "#FFF", fontSize: 11, fontWeight: "700",
  },
  cell: {
    flex: 1, minWidth: "12%", maxWidth: "15%",
    borderRadius: BORDER_RADIUS,
    elevation: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2,
  },
  cellInner: {
    flex: 1, alignItems: "center", justifyContent: "center",
  },
});
