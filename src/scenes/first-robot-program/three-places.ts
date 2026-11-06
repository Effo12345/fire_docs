import { defineScene } from '@kit/scene';
import { fadeIn, fadeOut, timeline, gsap } from '@kit/timeline';
import { color } from '@kit/palette';

const TOP = 54;
const HEIGHT = 150;
const COLS = [
    { x: 12, title: 'Working folder', note: 'saving writes here' },
    { x: 196, title: 'Staged Changes', note: 'picked for the next commit' },
    { x: 380, title: 'Local history', note: 'commits live here' },
    { x: 564, title: 'GitHub', note: 'a copy on a server' },
];
const W = 136;
const MID = TOP + HEIGHT / 2;

export default defineScene({
    label: 'A change to main.cpp moves through four places: the working folder, the Staged Changes list, the local commit history, and GitHub. Under each step is the Source Control action that moves it: the plus button, Commit, and Sync Changes.',
    height: 300,
    beats: [
        { at: 0, text: 'You edit <strong>main.cpp</strong> and save. The change exists in your folder and nowhere else. Git has seen it, but it has recorded nothing.' },
        { at: 3.5, text: 'The <strong>+</strong> beside the file in Changes <strong>stages</strong> it: this change goes into the next commit.' },
        { at: 7, text: '<strong>Commit</strong> records the staged snapshot in your local history. The Staged Changes list empties. Nobody else can see it yet.' },
        { at: 10.5, text: '<strong>Sync Changes</strong> (or Push) copies your commits to GitHub. Until then, a dead laptop takes the commit with it.' },
    ],
    build({ draw }) {
        const tl = timeline();

        COLS.forEach((c) => {
            draw.rect(c.x, TOP, W, HEIGHT, { color: color.rule, width: 1.5 });
            draw.text(c.title, c.x + W / 2, TOP - 14, { size: 14, anchor: 'middle' });
            draw.text(c.note, c.x + W / 2, TOP + HEIGHT + 22, { size: 12, anchor: 'middle', color: color.dim });
        });

        // The arrows between the places, with the panel action under each
        const actions = [
            { from: 0, text: '+ Stage Changes', at: 3.5 },
            { from: 1, text: 'Commit', at: 7 },
            { from: 2, text: 'Sync Changes', at: 10.5 },
        ];
        actions.forEach((a) => {
            const x1 = COLS[a.from].x + W + 4;
            const x2 = COLS[a.from + 1].x - 4;
            const arrow = draw.arrow(x1, MID, x2, MID, { color: color.dim, width: 1.5, head: 8 });
            const label = draw.text(a.text, (x1 + x2) / 2, TOP + HEIGHT + 62, { size: 13, mono: true, anchor: 'middle', color: color.focus });
            const tick = draw.line((x1 + x2) / 2, MID + 14, (x1 + x2) / 2, TOP + HEIGHT + 48, { color: color.faint, width: 1, dash: '2 4' });
            fadeIn(tl, arrow, a.at - 0.3, 0.3);
            fadeIn(tl, label, a.at - 0.3, 0.3);
            fadeIn(tl, tick, a.at - 0.3, 0.3);
        });

        const chip = (col: number, at: number, until: number | null, c: string, text: string) => {
            const g = draw.group();
            const x = COLS[col].x + 12;
            draw.rect(x, MID - 18, W - 24, 36, { color: c, width: 2, parent: g.el });
            draw.text(text, x + (W - 24) / 2, MID + 5, { size: 13, mono: true, anchor: 'middle', color: c, parent: g.el });
            fadeIn(tl, g, at, 0.4);
            if(until !== null) {
                fadeOut(tl, g, until, 0.4);
            }
            return g;
        };

        // The edited file stays in the folder the whole time
        chip(0, 0.2, null, color.value, 'main.cpp');
        const edited = draw.text('edited', COLS[0].x + W / 2, MID + 40, { size: 12, anchor: 'middle', color: color.dim });
        const saved = draw.text('same as the commit', COLS[0].x + W / 2, MID + 40, { size: 12, anchor: 'middle', color: color.dim });
        fadeIn(tl, edited, 0.2, 0.4);
        fadeOut(tl, edited, 8, 0.4);
        fadeIn(tl, saved, 8.4, 0.4);
        chip(1, 4.2, 7.8, color.value, 'main.cpp');

        // A commit is a circle in the history, and a copy of it appears on GitHub
        const commit = (col: number, at: number) => {
            const g = draw.group();
            const cx = COLS[col].x + W / 2;
            draw.circle(cx, MID - 6, 13, { color: color.focus, width: 2, parent: g.el });
            draw.text('Toggle intake', cx, MID + 32, { size: 12, anchor: 'middle', parent: g.el });
            fadeIn(tl, g, at, 0.4);
        };
        commit(2, 8);
        commit(3, 11.4);

        // Early commits that were already there
        const older = (col: number) => {
            const cx = COLS[col].x + W / 2;
            draw.circle(cx - 36, MID - 6, 9, { color: color.faint, width: 1.5 });
            draw.line(cx - 27, MID - 6, cx - 13, MID - 6, { color: color.faint, width: 1.5 });
        };
        older(2);
        older(3);

        tl.to({}, { duration: 0.1 }, 14);
        void gsap;
        return { timeline: tl, update: () => {} };
    },
});
