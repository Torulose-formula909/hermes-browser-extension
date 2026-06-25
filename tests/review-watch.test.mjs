import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReviewTargets,
  reviewTargetSignature,
  shouldReviewTarget,
} from '../scripts/hermes-review-watch.mjs';

test('reviewTargetSignature tracks PR head sha and issue title/body without comment churn', () => {
  const pr = { kind: 'pull_request', number: 4, title: 'Remote gateway', body: 'body', headSha: 'abc123' };
  assert.equal(reviewTargetSignature(pr), reviewTargetSignature({ ...pr, updatedAt: 'later' }));
  assert.notEqual(reviewTargetSignature(pr), reviewTargetSignature({ ...pr, headSha: 'def456' }));

  const issue = { kind: 'issue', number: 9, title: 'Mic broken', body: 'steps' };
  assert.equal(reviewTargetSignature(issue), reviewTargetSignature({ ...issue, updatedAt: 'comment changed timestamp' }));
  assert.notEqual(reviewTargetSignature(issue), reviewTargetSignature({ ...issue, body: 'new steps' }));
});

test('shouldReviewTarget skips unchanged signatures and reviews changed ones', () => {
  const target = { kind: 'issue', number: 2, title: 'Bug', body: 'A' };
  const signature = reviewTargetSignature(target);
  assert.equal(shouldReviewTarget(target, {}), true);
  assert.equal(shouldReviewTarget(target, { 'issue:2': signature }), false);
  assert.equal(shouldReviewTarget({ ...target, body: 'B' }, { 'issue:2': signature }), true);
});

test('buildReviewTargets normalizes PR and issue API payloads', () => {
  const targets = buildReviewTargets({
    prs: [{ number: 1, title: 'PR', body: '', html_url: 'https://x/pr/1', user: { login: 'alice' }, head: { sha: 'sha1' } }],
    issues: [
      { number: 2, title: 'Issue', body: 'body', html_url: 'https://x/issues/2', user: { login: 'bob' } },
      { number: 3, title: 'Backed PR', pull_request: { url: 'https://api/pr/3' } },
    ],
  });
  assert.deepEqual(targets.map((target) => `${target.kind}:${target.number}`), ['pull_request:1', 'issue:2']);
  assert.equal(targets[0].headSha, 'sha1');
  assert.equal(targets[1].author, 'bob');
});
