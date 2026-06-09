"use client";

import { useEffect, useRef } from "react";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("pv_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("pv_session_id", sid);
  }
  return sid;
}

export function PageViewTracker({
  listingId,
  eventId,
  cityId,
  pagePath,
  pageType,
}: {
  listingId?: string;
  eventId?: string;
  cityId: string;
  pagePath: string;
  pageType: "listing" | "category" | "zone" | "home" | "event" | "other";
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Skip bots
    if (typeof navigator !== "undefined" && (navigator as { webdriver?: boolean }).webdriver) return;

    const sessionId = getSessionId();

    fetch("/api/page-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id: listingId || null,
        event_id: eventId || null,
        city_id: cityId,
        page_path: pagePath,
        page_type: pageType,
        referrer: document.referrer || null,
        session_id: sessionId,
      }),
    }).catch(() => {});
  }, [listingId, eventId, cityId, pagePath, pageType]);

  return null;
}

// Utility to get session ID for use in click tracking
export function getTrackingSessionId(): string {
  if (typeof window === "undefined") return "";
  return getSessionId();
}

// Fire-and-forget tracker for event-level interactions. Never throws.
export function trackEventInteraction(
  eventId: string,
  kind: "reserve_click" | "pay_start" | "external_ticket_click"
): void {
  if (typeof window === "undefined" || !eventId) return;
  try {
    const body = JSON.stringify({
      event_id: eventId,
      kind,
      session_id: getSessionId(),
      referrer: document.referrer || null,
    });
    // Use keepalive so the request survives page navigation (e.g., Stripe redirect).
    fetch("/api/event-interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never throw from a tracker
  }
}
