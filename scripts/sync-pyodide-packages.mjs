import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { mkdir, readFile, stat, writeFile } from "fs/promises";

async function fileExists(path) {
  try {
    const info = await stat(path);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

async function main() {
  const pyodideDir = dirname(fileURLToPath(import.meta.resolve("pyodide")));
  const lockfilePath = join(pyodideDir, "pyodide-lock.json");
  const pyodidePackageJsonPath = join(pyodideDir, "package.json");

  const lockfile = JSON.parse(await readFile(lockfilePath, "utf-8"));
  const pyodidePackageJson = JSON.parse(
    await readFile(pyodidePackageJsonPath, "utf-8"),
  );

  const pyodideVersion = pyodidePackageJson.version;
  const packageIndex = lockfile.packages;

  const filesToDownload = [
    ...new Set(
      Object.values(packageIndex)
        .map((pkg) => pkg?.file_name)
        .filter(Boolean),
    ),
  ];

  const targetDir = resolve(process.cwd(), "public", "pyodide");
  await mkdir(targetDir, { recursive: true });

  const baseUrl = `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full`;

  for (const fileName of filesToDownload) {
    const targetPath = join(targetDir, fileName);
    if (await fileExists(targetPath)) {
      continue;
    }

    const url = `${baseUrl}/${fileName}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to download ${fileName}: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    await writeFile(targetPath, Buffer.from(arrayBuffer));
    console.log(`Downloaded ${fileName}`);
  }

  console.log(`Pyodide offline package files ready: ${filesToDownload.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
