// Narrow adapter over the native clarify form; no RPC or permission-dialog handling.
// Native selection and native submit retain request ownership, validation and errors.
export default {
  id: 'pm-clarify-quick-pick',
  name: 'One-click question answers',
  description: 'Click a preset answer to send a single-choice question. Other and multi-question forms keep confirmation.',
  register(ctx) {
    let alive = true;
    const pending = new WeakMap();
    const eligible = (form, button) => {
      if (!form?.isConnected || !button?.isConnected || button.disabled) return false;
      if (form.dataset.clarifyBatch !== '1' || form.hasAttribute('data-clarify-batch-preview')) return false;
      if (form.getAttribute('aria-busy') === 'true' || form.closest('[inert], [aria-hidden="true"]')) return false;
      if (!form.getClientRects().length || (form.checkVisibility && !form.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))) return false;
      const blocks = form.querySelectorAll('[data-clarify-batch-question]');
      return blocks.length === 1 && blocks[0].contains(button) &&
        blocks[0].querySelector('[data-clarify-select-mode]')?.dataset.clarifySelectMode === 'single';
    };
    const activations = new WeakMap();
    const onCapture = event => {
      // Snapshot identity before React stages the pick or another handler changes the card.
      if (!alive || !event.isTrusted || event.defaultPrevented || event.button !== 0) return;
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('button[data-choice]');
      const form = button?.closest('form[data-clarify-batch]');
      if (!eligible(form, button)) return;
      const block = button.closest('[data-clarify-batch-question]');
      activations.set(event,{form,button,block,qid:block.dataset.clarifyBatchQuestion,label:button.textContent});
    };
    const onClick = event => {
      const ticket = activations.get(event);
      activations.delete(event);
      if (!alive || !ticket || event.defaultPrevented) return;
      const {form,button,block} = ticket;
      pending.set(form, ticket);
      // React's discrete selection update must commit before native confirmation.
      queueMicrotask(() => {
        if (!alive || pending.get(form) !== ticket) return;
        pending.delete(form);
        if (!eligible(form, button) || button.closest('[data-clarify-batch-question]') !== block ||
            block.dataset.clarifyBatchQuestion !== ticket.qid || button.textContent !== ticket.label ||
            button.getAttribute('aria-pressed') !== 'true') return;
        if (form.querySelectorAll('button[data-choice][aria-pressed="true"]').length !== 1) return;
        if ([...form.querySelectorAll('textarea')].some(input => input.value.trim())) return;
        const submit = form.querySelector('button[type="submit"]');
        if (submit && !submit.disabled) submit.click();
      });
    };
    document.addEventListener('click', onCapture, true);
    document.addEventListener('click', onClick);
    document.documentElement.setAttribute('data-pm-clarify-quick-pick', 'enabled');
    ctx.onDispose(() => {
      alive = false;
      document.removeEventListener('click', onCapture, true);
      document.removeEventListener('click', onClick);
      document.documentElement.removeAttribute('data-pm-clarify-quick-pick');
    });
  }
};
