import { loadPyodide, PyodideAPI, version as pyodideVersion } from "pyodide";

export let pyodide: PyodideAPI | null = null;

export async function initPyodide() {
  pyodide = await loadPyodide({
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
  });
}
