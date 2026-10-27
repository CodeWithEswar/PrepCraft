import Link from "next/link"

interface MockPageProps {
  params: Promise<{
    workspaceSlug: string
  }>
}

export default async function MockPage({ params }: MockPageProps) {
  const { workspaceSlug } = await params
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-6 sm:p-10">
      <p className="text-xs uppercase tracking-widest text-primary">INTERVIEW PREPARATION</p>
      <h1 className="text-3xl font-semibold tracking-tight">Mock interviews</h1>
      <section className="space-y-4 rounded-2xl border bg-card/95 p-6">
        <h2 className="text-lg font-medium">Live recording is being connected.</h2>
        <p className="text-sm leading-6 text-muted-foreground">Your workspace does not yet support saved mock simulations. Use Practice to record sessions, timing and reflections, or explore the mock interface with isolated sample data.</p>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground" href={`/w/${workspaceSlug}/practice`}>Open Practice</Link>
          <Link className="rounded-xl border px-4 py-2 text-sm" href="/preview/interview/mocks">Explore mock preview</Link>
        </div>
      </section>
    </main>
  )
}
