import { type ReactNode } from "react"
import { Login, Register } from "@/entities/auth/model"
import type { InitialModeType } from "@/entities/auth/model"

export function AuthDashboard(initialMode: InitialModeType): ReactNode {
    return (
        initialMode === "signin" ? (
            <Login />
        ) : <Register />
    )
}