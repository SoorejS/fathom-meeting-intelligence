"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { type RelayPreferences } from "@/lib/relayPreferences";
export function WorkspacePreferences() {
  const [prefs, setPrefs] = useState<RelayPreferences | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    api<RelayPreferences>("/preferences")
      .then(setPrefs)
      .catch((e) => setError(e.message));
  }, []);
  async function save() {
    if (!prefs) return;
    setBusy(true);
    setError("");
    try {
      setPrefs(await api<RelayPreferences>("/preferences", "PATCH", prefs));
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!prefs) return <p role="status">{error || "Loading preferences…"}</p>;
  const change = (patch: Partial<RelayPreferences>) => {
    setPrefs({ ...prefs, ...patch });
    setSaved(false);
  };
  return (
    <section className="preference-card">
      <h2>Session preferences</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label>
          Default brief
          <select
            value={prefs.defaultTemplate}
            onChange={(e) =>
              change({
                defaultTemplate: e.target
                  .value as RelayPreferences["defaultTemplate"],
              })
            }
          >
            {["default", "executive", "sales", "engineering"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <p className="muted small">
          Applies to sessions without an individually selected brief.
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={prefs.autoExtractActions}
            onChange={(e) => change({ autoExtractActions: e.target.checked })}
          />
          Extract actions for new captured sessions
        </label>
        <label>
          Schedule capture
          <select
            value={prefs.autoRecordMode}
            onChange={(e) =>
              change({
                autoRecordMode: e.target
                  .value as RelayPreferences["autoRecordMode"],
              })
            }
          >
            {["all", "external", "internal", "manual"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <p className="muted small">
          Sets the default arming policy for the demo calendar; individual
          overrides take priority. No external bot joins calls.
        </p>
        <label>
          Notetaker name
          <input
            required
            maxLength={80}
            value={prefs.botDisplayName}
            onChange={(e) => change({ botDisplayName: e.target.value })}
          />
        </label>
        <label>
          Consent preference
          <select
            value={prefs.consentPreference}
            onChange={(e) =>
              change({
                consentPreference: e.target
                  .value as RelayPreferences["consentPreference"],
              })
            }
          >
            <option value="remember">Allow remembered choices</option>
            <option value="required">Require fresh choices</option>
          </select>
        </label>
        <p className="muted small">
          Every session always requires explicit recording approval.
        </p>
        <label>
          Default session visibility
          <select
            value={prefs.defaultVisibility}
            onChange={(e) =>
              change({
                defaultVisibility: e.target
                  .value as RelayPreferences["defaultVisibility"],
              })
            }
          >
            {["private", "team", "public"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <p className="muted small">
          Controls new sessions’ library grouping. Public share links remain
          accessible to anyone with the link; access enforcement needs
          authenticated accounts.
        </p>
        <h3>Moment categories</h3>
        {prefs.momentTypes.map((t, i) => (
          <div className="preference-type" key={i}>
            <input
              aria-label={`Category ${i + 1} name`}
              required
              maxLength={80}
              value={t.name}
              onChange={(e) =>
                change({
                  momentTypes: prefs.momentTypes.map((v, n) =>
                    n === i ? { ...v, name: e.target.value } : v,
                  ),
                })
              }
            />
            <input
              type="color"
              aria-label={`Category ${i + 1} color`}
              value={t.color}
              onChange={(e) =>
                change({
                  momentTypes: prefs.momentTypes.map((v, n) =>
                    n === i ? { ...v, color: e.target.value } : v,
                  ),
                })
              }
            />
            <button
              type="button"
              disabled={!i}
              onClick={() => {
                const next = [...prefs.momentTypes];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                change({ momentTypes: next });
              }}
            >
              ↑
            </button>
            <button
              type="button"
              disabled={i === prefs.momentTypes.length - 1}
              onClick={() => {
                const next = [...prefs.momentTypes];
                [next[i + 1], next[i]] = [next[i], next[i + 1]];
                change({ momentTypes: next });
              }}
            >
              ↓
            </button>
            <button
              type="button"
              disabled={prefs.momentTypes.length <= 1}
              onClick={() =>
                change({
                  momentTypes: prefs.momentTypes.filter((_, n) => n !== i),
                })
              }
            >
              Remove
            </button>
          </div>
        ))}
        <div className="button-row">
          <button
            type="button"
            className="secondary"
            disabled={prefs.momentTypes.length >= 30}
            onClick={() =>
              change({
                momentTypes: [
                  ...prefs.momentTypes,
                  { name: "New category", color: "#53745b" },
                ],
              })
            }
          >
            Add category
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : "Save preferences"}
          </button>
        </div>
        <p role="status">
          {error || (saved ? "Preferences saved to your workspace." : "")}
        </p>
      </form>
    </section>
  );
}
