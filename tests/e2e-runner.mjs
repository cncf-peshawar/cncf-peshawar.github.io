#!/usr/bin/env node
/**
 * Master E2E Test Suite Runner
 * Cloud Native Peshawar Automation Suite
 * 
 * Orchestrates the comprehensive 9-tier opaque-box E2E test suite:
 * - Tier 1: Feature Coverage (F1 - F8)
 * - Tier 2: Boundary & Corner Cases (F1 - F8)
 * - Tier 3: Cross-Feature Integration (F1 - F8)
 * - Tier 4: Real-World Community Lifecycle Scenarios
 * - Tier 5: Event Lifecycle Consistency (derived state, timezone, cancellation)
 * - Tier 6: Homepage Hero Responsive Hierarchy
 * - Tier 7: Mobile Header Action Hierarchy
 * - Tier 8: Mobile Nav Drawer Overflow & Accessibility
 * - Tier 9: Mobile Touch Target Sizes
 * 
 * Usage:
 *   node tests/e2e-runner.mjs
 *   npm test
 */

import { runTier1Suite } from './tier1-feature-coverage.test.mjs';
import { runTier2Suite } from './tier2-boundary-corner.test.mjs';
import { runTier3Suite } from './tier3-cross-feature.test.mjs';
import { runTier4Suite } from './tier4-real-world.test.mjs';
import { runTier5Suite } from './tier5-event-lifecycle.test.mjs';
import { runTier6Suite } from './tier6-hero-responsive.test.mjs';
import { runTier7Suite } from './tier7-mobile-header.test.mjs';
import { runTier8Suite } from './tier8-nav-drawer-overflow.test.mjs';
import { runTier9Suite } from './tier9-touch-targets.test.mjs';

async function main() {
  const globalStart = Date.now();

  console.log(`\n================================================================================`);
  console.log(`🚀 STARTING CLOUD NATIVE PESHAWAR AUTOMATION 9-TIER E2E TEST RUNNER`);
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

  // Run Tier 5
  try {
    const t5Start = Date.now();
    const t5 = await runTier5Suite();
    results.push({ name: 'Tier 5: Event Lifecycle Consistency', ...t5, timeMs: Date.now() - t5Start });
  } catch (err) {
    console.error('Fatal error in Tier 5:', err);
    results.push({ name: 'Tier 5: Event Lifecycle Consistency', total: 0, passed: 0, failed: 1, error: err, timeMs: 0 });
  }

  // Run Tier 6
  try {
    const t6Start = Date.now();
    const t6 = await runTier6Suite();
    results.push({ name: 'Tier 6: Hero Responsive Hierarchy', ...t6, timeMs: Date.now() - t6Start });
  } catch (err) {
    console.error('Fatal error in Tier 6:', err);
    results.push({ name: 'Tier 6: Hero Responsive Hierarchy', total: 0, passed: 0, failed: 1, error: err, timeMs: 0 });
  }

  // Run Tier 7
  try {
    const t7Start = Date.now();
    const t7 = await runTier7Suite();
    results.push({ name: 'Tier 7: Mobile Header Action Hierarchy', ...t7, timeMs: Date.now() - t7Start });
  } catch (err) {
    console.error('Fatal error in Tier 7:', err);
    results.push({ name: 'Tier 7: Mobile Header Action Hierarchy', total: 0, passed: 0, failed: 1, error: err, timeMs: 0 });
  }

  // Run Tier 8
  try {
    const t8Start = Date.now();
    const t8 = await runTier8Suite();
    results.push({ name: 'Tier 8: Nav Drawer Overflow & Accessibility', ...t8, timeMs: Date.now() - t8Start });
  } catch (err) {
    console.error('Fatal error in Tier 8:', err);
    results.push({ name: 'Tier 8: Nav Drawer Overflow & Accessibility', total: 0, passed: 0, failed: 1, error: err, timeMs: 0 });
  }

  // Run Tier 9
  try {
    const t9Start = Date.now();
    const t9 = await runTier9Suite();
    results.push({ name: 'Tier 9: Mobile Touch Target Sizes', ...t9, timeMs: Date.now() - t9Start });
  } catch (err) {
    console.error('Fatal error in Tier 9:', err);
    results.push({ name: 'Tier 9: Mobile Touch Target Sizes', total: 0, passed: 0, failed: 1, error: err, timeMs: 0 });
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
