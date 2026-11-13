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
  Spinner,
} from "@/shared/ui"
import { useI18n } from "@/shared/i18n"

import { login } from "../api/auth"
import { FormError } from "./form-error"

/**
 * Login form.
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
    <Card lit className="w-full bg-gray-50/90 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>{t("login.title")}</CardTitle>
        <CardDescription>
          {t("login.subtitle")}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4 pt-2">
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

        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending && <Spinner />}
            {pending ? t("auth.signingIn") : t("auth.signIn")}
          </Button>
          <p className="m-0 text-center text-[13px] text-gray-700">
            {t("login.noAccount")}{" "}
            <Link
              to="/register"
              className="font-medium text-gray-900 underline-offset-4 hover:underline"
            >
              {t("login.createOne")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
