# Contact Form Delivery Runbook

**Target Recipient:** `cncfpeshawar@gmail.com`  
**Relay:** FormSubmit.co AJAX endpoint (`https://formsubmit.co/ajax/cncfpeshawar@gmail.com`)
**Public Route:** `/contact`

---

## 1. Architecture & Data Flow

```
[Visitor / Community Member]
            │
            ▼ (Browser JSON POST via AJAX)
[https://formsubmit.co/ajax/cncfpeshawar@gmail.com]
            │
            ▼ (FormSubmit forwards the submission)
[Organizer Inbox: cncfpeshawar@gmail.com]
```

- The browser sends JSON to FormSubmit with `Accept: application/json` and `Content-Type: application/json`.
- The client bundle contains no API keys, passwords, or tokens.
- FormSubmit processes each submission, forwards it to the organizer inbox, and may retain it for up to 30 days in a submission archive. See the [FormSubmit documentation](https://formsubmit.co/documentation) and [privacy policy](https://formsubmit.co/privacy).

---

## 2. Ownership & Mailbox Administration

| Responsibility | Designated Owner | Contact Channel |
|---|---|---|
| **Primary Inbox Access** | CNCF Peshawar Lead Organizers | `cncfpeshawar@gmail.com` |
| **FormSubmit Activation & Recovery** | Community Executive Organizers | CNCF Slack (`#peshawar`) / Organizers Channel |
| **Website Frontend Maintenance** | Chapter Tech Team & Maintainers | GitHub Repo (`cncf-peshawar/cncf-peshawar.github.io`) |

---

## 3. FormSubmit Recipient Activation

FormSubmit requires an initial one-time recipient verification to prevent unsolicited inbox spamming:

1. **Triggering First Submission:**
   - Submit a test inquiry on the `/contact` page with legitimate details.
2. **Receiving Activation Email:**
   - FormSubmit dispatches an email to `cncfpeshawar@gmail.com` with subject: `Action Required: Activate FormSubmit`.
3. **Activation Confirmation:**
   - An organizer logged into `cncfpeshawar@gmail.com` clicks the **"Activate Form"** verification button.
   - FormSubmit then accepts submissions for `cncfpeshawar@gmail.com`.
4. **Reactivation & Recovery:**
   - If the recipient address changes or FormSubmit resets activation, an organizer repeats this procedure.

---

## 4. Spam Controls & Ingestion Rules

- **Honeypot Field (`_honey`):** Hidden offscreen (`position: absolute; left: -9999px`), omitted from keyboard tab index (`tabindex="-1"`), and hidden from screen readers (`aria-hidden="true"`). Automated crawlers filling this field are silently dropped with no error feedback.
- **`_captcha: false` Setting:** Disables FormSubmit's CAPTCHA. FormSubmit warns that disabling CAPTCHA can trigger service limits. Keep the honeypot and monitor legitimate delivery after changes.
- **Form Fields Validated:** Full Name, Email Address, Subject, and Message are required before dispatch.

---

## 5. Direct Email Fallback Protocol

If the FormSubmit relay encounters an outage, network failure, or returns a non-200 / unsuccessful response:
1. The form submission UI captures the failure and disables the loading state.
2. An error banner displays immediately with `role="status"` and `aria-live="polite"`.
3. The error banner includes an active, pre-filled `mailto:cncfpeshawar@gmail.com?subject=...&body=...` link so the sender can submit their message via their local email client without re-typing.
4. The `/contact` page permanently features direct email coordinates and one-click copy buttons in the Community Coordinates card.

---

## 6. Verification Record

Automated tests cover response parsing, validation, and the fallback link. An organizer must complete the inbox checks after each production deployment that changes the form.

| Check | Status | Date | Tester | Evidence |
|---|---|---|---|---|
| FormSubmit accepts a production submission from a non-organizer address | Pending | | | Record the response and test message identifier |
| The message reaches `cncfpeshawar@gmail.com` | Pending | | | Record the inbox timestamp and subject; do not store message contents here |
| The message avoids silent spam filtering | Pending | | | Check Inbox and Spam |
| Keyboard navigation works on mobile and desktop | Pending | | | Record browsers and devices |
| Screen-reader labels and status announcements work | Pending | | | Record screen reader and browser |
| Relay failure shows the prefilled direct-email fallback | Covered by automated and browser tests | | | Link the CI run and browser-test note |
| Success UI requires a valid positive FormSubmit response | Covered by automated tests | | | Link the CI run |

Do not mark the production-delivery rows complete until the organizer confirms the message in the destination inbox.
