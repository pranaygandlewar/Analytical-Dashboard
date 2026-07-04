import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#ffffff",
          color: "#0f172a",
          borderRadius: "18px",
          padding: "16px",
          boxShadow:
            "0 10px 30px rgba(15,23,42,0.12)",
          border: "1px solid #e2e8f0",
        },

        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
        },

        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },
      }}
    />

    <App />
  </React.StrictMode>
);