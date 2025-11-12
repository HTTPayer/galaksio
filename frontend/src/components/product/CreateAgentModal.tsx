"use client";
import { useState } from "react";

export function CreateAgentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function createAgent() {
    setSaving(true);
    try {
      const res = await fetch("/api/galaksio/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, model }),
      });
      if (!res.ok) throw new Error("Failed");
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6">
        <h3 className="text-lg font-semibold">Create agent</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-zinc-600">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="My AI Agent"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Model</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5">
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={createAgent}
            className="rounded-lg bg-black px-3 py-1.5 text-white"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
