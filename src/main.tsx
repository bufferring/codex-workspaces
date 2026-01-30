import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";
import "./i18n";

const updateSW = registerSW({ immediate: true });

if (import.meta.hot) {
  import.meta.hot.accept(() => updateSW && updateSW(true));
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
