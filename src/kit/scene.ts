// Scene definitions. A scene is a pure function of time and parameters: build() draws
// the elements once, and update() places them for any moment. That's what makes
// scrubbing work, and it means a scene must never keep state between frames.
import type { Draw } from './draw';
import type { Palette } from './palette';

export interface Param {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    digits?: number;
    // Hidden params get no slider. Use them with ctx.setParam for dragging.
    hidden?: boolean;
}

export interface Beat {
    at: number;
    text: string;
}

export interface Frame {
    t: number;
    u: number; // t as a fraction of the duration, 0 to 1
    p: Record<string, number>;
}

export interface SceneContext {
    svg: SVGSVGElement;
    draw: Draw;
    color: Palette;
    width: number;
    height: number;
    setParam(key: string, value: number): void;
    // Calls onMove with the pointer's position in scene coordinates while el is dragged
    drag(el: Element, onMove: (x: number, y: number) => void): void;
}

export type Update = (frame: Frame) => void;

export interface Seekable {
    seek(time: number, suppressEvents?: boolean): unknown;
    duration(): number;
}

export type BuildResult = Update | { update?: Update; timeline?: Seekable };

export interface SceneDef {
    label: string; // Describes the scene for screen readers
    width?: number;
    height?: number;
    // Seconds. Leave out to use the timeline's length. 0 means no timeline, just sliders.
    duration?: number;
    params?: Param[];
    beats?: Beat[];
    autoplay?: boolean;
    build(ctx: SceneContext): BuildResult;
}

export const defineScene = (def: SceneDef): SceneDef => def;
