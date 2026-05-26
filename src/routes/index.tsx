import { createFileRoute } from "@tanstack/react-router";
import { FinanceTracker } from "@/components/xyz";

export const Route = createFileRoute("/")({
  component: FinanceTracker,
});
