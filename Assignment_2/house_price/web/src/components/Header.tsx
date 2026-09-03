import { useEffect, useRef } from "react";
import { History, Home, LayoutDashboard, Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";
import { useRipple } from "../lib/useRipple";
import { useLiquidTabDrag } from "../lib/useLiquidTabDrag";

export type View = "predict" | "history" | "insights";

const TAB_ORDER: View[] = ["predict", "history", "insights"];

export function Header({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  const { theme, toggleTheme } = useTheme();
  const ripple = useRipple();
  const { containerRef, registerButton, rect, isDragging, pulse, handlers } = useLiquidTabDrag<View>(
    view,
    TAB_ORDER,
    onNavigate
  );
  const indicatorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = indicatorRef.current;
    if (!el || pulse === 0) return;
    el.classList.remove("is-stretching");
    void el.offsetWidth;
    el.classList.add("is-stretching");
  }, [pulse]);

  return (
    <>
      <header
        className="glass-nav sticky top-0 z-30 border-b border-default"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
              style={{ background: "var(--brand)" }}
            >
              <Home className="h-5 w-5" style={{ color: "#f4c69c" }} strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold">
                Valu<span style={{ color: "var(--accent)" }}>AI</span>
              </p>
              <p className="text-[11px] text-muted hidden sm:block">Ước tính giá bất động sản bằng AI</p>
            </div>
          </div>

          <nav className="glass-pill hidden sm:flex items-center gap-1 rounded-xl p-1">
            <button
              className={`tab-btn ripple-surface ${view === "predict" ? "active" : ""}`}
              onPointerDown={ripple}
              onClick={() => onNavigate("predict")}
            >
              <Home className="h-4 w-4" />
              <span>Định giá</span>
            </button>
            <button
              className={`tab-btn ripple-surface ${view === "history" ? "active" : ""}`}
              onPointerDown={ripple}
              onClick={() => onNavigate("history")}
            >
              <History className="h-4 w-4" />
              <span>Lịch sử</span>
            </button>
            <button
              className={`tab-btn ripple-surface ${view === "insights" ? "active" : ""}`}
              onPointerDown={ripple}
              onClick={() => onNavigate("insights")}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Thống kê</span>
            </button>
          </nav>

          <button
            className="btn-ghost ripple-surface !w-11 !px-0 shrink-0"
            onPointerDown={ripple}
            onClick={toggleTheme}
            title="Đổi giao diện"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="glass-tabbar-wrap sm:hidden">
        <nav
          className="glass-tabbar"
          ref={containerRef as React.RefObject<HTMLElement>}
          onPointerDown={handlers.onPointerDown}
          onPointerMove={handlers.onPointerMove}
          onPointerUp={handlers.onPointerUp}
          onPointerCancel={handlers.onPointerCancel}
          style={{ touchAction: "none" }}
        >
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
            <filter id="liquid-goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </svg>

          <div className="liquid-indicator-layer" style={{ filter: "url(#liquid-goo)" }}>
            {rect && (
              <span
                className={`liquid-indicator ${isDragging ? "is-dragging" : ""}`}
                style={{ transform: `translateX(${rect.left}px)`, width: rect.width }}
              >
                <span ref={indicatorRef} className="liquid-indicator-fill" />
              </span>
            )}
          </div>

          <button
            ref={registerButton("predict")}
            type="button"
            className={`tab-btn-bottom ripple-surface ${view === "predict" ? "active" : ""}`}
            onClick={() => onNavigate("predict")}
          >
            <Home className="h-5 w-5" />
            <span>Định giá</span>
          </button>
          <button
            ref={registerButton("history")}
            type="button"
            className={`tab-btn-bottom ripple-surface ${view === "history" ? "active" : ""}`}
            onClick={() => onNavigate("history")}
          >
            <History className="h-5 w-5" />
            <span>Lịch sử</span>
          </button>
          <button
            ref={registerButton("insights")}
            type="button"
            className={`tab-btn-bottom ripple-surface ${view === "insights" ? "active" : ""}`}
            onClick={() => onNavigate("insights")}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Thống kê</span>
          </button>
        </nav>
      </div>
    </>
  );
}
