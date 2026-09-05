import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/tokens.css";
import "./styles/base.css";
import App from "./App";
import { IconDefaults } from "./components/icons";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <IconDefaults>
        <App />
      </IconDefaults>
    </BrowserRouter>
  </StrictMode>
);
