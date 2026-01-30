import { ErrorBoundary as SolidErrorBoundary, ParentProps } from "solid-js";
import { Button } from "./Button";

export function ErrorBoundary(props: ParentProps) {
  return (
    <SolidErrorBoundary
      fallback={(err, reset) => (
        <div class="flex flex-col items-center justify-center min-h-[50vh] w-full p-8 text-center gap-6">
          <div class="flex flex-col items-center gap-2 max-w-md">
            <h2 class="text-4xl font-black uppercase italic text-brand-primary tracking-tight">
              System Error
            </h2>
            <p class="text-brand-secondary font-bold text-lg uppercase tracking-wide opacity-80">
              The game encountered a problem
            </p>
          </div>

          <div class="w-full max-w-md p-6 bg-white rounded-xl border-2 border-brand-secondary/10 shadow-lg backdrop-blur-sm">
            <pre class="font-mono text-xs text-left text-brand-secondary/70 whitespace-pre-wrap break-words overflow-auto max-h-40">
              {err instanceof Error ? err.message : String(err)}
            </pre>
          </div>

          <Button 
            variant="primary" 
            size="lg"
            onClick={() => window.location.reload()}
            class="transition-opacity hover:opacity-90"
          >
            TRY AGAIN
          </Button>
        </div>
      )}
    >
      {props.children}
    </SolidErrorBoundary>
  );
}
