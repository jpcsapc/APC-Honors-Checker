"use client";

import * as React from "react";
import { X, Megaphone } from "lucide-react";
import {
  CHANGELOG_STORAGE_KEY,
  MAX_INITIAL_DISPLAY,
  getLatestChangelogId,
  getUnreadEntries,
  type ChangelogEntry,
} from "@/lib/changelog";

export function UpdateToast() {
  const [unread, setUnread] = React.useState<ChangelogEntry[]>([]);
  const [latestVisibleId, setLatestVisibleId] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      try {
        const response = await fetch("/api/changelog", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          entries?: ChangelogEntry[];
        };

        const allEntries = Array.isArray(data.entries) ? data.entries : [];
        const latestId = getLatestChangelogId(allEntries);

        const raw = localStorage.getItem(CHANGELOG_STORAGE_KEY);
        const isNewVisitor = raw === null;
        const parsedLastSeen = isNewVisitor ? -1 : parseInt(raw, 10);
        const lastSeen = Number.isNaN(parsedLastSeen) ? -1 : parsedLastSeen;

        let entries = getUnreadEntries(allEntries, lastSeen);

        if (isNewVisitor && entries.length > MAX_INITIAL_DISPLAY) {
          entries = entries.sort((a, b) => b.id - a.id).slice(0, MAX_INITIAL_DISPLAY);
        }

        if (!mounted || entries.length === 0) {
          return;
        }

        setLatestVisibleId(latestId);
        setUnread(entries);
        timeout = setTimeout(() => setVisible(true), 120);
      } catch {
        // ignore network/localStorage failures
      }
    };

    void load();

    return () => {
      mounted = false;
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const dismiss = React.useCallback(() => {
    setExiting(true);
    try {
      localStorage.setItem(CHANGELOG_STORAGE_KEY, String(latestVisibleId));
    } catch {
      /* ignore */
    }
    setTimeout(() => setVisible(false), 350);
  }, [latestVisibleId]);

  if (!visible) return null;

  const visibleEntries = [...unread].sort((a, b) => b.id - a.id);

  if (visibleEntries.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`update-toast ${exiting ? "update-toast--exit" : "update-toast--enter"}`}
    >
      {/* Header row */}
      <div className="update-toast__header">
        <span className="update-toast__icon">
          <Megaphone className="h-4 w-4" />
        </span>
        <span className="update-toast__title">What&rsquo;s new</span>
        <button
          onClick={dismiss}
          aria-label="Dismiss update notification"
          className="update-toast__close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Feature list */}
      <div className="update-toast__entries">
        {visibleEntries.map((entry) => (
          <div key={entry.id} className="update-toast__entry">
            <div className="update-toast__feature">
              {entry.title && (
                <p className="update-toast__feature-title">{entry.title}</p>
              )}
              {entry.description && (
                <p className="update-toast__feature-desc">{entry.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <button onClick={dismiss} className="update-toast__cta">
        Got it
      </button>
    </div>
  );
}
