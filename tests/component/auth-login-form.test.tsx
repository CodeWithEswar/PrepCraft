// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { LoginForm } from "@/features/auth/components/login-form"

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  }),
}))

describe("LoginForm Component", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("renders default welcome title and Google sign-in button for first-time visitor", () => {
    render(<LoginForm />)

    expect(screen.getByRole("heading", { name: "Welcome to PrepCraft" })).toBeInTheDocument()
    expect(screen.getByText("Continue where your preparation left off.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByText(/Your preparation data stays private/i)).toBeInTheDocument()
  })

  it("displays session expired alert when reason query param is session_expired", () => {
    render(<LoginForm reason="session_expired" />)

    expect(screen.getByText("Session expired")).toBeInTheDocument()
    expect(screen.getByText(/Your secure session has timed out/i)).toBeInTheDocument()
  })

  it("displays access revoked alert when reason query param is access_revoked", () => {
    render(<LoginForm reason="access_revoked" workspaceSlug="amazon-sde" />)

    expect(screen.getByText("Workspace access changed")).toBeInTheDocument()
    expect(screen.getByText(/membership in "amazon-sde" is no longer active/i)).toBeInTheDocument()
  })

  it("renders 'Welcome back' and displays masked email when remembered hint exists in localStorage", () => {
    window.localStorage.setItem(
      "prepcraft_last_account",
      JSON.stringify({
        email: "alex@example.com",
        maskedEmail: "al••••@example.com",
        displayName: "Alex Dev",
        lastUsedAt: new Date().toISOString(),
      })
    )

    render(<LoginForm />)

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument()
    expect(screen.getByText("Last used on this device")).toBeInTheDocument()
    expect(screen.getByText("Alex Dev")).toBeInTheDocument()
    expect(screen.getByText("al••••@example.com")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /not you\?/i })).toBeInTheDocument()
  })

  it("allows switching accounts with 'Not you?' without destroying account privacy", () => {
    window.localStorage.setItem(
      "prepcraft_last_account",
      JSON.stringify({
        email: "alex@example.com",
        maskedEmail: "al••••@example.com",
        displayName: "Alex Dev",
        lastUsedAt: new Date().toISOString(),
      })
    )

    render(<LoginForm />)

    const notYouBtn = screen.getByRole("button", { name: /not you\?/i })
    fireEvent.click(notYouBtn)

    // Should indicate selecting another account
    expect(screen.getByText("Selecting a different Google account")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /use saved hint/i })).toBeInTheDocument()
  })
})
