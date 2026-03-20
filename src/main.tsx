import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { TooltipProvider } from "./components/ui/tooltip";
import { PyodideProvider } from "./lib/context/pyodide";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <PyodideProvider>
          <App />
        </PyodideProvider>
      </QueryClientProvider>
    </TooltipProvider>
  </React.StrictMode>,
);
