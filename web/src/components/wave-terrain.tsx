"use client";

import { useEffect, useRef } from "react";

const COLS = 40;
const ROWS = 22;
const VIEW_W = 1600;
const VIEW_H = 900;

const INFLUENCE_RADIUS = 180;
const MAX_OFFSET = 7;
const LERP = 0.12;
const SETTLE_EPSILON = 0.05;

export function WaveTerrain({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const dx = VIEW_W / (COLS - 1);
    const dy = VIEW_H / (ROWS - 1);

    type Pt = { bx: number; by: number; cx: number; cy: number };
    const grid: Pt[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Pt[] = [];
      for (let c = 0; c < COLS; c++) {
        const bx = c * dx;
        const by = r * dy;
        row.push({ bx, by, cx: bx, cy: by });
      }
      grid.push(row);
    }

    const ns = "http://www.w3.org/2000/svg";
    const root = document.createElementNS(ns, "g");
    svg.appendChild(root);

    const hLines: SVGPathElement[] = [];
    const vLines: SVGPathElement[] = [];
    for (let r = 0; r < ROWS; r++) {
      const p = document.createElementNS(ns, "path");
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "currentColor");
      p.setAttribute("stroke-width", "1");
      p.setAttribute("opacity", "0.16");
      root.appendChild(p);
      hLines.push(p);
    }
    for (let c = 0; c < COLS; c++) {
      const p = document.createElementNS(ns, "path");
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "currentColor");
      p.setAttribute("stroke-width", "1");
      p.setAttribute("opacity", "0.12");
      root.appendChild(p);
      vLines.push(p);
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    let mouse: { x: number; y: number } | null = null;
    let raf = 0;

    const draw = () => {
      let stillMoving = false;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const p = grid[r][c];
          let tx = p.bx;
          let ty = p.by;
          if (mouse) {
            const dxm = p.bx - mouse.x;
            const dym = p.by - mouse.y;
            const dist = Math.hypot(dxm, dym);
            if (dist > 0 && dist < INFLUENCE_RADIUS) {
              const influence = 1 - dist / INFLUENCE_RADIUS;
              const fall = influence * influence;
              const norm = 1 / dist;
              tx = p.bx + dxm * norm * MAX_OFFSET * fall;
              ty = p.by + dym * norm * MAX_OFFSET * fall;
            }
          }
          const ddx = tx - p.cx;
          const ddy = ty - p.cy;
          if (Math.abs(ddx) > SETTLE_EPSILON || Math.abs(ddy) > SETTLE_EPSILON) {
            stillMoving = true;
          }
          p.cx += ddx * LERP;
          p.cy += ddy * LERP;
        }
      }

      for (let r = 0; r < ROWS; r++) {
        const row = grid[r];
        let d = `M${row[0].cx.toFixed(2)} ${row[0].cy.toFixed(2)}`;
        for (let c = 1; c < COLS; c++) {
          d += `L${row[c].cx.toFixed(2)} ${row[c].cy.toFixed(2)}`;
        }
        hLines[r].setAttribute("d", d);
      }
      for (let c = 0; c < COLS; c++) {
        let d = `M${grid[0][c].cx.toFixed(2)} ${grid[0][c].cy.toFixed(2)}`;
        for (let r = 1; r < ROWS; r++) {
          d += `L${grid[r][c].cx.toFixed(2)} ${grid[r][c].cy.toFixed(2)}`;
        }
        vLines[c].setAttribute("d", d);
      }

      if (reduce.matches) {
        raf = 0;
        return;
      }
      if (stillMoving || mouse) {
        raf = requestAnimationFrame(draw);
      } else {
        raf = 0;
      }
    };

    const ensureRunning = () => {
      if (!raf && !reduce.matches) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      if (px < 0 || py < 0 || px > rect.width || py > rect.height) {
        if (mouse) {
          mouse = null;
          ensureRunning();
        }
        return;
      }
      mouse = {
        x: (px / rect.width) * VIEW_W,
        y: (py / rect.height) * VIEW_H,
      };
      ensureRunning();
    };
    const onLeave = () => {
      if (mouse) {
        mouse = null;
        ensureRunning();
      }
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("mouseleave", onLeave);
      root.remove();
    };
  }, []);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none ${className}`}
      aria-hidden
    />
  );
}
