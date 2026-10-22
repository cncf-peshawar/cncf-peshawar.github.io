export function isSuccessfulFormSubmitResponse(responseOk, data) {
  if (!responseOk || !data || typeof data !== 'object') return false;
  return data.success === true || data.success === 'true';
}

export function buildContactMailto(email, subject, message) {
  const subjectEncoded = encodeURIComponent(subject.trim() || 'CNCF Peshawar Inquiry');
  const bodyEncoded = encodeURIComponent(message.trim());
  return `mailto:${email}?subject=${subjectEncoded}&body=${bodyEncoded}`;
}

export async function submitContactPayload(fetchImpl, endpoint, payload) {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!isSuccessfulFormSubmitResponse(response.ok, data)) {
    throw new Error('FormSubmit did not return a confirmed acceptance response');
  }

  return data;
}

export function initContactPage() {
  const form = document.getElementById('contact-form');
  if (!(form instanceof HTMLFormElement) || form.dataset.contactInitialized === 'true') return;

  const contactEmail = form.dataset.contactEmail;
  const submitBtn = document.getElementById('contact-submit-btn');
  const submitLabel = document.getElementById('contact-submit-label');
  const resultEl = document.getElementById('contact-result');
  const subjectField = document.getElementById('contact-subject-field');
  const userSubjectField = document.getElementById('contact-subject');
  const messageField = document.getElementById('contact-message');
  const copyBtn = document.getElementById('copy-email-btn');

  if (!contactEmail || !(submitBtn instanceof HTMLButtonElement) || !submitLabel || !resultEl ||
      !(subjectField instanceof HTMLInputElement) || !(userSubjectField instanceof HTMLInputElement) ||
      !(messageField instanceof HTMLTextAreaElement)) return;

  form.dataset.contactInitialized = 'true';
  const radios = form.querySelectorAll('input[name="inquiry_type"]');

  function syncRadioClasses() {
    radios.forEach((radio) => {
      radio.closest('.radio-card')?.classList.toggle('is-checked', radio.checked);
    });
  }

  function showResult(message, state) {
    resultEl.textContent = message;
    resultEl.className = `form-result is-${state}`;
    resultEl.hidden = false;
  }

  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(contactEmail);
      copyBtn.textContent = 'Copied! ✓';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    } catch {
      const selection = window.getSelection();
      const emailLink = document.querySelector('.coordinate-row__value');
      if (emailLink && selection) {
        const range = document.createRange();
        range.selectNodeContents(emailLink);
        selection.removeAllRanges();
        selection.addRange(range);
        copyBtn.textContent = 'Selected (Ctrl+C)';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2500);
      }
    }
  });

  syncRadioClasses();
  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        subjectField.value = `CNCF Peshawar [${radio.value}] — ${userSubjectField.value || 'Inquiry'}`;
      }
      syncRadioClasses();
    });
  });

  userSubjectField.addEventListener('input', () => {
    const selectedRadio = form.querySelector('input[name="inquiry_type"]:checked');
    const prefix = selectedRadio ? `CNCF Peshawar [${selectedRadio.value}] — ` : 'CNCF Peshawar — ';
    subjectField.value = `${prefix}${userSubjectField.value.trim() || 'Inquiry'}`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const honeypot = form.querySelector('input[name="_honey"]');
    if (honeypot?.value) return;

    if (!form.reportValidity()) {
      showResult('Check the required fields and enter a valid email address.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitLabel.textContent = 'Sending…';
    resultEl.hidden = true;
    resultEl.className = 'form-result';

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await submitContactPayload(fetch, `https://formsubmit.co/ajax/${contactEmail}`, payload);

      showResult('FormSubmit accepted your message for processing. If the form needs activation, an organizer must confirm it before FormSubmit forwards the message.', 'success');
      form.reset();
      syncRadioClasses();
    } catch {
      const mailtoLink = buildContactMailto(contactEmail, userSubjectField.value, messageField.value);
      resultEl.replaceChildren(
        document.createTextNode('FormSubmit could not accept the message. Email our team at '),
        Object.assign(document.createElement('a'), { href: mailtoLink, textContent: contactEmail }),
        document.createTextNode(' instead.')
      );
      resultEl.className = 'form-result is-error';
      resultEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitLabel.textContent = 'Send Message';
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactPage, { once: true });
  } else {
    initContactPage();
  }
  document.addEventListener('astro:page-load', initContactPage);
}
