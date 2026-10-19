const { spawnSync } = require('child_process');
const path = require('path');

const testSuites = [
  { name: 'Authentication & RBAC (Feature 0)', file: 'test-auth-apis.js' },
  { name: 'FIR Review & Registration (Feature 2)', file: 'test-fir-registration-apis.js' },
  { name: 'Case Assignment & Investigation (Feature 3)', file: 'test-case-investigation-apis.js' },
  { name: 'Evidence Management & Chain of Custody (Feature 4)', file: 'test-evidence-apis.js' },
  { name: 'Citizen Tracking & Notifications (Feature 5)', file: 'test-tracking-notifications-apis.js' },
  { name: 'Audit Trail & Analytics Reporting (Feature 6)', file: 'test-audit-reporting-apis.js' }
];

console.log('=================================================================');
console.log('     Executing All System Test Suites (Features 0 to 6)          ');
console.log('=================================================================\n');

let totalPassed = 0;
let totalFailed = 0;

for (const suite of testSuites) {
  console.log(`\n▶ Running: ${suite.name} (${suite.file})...`);
  const scriptPath = path.join(__dirname, suite.file);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: process.env
  });

  if (result.status === 0) {
    console.log(`✅ [SUITE PASSED] ${suite.name}`);
    totalPassed++;
  } else {
    console.log(`❌ [SUITE FAILED] ${suite.name} (Exit code: ${result.status})`);
    totalFailed++;
  }
}

console.log('\n=================================================================');
console.log(`   Final Summary: ${totalPassed} Suites Passed, ${totalFailed} Suites Failed`);
console.log('=================================================================\n');

if (totalFailed > 0) {
  process.exit(1);
}
