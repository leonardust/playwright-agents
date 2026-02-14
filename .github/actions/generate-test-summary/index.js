import fs from 'fs';

function getInput(name) {
  return process.env[`INPUT_${name.toUpperCase().replace(/-/g, '_')}`] || '';
}

function appendSummary(text) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, text + '\n');
  }
}

function parseTestResults(resultsPath) {
  if (!fs.existsSync(resultsPath)) {
    return null;
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let browser = '';
  let baseURL = 'N/A';

  // Parse nested structure: suites -> suites -> specs -> tests
  if (results.suites) {
    for (const suite of results.suites) {
      if (suite.suites) {
        for (const nestedSuite of suite.suites) {
          if (nestedSuite.specs) {
            for (const spec of nestedSuite.specs) {
              if (spec.tests) {
                total += spec.tests.length;
                for (const test of spec.tests) {
                  if (test.status === 'expected') passed++;
                  else if (test.status === 'unexpected') failed++;
                  else if (test.status === 'skipped') skipped++;

                  // Get browser from first test
                  if (!browser && test.projectName) {
                    browser = test.projectName;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Get base URL from config
  if (results.config?.projects?.[0]?.use?.baseURL) {
    baseURL = results.config.projects[0].use.baseURL;
  }

  return { total, passed, failed, skipped, browser, baseURL };
}

function generateSummary() {
  const resultsPath = getInput('results-path');
  const aiModel = getInput('ai-model');
  const reportUrl = getInput('report-url');

  console.log('Starting test summary generation...');
  console.log('Results path:', resultsPath);
  console.log('AI Model:', aiModel);
  console.log('Report URL:', reportUrl);

  appendSummary('## 🎭 Playwright Test Results');
  appendSummary('');

  const stats = parseTestResults(resultsPath);

  if (!stats) {
    console.log('No test results found at:', resultsPath);
    appendSummary('⚠️ No test results found');
    return;
  }

  console.log('Test stats:', JSON.stringify(stats));

  // Test Summary Table
  appendSummary('### 📊 Test Summary');
  appendSummary('| Metric | Count |');
  appendSummary('| ------ | ----- |');
  appendSummary(`| ✅ Passed | ${stats.passed} |`);
  appendSummary(`| ❌ Failed | ${stats.failed} |`);
  appendSummary(`| ⏭️ Skipped | ${stats.skipped} |`);
  appendSummary(`| 📝 Total | ${stats.total} |`);
  appendSummary('');

  // Test Environment Table
  appendSummary('### 🌐 Test Environment');
  appendSummary('| Property | Value |');
  appendSummary('| -------- | ----- |');
  if (stats.browser) {
    appendSummary(`| 🌐 Browser | ${stats.browser} |`);
  }
  appendSummary(`| 🔗 Base URL | ${stats.baseURL} |`);
  appendSummary(`| 🤖 AI Model | ${aiModel} |`);
  appendSummary('');

  // Reports Table
  appendSummary('### 📄 Reports');
  appendSummary('| Type | Link |');
  appendSummary('| ---- | ---- |');
  appendSummary(`| Playwright | [View HTML Report](${reportUrl}) |`);
}

try {
  generateSummary();
} catch (error) {
  console.error('Error generating test summary:', error);
  process.exit(1);
}
