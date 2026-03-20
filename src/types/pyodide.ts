export type PyodideRunResult = {
  result: string;
  stdout: string[];
};

export type PyodideWorkerClient = {
  runPythonAsync: (code: string) => Promise<PyodideRunResult>;
  stopCurrentJob: () => void;
  restartWorker: () => void;
};

export type WorkerRequest = {
  type: "run";
  id: number;
  code: string;
};

export type WorkerResponse =
  | { type: "ready" }
  | { type: "init-error"; error: string }
  | { type: "run-result"; id: number; result: string; stdout: string[] }
  | { type: "run-error"; id: number; error: string; stdout: string[] };

export type RunRequestMessage = {
  type: "run";
  id: number;
  code: string;
};

export type IncomingMessage = RunRequestMessage;

export type ReadyMessage = {
  type: "ready";
};

export type InitErrorMessage = {
  type: "init-error";
  error: string;
};

export type RunResultMessage = {
  type: "run-result";
  id: number;
  result: string;
  stdout: string[];
};

export type RunErrorMessage = {
  type: "run-error";
  id: number;
  error: string;
  stdout: string[];
};

export type OutgoingMessage =
  | ReadyMessage
  | InitErrorMessage
  | RunResultMessage
  | RunErrorMessage;
