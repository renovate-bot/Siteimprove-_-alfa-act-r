import * as fs from "fs";
import * as jsonld from "jsonld";

import { Document } from "@siteimprove/alfa-json-ld";
import { Page } from "@siteimprove/alfa-web";

import { Context } from "./context";

export async function report<T, Q, S>(
  context: Context<Page, T, Q, S>,
  out: string
) {
  const graph: Array<Document> = [];

  for (const [page, outcome] of context.outcomes) {
    const subject = page.toEARL();

    graph.push(subject);

    const assertion = outcome.toEARL();

    assertion["earl:test"] = outcome.rule.toEARL();

    assertion["earl:subject"] = {
      "@id": subject["@id"],
    };

    graph.push(assertion);
  }

  const compact = await jsonld.compact(
    graph as jsonld.JsonLdDocument,
    ACTContext
  );

  fs.writeFileSync(out, JSON.stringify(compact, null, 2));
}

/**
 * The JSON-LD context used by ACT rules CG
 * {@link https://act-rules.github.io/earl-context.json}
 */
// We want a local copy of the context to avoid network connexion when
// compacting JSON-LD documents.
const ACTContext = {
  "@vocab": "http://www.w3.org/ns/earl#",
  earl: "http://www.w3.org/ns/earl#",
  WCAG: "https://www.w3.org/TR/WCAG/#",
  WCAG10: "https://www.w3.org/TR/WCAG10/#",
  WCAG2: "https://www.w3.org/TR/WCAG2/#",
  WCAG20: "https://www.w3.org/TR/WCAG20/#",
  WCAG21: "https://www.w3.org/TR/WCAG21/#",
  WCAG22: "https://www.w3.org/TR/WCAG22/#",
  WCAG30: "https://www.w3.org/TR/wcag-3.0/#",
  dct: "http://purl.org/dc/terms/",
  sch: "https://schema.org/",
  doap: "http://usefulinc.com/ns/doap#",
  foaf: "http://xmlns.com/foaf/0.1/",
  ptr: "http://www.w3.org/2009/pointers#",
  cnt: "http://www.w3.org/2011/content#",
  "http-vocab": "http://www.w3.org/2011/http#",
  WebPage: "sch:WebPage",
  url: "dct:source",
  source: "dct:source",
  redirectedTo: "dct:source",
  title: "dct:title",
  Project: "doap:Project",
  Version: "doap:Version",
  name: "doap:name",
  description: "doap:description",
  shortdesc: "doap:shortdesc",
  created: "doap:created",
  release: "doap:release",
  revision: "doap:revision",
  homepage: {
    "@id": "doap:homepage",
    "@type": "@id",
  },
  license: {
    "@id": "doap:license",
    "@type": "@id",
  },
  assertedThat: {
    "@reverse": "assertedBy",
  },
  assertions: {
    "@reverse": "subject",
  },
  assertedBy: {
    "@type": "@id",
  },
  outcome: {
    "@type": "@id",
  },
  mode: {
    "@type": "@id",
  },
  pointer: {
    "@type": "ptr:CSSSelectorPointer",
  },
  isPartOf: {
    "@id": "dct:isPartOf",
    "@type": "@id",
  },
};