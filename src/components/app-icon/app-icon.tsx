import { HugeiconsIcon } from "@hugeicons/react"
import { APP_ICON_MAP, ICON_SIZE_MAP } from "./icon-map"
import type { AppIconName, AppIconProps, HugeiconData } from "./icon.types"

export function AppIcon({
  icon,
  size = "md",
  strokeWidth = 1.5,
  color = "currentColor",
  className,
  label,
  "aria-hidden": ariaHiddenProp,
  ...props
}: AppIconProps) {
  const resolvedSize = typeof size === "number" ? size : ICON_SIZE_MAP[size] ?? 20

  const resolvedIcon: HugeiconData =
    typeof icon === "string" ? APP_ICON_MAP[icon as AppIconName] : icon

  if (!resolvedIcon) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[AppIcon] Unknown icon: "${String(icon)}"`)
    }
    return null
  }

  const isAccessible = Boolean(label)
  const ariaHidden = ariaHiddenProp ?? !isAccessible

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      role={isAccessible ? "img" : undefined}
      aria-label={label}
      aria-hidden={ariaHidden ? "true" : undefined}
    >
      <HugeiconsIcon
        icon={resolvedIcon}
        size={resolvedSize}
        strokeWidth={strokeWidth}
        color={color}
        className={className}
        {...props}
      />
    </span>
  )
}
