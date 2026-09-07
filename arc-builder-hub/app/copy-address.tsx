"use client";

import React, { useState } from "react";

export function CopyAddress({ label, value }: { label: string; value: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setMessage("Copy unavailable. Select and copy the full value below.");
    }
  }
  return <div className="address-row"><div className="address-heading"><span>{label}</span><button type="button" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>Copy</button></div><code>{value}</code><span className="copy-status" role="status">{message}</span></div>;
}
