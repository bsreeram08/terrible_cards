import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { isServer } from "solid-js/web";

if (!isServer) {
  gsap.registerPlugin(Draggable);
}

export { gsap, Draggable };
