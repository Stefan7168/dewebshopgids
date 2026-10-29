// Fallback while a page's data streams in. It reserves a full screen of height, so the
// footer starts below the fold and does not jump down when the content arrives (layout shift).
export function PageLoading() {
  return (
    <p role="status" className="min-h-screen text-muted-foreground">
      Laden...
    </p>
  );
}
