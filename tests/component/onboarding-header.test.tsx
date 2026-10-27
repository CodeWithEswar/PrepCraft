// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { OnboardingHeader } from "@/features/onboarding/components/onboarding-header"

const pushMock = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

describe("OnboardingHeader component", () => {
  it("renders PrepCraft logo, Save action with icon, and Exit action with icon", () => {
    render(<OnboardingHeader />)

    // Brand link
    const brandLink = screen.getByRole("link", { name: /prepcraft home/i })
    expect(brandLink).toBeInTheDocument()
    expect(brandLink).toHaveAttribute("href", "/")

    // Save button with icon
    const saveButton = screen.getByRole("button", { name: /save progress/i })
    expect(saveButton).toBeInTheDocument()

    // Exit button with icon
    const exitButton = screen.getByRole("button", { name: /exit onboarding/i })
    expect(exitButton).toBeInTheDocument()
  })

  it("handles Save action with feedback and calls onSave callback", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<OnboardingHeader onSave={onSave} />)

    const saveButton = screen.getByRole("button", { name: /save progress/i })

    await act(async () => {
      fireEvent.click(saveButton)
    })

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Saved")).toBeInTheDocument()
  })

  it("calls onSaveAndExit when Exit button is clicked", () => {
    const onSaveAndExit = vi.fn()
    render(<OnboardingHeader onSaveAndExit={onSaveAndExit} />)

    const exitButton = screen.getByRole("button", { name: /exit onboarding/i })
    fireEvent.click(exitButton)

    expect(onSaveAndExit).toHaveBeenCalledTimes(1)
  })

  it("navigates to '/' when Exit is clicked without custom onSaveAndExit", () => {
    pushMock.mockClear()
    render(<OnboardingHeader />)

    const exitButton = screen.getByRole("button", { name: /exit onboarding/i })
    fireEvent.click(exitButton)

    expect(pushMock).toHaveBeenCalledWith("/")
  })
})
