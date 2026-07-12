import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Intentionally incomplete happy-path login form for Milestone 2A
 * local-file import demos. Missing loading / error / disabled UI.
 */
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
}
