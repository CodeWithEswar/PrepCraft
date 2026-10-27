// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

describe("DropdownMenuItem render semantics", () => {
  it("renders a native <button> via render prop without logging Base UI nativeButton console errors", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <DropdownMenu open>
        <DropdownMenuTrigger render={<button type="button">Trigger</button>} />
        <DropdownMenuContent>
          <DropdownMenuItem render={<button type="submit" />}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    const signOutBtn = screen.getByRole("menuitem", { name: /sign out/i })
    expect(signOutBtn).toBeInTheDocument()
    expect(signOutBtn.tagName.toLowerCase()).toBe("button")
    expect(signOutBtn).toHaveAttribute("type", "submit")

    const baseUiError = consoleErrorSpy.mock.calls.find((call) =>
      call.some((arg) =>
        typeof arg === "string" &&
        arg.includes("Base UI: A component that acts as a button expected a non-<button>")
      )
    )
    expect(baseUiError).toBeUndefined()

    consoleErrorSpy.mockRestore()
  })

  it("accepts explicit nativeButton prop without error", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <DropdownMenu open>
        <DropdownMenuTrigger render={<button type="button">Trigger</button>} />
        <DropdownMenuContent>
          <DropdownMenuItem nativeButton render={<button type="submit" />}>
            Sign out explicit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    const signOutBtn = screen.getByRole("menuitem", { name: /sign out explicit/i })
    expect(signOutBtn).toBeInTheDocument()

    const baseUiError = consoleErrorSpy.mock.calls.find((call) =>
      call.some((arg) =>
        typeof arg === "string" &&
        arg.includes("Base UI: A component that acts as a button expected a non-<button>")
      )
    )
    expect(baseUiError).toBeUndefined()

    consoleErrorSpy.mockRestore()
  })
})
