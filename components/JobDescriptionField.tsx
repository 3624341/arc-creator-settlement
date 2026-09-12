type JobDescriptionFieldProps = {
  value: string;
  onChange(value: string): void;
};

export function JobDescriptionField({ value, onChange }: JobDescriptionFieldProps) {
  return (
    <label className="grid gap-2 font-bold">
      Job description
      <textarea
        aria-label="Job description"
        className="min-h-36 resize-y rounded-2xl border border-arc-line bg-white px-4 py-3 font-normal leading-7"
        maxLength={2_000}
        placeholder="Describe the creator you are looking for, the work to deliver, and any important requirements."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="flex justify-between gap-4 text-sm font-normal text-arc-muted">
        <span>Required · 20–2,000 characters</span>
        <span>{value.length.toLocaleString()}/2,000</span>
      </span>
    </label>
  );
}
