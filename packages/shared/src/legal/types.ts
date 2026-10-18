// Page légale : des sections faites de paragraphes (texte) et de listes (tableau de textes).
export type LegalBlock = string | readonly string[];

export interface LegalDocument {
  title: string;
  updatedAt: string; // affiché tel quel
  intro: string;
  sections: readonly { title: string; blocks: readonly LegalBlock[] }[];
}
