import { Routes, Route } from "react-router-dom";
import { Header, Footer, Intro } from "./components/Chrome";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Previous from "./pages/Previous";
import DashLife from "./pages/DashLife";
import Diaries from "./pages/Diaries";
import Diary from "./pages/Diary";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import { CartProvider, CartAnnounce, useCart } from "./lib/cart";
import { CartDrawer } from "./components/CartDrawer";
import { SearchOverlay } from "./components/SearchOverlay";
import { SearchProvider } from "./lib/search";
import { GooDefs } from "./motion/liquid/LiquidBite";
import { DevAnnotations } from "./dev/DevAnnotations";

/* The cart lives above the router so it survives navigation, and every page
   reads it from context rather than being handed a callback chain. */
export default function App() {
  return (
    <CartProvider>
      <SearchProvider>
        <Shell />
      </SearchProvider>
    </CartProvider>
  );
}

function Shell() {
  const cart = useCart();
  return (
    <>
      {/* One goo filter for every button in the document. */}
      <GooDefs />
      <Intro />
      <Header />
      <CartAnnounce />
      <main>
        <Routes>
          <Route path="/" element={<Home onAdd={cart.add} />} />
          <Route path="/shop" element={<Shop onAdd={cart.add} />} />
          <Route path="/products/:handle" element={<Product onAdd={cart.add} />} />
          <Route path="/dash-life" element={<DashLife />} />
          <Route path="/dash-diaries" element={<Diaries />} />
          <Route path="/dash-diaries/:slug" element={<Diary />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/:stage" element={<Checkout />} />
          {/* The archived first iteration, kept for comparison. */}
          <Route path="/previous" element={<Previous onAdd={cart.add} />} />
          {/* A wrong URL used to silently render the home page, which tells a
              visitor their link worked when it did not. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      {/* Design review tooling. Renders nothing outside development and is
          stripped from the production bundle entirely. */}
      <DevAnnotations />
    </>
  );
}
