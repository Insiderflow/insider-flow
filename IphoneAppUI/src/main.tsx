import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initGoogleAnalytics } from "@/lib/analytics";
import "./styles/globals.css";

initGoogleAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
