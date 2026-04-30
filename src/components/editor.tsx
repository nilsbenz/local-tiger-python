import useIsTauriDesktop from "@/hooks/use-tauri-desktop";
import {
  baseDirAtom,
  currentFileAtom,
  currentFileEditedAtom,
  editorContentAtom,
} from "@/lib/atoms";
import { usePyodide } from "@/lib/context/pyodide";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation } from "@tanstack/react-query";
import { readFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";

export default function Editor({ onRun }: { onRun: () => void }) {
  const baseDir = useAtomValue(baseDirAtom);
  const currentFile = useAtomValue(currentFileAtom);
  const [edited, setEdited] = useAtom(currentFileEditedAtom);
  const filePath =
    baseDir && currentFile ? [baseDir, currentFile].join("/") : null;
  const [content, setContent] = useAtom(editorContentAtom);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isTauriDesktop = useIsTauriDesktop();
  const pyodide = usePyodide();

  const { mutateAsync: saveContent, isPending: isSaving } = useMutation({
    mutationFn: async ({
      file,
      content,
    }: {
      file: string | null;
      content: string;
    }) => {
      if (isTauriDesktop && file) {
        await writeTextFile(file, content);
      } else {
        localStorage.setItem("editor-content", content);
      }
    },
    onSuccess: () => {
      setEdited(false);
    },
    onError: (error) => {
      toast.error(`Failed to save file: ${error.name}`, {
        description: error.message,
      });
    },
  });

  function handleChange(value: string) {
    setContent(value);
    setEdited(true);
    if (!isTauriDesktop) {
      saveContent({ file: null, content: value });
    }
  }

  async function handleRun() {
    if (edited) {
      await saveContent({ file: filePath, content });
    }
    onRun();
  }

  useHotkey("Mod+Enter", handleRun, {
    target: inputRef,
    enabled: !!pyodide,
  });
  useHotkey("Mod+S", () => saveContent({ file: filePath, content }), {
    target: inputRef,
  });

  useEffect(() => {
    if (!filePath) {
      const savedContent = localStorage.getItem("editor-content") || "";
      setContent(savedContent);
      return;
    }

    setContent("");
    setEdited(false);

    async function readContent() {
      if (!filePath) return;
      const res = await readFile(filePath);
      setContent(new TextDecoder().decode(res));
    }

    readContent();

    return () => {
      saveContent({ file: filePath!, content: inputRef.current?.value || "" });
    };
  }, [filePath]);

  return (
    <div className="relative h-full">
      <div className="absolute top-3 right-3 left-3 flex justify-between">
        <p className="text-muted-foreground pointer-events-none font-mono text-xs font-bold">
          {currentFile || "Scratchpad"}
        </p>
        <button
          hidden={!filePath || !edited}
          className="text-muted-foreground cursor-pointer text-xs font-bold"
          onClick={() => filePath && saveContent({ file: filePath, content })}
          disabled={isSaving}
        >
          Save
        </button>
      </div>
      <Textarea
        ref={inputRef}
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        className="h-full pt-9 font-mono text-sm"
        autoFocus
        wrap="off"
      />
    </div>
  );
}
