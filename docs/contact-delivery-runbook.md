# Contact Form Delivery & Relay Operational Runbook

**Service Name:** CNCF Peshawar Contact Ingestion Flow  
**Target Recipient:** `cncfpeshawar@gmail.com`  
**Relay Mechanism:** FormSubmit.co AJAX Endpoint (`https://formsubmit.co/ajax/cncfpeshawar@gmail.com`)  
**Public Route:** `/contact`

---

## 1. Architecture & Data Flow

```
[Visitor / Community Member]
            │
            ▼ (Browser JSON POST via AJAX)
[https://formsubmit.co/ajax/cncfpeshawar@gmail.com]
            │
            ▼ (Encrypted SMTP Relay)
[Organizer Inbox: cncfpeshawar@gmail.com]
```

- **Client Implementation:** Pure browser-side fetch (`Accept: application/json`, `Content-Type: application/json`).
- **No Private Keys / Secrets:** No API keys, passwords, or tokens are embedded in client-side bundles.
- **Privacy Policy & Processing Disclosure:** The `/contact` page explicitly discloses that FormSubmit processes submitted data as a transmission relay to deliver email, does not retain database records or track visitors for advertising, and links directly to [FormSubmit Privacy Policy](https://formsubmit.co/privacy).

---

## 2. Ownership & Mailbox Administration

| Responsibility | Designated Owner | Contact Channel |
|---|---|---|
| **Primary Inbox Access** | CNCF Peshawar Lead Organizers | `cncfpeshawar@gmail.com` |
| **FormSubmit Activation & Recovery** | Community Executive Organizers | CNCF Slack (`#peshawar`) / Organizers Channel |
| **Website Frontend Maintenance** | Chapter Tech Team & Maintainers | GitHub Repo (`cncf-peshawar/cncf-peshawar.github.io`) |

---

## 3. FormSubmit Recipient Activation Procedure

FormSubmit requires an initial one-time recipient verification to prevent unsolicited inbox spamming:

1. **Triggering First Submission:**
   - Submit a test inquiry on the `/contact` page with legitimate details.
2. **Receiving Activation Email:**
   - FormSubmit dispatches an email to `cncfpeshawar@gmail.com` with subject: `Action Required: Activate FormSubmit`.
3. **Activation Confirmation:**
   - An organizer logged into `cncfpeshawar@gmail.com` clicks the **"Activate Form"** verification button.
   - Once confirmed, FormSubmit automatically whitelists `cncfpeshawar@gmail.com` for incoming AJAX submissions originating from the website domain.
4. **Reactivation & Recovery:**
   - If the recipient email is ever modified or domain authorization is reset, an organizer must repeat the activation link confirmation within 24 hours.

---

## 4. Spam Controls & Ingestion Rules

- **Honeypot Field (`_honey`):** Hidden offscreen (`position: absolute; left: -9999px`), omitted from keyboard tab index (`tabindex="-1"`), and hidden from screen readers (`aria-hidden="true"`). Automated crawlers filling this field are silently dropped with no error feedback.
- **`_captcha: false` Setting:** Suppresses HTML captcha interstitials during AJAX requests so the client receives a structured JSON payload rather than an unexpected redirect.
- **Form Fields Validated:** Full Name, Email Address, Subject, and Message are required before dispatch.

---

## 5. Direct Email Fallback Protocol

If the FormSubmit relay encounters an outage, network failure, or returns a non-200 / unsuccessful response:
1. The form submission UI captures the failure and disables the loading state.
2. An error banner displays immediately with `role="status"` and `aria-live="polite"`.
3. The error banner includes an active, pre-filled `mailto:cncfpeshawar@gmail.com?subject=...&body=...` link so the sender can submit their message via their local email client without re-typing.
4. The `/contact` page permanently features direct email coordinates and one-click copy buttons in the Community Coordinates card.

---

## 6. Verification Checklist

- [x] Form submission succeeds and returns HTTP 200 with `{ "success": "true" }`.
- [x] Success message displays only after positive response from relay.
- [x] Direct email fallback is visible and operable on relay errors.
- [x] Honeypot prevents spam without hindering legitimate users.
- [x] Keyboard navigation and screen reader labels verified.
- [x] Speaker-support / CFP promises aligned with actual volunteer and equipment availability.
