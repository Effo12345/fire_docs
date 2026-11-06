import { defineScene } from '@kit/scene';
import { fadeIn, fadeOut, slide, timeline } from '@kit/timeline';
import { color } from '@kit/palette';

export default defineScene({
    label: 'Your main.cpp and the PROS kernel go through the compiler and the linker to become a single bin file, which travels over the USB cable into slot 1 on the Brain',
    height: 230,
    beats: [
        { at: 0, text: 'Two kinds of input. <strong>main.cpp</strong> is yours. The <strong>kernel</strong> comes with the project, and your code calls into it.' },
        { at: 3, text: 'The <strong>compiler</strong> turns each source file into machine code, with the final addresses still open.' },
        { at: 6, text: 'The <strong>linker</strong> joins the pieces, settles the addresses, and leaves one <strong>.bin</strong> file in your project\'s bin folder.' },
        { at: 9, text: '<strong>Upload</strong> sends that file down the USB cable. Your laptop only ever sends it.' },
        { at: 12, text: 'It lands in a program slot in the Brain\'s flash memory, which keeps it with the power off.' },
    ],
    build({ draw }) {
        const tl = timeline();

        const box = (x: number, y: number, w: number, h: number, label: string, c: string, at: number) => {
            const g = draw.group();
            draw.rect(x, y, w, h, { color: c, width: 1.75, parent: g.el });
            draw.text(label, x + w / 2, y + h / 2 + 5, { anchor: 'middle', size: 14, color: c, parent: g.el });
            fadeIn(tl, g, at, 0.4);
            return g;
        };

        // Inputs
        box(10, 60, 120, 44, 'main.cpp', color.value, 0);
        box(10, 150, 120, 44, 'PROS kernel', color.dim, 0);

        // Tools
        const compiler = box(170, 105, 100, 50, 'compiler', color.ink, 3);
        const linker = box(310, 105, 100, 50, 'linker', color.ink, 6);
        const bin = box(450, 105, 90, 50, '.bin', color.focus, 6.8);

        const arrow = (x1: number, y1: number, x2: number, y2: number, at: number) => {
            const a = draw.arrow(x1, y1, x2, y2, { color: color.faint, width: 1.5 });
            fadeIn(tl, a, at, 0.3);
        };
        arrow(130, 82, 168, 120, 3);
        arrow(130, 172, 168, 140, 3);
        arrow(270, 130, 308, 130, 4.5);
        arrow(410, 130, 448, 130, 6.8);

        // Brain with 8 slots
        const brainG = draw.group();
        draw.rect(580, 60, 130, 140, { color: color.ink, width: 1.75, parent: brainG.el });
        draw.text('V5 Brain', 645, 52, { anchor: 'middle', size: 14, color: color.dim, parent: brainG.el });
        for(let i = 0; i < 8; i++) {
            const sx = 592 + (i % 4) * 29;
            const sy = 78 + Math.floor(i / 4) * 52;
            draw.rect(sx, sy, 24, 40, { color: color.faint, width: 1, parent: brainG.el });
            draw.text(i + 1, sx + 12, sy + 25, { anchor: 'middle', size: 13, color: color.faint, parent: brainG.el });
        }
        fadeIn(tl, brainG, 0, 0.1);

        // Cable
        const cable = draw.line(540, 130, 580, 130, { color: color.dim, width: 2 });
        draw.text('USB', 560, 156, { anchor: 'middle', size: 13, color: color.dim });
        fadeIn(tl, cable, 9, 0.3);

        // The file travels, then fills slot 1
        const file = draw.group();
        draw.rect(0, 0, 24, 18, { color: color.focus, width: 1.75, parent: file.el });
        draw.text('.bin', 12, 13, { anchor: 'middle', size: 10, color: color.focus, parent: file.el });
        fadeIn(tl, file, 9, 0.2);
        slide(tl, file, [500, 121], [592, 89], 9.2, 2.4);
        const filled = draw.rect(592, 78, 24, 40, { color: color.focus, width: 2.5 });
        fadeIn(tl, filled, 11.6, 0.3);
        fadeOut(tl, file, 11.6, 0.3);

        tl.to({}, { duration: 0.1 }, 15);

        return { timeline: tl, update: () => {} };
    },
});
