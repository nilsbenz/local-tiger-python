import { PyodideAPI } from "pyodide";
import React from "react";

const PyodideContext = React.createContext<PyodideAPI | null>(null);

function PyodideProvider({ children }: { children: React.ReactNode }) {
  const [pyodide, setPyodide] = React.useState<PyodideAPI | null>(null);

  React.useEffect(() => {
    import("pyodide").then(({ loadPyodide, version }) => {
      loadPyodide({
        indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`,
      }).then(setPyodide);
    });
  }, []);

  return <PyodideContext value={pyodide}>{children}</PyodideContext>;
}

function usePyodide() {
  const pyodide = React.use(PyodideContext);
  if (pyodide === undefined) {
    throw new Error("usePyodide must be used within a PyodideProvider");
  }
  return pyodide;
}

export { PyodideContext, PyodideProvider, usePyodide };
