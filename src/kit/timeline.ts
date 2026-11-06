// GSAP helpers for scripted scenes. Return the timeline from build() and the player seeks it.
import { gsap } from 'gsap';
import type { Node } from './draw';

export const timeline = () => gsap.timeline({ paused: true });
export type Timeline = gsap.core.Timeline;

// Hides a node until it's faded in
export const fadeIn = (tl: Timeline, node: Node, at: number, duration = 0.4) => {
    gsap.set(node.el, { opacity: 0 });
    tl.to(node.el, { opacity: 1, duration, ease: 'power1.out' }, at);
};

export const fadeOut = (tl: Timeline, node: Node, at: number, duration = 0.4) => {
    tl.to(node.el, { opacity: 0, duration, ease: 'power1.in' }, at);
};

// Draws a stroked line or path from one end to the other
export const create = (tl: Timeline, node: Node, at: number, duration = 0.8) => {
    node.el.setAttribute('pathLength', '1');
    gsap.set(node.el, { strokeDasharray: 1, strokeDashoffset: 1 });
    tl.to(node.el, { strokeDashoffset: 0, duration, ease: 'power1.inOut' }, at);
};

// Slides a group made with draw.group() from one spot to another
export const slide = (tl: Timeline, node: Node, from: [number, number], to: [number, number], at: number, duration = 0.7) => {
    gsap.set(node.el, { x: from[0], y: from[1] });
    tl.to(node.el, { x: to[0], y: to[1], duration, ease: 'power2.inOut' }, at);
};

// Picks the text for a moment in time. Call it from update(), so scrubbing back just works.
// Example: node.text(textAt(t, [[0, 'first'], [2.5, 'second']]))
export const textAt = (t: number, script: [number, string | number][]) => {
    let current: string | number = '';
    for (const [at, value] of script) {
        if(at <= t + 1e-6) current = value;
    }
    return current;
};

export { gsap };
