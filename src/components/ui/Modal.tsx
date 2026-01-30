import { JSX, Show, onMount, onCleanup } from "solid-js";
import { Portal, isServer } from "solid-js/web";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
}

export function Modal(props: ModalProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") props.onClose();
  };

  onMount(() => {
    if (!isServer) {
      window.addEventListener("keydown", handleKeyDown);
    }
  });

  onCleanup(() => {
    if (!isServer) {
      window.removeEventListener("keydown", handleKeyDown);
    }
  });

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div 
            class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              {props.title && <h3 class="text-xl font-bold text-brand-secondary">{props.title}</h3>}
              <button 
                onClick={props.onClose}
                class="p-2 hover:bg-brand-secondary/10 rounded-full transition-colors text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div class="p-6">
              {props.children}
            </div>
          </div>
          <div class="absolute inset-0 -z-10" onClick={props.onClose} />
        </div>
      </Portal>
    </Show>
  );
}
