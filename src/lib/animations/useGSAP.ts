import { onCleanup } from "solid-js";
import { isServer } from "solid-js/web";

/**
 * SolidJS hook for safe GSAP usage with automatic cleanup.
 * @returns An object with a register function to track animations for cleanup.
 */
export function useGSAP() {
  const animations: any[] = [];

  const register = (anim: any) => {
    if (!isServer) {
      animations.push(anim);
    }
    return anim;
  };

  onCleanup(() => {
    animations.forEach(anim => {
      if (anim && typeof anim.kill === "function") {
        anim.kill();
      }
    });
  });

  return { register };
}

/**
 * Utility to dynamically import GSAP animations in onMount
 */
export async function loadCardAnimations() {
  if (isServer) return null;
  return import("./cardAnimations");
}
