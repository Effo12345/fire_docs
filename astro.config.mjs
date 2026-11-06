import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { curriculum, SITE_TITLE } from './src/data/curriculum.mjs';
import codeTheme from './src/data/blackboard-code-theme.json' with { type: 'json' };

// GitHub Pages serves the site from a subfolder named after the repo
const site = 'https://effo12345.github.io';
const base = process.env.FIRE_BASE ?? '/fire_docs';

// Colored math, matching the colors used in the animations
const katexMacros = {
    '\\val': '\\htmlClass{fd-value}{#1}',
    '\\foc': '\\htmlClass{fd-focus}{#1}',
    '\\tar': '\\htmlClass{fd-target}{#1}',
    '\\err': '\\htmlClass{fd-error}{#1}',
};

export default defineConfig({
    site,
    base,
    trailingSlash: 'always',
    markdown: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [[rehypeKatex, { trust: true, macros: katexMacros, strict: false }]],
    },
    integrations: [
        starlight({
            title: SITE_TITLE,
            description: 'Learn to program VEX V5 robots with PROS, starting from no coding experience.',
            customCss: [
                '@fontsource-variable/source-serif-4/opsz.css',
                '@fontsource-variable/source-serif-4/opsz-italic.css',
                '@fontsource/jetbrains-mono/400.css',
                'katex/dist/katex.min.css',
                './src/styles/theme.css',
                './src/styles/scene.css',
            ],
            components: {
                ThemeSelect: './src/overrides/ThemeSelect.astro',
                ThemeProvider: './src/overrides/ThemeProvider.astro',
                TableOfContents: './src/overrides/TableOfContents.astro',
            },
            expressiveCode: {
                themes: [codeTheme],
                useStarlightDarkModeSwitch: false,
                useStarlightUiThemeColors: false,
                styleOverrides: {
                    borderRadius: '0',
                    borderWidth: '0',
                    codeFontFamily: "'JetBrains Mono', monospace",
                    codeFontSize: '0.82rem',
                    codeLineHeight: '1.6',
                    uiFontFamily: "'Source Serif 4 Variable', Georgia, serif",
                    frames: {
                        frameBoxShadowCssValue: 'none',
                        editorActiveTabIndicatorTopColor: 'transparent',
                        editorActiveTabBackground: '#0C0F12',
                        editorTabBarBackground: '#0C0F12',
                        editorTabBarBorderBottomColor: '#33393F',
                        terminalBackground: '#0C0F12',
                        terminalTitlebarBackground: '#0C0F12',
                        terminalTitlebarBorderBottomColor: '#33393F',
                    },
                },
            },
            sidebar: curriculum.map((section) => ({
                label: section.label,
                collapsed: true,
                items: section.pages.map(([slug]) => ({ slug: `${section.dir}/${slug}` })),
            })),
        }),
    ],
});
