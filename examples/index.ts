export interface CodeExample {
  id: string;
  /** Short chip title, e.g. "Icon button · a11y" */
  label: string;
  /** One-line description for tooltips / helper */
  description: string;
  /** Compact “This example should reveal…” copy */
  reveals: string;
  code: string;
}

/**
 * Intentionally imperfect Cursor/shadcn-style outputs for the launch demo.
 * Each example is designed to surface clear Overview / States / A11y / Fixes findings.
 */
export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: "icon-button",
    label: "Icon button · a11y",
    description: "Looks fine visually — missing name, focus, loading, disabled",
    reveals:
      "Icon button without aria-label, plus missing focus / loading / disabled handling.",
    code: `import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

export function SaveButton({ onSave }: { onSave: () => void }) {
  return (
    <Button size="icon" onClick={onSave}>
      <Save className="h-4 w-4" />
    </Button>
  )
}`,
  },
  {
    id: "login-form",
    label: "Login form · states",
    description: "Card form with unlabeled inputs and no async/error UI",
    reveals:
      "Unlabeled inputs, no loading/disabled/error states, and hard-coded button colors.",
    code: `import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function LoginForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
          <Button className="w-full bg-blue-600 text-white">
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}`,
  },
  {
    id: "project-list",
    label: "Project list · empty/loading",
    description: "Card list that always maps — no loading, empty, or error UI",
    reveals:
      "Missing loading / empty / error branches, list keys, and hover affordance on rows.",
    code: `import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ProjectsCard({
  projects,
}: {
  projects: { id: string; name: string }[]
}) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.map((project) => (
          <div className="flex items-center justify-between">
            <span>{project.name}</span>
            <Button size="sm">Open</Button>
          </div>
        ))}
        <Button className="w-full bg-blue-600 text-white">
          Refresh
        </Button>
      </CardContent>
    </Card>
  )
}`,
  },
  {
    id: "settings-dialog",
    label: "Dialog · Radix a11y",
    description: "Dialog missing title/description; clickable div in footer",
    reveals:
      "Dialog without DialogTitle/Description, plus a non-keyboard Save control.",
    code: `import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

export function SettingsDialog({ themes }: { themes: string[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Settings</Button>
      </DialogTrigger>
      <DialogContent>
        <Select>
          <SelectTrigger>
            {/* missing SelectValue */}
          </SelectTrigger>
          <SelectContent>
            {themes.map((theme) => (
              <SelectItem value={theme}>{theme}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <div onClick={() => console.log("saved")}>Save</div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`,
  },
  {
    id: "theme-select",
    label: "Select · focus/empty",
    description: "Select without value label, empty guard, or disabled handling",
    reveals:
      "Select missing SelectValue/label, empty-state guard, and disabled/focus cues.",
    code: `import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

export function ThemeSelect({ themes }: { themes: string[] }) {
  return (
    <div className="flex items-end gap-2">
      <Select>
        <SelectTrigger className="w-[200px]">
          {/* missing SelectValue + Label */}
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem value={theme}>{theme}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline">Apply</Button>
    </div>
  )
}`,
  },
];

export function findExampleByCode(code: string): CodeExample | undefined {
  const trimmed = code.trim();
  return CODE_EXAMPLES.find((ex) => ex.code.trim() === trimmed);
}
