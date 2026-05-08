import type { ComponentType } from "react";
import SprintHeader from "./components/SprintHeader";
import KpiCards from "./components/KpiCards";
import AssigneeStats from "./components/AssigneeStats";
import BurndownChart from "./components/BurndownChart";
import TaskTable from "./components/TaskTable";
import Markdown from "./components/Markdown";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registry: Record<string, ComponentType<any>> = {
  SprintHeader,
  KpiCards,
  AssigneeStats,
  BurndownChart,
  TaskTable,
  Markdown,
};
