"use client";

import * as React from "react";
import { X, Megaphone } from "lucide-react";
import {
  CHANGELOG_STORAGE_KEY,
  LATEST_CHANGELOG_ID,
  getUnreadEntries,
  type ChangelogEntry,
} from "@/lib/changelog";

export function UpdateToast() {
  const [unread, setUnread] = React.useState<ChangelogEntry[]>([]);
  const [visible, setVisible] = React.useState(false);
  const [exiting, setExiting] = React.useState(false);

  // Read localStorage only on the client
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CHANGELOG_STORAGE_KEY);
      const lastSeen = raw !== null ? parseInt(raw, 10) : -1;
      const entries = getUnreadEntries(lastSeen);
      if (entries.length > 0) {
        setUnread(entries);
        // Small delay so the slide-in animates after hydration
        const t = setTimeout(() => setVisible(true), 120);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage unavailable (e.g. SSR guard)
    }
  }, []);

  const dismiss = React.useCallback(() => {
    setExiting(true);
    // Persist the read state immediately so a refresh won't re-show it
    try {
      localStorage.setItem(CHANGELOG_STORAGE_KEY, String(LATEST_CHANGELOG_ID));
    } catch {
      /* ignore */
    }
    // Wait for the slide-out animation to finish before un-mounting
    setTimeout(() => setVisible(false), 350);
  }, []);

  if (!visible) return null;

  // Collect every unique change bullet across all unread entries, most-recent first
  const bullets = [...unread]
    .sort((a, b) => b.id - a.id)
    .flatMap((e) => e.changes);

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

      {/* Change list */}
      <ul className="update-toast__list">
        {bullets.map((change, i) => (
          <li key={i} className="update-toast__item">
            {change}
          </li>
        ))}
      </ul>

      {/* Footer CTA */}
      <button onClick={dismiss} className="update-toast__cta">
        Got it
      </button>
    </div>
  );
}
