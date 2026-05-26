import { createFileRoute } from "@tanstack/react-router";
import { FinanceTracker } from "@/components/temp";

export const Route = createFileRoute("/")({
  component: FinanceTracker,
});
