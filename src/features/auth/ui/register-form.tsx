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

import { register } from "../api/auth"
import { FormError } from "./form-error"

/**
 * Register form — same taped scrap as LoginForm.
 * Calls `POST /api/auth/register`; the server signs the new user in.
 */
export function RegisterForm() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const credentials = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      confirmPassword: String(form.get("confirmPassword")),
    }
    if (credentials.password !== credentials.confirmPassword) {
      setError(t("register.passwordMismatch"))
      return
    }

    setError(undefined)
    setPending(true)
    try {
      await register(credentials)
      await navigate({ to: "/chat" })
    } catch (err) {
      setError(err instanceof Error ? err.message : t("register.failed"))
      setPending(false)
    }
  }

  return (
    <Card tilt={1.2} className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle>{t("register.title")}</CardTitle>
        <CardDescription>
          {t("register.subtitle")}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="register-name">{t("field.name")}</Label>
            <Input
              id="register-name"
              name="name"
              type="text"
              placeholder={t("register.namePlaceholder")}
              autoComplete="name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="register-email">{t("field.email")}</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder={t("field.emailPlaceholder")}
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="register-password">{t("field.password")}</Label>
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
            <Label htmlFor="register-confirm-password">{t("register.confirmPassword")}</Label>
            <Input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <FormError message={error} />
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? t("auth.creatingAccount") : t("auth.createAccount")}
          </Button>
          <p className="m-0 text-center text-base text-ink-soft">
            {t("register.haveAccount")}{" "}
            <Link
              to="/login"
              className="text-ink underline decoration-2 underline-offset-4 hover:decoration-pink"
            >
              {t("auth.signIn")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
