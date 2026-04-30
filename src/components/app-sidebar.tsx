import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import useIsTauriDesktop from "@/hooks/use-tauri-desktop";
import {
  baseDirAtom,
  currentFileAtom,
  currentFileEditedAtom,
} from "@/lib/atoms";
import { cn } from "@/lib/utils";
import { File02Icon, Folder02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatForDisplay, useHotkey } from "@tanstack/react-hotkeys";
import { open } from "@tauri-apps/plugin-dialog";
import { DirEntry, readDir, watchImmediate } from "@tauri-apps/plugin-fs";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { Kbd } from "./ui/kbd";

export function AppSidebar() {
  const isTauriDesktop = useIsTauriDesktop();

  const [baseDir, setBaseDir] = useAtom(baseDirAtom);
  const [contents, setContents] = useState<DirEntry[]>([]);
  const [currentFile, setCurrentFile] = useAtom(currentFileAtom);
  const currentFileEdited = useAtomValue(currentFileEditedAtom);
  const folderName = baseDir
    ? String(baseDir).split(/[\\/]/).filter(Boolean).pop() || String(baseDir)
    : "";

  useHotkey("Mod+O", handleOpenDirectory);

  async function handleOpenDirectory() {
    if (!isTauriDesktop) return;

    const folder = await open({
      multiple: false,
      directory: true,
    });

    if (!folder) return;

    if (folder !== baseDir) {
      setCurrentFile(null);
    }
    setBaseDir(folder);
  }

  useEffect(() => {
    if (!baseDir) return;

    let unwatch: (() => void) | null = null;

    async function readContents() {
      if (!baseDir) return;
      const res = await readDir(baseDir);
      setContents(
        res
          .filter((entry) => entry.isFile && entry.name.endsWith(".py"))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    async function init() {
      if (!baseDir) return;
      readContents();
      unwatch = await watchImmediate(baseDir, (event) => {
        if (typeof event.type !== "object") return;
        if (
          ("create" in event.type && event.type.create.kind === "file") ||
          ("remove" in event.type && event.type.remove.kind === "file") ||
          ("modify" in event.type && event.type.modify.kind === "rename")
        ) {
          readContents();
        }
      });
    }

    init();

    return () => {
      unwatch?.();
    };
  }, [baseDir]);

  if (!isTauriDesktop) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader
        className={cn("standalone:hidden", isTauriDesktop && "hidden")}
      >
        <h1 className="flex items-center gap-1 text-lg font-semibold">
          <img src="/icon.svg" alt="" className="size-6" />
          LocalTP
        </h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleOpenDirectory}
                disabled={!isTauriDesktop}
                variant="outline"
              >
                <HugeiconsIcon icon={Folder02Icon} />
                Open Folder
                <Kbd className="ml-auto">{formatForDisplay("Mod+O")}</Kbd>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setCurrentFile(null)}
                data-active={!currentFile}
              >
                <HugeiconsIcon icon={File02Icon} />
                <span className="truncate">Scratchpad</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {baseDir && (
          <SidebarGroup>
            <SidebarGroupLabel>{folderName}</SidebarGroupLabel>
            <SidebarMenu>
              {contents.map((entry) => (
                <SidebarMenuItem key={entry.name}>
                  <SidebarMenuButton
                    onClick={() => setCurrentFile(entry.name)}
                    data-active={currentFile === entry.name}
                  >
                    <HugeiconsIcon icon={File02Icon} />
                    <span className="truncate">{entry.name}</span>
                    {currentFileEdited && currentFile === entry.name && (
                      <span className="bg-muted-foreground ml-auto size-1.5 shrink-0 rounded-full" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <ModeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
