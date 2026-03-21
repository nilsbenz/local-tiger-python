import { IncomingMessage, OutgoingMessage } from "@/types/pyodide";
import { loadPyodide, type PyodideAPI } from "pyodide";

let pyodide: PyodideAPI | null = null;
let currentStdout: string[] | null = null;

const initPromise = loadPyodide({
  indexURL: "/pyodide",
})
  .then((api) => {
    pyodide = api;
    pyodide.setStdout({
      batched: (text: string) => {
        currentStdout?.push(text);
      },
    });
    self.postMessage({ type: "ready" } satisfies OutgoingMessage);
  })
  .catch((error) => {
    self.postMessage({
      type: "init-error",
      error: String(error),
    } satisfies OutgoingMessage);
  });

self.onmessage = async (event: MessageEvent<IncomingMessage>) => {
  const message = event.data;
  if (message.type !== "run") {
    return;
  }

  await initPromise;

  if (!pyodide) {
    self.postMessage({
      type: "run-error",
      id: message.id,
      error: "Pyodide failed to initialize",
      stdout: [],
    } satisfies OutgoingMessage);
    return;
  }

  try {
    await pyodide.loadPackagesFromImports(message.code);
    currentStdout = [];
    const result = await pyodide.runPythonAsync(message.code);
    const stdout = currentStdout ?? [];
    currentStdout = null;
    self.postMessage({
      type: "run-result",
      id: message.id,
      result: String(result),
      stdout,
    } satisfies OutgoingMessage);
  } catch (error) {
    const stdout = currentStdout ?? [];
    currentStdout = null;
    self.postMessage({
      type: "run-error",
      id: message.id,
      error: String(error),
      stdout,
    } satisfies OutgoingMessage);
  }
};
