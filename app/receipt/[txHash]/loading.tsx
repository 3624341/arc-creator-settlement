import { Shell } from "@/components/Shell";

export default function ReceiptLoading() {
  return (
    <Shell>
      <div className="mx-auto max-w-4xl animate-pulse py-10" aria-label="Verifying settlement receipt">
        <div className="h-[32rem] rounded-[2.25rem] bg-white/70 shadow-sm" />
      </div>
    </Shell>
  );
}
