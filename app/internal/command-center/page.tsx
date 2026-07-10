import type { Metadata } from "next";
import { CommandCenterDashboard } from "@/components/command-center-dashboard";

export const metadata: Metadata = {
  title: "EdgeLens — Command Center",
  description:
    "Internal project ops dashboard for EdgeLens sprint progress, launch readiness, blockers, and agent workload.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CommandCenterPage() {
  return <CommandCenterDashboard />;
}
