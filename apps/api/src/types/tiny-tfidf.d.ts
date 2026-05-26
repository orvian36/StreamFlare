declare module "tiny-tfidf" {
  export class Corpus {
    constructor(names: string[], texts: string[]);
    getResultsForQuery(query: string): Array<[string, number]>;
    getDocumentVector(name: string): Map<string, number>;
  }
}
