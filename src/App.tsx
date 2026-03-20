import {
  CloudDownloadIcon,
  Loading02Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatForDisplay, useHotkey } from "@tanstack/react-hotkeys";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Kbd } from "./components/ui/kbd";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { Textarea } from "./components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { useIsMobile } from "./hooks/use-mobile";
import { usePyodide } from "./lib/context/pyodide";
import "./main.css";

export default function App() {
  const pyodide = usePyodide();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [output, setOutput] = useState<string>();
  const isMobile = useIsMobile();

  useHotkey("Mod+Enter", () => runCode(), {
    enabled: !!pyodide,
    target: inputRef,
  });

  const { mutate: runCode, isPending } = useMutation({
    mutationFn: async () => {
      if (!pyodide) return;
      setOutput(undefined);
      let output: string[] = [];
      pyodide.setStdout({
        batched: (text: string) => {
          output.push(text);
        },
      });
      try {
        const result = await pyodide.runPythonAsync(
          inputRef.current?.value || "",
        );
        setOutput(output.length > 0 ? output.join("\n") : String(result));
      } catch (error) {
        setOutput(String(error));
      }
    },
  });

  return (
    <main className="h-dvh overscroll-contain">
      <ResizablePanelGroup
        orientation={isMobile ? "vertical" : "horizontal"}
        className="h-full"
      >
        <ResizablePanel className="p-2" minSize={160}>
          <div className="relative h-full">
            <p className="text-muted-foreground pointer-events-none absolute top-3 left-3 font-mono text-xs font-bold">
              main.py
            </p>
            <Textarea
              ref={inputRef}
              defaultValue="print(42)"
              className="h-full pt-9 font-mono text-sm"
              autoFocus
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="p-2 pt-4" minSize={160}>
          <div className="flex h-full flex-col space-y-4">
            {pyodide ? (
              <div className="flex gap-4">
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
              </div>
            ) : (
              <Button disabled variant="outline" className="w-fit">
                <HugeiconsIcon
                  icon={CloudDownloadIcon}
                  className="animate-pulse"
                />
                Downloading Pyodide
              </Button>
            )}
            <pre className="bg-input/30 border-input relative grow overflow-y-auto overscroll-contain rounded-xl border p-3 pt-9 text-sm wrap-break-word whitespace-pre-wrap">
              <p className="text-muted-foreground pointer-events-none absolute top-3 left-3 font-mono text-xs font-bold">
                Output
              </p>
              {output}
            </pre>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
