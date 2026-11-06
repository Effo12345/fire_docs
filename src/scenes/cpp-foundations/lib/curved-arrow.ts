import type { Draw } from '@kit/draw';
import { color } from '@kit/palette';

// An arrow along a gentle curve, with a head that can be recolored. bulge pushes the middle sideways.
export function curvedArrow(draw: Draw, bulge = 0, width = 1.75) {
    const body = draw.path('', { color: color.focus, width });
    const head = draw.path('', { color: color.focus, width });

    return (x1: number, y1: number, x2: number, y2: number, opacity: number, stroke: string = color.focus) => {
        const cx = (x1 + x2) / 2 + bulge;
        const cy = (y1 + y2) / 2;
        body.d(`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`).opacity(opacity).set({ stroke });

        const angle = Math.atan2(y2 - cy, x2 - cx);
        const side = (dir: number) => `${x2 - 9 * Math.cos(angle) + 4.5 * dir * Math.sin(angle)} ${y2 - 9 * Math.sin(angle) - 4.5 * dir * Math.cos(angle)}`;
        head.d(`M${side(1)} L${x2} ${y2} L${side(-1)}`).opacity(opacity).set({ stroke });
    };
}
