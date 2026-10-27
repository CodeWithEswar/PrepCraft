import { cn } from "cn"
import { AppIcon } from './app-icon'
import type { AppIconName, AppIconProps } from './icon.types'
type Props = Omit<AppIconProps, 'icon' | 'size' | 'strokeWidth'> & { size?: number | string; strokeWidth?: number | string }
function icon(name: AppIconName) {
  return function UIIcon({ size = 16, strokeWidth = 1.5, ...props }: Props) {
    return <AppIcon icon={name} size={typeof size === 'number' ? size : Number.parseFloat(size) || 16} strokeWidth={Number(strokeWidth)} {...props} />
  }
}
export const ArrowDownIcon = icon('arrow-down')
export const CheckIcon = icon('check')
export const ChevronDownIcon = icon('chevron-down')
export const ChevronLeftIcon = icon('chevron-left')
export const ChevronRightIcon = icon('chevron-right')
export const ChevronUpIcon = icon('chevron-up')
export const CircleCheckIcon = icon('check-circle')
export const CopyIcon = icon('copy')
export const InfoIcon = icon('info')

export function Loader2Icon({ size = 16, className, ...props }: Props & React.ComponentProps<"svg">) {
  const pixelSize = typeof size === "number" ? size : Number.parseFloat(size) || 16
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={pixelSize}
      height={pixelSize}
      className={cn("animate-spin shrink-0 text-current", className)}
      aria-hidden="true"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
export const MinusIcon = icon('minus')
export const MoreHorizontalIcon = icon('more-horizontal')
export const OctagonXIcon = icon('alert-circle')
export const PanelLeftIcon = icon('menu')
export const SearchIcon = icon('search')
export const TriangleAlertIcon = icon('alert')
export const XIcon = icon('close')
