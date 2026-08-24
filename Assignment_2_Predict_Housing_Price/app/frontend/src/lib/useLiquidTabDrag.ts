import { useCallback, useEffect, useRef, useState } from "react";

interface Rect {
  left: number;
  width: number;
}

/**
 * Drives a liquid tab-bar indicator that follows the user's finger while
 * dragging across the bar, and springs to the previous tab's position (not
 * a reset/default) the moment a drag starts — so the blob always animates
 * from wherever it actually was, then tracks 1:1 with the pointer, then
 * snaps to whichever tab is under the finger on release.
 */
export function useLiquidTabDrag<T extends string>(
  activeKey: T,
  order: T[],
  onSelect: (key: T) => void
) {
  const containerRef = useRef<HTMLElement | null>(null);
  const buttonRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const settledRect = useRef<Rect | null>(null);
  const [displayRect, setDisplayRect] = useState<Rect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pulse, setPulse] = useState(0);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const movedRef = useRef(false);
  const startXRef = useRef(0);

  const registerButton = (key: T) => (el: HTMLButtonElement | null) => {
    if (el) buttonRefs.current.set(key, el);
    else buttonRefs.current.delete(key);
  };

  const rectFor = useCallback((key: T): Rect | null => {
    const container = containerRef.current;
    const btn = buttonRefs.current.get(key);
    if (!container || !btn) return null;
    const containerBox = container.getBoundingClientRect();
    const btnBox = btn.getBoundingClientRect();
    return { left: btnBox.left - containerBox.left, width: btnBox.width };
  }, []);

  const keyAtPoint = useCallback(
    (clientX: number): T => {
      let closest = order[0];
      let closestDist = Infinity;
      for (const key of order) {
        const btn = buttonRefs.current.get(key);
        if (!btn) continue;
        const box = btn.getBoundingClientRect();
        const center = box.left + box.width / 2;
        const dist = Math.abs(clientX - center);
        if (dist < closestDist) {
          closestDist = dist;
          closest = key;
        }
      }
      return closest;
    },
    [order]
  );

  // Settle to the active tab whenever it changes via non-drag means
  // (programmatic navigation) and on mount/resize.
  useEffect(() => {
    if (draggingRef.current) return;
    const r = rectFor(activeKey);
    if (r) {
      settledRect.current = r;
      setDisplayRect(r);
    }
  }, [activeKey, rectFor]);

  useEffect(() => {
    const onResize = () => {
      if (draggingRef.current) return;
      const r = rectFor(activeKey);
      if (r) {
        settledRect.current = r;
        setDisplayRect(r);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeKey, rectFor]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      draggingRef.current = true;
      pointerIdRef.current = e.pointerId;
      movedRef.current = false;
      startXRef.current = e.clientX;
      setIsDragging(true);
      // Begin exactly from wherever the indicator currently sits — no jump.
      const start = settledRect.current ?? rectFor(activeKey);
      if (start) setDisplayRect(start);
    },
    [activeKey, rectFor]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!draggingRef.current || pointerIdRef.current !== e.pointerId) return;
      if (Math.abs(e.clientX - startXRef.current) > 4) movedRef.current = true;
      const container = containerRef.current;
      if (!container) return;
      const hoveredKey = keyAtPoint(e.clientX);
      const hoveredRect = rectFor(hoveredKey);
      if (!hoveredRect) return;
      // Track the finger directly: center the indicator under the pointer,
      // clamped to the tab currently under it, so it feels grabbed rather
      // than just previewing the destination tab.
      const containerBox = container.getBoundingClientRect();
      const pointerLocal = e.clientX - containerBox.left;
      const half = hoveredRect.width / 2;
      const left = Math.min(
        Math.max(pointerLocal - half, 0),
        container.clientWidth - hoveredRect.width
      );
      setDisplayRect({ left, width: hoveredRect.width });
    },
    [keyAtPoint, rectFor]
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!draggingRef.current || pointerIdRef.current !== e.pointerId) return;
      draggingRef.current = false;
      pointerIdRef.current = null;
      setIsDragging(false);
      // A plain tap (no real movement) is left to the button's own onClick,
      // which also handles keyboard/assistive-tech activation; only an
      // actual drag resolves and commits a selection here.
      if (!movedRef.current) return;
      const finalKey = keyAtPoint(e.clientX);
      const finalRect = rectFor(finalKey);
      if (finalRect) {
        settledRect.current = finalRect;
        setDisplayRect(finalRect);
      }
      setPulse((p) => p + 1);
      if (finalKey !== activeKey) onSelect(finalKey);
    },
    [activeKey, keyAtPoint, onSelect, rectFor]
  );

  return {
    containerRef,
    registerButton,
    rect: displayRect,
    isDragging,
    pulse,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
