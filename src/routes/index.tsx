import { createFileRoute } from "@tanstack/react-router";
import { FinanceTracker } from "@/components/Financetracker";

export const Route = createFileRoute("/")({
  component: FinanceTracker,
});
