/** Quote of the day: Georgia italic, centered, author in small caps. */
export function Quote({ text, author }: { text: string; author: string | null }) {
  return (
    <figure className="my-8 border-y border-line py-5 text-center">
      <blockquote className="font-body text-[0.95rem] italic leading-[1.8]">
        &ldquo;{text}&rdquo;
      </blockquote>
      {author && (
        <figcaption className="mt-2 text-[0.85rem] tracking-[1px] text-muted [font-variant:small-caps]">
          — {author}
        </figcaption>
      )}
    </figure>
  );
}
