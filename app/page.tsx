"use client";

import { useRef, useState } from "react";

interface LogEntry {
  time: string;
  text: string;
  kind: "supervisor" | "worker" | "system" | "default";
}

type Tab = "logs" | "output";

function classifyLog(text: string): LogEntry["kind"] {
  if (text.includes("[Supervisor]")) return "supervisor";
  if (text.includes("[Worker]")) return "worker";
  if (text.startsWith("===") || text.startsWith("[")) return "system";
  return "default";
}

function now(): string {
  return new Date().toLocaleTimeString("ja-JP", { hour12: false });
}

export default function Home() {
  const [instruction, setInstruction] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("logs");
  const [taskCount, setTaskCount] = useState<number>(0);
  const [runCount, setRunCount] = useState<number>(0);
  const logBottomRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string) => {
    setLogs((prev) => {
      const updated = [
        ...prev,
        { time: now(), text, kind: classifyLog(text) },
      ];
      return updated;
    });
    setTimeout(() => {
      logBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleRun = async () => {
    if (!instruction.trim() || isRunning) return;

    setIsRunning(true);
    setLogs([]);
    setOutput("");
    setActiveTab("logs");

    addLog("[System] 実行開始...");

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instruction.trim() }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const { type, data } = JSON.parse(line.slice(6));
            if (type === "log") {
              addLog(data);
              if (data.includes("個のタスクをワーカーに割り当てます")) {
                const m = data.match(/(\d+)個/);
                if (m) setTaskCount(parseInt(m[1], 10));
              }
            } else if (type === "complete") {
              setOutput(data);
              setRunCount((c) => c + 1);
              setActiveTab("output");
              addLog("[System] 処理完了");
            } else if (type === "error") {
              addLog(`[Error] ${data}`);
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (err) {
      addLog(`[Error] ${String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">AI</div>
          <div>
            <div className="header-title">AI Company</div>
            <div className="header-subtitle">Supervisor · Worker Architecture</div>
          </div>
        </div>
        <div className="status-badge">
          <div className={`status-dot ${isRunning ? "running" : runCount > 0 ? "idle" : ""}`} />
          {isRunning ? "Processing" : runCount > 0 ? "Ready" : "Standby"}
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Left Panel */}
        <aside className="panel-left">
          <div>
            <div className="panel-section-label">指示内容</div>
            <textarea
              className="instruction-textarea"
              placeholder="AIチームへの指示を入力してください..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isRunning}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRun();
              }}
            />
          </div>

          <button className="run-button" onClick={handleRun} disabled={isRunning || !instruction.trim()}>
            {isRunning ? (
              <>
                <div className="spinner" />
                処理中...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 2L12 7L3 12V2Z" fill="currentColor" />
                </svg>
                実行 (⌘ Enter)
              </>
            )}
          </button>

          <div className="info-cards">
            <div className="info-card">
              <div className="info-card-title">実行回数</div>
              <div className="info-card-value accent">{runCount}</div>
            </div>
            <div className="info-card">
              <div className="info-card-title">最終タスク数</div>
              <div className="info-card-value">{taskCount > 0 ? taskCount : "—"}</div>
            </div>
            <div className="info-card">
              <div className="info-card-title">ログ件数</div>
              <div className="info-card-value">{logs.length}</div>
            </div>
          </div>
        </aside>

        {/* Right Panel */}
        <div className="panel-right">
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activeTab === "logs" ? "active" : ""}`}
              onClick={() => setActiveTab("logs")}
            >
              実行ログ {logs.length > 0 && `(${logs.length})`}
            </button>
            <button
              className={`panel-tab ${activeTab === "output" ? "active" : ""}`}
              onClick={() => setActiveTab("output")}
            >
              最終成果物 {output && "✓"}
            </button>
          </div>

          {activeTab === "logs" && (
            <div className="log-console">
              {logs.length === 0 ? (
                <div className="log-empty">実行ボタンを押すとログが表示されます</div>
              ) : (
                logs.map((entry, i) => (
                  <div key={i} className="log-line">
                    <span className="log-time">{entry.time}</span>
                    <span className={`log-text ${entry.kind}`}>{entry.text}</span>
                  </div>
                ))
              )}
              <div ref={logBottomRef} />
            </div>
          )}

          {activeTab === "output" && (
            <div className="output-panel">
              {!output ? (
                <div className="output-empty">実行後に最終成果物がここに表示されます</div>
              ) : (
                <div className="output-card">
                  <div className="output-card-header">
                    <div className="output-card-dot" />
                    最終成果物 — Supervisor 集約結果
                  </div>
                  <div className="output-content">{output}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
