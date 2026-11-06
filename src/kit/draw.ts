// Thin wrappers over SVG elements. Every drawing method returns a Node you can move later.
import { color } from './palette';

const NS = 'http://www.w3.org/2000/svg';
type Attrs = Record<string, string | number>;

export class Node<E extends SVGElement = SVGElement> {
    constructor(public el: E) {}

    set(attrs: Attrs) {
        for (const key in attrs) this.el.setAttribute(key, String(attrs[key]));
        return this;
    }

    show(visible: boolean) {
        this.el.style.display = visible ? '' : 'none';
        return this;
    }

    opacity(value: number) {
        this.el.style.opacity = String(value);
        return this;
    }

    move(x: number, y: number, rotateDeg = 0) {
        this.el.setAttribute('transform', `translate(${x} ${y}) rotate(${rotateDeg})`);
        return this;
    }
}

export class LineNode extends Node<SVGLineElement> {
    to(x1: number, y1: number, x2: number, y2: number) {
        return this.set({ x1, y1, x2, y2 });
    }
}

export class PathNode extends Node<SVGPathElement> {
    d(value: string) {
        return this.set({ d: value });
    }
}

export class TextNode extends Node<SVGTextElement> {
    text(value: string | number) {
        this.el.textContent = String(value);
        return this;
    }

    at(x: number, y: number) {
        return this.set({ x, y });
    }
}

export class ArrowNode extends Node<SVGGElement> {
    constructor(el: SVGGElement, private line: LineNode, private head: PathNode, private headSize: number) {
        super(el);
    }

    to(x1: number, y1: number, x2: number, y2: number) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const s = this.headSize;
        const backX = x2 - s * Math.cos(angle);
        const backY = y2 - s * Math.sin(angle);
        this.line.to(x1, y1, x2, y2);
        const side = (dir: number) =>
            `${backX + (s / 2.2) * Math.cos(angle + dir * Math.PI / 2)} ${backY + (s / 2.2) * Math.sin(angle + dir * Math.PI / 2)}`;
        this.head.d(`M${side(1)} L${x2} ${y2} L${side(-1)}`);
        return this;
    }
}

export class SpanNode extends Node<SVGGElement> {
    // A bar with end ticks, used to measure a distance between two points
    constructor(el: SVGGElement, private path: PathNode, private tick: number) {
        super(el);
    }

    to(x1: number, y1: number, x2: number, y2: number) {
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const nx = (-(y2 - y1) / len) * this.tick;
        const ny = ((x2 - x1) / len) * this.tick;
        this.path.d(`M${x1 + nx} ${y1 + ny} L${x1 - nx} ${y1 - ny} M${x1} ${y1} L${x2} ${y2} M${x2 + nx} ${y2 + ny} L${x2 - nx} ${y2 - ny}`);
        return this;
    }
}

export interface Stroke {
    color?: string;
    width?: number;
    dash?: string;
    parent?: SVGElement;
}

export interface TextStyle {
    color?: string;
    size?: number;
    anchor?: 'start' | 'middle' | 'end';
    mono?: boolean;
    italic?: boolean;
    weight?: number;
    parent?: SVGElement;
}

export class Draw {
    constructor(private root: SVGElement) {}

    private make<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs, parent?: SVGElement) {
        const el = document.createElementNS(NS, tag) as SVGElementTagNameMap[K];
        for (const key in attrs) el.setAttribute(key, String(attrs[key]));
        (parent ?? this.root).appendChild(el);
        return el;
    }

    private stroke(o: Stroke, fallbackWidth = 2) {
        const attrs: Attrs = { stroke: o.color ?? color.ink, 'stroke-width': o.width ?? fallbackWidth, fill: 'none' };
        if (o.dash) attrs['stroke-dasharray'] = o.dash;
        return attrs;
    }

    group(parent?: SVGElement) {
        return new Node(this.make('g', {}, parent));
    }

    line(x1: number, y1: number, x2: number, y2: number, o: Stroke = {}) {
        return new LineNode(this.make('line', { x1, y1, x2, y2, ...this.stroke(o), 'stroke-linecap': 'round' }, o.parent));
    }

    path(d = '', o: Stroke & { fill?: string } = {}) {
        const attrs: Attrs = { d, ...this.stroke(o), 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
        if (o.fill) attrs.fill = o.fill;
        return new PathNode(this.make('path', attrs, o.parent));
    }

    circle(cx: number, cy: number, r: number, o: Stroke & { fill?: string } = {}) {
        const attrs: Attrs = { cx, cy, r, ...this.stroke(o) };
        if (o.fill) attrs.fill = o.fill;
        if (o.fill && !o.color) attrs.stroke = 'none';
        return new Node(this.make('circle', attrs, o.parent));
    }

    rect(x: number, y: number, width: number, height: number, o: Stroke & { fill?: string } = {}) {
        const attrs: Attrs = { x, y, width, height, ...this.stroke(o) };
        if (o.fill) attrs.fill = o.fill;
        if (o.fill && !o.color) attrs.stroke = 'none';
        return new Node(this.make('rect', attrs, o.parent));
    }

    text(value: string | number, x: number, y: number, o: TextStyle = {}) {
        const el = this.make('text', {
            x,
            y,
            fill: o.color ?? color.ink,
            'font-size': o.size ?? 15,
            'font-family': o.mono ? 'var(--sl-font-mono)' : 'var(--sl-font)',
            'text-anchor': o.anchor ?? 'start',
        }, o.parent);
        if (o.italic) el.setAttribute('font-style', 'italic');
        if (o.weight) el.setAttribute('font-weight', String(o.weight));
        el.textContent = String(value);
        return new TextNode(el);
    }

    arrow(x1: number, y1: number, x2: number, y2: number, o: Stroke & { head?: number } = {}) {
        const g = this.make('g', {}, o.parent);
        const line = this.line(x1, y1, x2, y2, { ...o, parent: g });
        const head = this.path('', { ...o, parent: g });
        return new ArrowNode(g, line, head, o.head ?? 10).to(x1, y1, x2, y2);
    }

    span(x1: number, y1: number, x2: number, y2: number, o: Stroke & { tick?: number } = {}) {
        const g = this.make('g', {}, o.parent);
        const path = this.path('', { ...o, parent: g });
        return new SpanNode(g, path, o.tick ?? 5).to(x1, y1, x2, y2);
    }
}
