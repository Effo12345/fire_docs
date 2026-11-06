// A row of memory cells, each with an address and a value
import type { Draw, Node, TextNode } from './draw';
import { color } from './palette';

export interface MemoryOptions {
    x: number;
    y: number;
    count: number;
    cellWidth?: number;
    cellHeight?: number;
    firstAddress?: number;
    values?: (string | number)[];
    parent?: SVGElement;
}

export class MemoryRow {
    cellWidth: number;
    cellHeight: number;
    boxes: Node[] = [];
    values: TextNode[] = [];

    constructor(draw: Draw, private o: MemoryOptions) {
        this.cellWidth = o.cellWidth ?? 56;
        this.cellHeight = o.cellHeight ?? 44;
        for (let i = 0; i < o.count; i++) {
            const left = o.x + i * this.cellWidth;
            this.boxes.push(draw.rect(left, o.y, this.cellWidth, this.cellHeight, { color: color.dim, width: 1.25, parent: o.parent }));
            this.values.push(draw.text(o.values?.[i] ?? '', left + this.cellWidth / 2, o.y + this.cellHeight / 2 + 6, {
                anchor: 'middle', mono: true, size: 16, parent: o.parent,
            }));
            draw.text((o.firstAddress ?? 0) + i, left + this.cellWidth / 2, o.y + this.cellHeight + 18, {
                anchor: 'middle', mono: true, size: 11, color: color.faint, parent: o.parent,
            });
        }
    }

    centerX(i: number) {
        return this.o.x + i * this.cellWidth + this.cellWidth / 2;
    }

    centerY() {
        return this.o.y + this.cellHeight / 2;
    }
}
