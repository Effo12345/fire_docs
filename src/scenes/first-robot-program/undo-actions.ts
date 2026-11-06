import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const ROW_Y = 130;
const XS = [90, 250, 410, 570];
const NAMES = ['Use arcade drive', 'Toggle intake', 'Curve the sticks', 'Revert "Curve the sticks"'];

// Where the files sit and what the branch points at, per action
const ACTIONS = [
    {
        title: 'Discard Changes',
        ring: 2,
        branch: 2,
        files: 'main.cpp matches the last commit again',
        before: 'Before: three commits, and edits in main.cpp that were never committed.',
        after: 'After: the edits are gone, and no commit holds a copy.',
    },
    {
        title: 'Undo Last Commit',
        ring: 1,
        branch: 1,
        files: 'main.cpp still has the curve code',
        before: 'Before: the last commit is Curve the sticks, not pushed yet.',
        after: 'After: the commit leaves the branch. Its changes stay in your files, staged.',
    },
    {
        title: 'Revert (in the terminal)',
        ring: 3,
        branch: 3,
        files: 'main.cpp has the curve code removed',
        before: 'Before: Curve the sticks is already on GitHub.',
        after: 'After: a new commit cancels it. The old commit stays in the history.',
    },
    {
        title: 'Checkout (Detached)',
        ring: 0,
        branch: 2,
        files: 'main.cpp matches Use arcade drive',
        before: 'Before: your files match the newest commit, with no uncommitted edits.',
        after: 'After: your files match an old commit. main still points at the newest one.',
    },
];

export default defineScene({
    label: 'Four undo actions on the same three-commit history. Discard Changes removes uncommitted edits, which are not recoverable. Undo Last Commit removes the last commit from the branch but keeps its changes staged in the files. Revert adds a new commit that cancels an earlier one. Checkout (Detached) moves the files to an old commit and leaves the branch where it was.',
    height: 400,
    duration: 0,
    params: [
        { key: 'action', label: 'action', min: 1, max: 4, step: 1, value: 1, digits: 0 },
    ],
    build({ draw }) {
        const title = draw.text('', 24, 38, { size: 18, weight: 600 });
        draw.text('1 Discard, 2 Undo, 3 Revert, 4 Checkout', 696, 38, { size: 13, anchor: 'end', color: color.dim });

        // History row
        const links = [0, 1, 2].map((i) => draw.line(XS[i] + 12, ROW_Y, XS[i + 1] - 12, ROW_Y, { color: color.dim, width: 2 }));
        const dots = XS.map((x) => draw.circle(x, ROW_Y, 11, { color: color.ink, width: 2 }));
        const names = XS.map((x, i) => draw.text(NAMES[i], x, ROW_Y - 26, { size: 13, anchor: 'middle' }));
        const removed = draw.text('removed from the branch', XS[2], ROW_Y + 36, { size: 13, anchor: 'middle', color: color.error });

        const ring = draw.circle(XS[2], ROW_Y, 18, { color: color.focus, width: 3 });
        const branch = draw.text('main', XS[2], ROW_Y + 56, { size: 13, mono: true, anchor: 'middle', color: color.dim });
        const noBranch = draw.text('no branch here', XS[0], ROW_Y + 36, { size: 13, anchor: 'middle', color: color.error });

        // The files
        draw.rect(24, 236, 390, 68, { color: color.rule, width: 1.5 });
        draw.text('Your files', 36, 256, { size: 13, color: color.dim });
        const files = draw.text('', 36, 286, { size: 14, mono: true });
        const staged = draw.rect(430, 236, 150, 68, { color: color.focus, width: 2 });
        const stagedText = draw.text('staged for commit', 505, 275, { size: 13, anchor: 'middle', color: color.focus });
        const lost = draw.rect(430, 236, 150, 68, { color: color.error, width: 2, dash: '5 4' });
        const lostText = draw.text('edits gone', 505, 275, { size: 13, anchor: 'middle', color: color.error });

        const before = draw.text('', 24, 346, { size: 14, color: color.dim });
        const after = draw.text('', 24, 372, { size: 14 });

        return ({ p }) => {
            const n = Math.min(3, Math.max(0, Math.round(p.action) - 1));
            const a = ACTIONS[n];

            title.text(a.title);

            // Only a revert adds a fourth commit
            dots[3].show(n === 2);
            names[3].show(n === 2);
            links[2].show(n === 2);

            // Undo Last Commit takes the third commit off the branch, drawn dashed in red
            dots[2].set({ stroke: n === 1 ? color.error : color.ink, 'stroke-dasharray': n === 1 ? '4 3' : 'none' });
            links[1].set({ stroke: n === 1 ? color.error : color.dim, 'stroke-dasharray': n === 1 ? '4 3' : 'none' });
            removed.show(n === 1);

            ring.set({ cx: XS[a.ring] });
            branch.at(XS[a.branch], ROW_Y + 56);
            noBranch.show(n === 3);

            files.text(a.files);
            staged.show(n === 1);
            stagedText.show(n === 1);
            lost.show(n === 0);
            lostText.show(n === 0);

            before.text(a.before);
            after.text(a.after);
        };
    },
});
