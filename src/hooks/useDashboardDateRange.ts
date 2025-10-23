import { useEffect, useMemo, useState } from "react";
import { dateRangeSchema } from "@/components/dashboard/types";
import { parseUiToDate, toInclusiveEnd, toISO, formatDateForUI, currentMonthDefault } from "@/lib/date";

export function useDashboardDateRange() {
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

  const initial = useMemo(() => {
    const start = search?.get("start");
    const end = search?.get("end");
    if (start && end) {
      try {
        dateRangeSchema.parse({ startISO: start, endISO: end });
        return { startISO: start, endISO: end };
      } catch {
        /* fallthrough */
      }
    }
    return currentMonthDefault();
  }, []);

  const [range, setRange] = useState(initial);
  const [startText, setStartText] = useState(() => formatDateForUI(new Date(range.startISO)));
  const [endText, setEndText] = useState(() => formatDateForUI(new Date(range.endISO)));
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set("start", range.startISO);
    params.set("end", range.endISO);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", url);
  }, [range]);

  function applyFromText() {
    const s = parseUiToDate(startText);
    const e0 = parseUiToDate(endText);
    if (!s || !e0) {
      setError("Please enter valid dates in DD/MM/YYYY HH:mm format.");
      return false;
    }
    const e = toInclusiveEnd(e0);
    const next = { startISO: toISO(s), endISO: toISO(e) };
    try {
      dateRangeSchema.parse(next);
      setRange(next);
      setError(undefined);
      return true;
    } catch {
      setError("Start must be before or equal to end.");
      return false;
    }
  }

  function resetToCurrentMonth() {
    const next = currentMonthDefault();
    setRange(next);
    setStartText(formatDateForUI(new Date(next.startISO)));
    setEndText(formatDateForUI(new Date(next.endISO)));
    setError(undefined);
  }

  const isValid = !error;

  return {
    range,
    display: { startText, endText },
    setStartText,
    setEndText,
    applyFromText,
    resetToCurrentMonth,
    isValid,
    error,
    setRange,
  };
}
