import { getActImplementationReport } from "act-tools";
import { ActProcedureSet } from "act-tools/dist/map-implementation/types";

import * as fs from "fs";
import * as path from "path";

import { ignoredRules } from "../common/ignored-rules";

const pkg = JSON.parse(
  fs.readFileSync(path.join(".", "package.json"), "utf-8"),
);

const vendor = "Siteimprove";
const version = pkg.dependencies["@siteimprove/alfa-rules"].replace("^", "");

const testCases = JSON.parse(
  fs.readFileSync(
    path.join(".", "test", "fixtures", "testcases.json"),
    "utf-8",
  ),
).testcases;

main().then(() => {});

async function main() {
  await summary("automated");
  await summary("assisted");
}
async function summary(flavor: "automated" | "assisted") {
  const name = `Alfa (${flavor})`;
  const report = JSON.parse(
    fs.readFileSync(
      path.join(".", "reports", `alfa-${flavor}-report.json`),
      "utf-8",
    ),
  );

  const implementationReport = await getActImplementationReport(
    report,
    testCases,
    { vendor, name, version },
  );

  // uncomment to save raw implementation reports
  // fs.writeFileSync(
  //   `output-${flavor}.json`,
  //   JSON.stringify(implementationReport, null, 2),
  //   "utf-8",
  // );

  let ignored: Array<ActProcedureSet> = [],
    notImplemented: Array<ActProcedureSet> = [],
    complete: Array<ActProcedureSet> = [],
    partial: Array<ActProcedureSet> = [],
    broken: Array<ActProcedureSet> = [];

  for (const rule of implementationReport.actRuleMapping) {
    if (ignoredRules.includes(rule.ruleId)) {
      ignored.push(rule);
      continue;
    }

    if (rule.procedureNames.length === 0) {
      notImplemented.push(rule);
      continue;
    }

    switch (rule.consistency) {
      case "complete":
        complete.push(rule);
        break;
      case "partial":
        partial.push(rule);
        break;
      case null:
        broken.push(rule);
    }
  }

  const output =
    `# Summary for Alfa ${flavor}\n\n` +
    "This file is auto-generated by `yarn summary`; do not edit.\n\n" +
    `Last generated: ${new Date().toDateString()}\n\n` +
    mappingTable(broken, "## Rules with a broken implementation", true) +
    mappingTable(notImplemented, "## Rules without implementation", false) +
    mappingTable(partial, "## Rules with a partial implementation", true) +
    mappingTable(complete, "## Rules with a complete implementation", true) +
    mappingTable(
      ignored,
      "## Ignored rules (no implementation intended)",
      false,
    );

  fs.writeFileSync(
    path.join(".", "reports", `summary-${flavor}.md`),
    output,
    "utf-8",
  );
}

function mappingTable(
  rules: Array<ActProcedureSet>,
  heading: string,
  withCoverage: boolean,
): string {
  let content =
    heading + ` (${rules.length})` +
    "\n\n" +
    "| Id | Name | Alfa | Consistency |" +
    (withCoverage
      ? " Total | Covered | untested | cantTell | incorrect |\n"
      : "\n") +
    "| --- | --- | --- | --- |" +
    (withCoverage ? " --- | --- | --- | --- | --- |\n" : "\n");
  for (const rule of rules.sort(compare)) {
    const { covered, untested, cantTell, testCaseTotal } = rule.coverage ?? {
      covered: 0,
      untested: 0,
      cantTell: 0,
      testCaseTotal: 0,
    };

    content +=
      `| ${rule.ruleId} | ${rule.ruleName} |` +
      ` ${rule.procedureNames.join(", ")} | ${rule.consistency} |` +
      (withCoverage
        ? ` ${testCaseTotal} | ${covered} | ${untested} | ${cantTell} | ${
            testCaseTotal - covered - untested - cantTell
          } |\n`
        : ` \n`);
  }

  content += "\n";

  return content;
}

function compare(rule1: ActProcedureSet, rule2: ActProcedureSet): number {
  if (rule1.procedureNames.length === 0 || rule2.procedureNames.length === 0) {
    return rule1.ruleName.localeCompare(rule2.ruleName)
  } else {
    // Mapping SIA <-> ACT rule should be one-to-one.
    return rule1.procedureNames[0].localeCompare(rule2.procedureNames[0])
  }
}