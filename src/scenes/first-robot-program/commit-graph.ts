import { defineScene } from '@kit/scene';
import { fadeIn, slide, timeline, gsap } from '@kit/timeline';
import { color } from '@kit/palette';

const MAIN_Y = 118;
const A_Y = 214;
const B_Y = 306;
const X = [64, 184, 304, 424, 604];

export default defineScene({
    label: 'A commit graph. Three commits on main are followed by a side branch for curving the sticks, which feels wrong and is set aside. A second side branch adds a timed autonomous and is merged back into main after a teammate adds a commit to main.',
    height: 380,
    beats: [
        { at: 0, text: 'Each circle is a <strong>commit</strong>, a snapshot of the whole project, and each one points back to the one before it. The yellow ring is where your files are right now.' },
        { at: 3.6, text: 'Before trying a curve on the sticks, make a <strong>branch</strong>. Commits now pile up on <strong>try-curved-arcade</strong> and <strong>main</strong> stays as it was.' },
        { at: 5.8, text: 'The new curve feels sluggish. Switch back to main and the files come back exactly as the third commit left them. Nothing on main was touched.' },
        { at: 8, text: 'A different idea gets its own branch: <strong>timed-auton</strong>. It starts from the same commit.' },
        { at: 10, text: 'Meanwhile a teammate\'s commit lands on main, so the two lines have gone different ways.' },
        { at: 11.6, text: 'Back on main, merging <strong>timed-auton</strong> makes a merge commit with two parents. Both lines of work are now in main.' },
    ],
    build({ draw }) {
        const tl = timeline();

        const aAll: SVGElement[] = [];
        const node = (x: number, y: number, label: string, above: boolean, at: number, c: string = color.ink) => {
            const g = draw.group();
            draw.circle(x, y, 11, { color: c, width: 2, parent: g.el });
            draw.text(label, x, above ? y - 22 : y + 32, { size: 13, anchor: 'middle', color: color.ink, parent: g.el });
            fadeIn(tl, g, at, 0.35);
            return g;
        };

        const link = (x1: number, y1: number, x2: number, y2: number, at: number, c: string = color.dim) => {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy);
            const sx = x1 + (dx / len) * 11;
            const sy = y1 + (dy / len) * 11;
            const ex = x2 - (dx / len) * 11;
            const ey = y2 - (dy / len) * 11;
            const l = draw.line(sx, sy, ex, ey, { color: c, width: 2 });
            fadeIn(tl, l, at, 0.35);
            return l;
        };

        // Main line
        node(X[0], MAIN_Y, 'Add tank drive', true, 0.3);
        node(X[1], MAIN_Y, 'Use arcade drive', true, 1.0);
        node(X[2], MAIN_Y, 'Toggle intake', true, 1.7);
        link(X[0], MAIN_Y, X[1], MAIN_Y, 1.0);
        link(X[1], MAIN_Y, X[2], MAIN_Y, 1.7);

        // Branch A: tried and dropped
        const a1x = X[3];
        aAll.push(link(X[2], MAIN_Y, a1x, A_Y, 4.0).el);
        const aNode = draw.group();
        draw.circle(a1x, A_Y, 11, { color: color.ink, width: 2, parent: aNode.el });
        draw.text('Curve the sticks', a1x + 22, A_Y - 2, { size: 13, parent: aNode.el });
        fadeIn(tl, aNode, 4.0, 0.35);
        aAll.push(aNode.el);
        const aBad = draw.circle(a1x, A_Y, 11, { color: color.error, width: 3 });
        fadeIn(tl, aBad, 5.6, 0.3);
        const aNote = draw.text('feels sluggish', a1x + 22, A_Y + 16, { size: 13, color: color.error });
        fadeIn(tl, aNote, 5.6, 0.3);
        const aTag = draw.text('try-curved-arcade', 14, A_Y + 5, { size: 13, mono: true, color: color.dim });
        fadeIn(tl, aTag, 4.0, 0.3);
        aAll.push(aTag.el);
        tl.to(aAll, { opacity: 0.35, duration: 0.6 }, 7.4);

        // Branch B: kept
        const b1x = X[3];
        const b2x = X[4] - 40;
        link(X[2], MAIN_Y, b1x, B_Y, 8.2);
        node(b1x, B_Y, 'Add timed auton', false, 8.2);
        link(b1x, B_Y, b2x, B_Y, 9.0);
        node(b2x, B_Y, 'Shorten turn', false, 9.0);
        const bTag = draw.text('timed-auton', 14, B_Y + 5, { size: 13, mono: true, color: color.dim });
        fadeIn(tl, bTag, 8.2, 0.3);

        // A teammate's commit on main
        link(X[2], MAIN_Y, X[3], MAIN_Y, 10.2);
        node(X[3], MAIN_Y, 'Reverse on R2', true, 10.2);

        // The merge commit has two parents
        link(X[3], MAIN_Y, X[4], MAIN_Y, 12.0);
        link(b2x, B_Y, X[4], MAIN_Y, 12.0, color.target);
        node(X[4], MAIN_Y, 'Merge timed-auton', true, 12.0, color.target);

        const mainTag = draw.text('main', 14, MAIN_Y + 5, { size: 13, mono: true, color: color.dim });
        fadeIn(tl, mainTag, 0.3, 0.3);

        // Where your files are right now
        const ring = draw.group();
        draw.circle(0, 0, 17, { color: color.focus, width: 3, parent: ring.el });
        slide(tl, ring, [X[2], MAIN_Y], [X[2], MAIN_Y], 0, 0.01);
        gsap.set(ring.el, { opacity: 0 });
        tl.to(ring.el, { opacity: 1, duration: 0.3 }, 1.7);
        tl.to(ring.el, { x: a1x, y: A_Y, duration: 0.8, ease: 'power2.inOut' }, 4.0);
        tl.to(ring.el, { x: X[2], y: MAIN_Y, duration: 0.9, ease: 'power2.inOut' }, 6.4);
        tl.to(ring.el, { x: b1x, y: B_Y, duration: 0.8, ease: 'power2.inOut' }, 8.2);
        tl.to(ring.el, { x: b2x, y: B_Y, duration: 0.8, ease: 'power2.inOut' }, 9.0);
        tl.to(ring.el, { x: X[3], y: MAIN_Y, duration: 0.8, ease: 'power2.inOut' }, 11.0);
        tl.to(ring.el, { x: X[4], y: MAIN_Y, duration: 0.7, ease: 'power2.inOut' }, 12.2);

        tl.to({}, { duration: 0.1 }, 15);
        return { timeline: tl, update: () => {} };
    },
});
