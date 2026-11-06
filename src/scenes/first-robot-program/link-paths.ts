import { defineScene } from '@kit/scene';
import { fadeIn, slide, timeline } from '@kit/timeline';
import { color } from '@kit/palette';

export default defineScene({
    label: 'The same ten-piece program sent three ways: straight over USB to the Brain, through the controller and radio, and through the controller and radio with only the two pieces of your own code sent',
    height: 340,
    beats: [
        { at: 0, text: 'Squares are pieces of one program. <strong>Row 1:</strong> USB straight into the Brain is the short, fast path.' },
        { at: 3.6, text: '<strong>Rows 2 and 3</strong> go through the controller and over the radio, which is the slow part. In row 3 the dim pieces are the kernel, already on the Brain from an earlier upload, so only your two pieces travel.' },
        { at: 7, text: 'Row 3 is done while row 2 is still sending pieces the Brain already had. The speeds are made up for the picture; the proportions are the point.' },
        { at: 11, text: 'This is hot and cold linking: the cold image (kernel) stays put, the hot image (your code) is sent each time.' },
    ],
    build({ draw }) {
        const tl = timeline();

        const box = (x: number, y: number, w: number, h: number, label: string, c: string) => {
            draw.rect(x, y, w, h, { color: c, width: 1.75 });
            draw.text(label, x + w / 2, y + h / 2 + 5, { anchor: 'middle', size: 14, color: c });
        };

        const rows = [70, 170, 270];
        const names = ['USB straight to the Brain', 'Controller and radio, whole program', 'Controller and radio, only your code'];

        rows.forEach((y, r) => {
            draw.text(names[r], 10, y - 34, { size: 13, color: color.dim });
            box(10, y - 20, 90, 40, 'laptop', color.ink);
            draw.rect(590, y - 28, 120, 56, { color: color.ink, width: 1.75 });
            draw.text('Brain', 650, y + 46, { anchor: 'middle', size: 14, color: color.ink });

            if(r === 0) {
                draw.line(100, y, 590, y, { color: color.dim, width: 2 });
                draw.text('USB cable', 345, y + 22, { anchor: 'middle', size: 13, color: color.faint });
            } else {
                draw.line(100, y, 250, y, { color: color.dim, width: 2 });
                box(250, y - 20, 90, 40, 'controller', color.ink);
                draw.line(340, y, 590, y, { color: color.dim, width: 1.5, dash: '3 6' });
                draw.text('radio link', 465, y + 22, { anchor: 'middle', size: 13, color: color.faint });
            }
        });

        // Pieces land in a grid inside the Brain box
        const spot = (r: number, i: number): [number, number] => [
            600 + (i % 5) * 20,
            rows[r] - 18 + Math.floor(i / 5) * 20,
        ];
        const start = (r: number): [number, number] => [108, rows[r] - 7];

        const piece = (r: number, i: number, c: string, at: number, travel: number) => {
            const g = draw.group();
            draw.rect(0, 0, 14, 14, { color: c, width: 1.75, parent: g.el });
            fadeIn(tl, g, at, 0.05);
            const [sx, sy] = start(r);
            const [ex, ey] = spot(r, i);
            slide(tl, g, [sx, sy], [ex, ey], at, travel);
        };

        // Row 1: fast, all ten pieces
        for(let i = 0; i < 10; i++) {
            piece(0, i, i < 8 ? color.value : color.focus, i * 0.15, 0.8);
        }

        // Row 2: slow, all ten pieces
        for(let i = 0; i < 10; i++) {
            piece(1, i, i < 8 ? color.value : color.focus, 3.6 + i * 0.55, 1.4);
        }

        // Row 3: kernel already there, only the two code pieces travel
        for(let i = 0; i < 8; i++) {
            const g = draw.group();
            draw.rect(0, 0, 14, 14, { color: color.faint, width: 1.5, parent: g.el });
            const [ex, ey] = spot(2, i);
            slide(tl, g, [ex, ey], [ex, ey], 0, 0.01);
        }
        for(let i = 8; i < 10; i++) {
            piece(2, i, color.focus, 3.6 + (i - 8) * 0.55, 1.4);
        }

        tl.to({}, { duration: 0.1 }, 13);

        return { timeline: tl, update: () => {} };
    },
});
