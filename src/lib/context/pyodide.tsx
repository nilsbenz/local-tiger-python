import {
  PyodideRunResult,
  PyodideWorkerClient,
  WorkerRequest,
  WorkerResponse,
} from "@/types/pyodide";
import React from "react";

const PyodideContext = React.createContext<PyodideWorkerClient | null>(null);

function PyodideProvider({ children }: { children: React.ReactNode }) {
  const [pyodide, setPyodide] = React.useState<PyodideWorkerClient | null>(
    null,
  );

  React.useEffect(() => {
    let worker: Worker | null = null;
    let workerGeneration = 0;

    const pendingRequests = new Map<
      number,
      {
        resolve: (value: PyodideRunResult) => void;
        reject: (error: Error) => void;
      }
    >();
    let requestId = 0;

    function rejectAllPending(error: Error) {
      for (const pendingRequest of pendingRequests.values()) {
        pendingRequest.reject(error);
      }
      pendingRequests.clear();
    }

    function resetWorker(errorMessage: string) {
      rejectAllPending(new Error(errorMessage));
      worker?.terminate();
      worker = null;
      setPyodide(null);
      createWorker();
    }

    function createWorker() {
      workerGeneration += 1;
      const generation = workerGeneration;
      const nextWorker = new Worker(
        new URL("../pyodide.worker.ts", import.meta.url),
        {
          type: "module",
        },
      );
      worker = nextWorker;

      nextWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (generation !== workerGeneration) {
          return;
        }

        const message = event.data;
        if (message.type === "ready") {
          setPyodide({
            runPythonAsync: (code: string) => {
              if (!worker || generation !== workerGeneration) {
                return Promise.reject(new Error("Pyodide is not ready"));
              }

              const id = requestId;
              requestId += 1;

              return new Promise<PyodideRunResult>((resolve, reject) => {
                pendingRequests.set(id, { resolve, reject });
                worker?.postMessage({
                  type: "run",
                  id,
                  code,
                } satisfies WorkerRequest);
              });
            },
            stopCurrentJob: () => {
              resetWorker("Execution interrupted");
            },
            restartWorker: () => {
              resetWorker("Pyodide worker restarted");
            },
          });
          return;
        }

        if (message.type === "init-error") {
          rejectAllPending(new Error(message.error));
          setPyodide(null);
          return;
        }

        const request = pendingRequests.get(message.id);
        if (!request) {
          return;
        }
        pendingRequests.delete(message.id);

        if (message.type === "run-result") {
          request.resolve({ result: message.result, stdout: message.stdout });
          return;
        }

        request.reject(new Error(message.error));
      };

      nextWorker.onerror = (event) => {
        if (generation !== workerGeneration) {
          return;
        }
        rejectAllPending(new Error(event.message));
        setPyodide(null);
      };
    }

    createWorker();

    return () => {
      rejectAllPending(new Error("Pyodide worker terminated"));
      worker?.terminate();
      worker = null;
    };
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
