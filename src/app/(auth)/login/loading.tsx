import { AuthResolving } from "@/features/auth"

export default function LoginLoading() {
  return (
    <div className="w-full max-w-[420px] mx-auto rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-2xl shadow-xl p-8">
      <AuthResolving heading="Loading sign in" subheading="Preparing secure authentication surface…" />
    </div>
  )
}
