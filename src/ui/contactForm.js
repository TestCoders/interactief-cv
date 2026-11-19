import { TESTCODERS } from '../config/company.js';

// Contactformulier aan het eind van het level. Zonder backend: opent een ingevulde mail aan TestCoders.
// Het formulier wordt telkens opnieuw in het paneel gezet, dus luisteren we op document-niveau.
export function initContactForm() {
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'contact-form') return;
    e.preventDefault();
    const form = new FormData(e.target);
    const cvName = e.target.dataset.cv;
    const subject = `Interesse in ${cvName} (via interactief CV)`;
    const body = [
      `Naam: ${form.get('naam')}`,
      `Organisatie: ${form.get('organisatie') || '-'}`,
      `E-mail: ${form.get('email')}`,
      '',
      form.get('bericht') || `Ik wil graag meer weten over ${cvName}.`
    ].join('\n');
    location.href = `mailto:${TESTCODERS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
