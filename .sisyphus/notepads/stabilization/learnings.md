## SolidJS + GSAP Integration
- **Client-Only Imports**: GSAP and other browser-only libraries must be imported dynamically inside `onMount` or `createEffect` to avoid SSR issues.
- **Ref Handling**: For conditionally rendered elements (e.g., inside `<Show>`), use a signal-based ref (`ref={setRefSignal}`) instead of a variable (`ref={refVar}`). This ensures effects dependent on the ref are re-triggered when the element mounts.
- **Style Conflicts**: If SolidJS manages `style={{ transform: ... }}` and GSAP animates the same properties, avoid `clearProps: "all"` in GSAP. This prevents GSAP from stripping the reactive styles at the end of the animation.

## Staggered Deal Animation Fix
- **Issue**: Deal animation wasn't triggering because `handContainerRef` was undefined or stale when the effect ran, and `gsap.from` with `clearProps: "all"` was removing SolidJS-managed inline styles (fan layout) after animation.
- **Fix**:
  - Converted `handContainerRef` to a signal (`[handContainer, setHandContainer]`) to make the ref reactive.
  - Updated `createEffect` to depend on `handContainer()`, ensuring it runs only when the container is mounted.
  - Removed `clearProps: "all"` from `dealCards` GSAP animation to preserve the fan layout `transform` applied by SolidJS.
- **Learning**: When mixing GSAP `from` animations with SolidJS reactive styles, avoid `clearProps: "all"` if the element relies on inline styles for its final state. Also, use signal refs for conditionally rendered elements to ensure effects have access to the DOM node.
