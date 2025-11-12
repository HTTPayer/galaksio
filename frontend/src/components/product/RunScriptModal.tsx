"use client";
import { useState } from "react";

export function RunScriptModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [code, setCode] = useState("print(2+2)");
  const [group, setGroup] = useState("ai-compute");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!open) return null;

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/galaksio/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: code, group }),
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (e) {
      console.error(e);
      setResult("Error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
        <h3 className="text-lg font-semibold">Run script</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-zinc-600">Script</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Response Group</label>
            <input
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5">
            Close
          </button>
          <button
            disabled={running}
            onClick={run}
            className="rounded-lg bg-black px-3 py-1.5 text-white"
          >
            {running ? "Running…" : "Run"}
          </button>
        </div>
        {result && (
          <div className="mt-4 rounded-xl border bg-zinc-50 p-4 text-sm">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
