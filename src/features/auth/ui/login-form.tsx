import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
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
import { useI18n } from "@/shared/i18n"

import { login } from "../api/auth"
import { FormError } from "./form-error"

/**
 * Login form — ElevenLabs UI aesthetic (dark surface, tight type, primary CTA).
 * Calls `POST /api/auth/login`; the server sets the session cookie.
 */
export function LoginForm() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(undefined)
    setPending(true)
    try {
      await login({
        email: String(form.get("email")),
        password: String(form.get("password")),
      })
      await navigate({ to: "/chat" })
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.failed"))
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm border-border/60 bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl tracking-tight">{t("login.title")}</CardTitle>
        <CardDescription>
          {t("login.subtitle")}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="login-email">{t("field.email")}</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder={t("field.emailPlaceholder")}
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="login-password">{t("field.password")}</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <FormError message={error} />
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t-0 bg-transparent">
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? t("auth.signingIn") : t("auth.signIn")}
          </Button>
          <p className="pt-1 text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link
              to="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("login.createOne")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
