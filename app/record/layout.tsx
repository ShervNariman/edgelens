import type { ReactNode } from "react";

/**
 * Explicit segment layout so the nested /record/* App Router tree is always
 * registered in production manifests (avoids intermittent PageNotFoundError
 * for /record/edgelens during "Collecting page data").
 */
export default function RecordLayout({ children }: { children: ReactNode }) {
  return children;
}
