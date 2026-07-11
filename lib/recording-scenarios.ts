/**
 * Deterministic seeded scenarios for marketing capture (/record/*).
 *
 * EdgeLens adapts the go/no-go metaphor to component pre-flight:
 * - BLOCKED — high-finding fixture; do not ship without fixes
 * - READY — complete states + a11y basics; pre-flight clear
 *
 * Fixtures are local source only — never secrets or customer data.
 */

import { CODE_EXAMPLES, type CodeExample } from "@/examples";

export type RecordingScenarioId = "blocked" | "ready" | "demo";

export type RecordingDecision = "BLOCKED" | "READY";

export interface RecordingScenario {
  id: RecordingScenarioId;
  /** Go/no-go style decision for capture frames */
  decision: RecordingDecision;
  title: string;
  subtitle: string;
  /** Built-in example id, or recording-only fixture id */
  exampleId: string;
  example: CodeExample;
  /** Optional forced preview state after analyze (for stills) */
  forcedState?: "default" | "loading" | "error" | "empty" | "disabled" | "focus";
}

/** Clean login form — labels, loading/disabled/error paths, focus-visible. */
export const READY_LOGIN_FORM_CODE = `import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function LoginForm({
  isLoading = false,
  error = null,
  isEmpty = false,
}: {
  isLoading?: boolean
  error?: string | null
  isEmpty?: boolean
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const disabled = isLoading || isEmpty

  if (isEmpty) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>No credentials configured.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add an account to continue.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              className="focus-visible:ring-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={disabled}
              className="focus-visible:ring-2"
            />
          </div>
          <Button
            type="submit"
            className="w-full focus-visible:ring-2"
            disabled={disabled}
            aria-busy={isLoading}
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}`;

const READY_EXAMPLE: CodeExample = {
  id: "login-form-ready",
  label: "Login form · ready",
  description: "Labeled inputs with loading, empty, error, and disabled paths",
  reveals: "Pre-flight clear: states and labels present for a READY capture.",
  code: READY_LOGIN_FORM_CODE,
};

function exampleById(id: string): CodeExample {
  const found = CODE_EXAMPLES.find((ex) => ex.id === id);
  if (!found) {
    throw new Error(`Recording scenario missing example: ${id}`);
  }
  return found;
}

export const RECORDING_SCENARIOS: Record<RecordingScenarioId, RecordingScenario> =
  {
    demo: {
      id: "demo",
      decision: "BLOCKED",
      title: "Launch demo",
      subtitle:
        "Happy path looked done until EdgeLens forced the states AI forgot.",
      exampleId: "login-form",
      example: exampleById("login-form"),
      forcedState: "default",
    },
    blocked: {
      id: "blocked",
      decision: "BLOCKED",
      title: "BLOCKED release candidate",
      subtitle:
        "Seeded high-finding login form — missing loading, error, disabled, and labels.",
      exampleId: "login-form",
      example: exampleById("login-form"),
      forcedState: "error",
    },
    ready: {
      id: "ready",
      decision: "READY",
      title: "READY release candidate",
      subtitle:
        "Seeded complete login form — states and accessible labels present.",
      exampleId: "login-form-ready",
      example: READY_EXAMPLE,
      forcedState: "default",
    },
  };

export const DEFAULT_RECORDING_SCENARIO: RecordingScenarioId = "demo";

export function parseRecordingScenario(
  value: string | null | undefined
): RecordingScenarioId {
  if (value === "blocked" || value === "ready" || value === "demo") {
    return value;
  }
  return DEFAULT_RECORDING_SCENARIO;
}

export function getRecordingScenario(
  id: RecordingScenarioId | string | null | undefined
): RecordingScenario {
  const parsed = parseRecordingScenario(
    typeof id === "string" ? id : id ?? null
  );
  return RECORDING_SCENARIOS[parsed];
}

/** All fixtures used by capture scripts (no secrets / customer data). */
export function listRecordingFixtures(): CodeExample[] {
  return [exampleById("login-form"), READY_EXAMPLE, ...CODE_EXAMPLES];
}
