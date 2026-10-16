import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const source = new URL("../dist-login/", import.meta.url);
const destinationRoot = new URL("../dist-login-root/", import.meta.url);
const destination = new URL("login/", destinationRoot);

await rm(destinationRoot, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });

// Browsers cache /favicon.ico very aggressively. Publish the PSIFU mark under
// a versioned URL so existing users stop seeing Expo's old default icon.
const indexFile = new URL("index.html", destination);
const versionedFavicon = new URL("psifu-favicon-v2.ico", destination);
await cp(new URL("favicon.ico", destination), versionedFavicon);
const html = await readFile(indexFile, "utf8");
await writeFile(
  indexFile,
  html.replace(/href="\/login\/favicon\.ico"/g, 'href="/login/psifu-favicon-v2.ico"'),
  "utf8",
);
