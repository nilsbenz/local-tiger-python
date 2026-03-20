import {
  PyodideRunResult,
  PyodideWorkerClient,
  WorkerRequest,
  WorkerResponse,
} from "@/types/pyodide";
import React from "react";

const PyodideContext = React.createContext<PyodideWorkerClient | null>(null);

type ManagedWorker = {
  worker: Worker;
  ready: boolean;
};

function PyodideProvider({ children }: { children: React.ReactNode }) {
  const [pyodide, setPyodide] = React.useState<PyodideWorkerClient | null>(
    null,
  );

  React.useEffect(() => {
    let activeWorker: ManagedWorker | null = null;
    let standbyWorker: ManagedWorker | null = null;

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

    function setClientReady() {
      setPyodide({
        runPythonAsync: (code: string) => {
          const currentWorker = activeWorker;
          if (!currentWorker || !currentWorker.ready) {
            return Promise.reject(new Error("Pyodide is not ready"));
          }

          const id = requestId;
          requestId += 1;

          return new Promise<PyodideRunResult>((resolve, reject) => {
            pendingRequests.set(id, { resolve, reject });
            currentWorker.worker.postMessage({
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
    }

    function promoteStandbyWorker() {
      if (!standbyWorker) {
        activeWorker = null;
        setPyodide(null);
        return;
      }

      activeWorker = standbyWorker;
      standbyWorker = null;

      if (activeWorker.ready) {
        setClientReady();
        return;
      }

      setPyodide(null);
    }

    function createWorker() {
      const worker = new Worker(
        new URL("../pyodide.worker.ts", import.meta.url),
        {
          type: "module",
        },
      );

      const managedWorker: ManagedWorker = {
        worker,
        ready: false,
      };

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const isActive = managedWorker === activeWorker;
        const isStandby = managedWorker === standbyWorker;
        if (!isActive && !isStandby) {
          return;
        }

        const message = event.data;
        if (message.type === "ready") {
          managedWorker.ready = true;
          if (isActive) {
            setClientReady();
          }
          return;
        }

        if (message.type === "init-error") {
          handleWorkerFatalError(managedWorker, message.error);
          return;
        }

        if (!isActive) {
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

      worker.onerror = (event) => {
        handleWorkerFatalError(managedWorker, event.message);
      };

      return managedWorker;
    }

    function ensureStandbyWorker() {
      if (standbyWorker) {
        return;
      }
      standbyWorker = createWorker();
    }

    function handleWorkerFatalError(
      managedWorker: ManagedWorker,
      message: string,
    ) {
      if (managedWorker === activeWorker) {
        rejectAllPending(new Error(message));
        activeWorker = null;
        promoteStandbyWorker();
        ensureStandbyWorker();
        return;
      }

      if (managedWorker === standbyWorker) {
        standbyWorker = null;
        ensureStandbyWorker();
      }
    }

    function resetWorker(errorMessage: string) {
      rejectAllPending(new Error(errorMessage));
      activeWorker?.worker.terminate();
      activeWorker = null;
      promoteStandbyWorker();
      ensureStandbyWorker();
    }

    activeWorker = createWorker();
    standbyWorker = createWorker();

    return () => {
      rejectAllPending(new Error("Pyodide worker terminated"));
      activeWorker?.worker.terminate();
      standbyWorker?.worker.terminate();
      activeWorker = null;
      standbyWorker = null;
      setPyodide(null);
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
