/**
 * @file src/app/login/loading.tsx
 * @description Modul fungsionalitas: loading.tsx.
 */

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
    </div>
  )
}
