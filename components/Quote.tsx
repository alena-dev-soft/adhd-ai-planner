/** Quote of the day (DESIGN §3): italic 22px, centred; author in uppercase 12px muted. */
export function Quote({ text, author }: { text: string; author: string | null }) {
  return (
    <figure className="text-center">
      <blockquote className="font-body text-[22px] italic leading-snug">&ldquo;{text}&rdquo;</blockquote>
      {author && (
        <figcaption className="mt-2 text-[12px] uppercase tracking-[1.5px] text-muted">— {author}</figcaption>
      )}
    </figure>
  );
}
