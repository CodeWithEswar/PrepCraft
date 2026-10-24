/** Hugeicons adapters keep the installed shadcn component APIs intact. */
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
export const Loader2Icon = icon('spinner')
export const MinusIcon = icon('minus')
export const MoreHorizontalIcon = icon('more-horizontal')
export const OctagonXIcon = icon('alert-circle')
export const PanelLeftIcon = icon('menu')
export const SearchIcon = icon('search')
export const TriangleAlertIcon = icon('alert')
export const XIcon = icon('close')
