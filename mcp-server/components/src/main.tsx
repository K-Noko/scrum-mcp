import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { registry } from "./registry";

declare global {
  interface Window {
    __ARTIFACT__: { sections: Array<{ component: string; props: Record<string, unknown> }> };
  }
}

const { sections } = window.__ARTIFACT__;

const elements = sections.map(({ component, props }, i) => {
  const Component = registry[component];
  if (!Component) {
    return React.createElement(
      "p",
      { key: i, className: "text-red-500 p-4" },
      `Unknown component: ${component}`
    );
  }
  return React.createElement(Component, { key: i, ...props });
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  React.createElement("div", { className: "min-h-screen bg-gray-50 p-6 font-sans space-y-6" }, ...elements)
);
