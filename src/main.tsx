import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { TooltipProvider } from "./components/ui/tooltip";
import { PyodideProvider } from "./lib/context/pyodide";

const queryClient = new QueryClient();

registerSW({
  immediate: true,
  onOfflineReady() {
    toast.success("App is ready to work offline");
  },
});

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
