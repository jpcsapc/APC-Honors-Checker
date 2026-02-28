"use client";

import * as React from "react";
import { X, Megaphone } from "lucide-react";
import {
  CHANGELOG_STORAGE_KEY,
  LATEST_CHANGELOG_ID,
  MAX_INITIAL_DISPLAY,
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
      const isNewVisitor = raw === null;
      const lastSeen = isNewVisitor ? -1 : parseInt(raw, 10);
      let entries = getUnreadEntries(lastSeen);

      // For brand-new visitors, cap the number of entries shown
      if (isNewVisitor && entries.length > MAX_INITIAL_DISPLAY) {
        entries = entries
          .sort((a, b) => b.id - a.id)
          .slice(0, MAX_INITIAL_DISPLAY);
      }

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

  // Sort most-recent first; skip entries that have no displayable features
  const visibleEntries = [...unread]
    .sort((a, b) => b.id - a.id)
    .filter((e) => (e.features?.length ?? 0) > 0);

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
            {entry.features.map((feature, i) => (
              <div key={i} className="update-toast__feature">
                {feature.title && (
                  <p className="update-toast__feature-title">{feature.title}</p>
                )}
                {feature.description && (
                  <p className="update-toast__feature-desc">{feature.description}</p>
                )}
              </div>
            ))}
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
