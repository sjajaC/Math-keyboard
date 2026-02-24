import { useState, useCallback } from "react";
import { COLS, ROWS, GAP } from "./buttons.js";

/**
 * useDragReorder — drag-and-drop button reordering
 * Works with both pointer events (web) and gesture handlers (native)
 */
export function useDragReorder(buttons, setButtons) {
  const [editMode, setEditMode] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [ghostPos, setGhostPos] = useState(null);

  const getCellFromPoint = useCallback((x, y, gridRect) => {
    if (!gridRect) return -1;
    const cellW = (gridRect.width - GAP * (COLS - 1)) / COLS;
    const cellH = (gridRect.height - GAP * (ROWS - 1)) / ROWS;
    const col = Math.floor((x - gridRect.left) / (cellW + GAP));
    const row = Math.floor((y - gridRect.top) / (cellH + GAP));
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
    return row * COLS + col;
  }, []);

  const startDrag = useCallback((idx, x, y) => {
    if (!editMode) return;
    setDragIdx(idx);
    setGhostPos({ x, y });
    setHoverIdx(idx);
  }, [editMode]);

  const moveDrag = useCallback((x, y, gridRect) => {
    if (dragIdx === null) return;
    setGhostPos({ x, y });
    const target = getCellFromPoint(x, y, gridRect);
    if (target >= 0 && target < buttons.length) setHoverIdx(target);
  }, [dragIdx, getCellFromPoint, buttons.length]);

  const endDrag = useCallback(() => {
    if (dragIdx !== null && hoverIdx !== null && dragIdx !== hoverIdx) {
      setButtons((prev) => {
        const next = [...prev];
        const temp = next[dragIdx];
        next[dragIdx] = next[hoverIdx];
        next[hoverIdx] = temp;
        return next;
      });
    }
    setDragIdx(null); setHoverIdx(null); setGhostPos(null);
  }, [dragIdx, hoverIdx, setButtons]);

  const toggleEdit = useCallback(() => {
    setEditMode((p) => !p);
    setDragIdx(null); setHoverIdx(null); setGhostPos(null);
  }, []);

  return {
    editMode, dragIdx, hoverIdx, ghostPos,
    toggleEdit, startDrag, moveDrag, endDrag,
  };
}
