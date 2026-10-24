import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PrepCraftLogo } from "@/components/brand"

describe("PrepCraftLogo Component", () => {
  it("renders with default accessibility title and role", () => {
    render(<PrepCraftLogo />)
    const logoImg = screen.getByRole("img", { name: "PrepCraft" })
    expect(logoImg).toBeInTheDocument()
  })

  it("renders with custom pixel size", () => {
    render(<PrepCraftLogo size={48} />)
    const logoImg = screen.getByRole("img", { name: "PrepCraft" })
    expect(logoImg).toBeInTheDocument()
    expect(logoImg).toHaveStyle({ "--pc-logo-size": "48px" })
  })

  it("renders as decorative when specified", () => {
    const { container } = render(<PrepCraftLogo decorative />)
    const span = container.querySelector(".pc-logo")
    expect(span).not.toHaveAttribute("role", "img")
    expect(span).toHaveAttribute("aria-hidden", "true")
  })
})
