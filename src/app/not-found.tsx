import Link from "next/link"
import { PrepCraftLogo } from "@/components/brand"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <PrepCraftLogo size={48} decorative />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-brand font-semibold">404 — Not Found</p>
          <h1 className="text-2xl font-semibold tracking-tight">Looking for a session that doesn’t exist?</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you requested could not be located. Check the URL or return to the preparation workspace.
          </p>
        </div>
        <div className="pt-2">
          <Button render={<Link href="/" />}>
            Return to PrepCraft
          </Button>
        </div>
      </div>
    </div>
  )
}
