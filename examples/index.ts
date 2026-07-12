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
 * Story: the happy path looked done until EdgeLens forced the states AI forgot.
 * Each example surfaces State completeness / Static / Preview / Fixes findings.
 */
export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: "icon-button",
    label: "Icon button · states + name",
    description: "Looks fine visually — missing name, focus, loading, disabled",
    reveals:
      "Missing focus / loading / disabled states, plus icon button without accessible name.",
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
    label: "Login form · force states",
    description: "Happy-path card form — no loading, disabled, or error UI",
    reveals:
      "Happy path looks done until you force loading / disabled / error; unlabeled inputs too.",
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
      "Missing loading / empty / error branches — the list looked done on the happy path.",
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
    label: "Dialog · shadcn composition",
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
      "Missing empty-state guard and disabled/focus cues, plus SelectValue/label gaps.",
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
  {
    id: "team-invite",
    label: "Team invite · founder demo",
    description:
      "Production-looking invite card — missing async/error/empty states + Sheet title gap",
    reveals:
      "Happy-path invite UI hides loading/disabled/error/empty gaps; Sheet missing SheetTitle; duplicate-submit risk.",
    code: `import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

const ROLES = ["Admin", "Member", "Billing"]

/**
 * Looks launch-ready on the happy path: branded card, role select, primary CTA.
 * EdgeLens should surface missing invite states + SheetTitle composition gap.
 */
export function TeamInviteCard({
  members,
  onInvite,
}: {
  members: { id: string; email: string; role: string }[]
  onInvite: (email: string, role: string) => Promise<void>
}) {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Invite your team</CardTitle>
        <CardDescription>
          Add teammates so they can review launches with you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input type="email" placeholder="alex@startup.com" />
          <Select>
            <SelectTrigger className="w-[140px]">
              {/* missing SelectValue */}
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="bg-blue-600 text-white"
            onClick={() => onInvite("alex@startup.com", "Member")}
          >
            Send invite
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Pending members</p>
          {members.map((member) => (
            <div className="flex items-center justify-between text-sm">
              <span>{member.email}</span>
              <span className="text-muted-foreground">{member.role}</span>
            </div>
          ))}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              Manage seats
            </Button>
          </SheetTrigger>
          <SheetContent>
            {/* missing SheetTitle / SheetDescription */}
            <p className="text-sm text-muted-foreground">
              Seat management will appear here.
            </p>
            <Button variant="destructive" className="mt-4">
              Remove member
            </Button>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  )
}`,
  },
];

export function findExampleByCode(code: string): CodeExample | undefined {
  const trimmed = code.trim();
  return CODE_EXAMPLES.find((ex) => ex.code.trim() === trimmed);
}
