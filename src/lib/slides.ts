/**
 * Total number of slides for a post: the title slide, one per content section,
 * plus the optional "subscribe for more" slide.
 */
export function slideCount(
  slidesContent: string[],
  subForMore: boolean,
): number {
  return 1 + slidesContent.length + (subForMore ? 1 : 0);
}
