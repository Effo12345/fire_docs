// A plot with labeled axes
import type { Draw, PathNode, Stroke } from './draw';
import { color } from './palette';

export interface AxesOptions {
    box: { left: number; right: number; top: number; bottom: number };
    x: [number, number];
    y: [number, number];
    xTicks?: number[];
    yTicks?: number[];
    xUnit?: string;
    yLabel?: string;
    xLabel?: string;
    parent?: SVGElement;
}

export class Axes {
    constructor(private draw: Draw, public o: AxesOptions) {
        const { box, xTicks = [], yTicks = [], parent } = o;
        const axis = { color: color.rule, width: 1, parent };
        draw.line(box.left, this.sy(Math.max(o.y[0], 0)), box.right, this.sy(Math.max(o.y[0], 0)), axis);
        draw.line(box.left, box.top, box.left, box.bottom, axis);
        for (const tick of xTicks) {
            const x = this.sx(tick);
            draw.line(x, box.bottom, x, box.bottom + 5, axis);
            draw.text(`${tick}${o.xUnit ?? ''}`, x, box.bottom + 21, { color: color.dim, size: 13, anchor: 'middle', parent });
        }
        for (const tick of yTicks) {
            draw.text(tick, box.left - 9, this.sy(tick) + 4, { color: color.dim, size: 13, anchor: 'end', parent });
        }
        if (o.yLabel) draw.text(o.yLabel, box.left, box.top - 10, { color: color.dim, size: 13, parent });
        if (o.xLabel) draw.text(o.xLabel, box.right, box.bottom - 8, { color: color.dim, size: 13, anchor: 'end', parent });
    }

    // Data to scene coordinates
    sx(x: number) {
        const { box, x: [a, b] } = this.o;
        return box.left + ((x - a) / (b - a)) * (box.right - box.left);
    }

    sy(y: number) {
        const { box, y: [a, b] } = this.o;
        return box.bottom - ((y - a) / (b - a)) * (box.bottom - box.top);
    }

    hline(y: number, o: Stroke = {}) {
        const { box, parent } = this.o;
        return this.draw.line(box.left, this.sy(y), box.right, this.sy(y), { parent, ...o });
    }

    curve(o: Stroke = {}): PathNode {
        return this.draw.path('', { width: 2.5, parent: this.o.parent, ...o });
    }

    // Path through evenly spaced samples, up to index count
    trace(samples: ArrayLike<number>, tEnd: number, count = samples.length) {
        const n = samples.length - 1;
        let d = '';
        for (let i = 0; i < Math.min(count, samples.length); i++) {
            d += `${i ? 'L' : 'M'}${this.sx((i / n) * tEnd).toFixed(1)} ${this.sy(samples[i]).toFixed(1)}`;
        }
        return d;
    }
}
