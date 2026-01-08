export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-4xl p-8">
        <h1 className="text-4xl font-bold mb-4">Model Brief</h1>
        <p className="text-lg text-muted-foreground">
          Developer-first AI news briefing - Coming soon
        </p>
        <div className="mt-8 p-4 bg-card rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            Phase 0: Project setup complete ✓
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Next: Implement data pipeline with GitHub, HN, Reddit, and arXiv integration
          </p>
        </div>
      </main>
    </div>
  );
}
