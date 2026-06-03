import { mountApp } from "./ui/app.ts";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("#app element not found");
}

mountApp(root);
