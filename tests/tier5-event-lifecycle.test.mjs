/**
 * Tier 5: Event Lifecycle Consistency E2E Test Suite
 * CNCF Peshawar Automation Suite
 *
 * Regression coverage for the reported defect where an event whose `date`/`time`
 * had already elapsed was still rendered as the next upcoming meetup because the
 * page trusted the manually maintained `status` frontmatter field.
 *
 * Guarantees exercised here:
 * - Rendered lifecycle state is derived from the Asia/Karachi schedule, never from
 *   stale frontmatter, so an expired event can never be promoted.
 * - The conclusion boundary is the end of the scheduled window, not the start.
 * - A missing or unparseable time degrades safely to the local calendar day.
 * - Explicit cancellations win over the schedule.
 * - An unparseable schedule falls back to the stored editorial status instead of
 *   crashing or silently dropping the event.
 * - Sync, content schema, CMS config, and the test oracle agree on the status set.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { TestHarness, extractFrontmatter, validateEventFrontmatter } from './test-utils.mjs';

import { parseOcgEventHtml, stringifyFrontmatter, syncEvents, CANCELED_TAG } from '../scripts/sync-ocg-events.mjs';

import {
  CANCELED,
  COMPLETED,
  UPCOMING,
  countEventsByLifecycle,
  formatEventDateLabel,
  getEventSchedule,
  getEventStartTimestamp,
  isEventCanceled,
  resolveEventStatus,
  selectPastEvents,
  selectUpcomingEvents,
  sortEventsByStart
} from '../src/lib/event-lifecycle.mjs';

const EVENTS_DIR = path.resolve('src/content/events');

/** Wrap frontmatter in a minimal collection entry so the shared selectors can be used. */
function asEntry(frontmatter, slug = 'test-event') {
  return { slug, data: frontmatter };
}

function loadRepoEvent(slug) {
  const file = path.join(EVENTS_DIR, `${slug}.md`);
  const { frontmatter } = extractFrontmatter(fs.readFileSync(file, 'utf-8'));
  return asEntry(frontmatter, slug);
}

