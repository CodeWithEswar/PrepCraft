import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { AppIcon } from "./app-icon"

describe("AppIcon Component", () => {
  it("renders a semantic icon with default aria-hidden", () => {
    const { container } = render(<AppIcon icon="search" />)
    const iconWrapper = container.querySelector("span")
    expect(iconWrapper).toBeInTheDocument()
    expect(iconWrapper).toHaveAttribute("aria-hidden", "true")
  })

  it("renders with accessible label when label is provided", () => {
    render(<AppIcon icon="search" label="Search workspace" />)
    const accessibleElement = screen.getByRole("img", { name: "Search workspace" })
    expect(accessibleElement).toBeInTheDocument()
    expect(accessibleElement).not.toHaveAttribute("aria-hidden")
  })

  it("handles normalized semantic sizes properly", () => {
    const { container } = render(<AppIcon icon="code" size="sm" />)
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute("width", "16")
    expect(svg).toHaveAttribute("height", "16")
  })

  it("renders sidebar-close and sidebar-open icons cleanly", () => {
    const { container: closeContainer } = render(<AppIcon icon="sidebar-close" />)
    expect(closeContainer.querySelector("svg")).toBeInTheDocument()

    const { container: openContainer } = render(<AppIcon icon="sidebar-open" />)
    expect(openContainer.querySelector("svg")).toBeInTheDocument()
  })
})
