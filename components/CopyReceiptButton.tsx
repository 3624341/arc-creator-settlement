"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyReceiptButton({ value, label = "Copy receipt link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const copyValue = value.startsWith("/") ? `${window.location.origin}${value}` : value;
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={copy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-arc-line bg-white px-4 py-3 text-sm font-black text-arc-ink transition hover:-translate-y-0.5 hover:shadow-sm">
      {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      {copied ? "Copied" : label}
    </button>
  );
}
