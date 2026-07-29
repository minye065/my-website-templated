import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import StarMap from "./components/StarMap";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="h-[100dvh] w-screen overflow-hidden bg-[#03040a]">
      <StarMap />
    </main>
  </StrictMode>
);
