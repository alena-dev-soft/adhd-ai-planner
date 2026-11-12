/** Free notes at the bottom of the day page. */
export function Notes({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div className="border-t border-line pt-5">
      <h3 className="mb-1 text-[0.8rem] font-light uppercase tracking-[1px]">Notes</h3>
      <p className="mb-4 text-xs italic text-muted">
        &ldquo;Extra space for ideas, future tasks, inspiration, etc.&rdquo;
      </p>
      <textarea
        aria-label="Notes"
        placeholder="Notes…"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={() => onBlur?.()}
        className="min-h-20 w-full resize-y border border-line bg-transparent p-2.5 text-[0.9rem] outline-none focus:border-accent"
      />
    </div>
  );
}
