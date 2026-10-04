#!/usr/bin/env node
/**
 * Master E2E Test Suite Runner
 * Cloud Native Peshawar Automation Suite
 * 
 * Orchestrates the comprehensive 4-tier opaque-box E2E test suite:
 * - Tier 1: Feature Coverage (F1 - F8)
 * - Tier 2: Boundary & Corner Cases (F1 - F8)
 * - Tier 3: Cross-Feature Integration (F1 - F8)
 * - Tier 4: Real-World Community Lifecycle Scenarios
 * 
 * Usage:
 *   node tests/e2e-runner.mjs
 *   npm test
 */

import { runTier1Suite } from './tier1-feature-coverage.test.mjs';
import { runTier2Suite } from './tier2-boundary-corner.test.mjs';
import { runTier3Suite } from './tier3-cross-feature.test.mjs';
import { runTier4Suite } from './tier4-real-world.test.mjs';

async function main() {
  const globalStart = Date.now();

  console.log(`\n================================================================================`);
  console.log(`🚀 STARTING CLOUD NATIVE PESHAWAR AUTOMATION 4-TIER E2E TEST RUNNER`);
  console.log(`================================================================================\n`);

  const results = [];

  // Run Tier 1
  try {
    const t1Start = Date.now();
    const t1 = await runTier1Suite();
    results.push({ name: 'Tier 1: Feature Coverage', ...t1, timeMs: Date.now() - t1Start });
  } catch (err) {
    console.error('Fatal error in Tier 1:', err);
    results.push({ name: 'Tier 1: Feature Coverage', total: 0, passed: 0, failed: 1, error: err, timeMs: 0 });
  }

  // Run Tier 2
  try {
    const t2Start = Date.now();
    const t2 = await runTier2Suite();
    results.push({ name: 'Tier 2: Boundary & Corner Cases', ...t2, timeMs: Date.now() - t2Start });
  } catch (err) {
    console.error('Fatal error in Tier 2:', err);
    results.push({ name: 'Tier 2: Boundary & Corner Cases', total: 0, passed: 0, failed: 1, error: err, timeMs: 0 });
  }

  // Run Tier 3
  try {
    const t3Start = Date.now();
    const t3 = await runTier3Suite();
    results.push({ name: 'Tier 3: Cross-Feature Integration', ...t3, timeMs: Date.now() - t3Start });
  } catch (err) {
    console.error('Fatal error in Tier 3:', err);
    results.push({ name: 'Tier 3: Cross-Feature Integration', total: 0, passed: 0, failed: 1, error: err, timeMs: 0 });
  }

  // Run Tier 4
  try {
    const t4Start = Date.now();
    const t4 = await runTier4Suite();
    results.push({ name: 'Tier 4: Real-World Scenarios', ...t4, timeMs: Date.now() - t4Start });
  } catch (err) {
    console.error('Fatal error in Tier 4:', err);
    results.push({ name: 'Tier 4: Real-World Scenarios', total: 0, passed: 0, failed: 1, error: err, timeMs: 0 });
  }

  const globalDuration = Date.now() - globalStart;

  // Aggregate totals
  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;

  console.log(`\n================================================================================`);
  console.log(`📊 MASTER E2E TEST EXECUTION SUMMARY`);
  console.log(`================================================================================`);
  console.log(`| Tier                                     | Total | Passed | Failed | Duration |`);
  console.log(`|------------------------------------------|-------|--------|--------|----------|`);

  for (const r of results) {
    grandTotal += r.total || 0;
    grandPassed += r.passed || 0;
    grandFailed += r.failed || 0;
    const paddedName = r.name.padEnd(40, ' ');
    const paddedTotal = String(r.total || 0).padStart(5, ' ');
    const paddedPassed = String(r.passed || 0).padStart(6, ' ');
    const paddedFailed = String(r.failed || 0).padStart(6, ' ');
    const paddedDuration = `${r.timeMs}ms`.padStart(8, ' ');
    console.log(`| ${paddedName} | ${paddedTotal} | ${paddedPassed} | ${paddedFailed} | ${paddedDuration} |`);
  }

  console.log(`|------------------------------------------|-------|--------|--------|----------|`);
  const paddedGrandName = 'TOTAL / OVERALL'.padEnd(40, ' ');
  const paddedGrandTotal = String(grandTotal).padStart(5, ' ');
  const paddedGrandPassed = String(grandPassed).padStart(6, ' ');
  const paddedGrandFailed = String(grandFailed).padStart(6, ' ');
  const paddedGrandDuration = `${globalDuration}ms`.padStart(8, ' ');
  console.log(`| ${paddedGrandName} | ${paddedGrandTotal} | ${paddedGrandPassed} | ${paddedGrandFailed} | ${paddedGrandDuration} |`);
  console.log(`================================================================================`);

  if (grandFailed === 0) {
    console.log(`\n✨ ALL ${grandTotal} E2E TESTS PASSED SUCCESSFULLY! (100% Pass Rate)`);
    console.log(`⏱️ Total Execution Time: ${globalDuration}ms\n`);
    process.exit(0);
  } else {
    console.error(`\n❌ ${grandFailed} TEST(S) FAILED OUT OF ${grandTotal}.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal Runner Exception:', err);
  process.exit(1);
});
