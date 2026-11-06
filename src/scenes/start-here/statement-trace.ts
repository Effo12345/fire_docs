import { defineCodeScene } from '@kit/code-scene';

export default defineCodeScene({
    label: 'Four C++ statements run one at a time: first is set to 7, second to 5, total to their sum 12, and then first is changed to 10 while total stays 12',
    code: `
int first = 7;
int second = 5;
int total = first + second;
first = 10;
`,
    steps: [
        { line: 1, vars: { first: 7 }, note: 'The first statement makes a box named <code>first</code> and writes 7 into it.' },
        { line: 2, vars: { second: 5 }, note: 'The next statement makes a box for <code>second</code> and writes 5.' },
        { line: 3, vars: { total: 12 }, note: 'Read 7, read 5, add, write 12 into <code>total</code>. This happens once, right now.' },
        { line: 4, vars: { first: 10 }, note: 'Now <code>first</code> is overwritten with 10. Look at <code>total</code>.' },
        { line: 4, note: '<code>total</code> is still 12. The line that set it already finished. Nothing tied it to <code>first</code>.' },
    ],
});
