import { useState } from "react";
import "./main.css";
import { pyodide } from "./pyodide";

function App() {
  const [input, setInput] = useState("print(42)");
  const [output, setOutput] = useState<string>();

  function runCode() {
    if (!pyodide) return;

    let capturedStdout = "";

    pyodide.setStdout({
      batched: (text: string) => {
        capturedStdout += text + "\n";
      },
    });

    try {
      const result = pyodide.runPython(input);

      setOutput(
        capturedStdout.trim() !== ""
          ? capturedStdout.trimEnd()
          : result === undefined
            ? ""
            : String(result),
      );
    } catch (error) {
      setOutput(String(error));
    }
  }

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 min-h-dvh p-4 gap-4">
      <textarea
        className="p-4 border-2 font-mono border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter Python code here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="space-y-4 flex flex-col">
        <button
          onClick={runCode}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Run
        </button>
        <pre className="p-4 grow bg-gray-200 rounded-md">{output}</pre>
      </div>
    </main>
  );
}

export default App;
