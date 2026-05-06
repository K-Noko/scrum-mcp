import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { registry } from "./registry";

declare global {
  interface Window {
    __ARTIFACT__: { component: string; props: Record<string, unknown> };
  }
}

const { component, props } = window.__ARTIFACT__;
const Component = registry[component];

if (!Component) {
  document.getElementById("root")!.innerHTML =
    `<p class="text-red-500 p-4">Unknown component: ${component}</p>`;
} else {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    React.createElement(Component, props)
  );
}
