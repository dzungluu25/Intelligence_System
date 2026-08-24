import { History, Home, LayoutDashboard, Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";
import { useRipple } from "../lib/useRipple";

export type View = "predict" | "history" | "insights";

export function Header({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  const { theme, toggleTheme } = useTheme();
  const ripple = useRipple();

  return (
    <>
      <header className="glass-nav sticky top-0 z-30 border-b border-default">
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
            className="btn-ghost ripple-surface !px-2.5 !py-2 shrink-0"
            onPointerDown={ripple}
            onClick={toggleTheme}
            title="Đổi giao diện"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <nav className="glass-nav sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-default flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        <button
          className={`tab-btn-bottom ripple-surface ${view === "predict" ? "active" : ""}`}
          onPointerDown={ripple}
          onClick={() => onNavigate("predict")}
        >
          <Home className="h-5 w-5" />
          <span>Định giá</span>
        </button>
        <button
          className={`tab-btn-bottom ripple-surface ${view === "history" ? "active" : ""}`}
          onPointerDown={ripple}
          onClick={() => onNavigate("history")}
        >
          <History className="h-5 w-5" />
          <span>Lịch sử</span>
        </button>
        <button
          className={`tab-btn-bottom ripple-surface ${view === "insights" ? "active" : ""}`}
          onPointerDown={ripple}
          onClick={() => onNavigate("insights")}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Thống kê</span>
        </button>
      </nav>
    </>
  );
}
