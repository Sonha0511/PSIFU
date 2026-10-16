import { cp, mkdir, rm } from "node:fs/promises";

const source = new URL("../dist-login/", import.meta.url);
const destinationRoot = new URL("../dist-login-root/", import.meta.url);
const destination = new URL("login/", destinationRoot);

await rm(destinationRoot, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
