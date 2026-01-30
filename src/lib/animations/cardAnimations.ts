import { gsap } from "./gsap";

export function flipCard(element: HTMLElement, isFlipped: boolean) {
  gsap.to(element, {
    rotateY: isFlipped ? 180 : 0,
    duration: 0.6,
    ease: "expo.out",
    overwrite: "auto"
  });
}

export function shakeCard(element: HTMLElement) {
  const tl = gsap.timeline();
  tl.to(element, { rotateZ: 2, duration: 0.05 })
    .to(element, { rotateZ: -2, duration: 0.05 })
    .to(element, { rotateZ: 1.5, duration: 0.05 })
    .to(element, { rotateZ: -1.5, duration: 0.05 })
    .to(element, { rotateZ: 0, duration: 0.05 });
}

export function dealCards(elements: HTMLElement[], stagger = 0.1) {
  gsap.from(elements, {
    y: -500,
    x: 200,
    rotation: 45,
    opacity: 0,
    scale: 0.5,
    duration: 0.8,
    stagger: stagger,
    ease: "back.out(1.2)"
  });
}

export function hoverTilt(element: HTMLElement, enter: boolean) {
  gsap.to(element, {
    rotateY: enter ? 15 : 0,
    rotateX: enter ? 10 : 0,
    scale: enter ? 1.05 : 1,
    duration: 0.4,
    ease: "power2.out",
    overwrite: "auto"
  });
}
