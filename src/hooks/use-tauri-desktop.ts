export default function useIsTauriDesktop() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
