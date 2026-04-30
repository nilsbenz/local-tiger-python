import { atom } from "jotai";

export const baseDirAtom = atom<string | null>(null);
export const currentFileAtom = atom<string | null>(null);
export const currentFileEditedAtom = atom<boolean>(false);
export const editorContentAtom = atom<string>("");
