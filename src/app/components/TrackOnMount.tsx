"use client";

import { useEffect } from "react";
import { track } from "../lib/track";

type Props = {
  event: string;
  params?: Record<string, string | number | boolean | undefined>;
};

// Fires an analytics event exactly once after the component mounts.
// Drop into pages that represent conversion endpoints (e.g. /booked, /thank-you).
export default function TrackOnMount({ event, params }: Props) {
  useEffect(() => {
    track(event, params ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
