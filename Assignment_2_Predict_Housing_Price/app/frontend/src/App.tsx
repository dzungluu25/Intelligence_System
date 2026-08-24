import { useState } from "react";
import { ThemeProvider } from "./lib/ThemeContext";
import { Header, type View } from "./components/Header";
import { PredictPage } from "./pages/PredictPage";
import { HistoryPanel } from "./components/HistoryPanel";
import { InsightsPage } from "./pages/InsightsPage";

function AppShell() {
  const [view, setView] = useState<View>("predict");

  return (
    <div className="min-h-screen">
      <Header view={view} onNavigate={setView} />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:pb-6">
        {view === "predict" && <PredictPage />}
        {view === "history" && <HistoryPanel />}
        {view === "insights" && <InsightsPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
