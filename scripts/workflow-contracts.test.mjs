import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const agent = (name) => read(`agents/${name}.agent.md`);
const skill = (name) => read(`skills/${name}/SKILL.md`);
const implementation = agent('implementation-workflow-orchestrator');
const rules = skill('implementation-rules');
const implementationState = skill('implementation-workflow-state-machine');

test('static contract: effective requirements reach all implementation consumers', () => {
  for (const [name, file] of [
    ['Feature Implementer', 'feature-implementer'],
    ['Test Generator', 'test-generator'],
    ['Goal Verifier', 'goal-verifier'],
  ]) {
    const dispatch = implementation.split('\n').find((line) =>
      line.includes(`**${name}**`) && line.includes('`effectiveRequirements`'));
    assert.ok(dispatch, `${name} dispatch must supply effective requirements`);
    assert.match(agent(file), /\|[^\n]*`effectiveRequirements`[^\n]*\|/);
  }
  assert.match(implementation, /compare `artifacts\.changedFiles` with `specDigest\.plannedFiles`/);
  assert.match(skill('implementation-requirement-reconciliation'), /With `approval: null`, both lists must equal the original digest/);
});

test('static contract: consumer execution does not authorize consumer edits', () => {
  const generator = agent('test-generator');
  assert.match(generator, /Run unchanged consumers too/);
  assert.match(generator, /Consumer execution grants no edit permission/);
  assert.match(generator, /recompute affected consumer targets/);
  assert.match(implementation, /including unchanged consumer failures/);
  assert.match(implementation, /coverage absent because tests failed follows `TEST_FAIL` first/);
});

test('static contract: coverage evidence has identity, counters and comparable reports', () => {
  const generator = agent('test-generator');
  for (const field of [
    'baselineRef', 'testedRevision', 'requirementsKey', 'coverageConfigKey',
    'requiredTargets', 'dependencies', 'changedLines', 'changedBranches',
    'diffKey', 'sourceFiles', 'runId',
  ]) assert.ok(generator.includes(`${field}:`), `missing coverage field ${field}`);
  for (const measurement of ['baseline', 'current']) {
    assert.ok(generator.includes(`${measurement}: {revision, scopeKey, coverageConfigKey`));
  }
  assert.match(rules, /never sum overlapping totals or average percentages/);
  assert.match(rules, /A verified zero denominator is not applicable/);
  assert.match(rules, /Missing baseline\/current data or incomparable reports yields `unavailable`/);
  assert.match(implementationState, /Legacy percentages cannot satisfy the new gates/);
  const merge = implementation.indexOf('5. Merge `testResult`');
  const gates = implementation.indexOf('6. Gates use the merged');
  assert.ok(merge >= 0 && gates > merge, 'merge current evidence before gates');
});

test('static contract: independent reviewers receive prior results and return provenance', () => {
  for (const [name, file] of [
    ['Code Reviewer', 'code-reviewer'],
    ['Rubber Duck Reviewer', 'rubber-duck-reviewer'],
    ['Goal Verifier', 'goal-verifier'],
  ]) {
    assert.ok(implementation.split('\n').some((line) =>
      line.includes(`**${name}**`) && line.includes('`reviewContext`')));
    assert.match(agent(file), /`reviewEvidence`/);
  }
  for (const field of ['priorResult', 'invalidatedKeys', 'retainedKeys', 'runId']) {
    assert.ok(implementationState.includes(`${field}:`), `missing review field ${field}`);
  }
  assert.doesNotMatch(implementation, /re-run only the reviewer whose gate failed|where its gate already passed/);
  assert.match(implementation, /including previously satisfied ones/);
  assert.match(rules, /Unknown dependency coverage means re-run the full applicable check/);
  assert.match(rules, /Even the last allowed fix must receive fresh applicable reviews/);
  assert.match(implementationState, /reviewIterations: \{0-2\}/);
  assert.match(implementation, /Revalidate when the user answers/);
  assert.match(read('skills/dotnet-code-review-output/SKILL.md'), /shared `reviewEvidence` extension/);
});

test('static contract: all CONTEXT mutation paths finalize validation and versions', () => {
  const orchestrator = agent('specs-workflow-orchestrator');
  for (const prefix of [
    '- **F, localised**',
    '- **Confirmed or corrected assumptions only**',
    '- **A pattern chosen',
  ]) {
    const path = orchestrator.split('\n').find((line) => line.startsWith(prefix));
    assert.ok(path?.includes('validation/checkpoint steps only'), prefix);
  }
  assert.match(orchestrator, /Before any CONTEXT write in Steps 3\/3a\/3b/);
  assert.match(orchestrator, /Enter only with current-version `researchValidationComplete`/);
  const finalized = orchestrator.indexOf('4. Set `artifacts.technicalContextPath`');
  assert.ok(finalized >= 0 && orchestrator.indexOf('5. A critical-gate failure') > finalized);
  assert.match(skill('tech-researcher-common'), /Do not write workflow state, `contextVersion`, `contextMutation`, or research checkpoints/);
});

test('static contract: resume distinguishes pending writes from external CONTEXT changes', () => {
  const state = skill('specs-workflow-state-machine');
  assert.match(state, /contextMutation: \{source, baseVersion, request\} \| null/);
  assert.match(state, /written before dispatch or direct editing/);
  assert.match(state, /Once all CONTEXT writes are finished/);
  assert.match(state, /clear `contextMutation` in the same state write/);
  assert.match(state, /only for a passing validation/);
  assert.match(state, /compare it with the saved request/);
  assert.match(state, /invalidates all old research validation and approval checkpoints/);
  assert.match(state, /Do not silently overwrite external edits/);
  assert.match(state, /including when the saved step is GENERATE or VALIDATE/);
});