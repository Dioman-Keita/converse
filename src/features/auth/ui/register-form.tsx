import { Link } from "@tanstack/react-router"
import type { FormEvent } from "react"

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/shared/ui"

/**
 * Register form — ElevenLabs UI aesthetic, matched to LoginForm.
 * Submit is wired for future Convex Auth registration.
 */
export function RegisterForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Future: Convex Auth / Better Auth sign-up
  }

  return (
    <Card className="w-full max-w-sm border-border/60 bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl tracking-tight">Create your account</CardTitle>
        <CardDescription>
          Start chatting and calling in realtime
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="register-name">Name</Label>
            <Input
              id="register-name"
              name="name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="register-password">Password</Label>
            <Input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="register-confirm-password">Confirm password</Label>
            <Input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t-0 bg-transparent">
          <Button type="submit" className="w-full" size="lg">
            Create account
          </Button>
          <p className="pt-1 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
