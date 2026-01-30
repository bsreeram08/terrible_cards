import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, ErrorBoundary } from "solid-js";
import { MetaProvider } from "@solidjs/meta";
import { Button } from "~/components/ui/Button";
import { NetworkStatus } from "~/components/ui/NetworkStatus";
import "./app.css";

export default function App() {
  return (
    <MetaProvider>
      <Router
        root={(props) => (
          <ErrorBoundary fallback={(err) => (
            <div class="p-8 text-center space-y-4 bg-white min-h-screen flex flex-col items-center justify-center">
              <h1 class="text-2xl font-black uppercase text-brand-primary">Something went wrong</h1>
              <div class="bg-red-50 p-4 rounded text-left overflow-auto max-w-xl w-full">
                <p class="text-red-700 font-mono text-xs">{err.toString()}</p>
                {err.stack && <pre class="text-[10px] text-red-500 mt-2">{err.stack}</pre>}
              </div>
              <Button onClick={() => window.location.reload()}>Reload Page</Button>
            </div>
          )}>
            <NetworkStatus />
            <Suspense fallback={<div class="p-20 text-center font-black uppercase animate-pulse">Loading...</div>}>
              {props.children}
            </Suspense>
          </ErrorBoundary>
        )}
      >
        <FileRoutes />
      </Router>
    </MetaProvider>
  );
}
