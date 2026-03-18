export default function BriefLoading() {
  return (
    <div className="min-h-screen bg-base">
      <header className="sticky top-0 z-10 bg-base/95 backdrop-blur-sm border-b border-edge px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between py-4">
          <div className="h-5 w-40 bg-edge/60 rounded animate-pulse" />
          <div className="h-4 w-24 bg-edge/60 rounded animate-pulse" />
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-14">
          {/* Header skeleton */}
          <div className="space-y-4">
            <div className="h-3 w-12 bg-edge/60 rounded animate-pulse" />
            <div className="h-14 w-3/4 bg-edge/60 rounded animate-pulse" />
            <div className="h-3 w-full bg-edge/40 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-edge/40 rounded animate-pulse" />
          </div>

          {/* Section skeletons */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-3 w-36 bg-edge/60 rounded animate-pulse" />
                <div className="flex-1 h-px bg-edge/40" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-edge/40 rounded animate-pulse" />
                <div className="h-3 w-11/12 bg-edge/40 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-edge/40 rounded animate-pulse" />
                <div className="h-3 w-full bg-edge/40 rounded animate-pulse" />
                <div className="h-3 w-9/12 bg-edge/40 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
