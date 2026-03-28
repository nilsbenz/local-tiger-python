import {
  CloudDownloadIcon,
  CloudSavingDone01Icon,
  Loading02Icon,
  PlayIcon,
  StopIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocalStorage } from "@mantine/hooks";
import { formatForDisplay, useHotkey } from "@tanstack/react-hotkeys";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Kbd } from "./components/ui/kbd";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { Toaster } from "./components/ui/sonner";
import { Textarea } from "./components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { useIsMobile } from "./hooks/use-mobile";
import useIsTauriDesktop from "./hooks/use-tauri-desktop";
import { usePyodide } from "./lib/context/pyodide";
import { cn } from "./lib/utils";
import "./main.css";
import { PyodideRunResult } from "./types/pyodide";

export default function App() {
  const pyodide = usePyodide();
  const isTauriDesktop = useIsTauriDesktop();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useLocalStorage({
    key: "input",
    defaultValue: `import numpy as np
a = np.arange(15).reshape(3, 5)
print(a)`,
  });
  const [output, setOutput] = useState<PyodideRunResult>();
  const [isError, setIsError] = useState(false);
  const isMobile = useIsMobile();
  const [isOfflineReady, setIsOfflineReady] = useState(
    () => localStorage.getItem("is-offline-ready") === "true",
  );

  useEffect(() => {
    function readOfflineReady() {
      setIsOfflineReady(
        localStorage.getItem("is-offline-ready") === String(true),
      );
    }

    function onStorage(event: StorageEvent) {
      if (event.key === "is-offline-ready" || event.key === null) {
        readOfflineReady();
      }
    }

    function onOfflineReadyChanged() {
      readOfflineReady();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("offline-ready-changed", onOfflineReadyChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "offline-ready-changed",
        onOfflineReadyChanged,
      );
    };
  }, []);

  useHotkey("Mod+Enter", () => runCode(), {
    enabled: !!pyodide,
    target: inputRef,
  });
  useHotkey("Control+C", interruptExecution, {
    enabled: !!pyodide,
  });

  const { mutate: runCode, isPending } = useMutation({
    mutationFn: async () => {
      if (!pyodide) return;
      setOutput(undefined);
      setIsError(false);
      try {
        const execution = await pyodide.runPythonAsync(
          inputRef.current?.value || "",
        );
        setOutput(execution);
      } catch (error) {
        setOutput({
          result: String(error),
          stdout: [],
        } satisfies PyodideRunResult);
        setIsError(true);
      }
    },
  });

  function interruptExecution() {
    pyodide?.stopCurrentJob();
  }

  return (
    <main>
      <ResizablePanelGroup
        orientation={isMobile ? "vertical" : "horizontal"}
        className="top-safe-top left-safe-left right-safe-right bottom-safe-bottom fixed h-full"
      >
        <ResizablePanel className="p-2" minSize={160}>
          <div className="relative h-full">
            <p className="text-muted-foreground pointer-events-none absolute top-3 left-3 font-mono text-xs font-bold">
              main.py
            </p>
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-full pt-9 font-mono text-sm"
              autoFocus
              wrap="off"
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="p-2 pt-4" minSize={160}>
          <div className="flex h-full flex-col space-y-4">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {pyodide ? (
                <>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button onClick={() => runCode()} disabled={isPending}>
                          {isPending ? (
                            <HugeiconsIcon
                              icon={Loading02Icon}
                              className="animate-spin"
                            />
                          ) : (
                            <HugeiconsIcon icon={PlayIcon} />
                          )}
                          Run
                        </Button>
                      }
                    />
                    <TooltipContent align="start">
                      Run Python <Kbd>{formatForDisplay("Mod+Enter")}</Kbd>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={!isPending}
                          onClick={interruptExecution}
                        >
                          <HugeiconsIcon icon={StopIcon} />
                        </Button>
                      }
                    />
                    <TooltipContent align="start">
                      Interrupt execution{" "}
                      <Kbd>{formatForDisplay("Control+C")}</Kbd>
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <Button disabled variant="outline" className="w-fit">
                  <HugeiconsIcon
                    icon={Loading02Icon}
                    className="animate-spin"
                  />
                  Loading Pyodide
                </Button>
              )}
              <Badge
                variant="ghost"
                className="standalone:flex text-muted-foreground ml-auto hidden"
              >
                {isOfflineReady ? (
                  <>
                    <HugeiconsIcon icon={CloudSavingDone01Icon} />
                    Offline-ready
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={CloudDownloadIcon}
                      className="animate-pulse"
                    />
                    Loading assets...
                  </>
                )}
              </Badge>
              {!isTauriDesktop && (
                <Button
                  variant="outline"
                  className="standalone:hidden ml-auto"
                  render={
                    <a
                      href="https://github.com/nilsbenz/local-tiger-python/releases"
                      target="_blank"
                    />
                  }
                  nativeButton={false}
                >
                  <HugeiconsIcon icon={CloudDownloadIcon} />
                  Download
                </Button>
              )}
            </div>
            <pre
              className={cn(
                "bg-input/30 border-input standalone:max-md:rounded-b-[47px] relative grow overflow-y-auto overscroll-contain rounded-xl border p-3 pt-9 text-sm wrap-break-word whitespace-pre-wrap",
                isError && "text-destructive",
              )}
            >
              <p className="text-muted-foreground pointer-events-none absolute top-3 left-3 font-mono text-xs font-bold">
                Output
              </p>
              {output
                ? output.stdout.length > 0
                  ? output.stdout.join("\n")
                  : output.result
                : ""}
            </pre>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <Toaster position={isMobile ? "top-center" : "top-right"} />
    </main>
  );
}
