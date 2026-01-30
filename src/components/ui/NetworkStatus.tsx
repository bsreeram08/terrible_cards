import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { isServer } from "solid-js/web";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = createSignal(isServer ? true : navigator.onLine);

  const updateOnlineStatus = () => setIsOnline(navigator.onLine);

  onMount(() => {
    if (isServer) return;
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    
    onCleanup(() => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    });
  });

  return (
    <Show when={!isOnline()}>
      <div class="fixed top-0 left-0 right-0 z-[100] bg-brand-primary text-white p-2 text-center text-xs font-black uppercase tracking-widest animate-in slide-in-from-top duration-300">
        You are offline. Reconnecting...
      </div>
    </Show>
  );
}
