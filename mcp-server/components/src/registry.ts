import type { ComponentType } from "react";
import SprintSummary from "./components/SprintSummary";
import BurndownChart from "./components/BurndownChart";
import TaskTable from "./components/TaskTable";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registry: Record<string, ComponentType<any>> = {
  SprintSummary,
  BurndownChart,
  TaskTable,
};