export async function runTier5Suite() {
  const suite = new TestHarness('Tier 5: Event Lifecycle Consistency');

  // =====================================================================
  // LIFECYCLE 1: The reported regression - expired event stays archived
  // =====================================================================
  suite.group('Lifecycle 1: Expired Events Can Never Be Promoted');

  await suite.test('L1: Shipped Genesis event renders as completed and is excluded from the upcoming list', () => {
    const genesis = loadRepoEvent('01-cncf-peshawar-genesis');
    const schedule = getEventSchedule(genesis.data);

    assert.ok(schedule, 'Genesis must expose a parseable Asia/Karachi schedule');
    assert.ok(
      schedule.endsAt.getTime() < Date.now(),
      'Fixture precondition: the Genesis schedule must already have elapsed'
    );

    // The decisive assertion: frontmatter may still say `upcoming`, but the rendered
    // lifecycle state must be `completed` regardless of what the editor wrote.
    assert.equal(
      resolveEventStatus(genesis.data),
      COMPLETED,
      'An elapsed event must never resolve as upcoming, even with stale status frontmatter'
    );

    assert.equal(
      selectUpcomingEvents([genesis]).length,
      0,
      'An expired event must not appear in the upcoming collection'
    );
    assert.equal(selectPastEvents([genesis]).length, 1, 'An expired event must appear in the archive');
  });

  await suite.test('L2: Stale `upcoming` frontmatter is overridden by the schedule in both spellings of status', () => {
    const stale = { date: '2026-09-04', time: '03:00 PM - 07:00 PM PKT', status: 'upcoming' };
    const missing = { date: '2026-09-04', time: '03:00 PM - 07:00 PM PKT' };

    for (const frontmatter of [stale, missing]) {
      assert.equal(
        resolveEventStatus(frontmatter, new Date('2026-09-21T00:00:00Z')),
        COMPLETED,
        'An expired event must resolve as completed regardless of the stored status'
      );
    }

    const future = { date: '2099-01-15', time: '03:00 PM - 07:00 PM PKT', status: 'completed' };
    assert.equal(
      resolveEventStatus(future, new Date('2026-09-21T00:00:00Z')),
      UPCOMING,
      'A future event must resolve as upcoming even if an editor prematurely marked it completed'
    );
  });

  // =====================================================================
  // LIFECYCLE 2: Timezone handling and conclusion boundary
  // =====================================================================
  suite.group('Lifecycle 2: Asia/Karachi Schedule and Conclusion Boundary');

  await suite.test('L3: Wall-clock times are interpreted in Asia/Karachi, not the build machine timezone', () => {
    const schedule = getEventSchedule({ date: '2026-09-04', time: '03:00 PM - 07:00 PM PKT' });

    assert.equal(
      schedule.startsAt.toISOString(),
      '2026-09-04T10:00:00.000Z',
      '15:00 PKT must resolve to 10:00 UTC (UTC+05:00)'
    );
    assert.equal(
      schedule.endsAt.toISOString(),
      '2026-09-04T14:00:00.000Z',
      '19:00 PKT must resolve to 14:00 UTC (UTC+05:00)'
    );
    assert.equal(getEventStartTimestamp({ date: '2026-09-04', time: '03:00 PM - 07:00 PM PKT' }), '2026-09-04T10:00:00.000Z');
  });

  await suite.test('L4: The event concludes at the end of the window, not at its start', () => {
    const event = { date: '2026-09-04', time: '03:00 PM - 07:00 PM PKT', status: 'upcoming' };
    const schedule = getEventSchedule(event);
    const at = (iso) => resolveEventStatus(event, new Date(iso));

    assert.equal(at('2026-09-04T09:59:59Z'), UPCOMING, 'Minutes before the start must stay upcoming');
    assert.equal(at('2026-09-04T10:00:00Z'), UPCOMING, 'The start instant itself must still be upcoming');
    assert.equal(at('2026-09-04T13:59:59Z'), UPCOMING, 'The final second of the session must still be upcoming');
    assert.equal(at(schedule.endsAt.toISOString()), COMPLETED, 'The exact end instant must be completed');
    assert.equal(at('2026-09-04T14:00:01Z'), COMPLETED, 'Any instant after the end must be completed');
  });

  await suite.test('L5: A missing or unparseable time degrades safely to the whole local calendar day', () => {
    for (const time of ['', 'TBD', 'When the venue is free', '99:99 PM - 88:88 AM PKT']) {
      const event = { date: '2026-09-04', time, status: 'upcoming' };
      const schedule = getEventSchedule(event);

      assert.ok(schedule, `Schedule must stay parseable for time=${JSON.stringify(time)}`);
      assert.equal(schedule.startsAt.toISOString(), '2026-09-03T19:00:00.000Z', `00:00 PKT start for time=${JSON.stringify(time)}`);
      assert.equal(schedule.endsAt.toISOString(), '2026-09-04T18:59:59.999Z', `23:59:59.999 PKT end for time=${JSON.stringify(time)}`);

      assert.equal(
        resolveEventStatus(event, new Date('2026-09-03T18:59:59Z')),
        UPCOMING,
        `The local day must not end before it begins (time=${JSON.stringify(time)})`
      );
      assert.equal(
        resolveEventStatus(event, new Date('2026-09-04T19:00:00Z')),
        COMPLETED,
        `Midnight PKT must close the local day (time=${JSON.stringify(time)})`
      );
    }
  });

  await suite.test('L6: An unparseable schedule falls back to the stored status instead of failing', () => {
    assert.equal(resolveEventStatus({ date: 'sometime soon', time: '03:00 PM - 07:00 PM PKT', status: 'upcoming' }), UPCOMING);
    assert.equal(resolveEventStatus({ date: 'sometime soon', time: '03:00 PM - 07:00 PM PKT', status: 'completed' }), COMPLETED);
    assert.equal(resolveEventStatus({ date: '', time: '', status: 'canceled' }), CANCELED);
    assert.equal(resolveEventStatus({}, new Date('2026-09-21T00:00:00Z')), UPCOMING, 'An empty entry must default safely');
    assert.equal(getEventSchedule({ date: 'sometime soon' }), null);
    assert.equal(getEventStartTimestamp({ date: 'sometime soon' }), null);
  });

  await suite.test('L7: Overnight and 24-hour ranges resolve without rolling into the wrong day', () => {
    const overnight = getEventSchedule({ date: '2026-09-04', time: '11:00 PM - 03:00 AM PKT' });
    assert.equal(overnight.startsAt.toISOString(), '2026-09-04T18:00:00.000Z', '23:00 PKT start');
    assert.equal(overnight.endsAt.toISOString(), '2026-09-04T22:00:00.000Z', 'A same-day end time must not roll past midnight');

    const midnight = getEventSchedule({ date: '2026-09-04', time: '12:00 AM - 06:00 AM PKT' });
    assert.equal(midnight.startsAt.toISOString(), '2026-09-03T19:00:00.000Z', '12:00 AM must be midnight, not noon');
  });

  // =====================================================================
  // LIFECYCLE 3: Cancellations
  // =====================================================================
  suite.group('Lifecycle 3: Cancellation Integrity');

  await suite.test('L8: An explicit cancellation wins over the schedule and both spellings are honoured', () => {
    const future = { date: '2099-01-15', time: '03:00 PM - 07:00 PM PKT', status: UPCOMING };

    assert.equal(resolveEventStatus({ ...future, status: CANCELED }), CANCELED, 'status: canceled must win');
    assert.equal(resolveEventStatus({ ...future, status: 'cancelled' }), CANCELED, 'The British spelling must be honoured');
    assert.equal(resolveEventStatus({ ...future, tags: [CANCELED_TAG] }), CANCELED, `The ${CANCELED_TAG} tag must win`);
    assert.equal(resolveEventStatus({ ...future, tags: ['Cancelled'] }), CANCELED, 'A Cancelled tag must win');

    assert.equal(isEventCanceled({ tags: [CANCELED_TAG] }), true);
    assert.equal(isEventCanceled({ tags: ['CloudNative'] }), false);
    assert.equal(
      resolveEventStatus({ date: '2026-09-04', time: '03:00 PM - 07:00 PM PKT', status: CANCELED }),
      CANCELED,
      'A cancelled past event must stay cancelled rather than being reported as completed'
    );
  });

  await suite.test('L9: Cancelled events are excluded from both rendered lists and counted separately', () => {
    const events = [
      asEntry({ date: '2099-01-15', time: '03:00 PM - 07:00 PM PKT', status: UPCOMING }, 'future'),
      asEntry({ date: '2026-09-04', time: '03:00 PM - 07:00 PM PKT', status: UPCOMING }, 'expired'),
      asEntry({ date: '2099-02-20', time: '03:00 PM - 07:00 PM PKT', status: CANCELED }, 'cancelled'),
      asEntry({ date: '2025-01-10', time: '03:00 PM - 07:00 PM PKT', status: COMPLETED }, 'archive')
    ];
    const now = new Date('2026-09-21T00:00:00Z');

    const upcoming = selectUpcomingEvents(events, now);
    const past = selectPastEvents(events, now);

    assert.deepEqual(upcoming.map((e) => e.slug), ['future'], 'Only the genuinely upcoming event may be promoted');
    assert.deepEqual(past.map((e) => e.slug), ['expired', 'archive'], 'The archive must include the expired event, newest first');

    const counts = countEventsByLifecycle(events, now);
    assert.deepEqual(counts, { upcoming: 1, completed: 2, canceled: 1, total: 4 });
    assert.equal(counts.total, events.length, 'Every event must be classified exactly once');
    assert.equal(
      counts.upcoming + counts.completed + counts.canceled,
      counts.total,
      'Lifecycle counts must sum to the collection size'
    );
    assert.equal(
      counts.upcoming,
      upcoming.length,
      'The upcoming telemetry count must agree with the rendered upcoming list'
    );
  });

  await suite.test('L10: Upcoming events are ordered by real schedule, not lexicographic date text', () => {
    const events = [
      asEntry({ date: '2099-12-05', time: '03:00 PM - 07:00 PM PKT', status: UPCOMING }, 'december'),
      asEntry({ date: '2099-02-20', time: '03:00 PM - 07:00 PM PKT', status: UPCOMING }, 'february'),
      asEntry({ date: '2099-07-04', time: '03:00 PM - 07:00 PM PKT', status: UPCOMING }, 'july')
    ];

    assert.deepEqual(
      selectUpcomingEvents(events, new Date('2026-09-21T00:00:00Z')).map((e) => e.slug),
      ['february', 'july', 'december'],
      'The nearest upcoming event must be featured first'
    );
    assert.equal(
      sortEventsByStart(events)[0].slug,
      'february',
      'sortEventsByStart must order by schedule instant'
    );
    assert.equal(
      sortEventsByStart(events, { descending: true })[0].slug,
      'december',
      'sortEventsByStart must support reverse ordering for the archive'
    );
  });

  // =====================================================================
  // LIFECYCLE 4: Date formatting safety
  // =====================================================================
  suite.group('Lifecycle 4: Presentation Helpers');

  await suite.test('L11: Date labels never throw on malformed input and never shift calendar days', () => {
    assert.equal(formatEventDateLabel('2026-09-04'), 'Sep 4, 2026');
    assert.equal(formatEventDateLabel('2026-09-04', { weekday: true }), 'Friday, September 4, 2026');
    assert.equal(formatEventDateLabel('2026-01-01'), 'Jan 1, 2026', 'A year boundary must not roll into the adjacent year');
    assert.equal(formatEventDateLabel('2026-09-04T14:00:00Z'), 'Sep 4, 2026', 'An ISO instant must use its calendar day, not a UTC-shifted one');
    assert.equal(formatEventDateLabel('sometime soon'), 'sometime soon', 'Unparseable input must be shown verbatim rather than crashing');
    assert.equal(formatEventDateLabel(''), 'Date TBA');
    assert.equal(formatEventDateLabel(undefined), 'Date TBA');
    assert.equal(formatEventDateLabel('2026-13-45'), '2026-13-45', 'An impossible calendar date must be rejected, not coerced');
  });

  // =====================================================================
  // LIFECYCLE 5: Sync writes the same lifecycle the site renders
  // =====================================================================
  suite.group('Lifecycle 5: Sync Agreement');

  await suite.test('L12: Sync persists the derived lifecycle for elapsed and cancelled events', async () => {
    const pastHtml = fs.readFileSync('tests/fixtures/ocg-portal-past.html', 'utf-8');
    const pastEvent = parseOcgEventHtml(pastHtml);
    assert.equal(pastEvent.status, COMPLETED, 'A past OCG event must be persisted as completed');

    // OCG marks a withdrawn session with a `[CANCELED]` title prefix on the listing card.
    const cancelledListing = parseOcgEventHtml(
      `<html><head><meta property="og:title" content="[CANCELED] Peshawar Hackathon"></head></html>`
    );
    assert.equal(cancelledListing.status, CANCELED, 'A [CANCELED] OCG title must persist as cancelled');
    assert.ok(cancelledListing.tags.includes(CANCELED_TAG), `A cancelled event must carry the ${CANCELED_TAG} tag`);
    assert.ok(
      cancelledListing.summary.toLowerCase().includes('cancel'),
      'The cancellation must be announced in the summary'
    );

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'l12-sync-'));
    try {
      await syncEvents({ source: 'tests/fixtures/ocg-portal-canceled.html', eventsDir: tempDir });

      const written = fs
        .readdirSync(tempDir)
        .map((file) => extractFrontmatter(fs.readFileSync(path.join(tempDir, file), 'utf-8')).frontmatter);

      assert.equal(written.length, 1, 'The cancelled event must round-trip to disk');
      assert.equal(written[0].status, CANCELED, 'Persisted frontmatter must carry the cancelled status');
      assert.ok(written[0].tags.includes(CANCELED_TAG), `Persisted tags must carry the ${CANCELED_TAG} marker`);
      assert.ok(
        validateEventFrontmatter(written[0]).success,
        'Persisted frontmatter must satisfy the shared event schema'
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('L13: Sync stays idempotent now that status is derived', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'l13-idempotent-'));
    try {
      const first = await syncEvents({ source: 'tests/fixtures/ocg-portal-canceled.html', eventsDir: tempDir });
      const second = await syncEvents({ source: 'tests/fixtures/ocg-portal-canceled.html', eventsDir: tempDir });

      assert.equal(first.created.length, 1);
      assert.deepEqual(second.created, [], 'A second pass must not re-create the event');
      assert.deepEqual(second.updated, [], 'A second pass must not re-write an unchanged event');
      assert.equal(second.unchanged.length, 1, 'Deriving status must not introduce sync churn');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('L13a: Sync never reactivates a locally cancelled event that OCG still lists as live', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'l13a-manual-cancel-'));
    const source = 'tests/fixtures/ocg-portal-upcoming.html';

    try {
      // First pass seeds the events from a non-cancelled OCG listing.
      const seeded = await syncEvents({ source, eventsDir: tempDir });
      const targetFile = path
        .join(tempDir, seeded.created.find((file) => file.includes('kubernetes-deep-dive')) ?? seeded.created[0]);
      assert.ok(seeded.created.length > 0, 'The fixture must seed at least one event');

      // The organiser then cancels it locally, by status and by the marker tag.
      const seededFile = targetFile;
      const seededRaw = fs.readFileSync(seededFile, 'utf-8');
      const seededFm = extractFrontmatter(seededRaw).frontmatter;
      const seededBody = seededRaw.split(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)[1] ?? '';
      assert.notEqual(seededFm.status, CANCELED, 'Fixture precondition: OCG lists this event as live');

      const manuallyCancelled = {
        ...seededFm,
        status: CANCELED,
        tags: Array.from(new Set([...(Array.isArray(seededFm.tags) ? seededFm.tags : []), CANCELED_TAG]))
      };
      fs.writeFileSync(seededFile, `${stringifyFrontmatter(manuallyCancelled)}\n\n${seededBody.trim()}\n`, 'utf8');

      // A later sync against the same, still-live OCG listing must not undo it.
      await syncEvents({ source, eventsDir: tempDir });

      const afterSync = extractFrontmatter(fs.readFileSync(seededFile, 'utf-8')).frontmatter;
      assert.equal(
        afterSync.status,
        CANCELED,
        'A cancellation recorded in the repository must survive a sync against a non-cancelled OCG listing'
      );
      assert.ok(
        Array.isArray(afterSync.tags) && afterSync.tags.includes(CANCELED_TAG),
        `The ${CANCELED_TAG} marker tag must survive the sync`
      );
      assert.equal(
        resolveEventStatus(afterSync),
        CANCELED,
        'The re-synced event must still render as cancelled, keeping RSVP buttons hidden'
      );

      // And the guarantee must be idempotent, not a one-off write.
      await syncEvents({ source, eventsDir: tempDir });
      const afterSecondSync = extractFrontmatter(fs.readFileSync(seededFile, 'utf-8')).frontmatter;
      assert.deepEqual(afterSecondSync, afterSync, 'Re-syncing a cancelled event must not churn the frontmatter');

      // The opposite direction still works: an OCG cancellation applies to an event
      // the repository has not cancelled, so upstream withdrawals are not ignored.
      const upstreamDir = fs.mkdtempSync(path.join(os.tmpdir(), 'l13a-upstream-'));
      try {
        const upstreamHtml = fs
          .readFileSync(source, 'utf-8')
          .replace('>Kubernetes Deep Dive', '>[CANCELED] Kubernetes Deep Dive');
        const upstreamFixture = path.join(upstreamDir, 'upstream-canceled.html');
        fs.writeFileSync(upstreamFixture, upstreamHtml, 'utf-8');

        await syncEvents({ source, eventsDir: upstreamDir });
        const target = fs
          .readdirSync(upstreamDir)
          .map((file) => path.join(upstreamDir, file))
          .find((file) => fs.readFileSync(file, 'utf-8').includes('Kubernetes Deep Dive'));

        await syncEvents({ source: upstreamFixture, eventsDir: upstreamDir });

        const upstreamFm = extractFrontmatter(fs.readFileSync(target, 'utf-8')).frontmatter;
        assert.equal(
          upstreamFm.status,
          CANCELED,
          'An OCG-reported cancellation must still be persisted for a locally live event'
        );
        assert.ok(
          Array.isArray(upstreamFm.tags) && upstreamFm.tags.includes(CANCELED_TAG),
          `An OCG cancellation must also carry the ${CANCELED_TAG} marker tag`
        );
      } finally {
        fs.rmSync(upstreamDir, { recursive: true, force: true });
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // LIFECYCLE 6: Ordering contract
  // =====================================================================
  suite.group('Lifecycle 6: Ordering Contract');

  await suite.test('L13b: Events with an unknown schedule always sort last, ascending and descending', () => {
    const events = [
      asEntry({ date: '2099-07-04', time: '03:00 PM - 07:00 PM PKT', status: UPCOMING }, 'july'),
      asEntry({ date: 'not a date', time: 'whenever', status: UPCOMING }, 'unknown-a'),
      asEntry({ date: '2099-02-20', time: '03:00 PM - 07:00 PM PKT', status: UPCOMING }, 'february'),
      asEntry({ date: 'sometime soon', time: '', status: UPCOMING }, 'unknown-b')
    ];

    assert.deepEqual(
      sortEventsByStart(events).map((e) => e.slug),
      ['february', 'july', 'unknown-a', 'unknown-b'],
      'Ascending order must push unknown schedules after every dated event'
    );
    assert.deepEqual(
      sortEventsByStart(events, { descending: true }).map((e) => e.slug),
      ['july', 'february', 'unknown-a', 'unknown-b'],
      'Descending order must not let the Infinity key sort unknown schedules first'
    );

    // The same contract holds through the archive selector used by the rendered pages.
    const archive = [
      asEntry({ date: '2025-01-10', time: '03:00 PM - 07:00 PM PKT', status: COMPLETED }, 'archive'),
      asEntry({ date: 'whenever', time: '', status: COMPLETED }, 'archive-unknown')
    ];
    assert.deepEqual(
      selectPastEvents(archive, new Date('2026-09-21T00:00:00Z')).map((e) => e.slug),
      ['archive', 'archive-unknown'],
      'The descending archive must still place unknown schedules last'
    );
    assert.deepEqual(
      selectUpcomingEvents(
        [
          asEntry({ date: 'whenever', time: '', status: UPCOMING }, 'upcoming-unknown'),
          asEntry({ date: '2099-07-04', time: '03:00 PM - 07:00 PM PKT', status: UPCOMING }, 'july'),
          asEntry({ date: '2099-02-20', time: '03:00 PM - 07:00 PM PKT', status: UPCOMING }, 'february')
        ],
        new Date('2026-09-21T00:00:00Z')
      ).map((e) => e.slug),
      ['february', 'july', 'upcoming-unknown'],
      'The upcoming selector must still place unknown schedules last'
    );
  });

  // =====================================================================
  // LIFECYCLE 7: Every consumer uses the shared resolver
  // =====================================================================
  suite.group('Lifecycle 6: Consumer and Configuration Agreement');

  await suite.test('L14: Schema, CMS config, and the test oracle all accept the same status set', () => {
    const schemaSource = fs.readFileSync('src/content/config.ts', 'utf-8');
    const cmsSource = fs.readFileSync('public/admin/config.yml', 'utf-8');
    const oracleSource = fs.readFileSync('tests/test-utils.mjs', 'utf-8');

    const schemaStatuses = schemaSource.match(/status:\s*z\.enum\(\[([^\]]+)\]/)[1];
    for (const status of ['upcoming', 'completed', 'canceled']) {
      assert.ok(schemaStatuses.includes(status), `src/content/config.ts must allow "${status}"`);
      assert.ok(oracleSource.includes(`'${status}'`), `tests/test-utils.mjs must allow "${status}"`);
      assert.ok(cmsSource.includes(`"${status}"`), `public/admin/config.yml must offer "${status}"`);
    }

    for (const status of ['upcoming', 'completed', 'canceled']) {
      assert.ok(
        validateEventFrontmatter({
          title: 'Test Meetup',
          date: '2099-01-15',
          time: '03:00 PM - 07:00 PM PKT',
          venue: 'NIC',
          status,
          rsvpUrl: 'https://ocgroups.dev/cncf/group/6vwk2n4/event/test',
          summary: 'A test meetup.'
        }).success,
        `The oracle must validate status "${status}"`
      );
    }

    assert.equal(
      validateEventFrontmatter({
        title: 'Test Meetup',
        date: '2099-01-15',
        time: '03:00 PM - 07:00 PM PKT',
        venue: 'NIC',
        status: 'postponed',
        rsvpUrl: 'https://ocgroups.dev/cncf/group/6vwk2n4/event/test',
        summary: 'A test meetup.'
      }).success,
      false,
      'The oracle must reject an unsupported status'
    );
  });

  await suite.test('L15: No Astro page or component may branch on raw frontmatter status', () => {
    const offenders = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name.endsWith('.astro') && /\.(status)\s*===|\bstatus\s*==/.test(fs.readFileSync(full, 'utf-8'))) {
          offenders.push(path.relative(process.cwd(), full));
        }
      }
    };
    walk('src');

    assert.deepEqual(
      offenders,
      [],
      `These files bypass src/lib/event-lifecycle.mjs and can render a stale lifecycle: ${offenders.join(', ')}`
    );
  });

  return suite.getSummary();
}