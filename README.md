# Drink Dash

A redesign of [drinkdash.in](https://drinkdash.in), an Indian direct to consumer brand
selling 60ml ready to drink wellness shots. Three pages built to production quality: home,
product list and product detail.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type check then production build
npm run preview  # serve the build locally
```

## Routes

| Path | Page |
| :--- | :--- |
| `/` | Home |
| `/shop` | Product list |
| `/products/:handle` | Product detail, one of `dash-of-glow`, `dash-of-volume`, `dash-of-burn` |
| `/previous` | An archived earlier iteration of the home page, kept for comparison |

## Stack

Vite, React and TypeScript. GSAP with ScrollTrigger, SplitText and DrawSVG for motion.
Lenis for smooth scroll, on the home page only. three.js through react-three-fiber for the
bottle. No CSS framework: the design system is plain CSS custom properties.

## How the design system works

Two rules carry most of it.

**One fluid root, everything in em beneath it.** There is no `clamp()` on any individual
font size. The body carries a single fluid size and every type token is expressed in em
against it, so the ratios between elements are locked and a breakpoint is one edit. The
root stops scaling at the design width, so above 1440px the page gains margin rather than
growing.

**Spacing is in rem, type is in em.** Spacing is layout and must not inherit the size of
whatever text sits next to it. An earlier version had the spacing scale in em, which put
576px of dead space in the footer because a 3em margin sat on a 192px element.

Colour is computed rather than picked: one lightness and one chroma per tier, only the hue
rotates between the three products. Ink sits on every coloured ground at a floor of 5.22
to 1. Depth comes from bands overlapping under a `clip-path`, never from a shadow.

## Content

Everything in `src/lib/catalog.ts` is sourced from the live drinkdash.in store, and each
editorial block carries a `source` field recording where it came from. Anything invented
is marked `proposal` and renders a visible tag in the interface, so a reviewer can never
mistake a proposal for real merchandising.

`src/lib/previous-data.ts` holds the earlier iteration's content, most of which was
invented before that audit. It is used only by `/previous` and never by a live page.

## Fonts

`public/fonts` contains Champ and Degular Display. Both are commercial typefaces and the
files here are demo or trial cuts. They must be licensed before this is used commercially:
Degular from OH no Type Co, Champ from Typeverything. General Sans and Azeret Mono are
free for commercial use from Indian Type Foundry.

Degular's demo cut carries no punctuation at all, which is why it is restricted to
headings that contain none, and General Sans sets everything else.
