import { defineScene } from '@kit/scene';
import { fadeIn, fadeOut, slide, textAt, timeline } from '@kit/timeline';
import { color } from '@kit/palette';

const TOP = 170;
const BOTTOM = 262;
const REST_Y = 238;
const HOVER_Y = 110;

const BUCKETS = [
    { type: 'int', name: 'speed', cx: 100, width: 110 },
    { type: 'double', name: 'diameter', cx: 290, width: 150 },
    { type: 'bool', name: 'ready', cx: 470, width: 70 },
    { type: 'char', name: 'grade', cx: 600, width: 70 },
];

export default defineScene({
    label: 'Four buckets labeled int, double, bool and char. A whole number, a decimal, true and a letter are poured into the matching buckets. Then 3.7 is poured into the int bucket, which keeps the 3 and loses the .7.',
    duration: 18,
    height: 340,
    beats: [
        { at: 0, text: 'A <strong>variable</strong> is a bucket with a name on it. Its <em>type</em> decides what kind of thing the bucket can hold.' },
        { at: 1.4, text: 'An <code>int</code> bucket holds whole numbers.' },
        { at: 3.6, text: 'A <code>double</code> bucket holds numbers with a decimal point, so it is built wider.' },
        { at: 5.8, text: 'A <code>bool</code> bucket holds one of two things: true or false.' },
        { at: 8, text: 'A <code>char</code> bucket holds one character. Under the surface it stores that character\'s code number.' },
        { at: 10.4, text: 'Now pour 3.7 into the <code>int</code> bucket. The bucket has no place for a fraction.' },
        { at: 12.4, text: 'The 3 goes in. The <em>.7</em> is thrown away, and the compiler says nothing about it. The old 50 is gone too.' },
        { at: 16.5, text: 'The type sets what fits. Pick the bucket before you pour.' },
    ],
    build({ draw }) {
        const tl = timeline();

        const token = (value: string, colorName: string, size = 20) => {
            const group = draw.group();
            draw.text(value, 0, 0, { mono: true, size, anchor: 'middle', color: colorName, parent: group.el });
            return group;
        };

        for (const b of BUCKETS) {
            const half = b.width / 2;
            draw.path(`M${b.cx - half} ${TOP} L${b.cx - half * 0.8} ${BOTTOM} L${b.cx + half * 0.8} ${BOTTOM} L${b.cx + half} ${TOP}`, { color: color.dim, width: 2 });
            draw.text(b.type, b.cx, BOTTOM + 28, { mono: true, size: 16, anchor: 'middle', color: color.value });
            draw.text(b.name, b.cx, BOTTOM + 50, { mono: true, size: 14, anchor: 'middle', color: color.dim });
        }

        // Each value drops in from above and rests in its bucket
        const pour = (value: string, i: number, at: number) => {
            const t = token(value, color.value);
            fadeIn(tl, t, at, 0.2);
            slide(tl, t, [BUCKETS[i].cx, 60], [BUCKETS[i].cx, REST_Y], at, 1.2);
            return t;
        };
        const fifty = pour('50', 0, 1.4);
        pour('3.25', 1, 3.6);
        pour('true', 2, 5.8);
        pour("'A'", 3, 8);

        // 3.7 hovers over the int bucket, then splits
        const cx = BUCKETS[0].cx;
        const whole = token('3.7', color.ink);
        fadeIn(tl, whole, 10.4, 0.2);
        slide(tl, whole, [cx, 40], [cx, HOVER_Y], 10.4, 1.2);
        fadeOut(tl, whole, 12.3, 0.1);

        fadeOut(tl, fifty, 12.8, 0.4);
        const kept = token('3', color.value);
        fadeIn(tl, kept, 12.3, 0.1);
        slide(tl, kept, [cx - 12, HOVER_Y], [cx, REST_Y], 12.6, 1);

        const lost = token('.7', color.error);
        fadeIn(tl, lost, 12.3, 0.1);
        slide(tl, lost, [cx + 6, HOVER_Y], [188, 205], 12.6, 1.2);
        fadeOut(tl, lost, 14.6, 0.8);

        const note = draw.text('', 188, 232, { size: 14, color: color.error, anchor: 'middle' });

        return {
            timeline: tl,
            update: ({ t }) => {
                note.text(textAt(t, [[13.6, 'lost'], [15.4, '']]));
            },
        };
    },
});
