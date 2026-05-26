import { createFileRoute } from "@tanstack/react-router";
import { FinanceTracker } from "@/components/FinanceTracker";

export const Route = createFileRoute("/")({
  component: FinanceTracker,
});
