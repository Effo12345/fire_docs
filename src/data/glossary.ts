// Technical terms, kept one file per section in src/data/glossary/
export interface GlossaryEntry {
    id: string;
    term: string;
    definition: string;
    page: string; // Where it's explained, like "start-here/inside-a-computer"
}

const files = import.meta.glob<{ default: GlossaryEntry[] }>('./glossary/*.json', { eager: true });

export const glossary: GlossaryEntry[] = Object.values(files)
    .flatMap((file) => file.default)
    .sort((a, b) => a.term.localeCompare(b.term));

export const findTerm = (id: string) => glossary.find((entry) => entry.id === id);

export const termUrl = (entry: GlossaryEntry) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${entry.page}/#term-${entry.id}`;
