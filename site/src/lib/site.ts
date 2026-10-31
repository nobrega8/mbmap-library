// Names and links used across the site. Links point at the repository on
// GitHub, which stays the place where maps are added and corrected.

import { REPO_URL, BRANCH, blobUrl } from "./registry.ts";
import type { Device } from "./registry.ts";

export const SITE_NAME = "MBMap";
export const TAGLINE = "The open registry for Modbus device maps";
export const SUBLINE = "One format. Any tool. A shared device registry.";

export const MODBENCH_URL = "https://github.com/nobrega8/modbench";

export const LINKS = {
  repo: REPO_URL,
  spec: blobUrl("SPEC.md"),
  schema: blobUrl("schema/mbmap-2.schema.json"),
  contributing: blobUrl("CONTRIBUTING.md"),
  compatibility: blobUrl("COMPATIBILITY.md"),
  example: blobUrl("examples/example-corp/em-100.mbmap.json"),
  license: blobUrl("LICENSE"),
  tests: `${REPO_URL}/tree/${BRANCH}/tests`,
  issues: `${REPO_URL}/issues`,
  discussions: `${REPO_URL}/discussions`,
  qa: `${REPO_URL}/discussions/categories/q-a`,
  ideas: `${REPO_URL}/discussions/categories/ideas`,
  showAndTell: `${REPO_URL}/discussions/categories/show-and-tell`,
  mapRequest: `${REPO_URL}/issues/new?template=2-map-request.yml`,
  testReport: `${REPO_URL}/issues/new?template=1-test-report.yml`,
  newMap: `${REPO_URL}/new/${BRANCH}/maps`,
  pulls: `${REPO_URL}/pulls`,
};

const q = (params: Record<string, string>) => new URLSearchParams(params).toString();

/** GitHub links for one map: the file, an edit (fork + pull request), and
    issues prefilled with the map's path. The test report form fills its
    "Map file" field (id "map") from the query. */
export function deviceLinks(d: Device) {
  const name = `${d.info.vendor} ${d.info.model}`;
  return {
    source: blobUrl(d.path),
    history: `${REPO_URL}/commits/${BRANCH}/${d.path}`,
    edit: `${REPO_URL}/edit/${BRANCH}/${d.path}`,
    testReport: `${REPO_URL}/issues/new?${q({ template: "1-test-report.yml", title: `Test report: ${name}`, map: d.path })}`,
    problem: `${REPO_URL}/issues/new?${q({
      title: `Problem in ${name} (${d.path})`,
      body: `Map: ${d.path}\nRevision: ${d.info.revision ?? "none"}\n\nWhat is wrong (register name or address, what the map says, what the device or its manual says):\n\n\nWhere the correct value comes from (manual title and version, or a test on a device with firmware ...):\n`,
    })}`,
  };
}
