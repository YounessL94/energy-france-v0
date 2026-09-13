import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname);
const outputDirectory = resolve(projectRoot, "dist");
const publicFiles = ["index.html", "styles.css", "app.js", "scoring.js"];

if (basename(outputDirectory) !== "dist" || dirname(outputDirectory) !== projectRoot) {
  throw new Error("Le dossier de sortie attendu n’est pas sûr.");
}

rmSync(outputDirectory, { recursive: true, force: true });
mkdirSync(outputDirectory);

for (const file of publicFiles) {
  copyFileSync(join(projectRoot, file), join(outputDirectory, file));
}

console.log(`Build statique prêt : ${publicFiles.length} fichiers publics.`);
