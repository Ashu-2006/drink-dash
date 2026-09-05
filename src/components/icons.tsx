/* ==========================================================================
   The icon set.

   Every icon the interface uses is named and re-exported here, and pages import
   from this file rather than from the icon library. Two reasons.

   First, the set cannot sprawl. An icon library has 9,000 glyphs and six
   weights; without a single door, six pages pick six different arrows and the
   interface quietly stops looking designed.

   Second, weight and size are decided once. Phosphor's regular weight sits at
   the same optical weight as this interface's 500 to 600 body text; bold reads
   heavier than the type beside it and light disappears against it.

   Icons are imported from `dist/csr/<Name>` rather than the package root. The
   root barrel re-exports every glyph, and a bundler that fails to tree shake it
   pulls in megabytes. A direct path cannot do that whatever the bundler does.
   ========================================================================== */

import type { ComponentProps } from "react";
import { IconContext } from "@phosphor-icons/react";

import { ShoppingBag } from "@phosphor-icons/react/dist/csr/ShoppingBag";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { List } from "@phosphor-icons/react/dist/csr/List";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { Minus } from "@phosphor-icons/react/dist/csr/Minus";
import { Trash } from "@phosphor-icons/react/dist/csr/Trash";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { CaretDown } from "@phosphor-icons/react/dist/csr/CaretDown";
import { Check } from "@phosphor-icons/react/dist/csr/Check";
import { Star } from "@phosphor-icons/react/dist/csr/Star";
import { Truck } from "@phosphor-icons/react/dist/csr/Truck";
import { ArrowsClockwise } from "@phosphor-icons/react/dist/csr/ArrowsClockwise";
import { Money } from "@phosphor-icons/react/dist/csr/Money";
import { Leaf } from "@phosphor-icons/react/dist/csr/Leaf";
import { Flask } from "@phosphor-icons/react/dist/csr/Flask";
import { InstagramLogo } from "@phosphor-icons/react/dist/csr/InstagramLogo";

export type IconProps = ComponentProps<typeof X>;

/* Commerce and chrome */
export const CartIcon = ShoppingBag;
export const SearchIcon = MagnifyingGlass;
export const MenuIcon = List;
export const CloseIcon = X;

/* Quantity and disclosure */
export const PlusIcon = Plus;
export const MinusIcon = Minus;
export const RemoveIcon = Trash;
export const CaretIcon = CaretDown;

/* Direction */
export const NextIcon = ArrowRight;
export const BackIcon = ArrowLeft;
export const ExternalIcon = ArrowUpRight;

/* Meaning */
export const CheckIcon = Check;
export const StarIcon = Star;
export const ShippingIcon = Truck;
export const ReturnsIcon = ArrowsClockwise;
export const PaymentIcon = Money;
export const VeganIcon = Leaf;
export const LabIcon = Flask;
export const InstagramIcon = InstagramLogo;

/**
 * Sets the defaults for every icon beneath it.
 *
 * `currentColor` matters: an icon that inherits colour recolours with its
 * theme band, and this site swaps theme colour per product section. A hardcoded
 * fill would go wrong on the coral, olive and gold grounds.
 *
 * `1em` matters for the same reason as the type scale: the icon scales with the
 * text it sits beside instead of being pinned to a pixel size that is wrong at
 * three of the four breakpoints.
 */
export function IconDefaults({ children }: { children: React.ReactNode }) {
  return (
    <IconContext.Provider
      value={{
        color: "currentColor",
        size: "1.25em",
        weight: "regular",
        // Decorative by default. Anything carrying meaning on its own passes an
        // aria-label, which overrides this.
        "aria-hidden": true,
      }}
    >
      {children}
    </IconContext.Provider>
  );
}
