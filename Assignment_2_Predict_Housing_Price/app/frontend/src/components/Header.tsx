import { History, Home, LayoutDashboard, Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

export type View = "predict" | "history" | "insights";

export function Header({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-default" style={{ background: "var(--bg-elevated)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "var(--brand)" }}
          >
            <Home className="h-5 w-5" style={{ color: "#f4c69c" }} strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">
              Định Giá <span style={{ color: "var(--accent)" }}>Nhà</span>
            </p>
            <p className="text-[11px] text-muted hidden sm:block">Ước tính giá bất động sản bằng AI</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 surface-subtle p-1">
          <button
            className={`tab-btn ${view === "predict" ? "active" : ""}`}
            onClick={() => onNavigate("predict")}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Định giá</span>
          </button>
          <button
            className={`tab-btn ${view === "history" ? "active" : ""}`}
            onClick={() => onNavigate("history")}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Lịch sử</span>
          </button>
          <button
            className={`tab-btn ${view === "insights" ? "active" : ""}`}
            onClick={() => onNavigate("insights")}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Thống kê</span>
          </button>
        </nav>

        <button className="btn-ghost !px-2.5 !py-2" onClick={toggleTheme} title="Đổi giao diện">
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
