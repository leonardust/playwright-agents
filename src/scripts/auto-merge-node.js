import fs from 'fs';
import { getOctokit } from '@actions/github';

(async () => {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN not set');

    const eventPath = process.env.GITHUB_EVENT_PATH;
    const event =
      eventPath && fs.existsSync(eventPath) ? JSON.parse(fs.readFileSync(eventPath, 'utf8')) : {};

    const github = getOctokit(token);
    const context = { payload: event, repo: {} };
    if (event.repository && event.repository.owner) {
      context.repo.owner = event.repository.owner.login || event.repository.owner.name;
      context.repo.repo = event.repository.name;
    }

    const requiredChecks = [
      'GitGuardian Security Checks',
      'CodeQL',
      'Analyze (actions)',
      'Analyze (javascript-typescript)',
      'Analyze (python)',
      'dependabot-tests',
      'Prettier check',
    ];

    const pr_number = context.payload.pull_request && context.payload.pull_request.number;
    if (!pr_number) throw new Error('PR number not found in event payload');

    for (let attempt = 0; attempt < 60; attempt++) {
      const { data: pr } = await github.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pr_number,
      });

      const { data: checksData } = await github.rest.checks.listForRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: pr.head.sha,
      });

      let prettyLog = [];
      let anyFailed = false;
      const checkStatuses = requiredChecks.map(name => {
        const check = checksData.check_runs.find(c => c.name === name);
        let result;
        if (check) {
          if (check.conclusion === 'success') {
            result = '✅ SUCCESS';
          } else if (check.conclusion === 'failure') {
            result = '❌ FAILED';
            anyFailed = true;
          } else {
            result = `⏳ ${check.conclusion ? check.conclusion.toUpperCase() : 'PENDING'}`;
          }
        } else {
          result = '🚫 NOT FOUND';
        }
        prettyLog.push({ name, result });
        return check && check.conclusion === 'success';
      });

      console.log('==== REQUIRED CHECKS STATUS ====');
      prettyLog.forEach(entry => console.log(`- ${entry.name}: ${entry.result}`));
      console.log('================================');

      if (anyFailed) {
        throw new Error('At least one required check has failed. Auto-merge stopped.');
      }

      const allChecksPassed = checkStatuses.every(Boolean);
      if (
        pr.state === 'open' &&
        (pr.mergeable_state === 'clean' || pr.mergeable_state === 'unstable') &&
        allChecksPassed
      ) {
        await github.rest.pulls.merge({
          owner: context.repo.owner,
          repo: context.repo.repo,
          pull_number: pr_number,
          merge_method: 'squash',
        });
        console.log('PR has been auto-merged!');
        return;
      } else {
        console.log(`Attempt ${attempt + 1}: waiting for required checks to pass...`);
        await new Promise(r => setTimeout(r, 30000));
      }
    }

    throw new Error('Required checks did not pass in the expected time window. Auto-merge failed.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
