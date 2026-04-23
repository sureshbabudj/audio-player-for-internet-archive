import React from "react";
import ReactDOM from "react-dom/client";
import App from "../popup/App";
import "./index.css";

const AppWrapper: React.FC = () => {
  return (
    <div className="h-full w-full max-h-[600px] max-w-sm flex items-center justify-center border border-white/10 rounded-lg bg-dark p-4 shadow-xl">
      <App />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;

    navigator.serviceWorker.register(swUrl).catch(() => {
      // Service worker registration is optional in unsupported environments.
    });
  });
}
