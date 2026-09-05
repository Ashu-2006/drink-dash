/* ==========================================================================
   One Diaries list item, and the grid it sits in.

   There were three copies of this card: the Diaries index, the "read more"
   strip at the foot of an article, and a look-alike on the home page that was
   built from a separate copy list and linked nowhere. Three copies drift, and
   the home one had already drifted into a different component with different
   fields. This is the single card, used in all three places.

   The card is deliberately thin: picture, one meta line, title, standfirst.
   Title and standfirst are clamped to two lines each, so a long headline
   cannot set the height of the row and cards stay comparable at a glance.
   The clamp hides the overflow rather than shortening the string, so the full
   title is still in the DOM for search and for a screen reader.

   One hit target, not three. The title link is stretched over the whole card
   with a pseudo-element, so the picture and the standfirst are part of the
   same target instead of being three separate tab stops to the same URL.
   ========================================================================== */

import { Link } from "react-router-dom";
import { img } from "../lib/media";
import type { Diary } from "../lib/diaries";
import "./diarycard.css";

/** Heading level, so the card nests correctly under whatever precedes it. */
type Level = 2 | 3;

export function DiaryCard({ diary, level = 2 }: { diary: Diary; level?: Level }) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <article className={`dcard theme-${diary.theme}`}>
      <div className="dcard__media">
        <img className="dcard__art" {...img(diary.art)} loading="lazy" decoding="async" />
      </div>
      <p className="t-label t-muted dcard__meta">
        <time dateTime={diary.iso}>{diary.date}</time> · {diary.readingMinutes} min read
      </p>
      <Heading className="t-heading-s dcard__title">
        <Link to={`/dash-diaries/${diary.slug}`} className="dcard__link">
          {diary.title}
        </Link>
      </Heading>
      <p className="t-body-s t-muted dcard__dek">{diary.dek}</p>
    </article>
  );
}

/** The grid.

    auto-fit by default, so two cards fill the row instead of leaving a hole
    where a third would have gone. `columns={3}` pins it to three tracks and
    lets the hole stand, which is what the read more row at the foot of an
    article wants: two related posts today, a third slot held open for when
    there are more. */
export function DiaryList({
  items,
  level = 2,
  columns,
  className = "",
}: {
  items: readonly Diary[];
  level?: Level;
  columns?: 3;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={`dlist${columns === 3 ? " dlist--3" : ""} ${className}`.trim()}>
      {items.map((d) => (
        <DiaryCard key={d.slug} diary={d} level={level} />
      ))}
    </div>
  );
}
