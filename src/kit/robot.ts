// A top-down robot, and a VEX field to put it on
import type { Draw, Node } from './draw';
import { color } from './palette';

export interface RobotOptions {
    size?: number;
    color?: string;
    parent?: SVGElement;
}

// Faces right at 0 degrees. Rotation follows the screen, so positive turns clockwise.
export const robot = (draw: Draw, o: RobotOptions = {}): Node<SVGGElement> => {
    const s = o.size ?? 38;
    const c = o.color ?? color.value;
    const g = draw.group(o.parent) as Node<SVGGElement>;
    const parent = g.el;
    const w = s * 0.78;
    draw.rect(-s / 2, -w / 2, s, w, { color: c, width: 2, fill: color.bg, parent });
    for (const side of [-1, 1]) {
        draw.line(-s * 0.32, side * (w / 2 + 3), s * 0.32, side * (w / 2 + 3), { color: c, width: 4, parent });
    }
    draw.path(`M${s * 0.2} ${-s * 0.17} L${s * 0.42} 0 L${s * 0.2} ${s * 0.17}`, { color: c, width: 2, parent });
    return g;
};

// A 12 ft square field in inches. Scene coordinates follow the usual math axes, y up.
export class Field {
    scale: number;

    constructor(draw: Draw, public x: number, public y: number, public size: number, parent?: SVGElement) {
        this.scale = size / 144;
        const faint = { color: color.rule, width: 1, parent };
        for (let i = 1; i < 6; i++) {
            const offset = (i * size) / 6;
            draw.line(x + offset, y, x + offset, y + size, faint);
            draw.line(x, y + offset, x + size, y + offset, faint);
        }
        draw.rect(x, y, size, size, { color: color.dim, width: 1.5, parent });
    }

    sx(inches: number) {
        return this.x + inches * this.scale;
    }

    sy(inches: number) {
        return this.y + this.size - inches * this.scale;
    }
}
