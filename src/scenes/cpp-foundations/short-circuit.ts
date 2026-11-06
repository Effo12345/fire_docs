import { defineCodeScene } from '@kit/code-scene';

export default defineCodeScene({
    label: 'Two versions of the same test with the && operands in opposite orders. In the first, the left side is false so the division is skipped. In the second, the division runs first and divides by zero',
    code: `
int n = 0;
int sum = 6;

if(n != 0 && sum / n > 2) {
    sum = 0;
}

if(sum / n > 2 && n != 0) {
    sum = 0;
}
`,
    stepTime: 2.4,
    steps: [
        { line: 1, vars: { n: 0 }, note: 'Pretend <code>n</code> counts something that is sometimes zero.' },
        { line: 2, vars: { sum: 6 }, note: 'And <code>sum</code> is 6.' },
        { line: 4, vars: { left: 'false' }, note: 'Version one. The left side, <code>n != 0</code>, is false.' },
        { line: 4, vars: { right: 'skipped' }, note: 'An <code>&amp;&amp;</code> with a false left side can never be true, so the right side is never looked at. No division happens.' },
        { line: 8, vars: { left: '', right: '' }, note: 'Version two, with the sides swapped. Now the division is on the left, so it has to run first.' },
        { line: 8, vars: { left: '6 / 0' }, note: 'Dividing an integer by zero is undefined behavior. The program may crash or carry on with garbage, and the order of the tests is the whole difference.' },
    ],
});
