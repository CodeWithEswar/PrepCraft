// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import Link from "next/link"
import { AuthHeader } from "@/features/auth/components/auth-header"
import { Button } from "@/components/ui/button"

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}))

describe("AuthHeader & Button render semantics", () => {
  it("renders AuthHeader without logging Base UI nativeButton console errors", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(<AuthHeader />)

    const homeButton = screen.getByRole("button", { name: /back to home/i })
    expect(homeButton).toBeInTheDocument()
    expect(homeButton).toHaveAttribute("href", "/")

    // Verify no Base UI button error was printed
    const baseUiError = consoleErrorSpy.mock.calls.find((call) =>
      call.some((arg) => typeof arg === "string" && arg.includes("Base UI: A component that acts as a button expected a native <button>"))
    )
    expect(baseUiError).toBeUndefined()

    consoleErrorSpy.mockRestore()
  })

  it("automatically resolves nativeButton={false} when Button renders a non-button component", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <Button render={<Link href="/test" />}>
        Test Link
      </Button>
    )

    const linkAsButton = screen.getByRole("button", { name: "Test Link" })
    expect(linkAsButton).toBeInTheDocument()
    expect(linkAsButton).toHaveAttribute("href", "/test")

    const baseUiError = consoleErrorSpy.mock.calls.find((call) =>
      call.some((arg) => typeof arg === "string" && arg.includes("Base UI: A component that acts as a button expected a native <button>"))
    )
    expect(baseUiError).toBeUndefined()

    consoleErrorSpy.mockRestore()
  })

  it("renders circular spinner instead of logo animation when button is loading", () => {
    const { container } = render(<Button loading>Submit</Button>)
    const spinner = container.querySelector('[data-slot="spinner"]')
    expect(spinner).toBeInTheDocument()
    expect(spinner?.classList.contains("animate-spin")).toBe(true)
    // Brand logo loader (.pc-loader) should not be rendered
    expect(container.querySelector(".pc-loader")).toBeNull()
  })
})
