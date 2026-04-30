import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { AppSidebar } from "./components/app-sidebar";
import { ThemeProvider } from "./components/theme-provider";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { PyodideProvider } from "./lib/context/pyodide";
import "./main.css";

const queryClient = new QueryClient();

registerSW({
  immediate: true,
  onOfflineReady() {
    localStorage.setItem("is-offline-ready", String(true));
    window.dispatchEvent(new Event("offline-ready-changed"));
    toast.success("App is ready to work offline");
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <PyodideProvider>
          <ThemeProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <App />
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </PyodideProvider>
      </QueryClientProvider>
    </TooltipProvider>
  </React.StrictMode>,
);
