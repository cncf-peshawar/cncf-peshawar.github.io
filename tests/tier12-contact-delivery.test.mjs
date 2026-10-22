/**
 * Tier 12: Contact delivery response handling and disclosure accuracy
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildContactMailto,
  isSuccessfulFormSubmitResponse,
  submitContactPayload
} from '../public/scripts/contact-form.js';
import { TestHarness } from './test-utils.mjs';

function mockResponse(ok, data, parseError = false) {
  return {
    ok,
    async json() {
      if (parseError) throw new SyntaxError('invalid JSON');
      return data;
    }
  };
}

export async function runTier12Suite() {
  const suite = new TestHarness('Tier 12: Contact Delivery');

  suite.group('FormSubmit response validation');

  await suite.test('CD1: Boolean and string true responses are accepted', () => {
    assert.equal(isSuccessfulFormSubmitResponse(true, { success: true }), true);
    assert.equal(isSuccessfulFormSubmitResponse(true, { success: 'true' }), true);
  });

  await suite.test('CD2: Boolean and string false responses are rejected', () => {
    assert.equal(isSuccessfulFormSubmitResponse(true, { success: false }), false);
    assert.equal(isSuccessfulFormSubmitResponse(true, { success: 'false' }), false);
  });

  await suite.test('CD3: Empty, malformed-shaped, and unsuccessful responses are rejected', () => {
    assert.equal(isSuccessfulFormSubmitResponse(true, null), false);
    assert.equal(isSuccessfulFormSubmitResponse(true, {}), false);
    assert.equal(isSuccessfulFormSubmitResponse(false, { success: true }), false);
  });

  await suite.test('CD4: Submission requires a valid positive JSON response', async () => {
    const accepted = await submitContactPayload(
      async () => mockResponse(true, { success: true }),
      'https://example.test/contact',
      { message: 'test' }
    );
    assert.equal(accepted.success, true);

    await assert.rejects(() => submitContactPayload(
      async () => mockResponse(true, null, true),
      'https://example.test/contact',
      { message: 'test' }
    ));
  });

  await suite.test('CD5: Network and relay failures reject the submission', async () => {
    await assert.rejects(() => submitContactPayload(
      async () => { throw new Error('network unavailable'); },
      'https://example.test/contact',
      { message: 'test' }
    ), /network unavailable/);

    await assert.rejects(() => submitContactPayload(
      async () => mockResponse(false, { success: false }),
      'https://example.test/contact',
      { message: 'test' }
    ));
  });

  suite.group('Fallback and public disclosure');

  await suite.test('CD6: Direct-email fallback preserves and encodes user input', () => {
    const link = buildContactMailto(
      'cncfpeshawar@gmail.com',
      'Talk & workshop',
      'Line one\nLine two?'
    );
    assert.equal(
      link,
      'mailto:cncfpeshawar@gmail.com?subject=Talk%20%26%20workshop&body=Line%20one%0ALine%20two%3F'
    );
  });

  await suite.test('CD7: Contact page uses the tested module and avoids delivery claims', () => {
    const page = fs.readFileSync('src/pages/contact.astro', 'utf8');
    const script = fs.readFileSync('public/scripts/contact-form.js', 'utf8');
    assert.match(page, /data-contact-email=\{CONTACT_EMAIL\}/);
    assert.match(page, /scripts\/contact-form\.js/);
    assert.doesNotMatch(script, /Message sent successfully|delivered successfully/i);
    assert.match(script, /accepted your message for processing/i);
    assert.match(script, /form needs activation/i);
  });

  await suite.test('CD8: Disclosure states FormSubmit retention and archive access', () => {
    const page = fs.readFileSync('src/pages/contact.astro', 'utf8');
    const runbook = fs.readFileSync('docs/contact-delivery-runbook.md', 'utf8');
    assert.match(page, /retain submission data for up to 30 days/i);
    assert.match(page, /submission archive/i);
    assert.match(runbook, /retain it for up to 30 days/i);
    assert.doesNotMatch(runbook, /does not retain database records|Encrypted SMTP Relay/i);
  });

  await suite.test('CD9: Organizer-only delivery checks remain pending', () => {
    const runbook = fs.readFileSync('docs/contact-delivery-runbook.md', 'utf8');
    assert.match(runbook, /message reaches `cncfpeshawar@gmail\.com` \| Pending/i);
    assert.match(runbook, /Do not mark the production-delivery rows complete/i);
  });

  suite.printResults();
  return suite.getSummary();
}

if (process.argv[1]?.endsWith('tier12-contact-delivery.test.mjs')) {
  runTier12Suite()
    .then(summary => process.exit(summary.failed > 0 ? 1 : 0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
