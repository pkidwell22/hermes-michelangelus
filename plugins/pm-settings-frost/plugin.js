// CSS-only Michelangelus Settings companion. No theme registration or state writes.
const stylesheet = `/* Settings-only additive companion. Source-verified shell: SettingsView ->
   OverlayView + OverlayNav, also exported as SettingsPage. The persistent Model
   nav marker survives narrow-screen rail hiding, route and locale changes.
   No theme/token definitions, global menu sweep, wallpaper or behavior edits. */
:root:is([data-hermes-theme="patrick-michelangelus"], [data-hermes-theme^="patrick-michelangelus-accent-"])
[data-overlay-surface]:has([data-tour="overlay-nav"] [data-tour="nav-config:model"]) {
  /* The shared scrim's blur would isolate the card from the wallpaper.
     Preserve native dimming; put the one wallpaper blur on the raised card. */
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;

  & > div > [data-glass-raised] {
    background: var(--t3-frost-fill, var(--dt-card)) !important;
    border-color: var(--t3-frost-edge, var(--ui-stroke-secondary)) !important;
    border-radius: 18px;
    backdrop-filter: var(--t3-frost-filter, none) !important;
    -webkit-backdrop-filter: var(--t3-frost-filter, none) !important;
  }
  & [data-tour="overlay-nav"] {
    background: color-mix(in srgb, var(--t3-surface, var(--dt-card)) 24%, transparent) !important;
    border-inline-end: 1px solid var(--t3-frost-edge, var(--ui-stroke-secondary));
    padding-inline: 10px;
  }
  & [data-glass-opaque] {
    /* Near-opaque search badge, so the border-riding pill stays readable. */
    background: color-mix(in srgb, var(--t3-surface, var(--dt-card)) 94%, transparent) !important;
    border-color: var(--t3-frost-edge, var(--ui-stroke-secondary));
  }
  & [data-tour="overlay-nav"] button[data-tour^="nav-"] {
    border-radius: 8px;
    font-family: var(--t3-label-font, inherit);
  }
  & [data-tour="overlay-nav"] button[data-tour^="nav-"]:not([data-tour^="nav-toggle-"]) {
    min-height: 30px;
    margin-block: 1px;
  }
  & [data-tour="overlay-nav"] button[aria-current="page"] {
    background: var(--ui-control-active-background) !important;
    border-color: var(--t3-frost-edge, var(--ui-stroke-secondary)) !important;
    font-weight: 600;
  }
  & [data-tour="overlay-nav"] button:not(:disabled):hover {
    background: var(--ui-control-hover-background) !important;
  }
  & [data-tour="overlay-nav"] button[aria-current="page"]:hover {
    background: color-mix(in srgb, var(--ui-control-active-background), var(--t3-fg) 6%) !important;
  }

  /* Descendant scope intentionally excludes dialog/auth forms and semantic
     actions. No descendant-wide ink rule: keep error/warn/success/code colors. */
  & :is([data-slot="input"], [data-slot="textarea"], [data-slot="select-trigger"], [data-slot="searchable-select-trigger"]):not(
    input[type="password"], form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *
  ) {
    background: color-mix(in srgb, var(--t3-surface, var(--dt-card)) 56%, transparent) !important;
    border: 1px solid var(--t3-frost-edge, var(--ui-stroke-secondary));
    border-radius: 8px;
    min-height: 32px;
    max-inline-size: 100%;
    font-family: var(--t3-label-font, inherit);
  }
  & :is([data-slot="input"], [data-slot="textarea"], [data-slot="select-trigger"], [data-slot="searchable-select-trigger"]):not(:disabled):not(
    input[type="password"], form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *
  ):hover {
    background: var(--ui-control-hover-background) !important;
    border-color: color-mix(in srgb, var(--t3-fg) 26%, transparent);
  }
  & [data-slot="button"]:is([data-variant="default"], [data-variant="secondary"], [data-variant="outline"]):not(
    form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *, [class*="destructive"]
  ) {
    border-radius: 8px;
    border: 1px solid var(--t3-frost-edge, var(--ui-stroke-secondary));
    font-family: var(--t3-label-font, inherit);
  }
  & [data-slot="button"][data-variant="default"]:not(
    form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *, [class*="destructive"]
  ) {
    /* Keep the existing primary hierarchy; picked accent is authoritative. */
    background: var(--theme-primary, var(--ui-accent)) !important;
    border-color: var(--theme-primary, var(--ui-accent));
  }
  & [data-slot="button"]:is([data-variant="secondary"], [data-variant="outline"]):not(
    form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *, [class*="destructive"]
  ) {
    background: var(--ui-bg-quinary);
  }
  & [data-slot="button"][data-variant="default"]:not(:disabled):not(
    form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *, [class*="destructive"]
  ):hover {
    background: color-mix(in srgb, var(--theme-primary, var(--ui-accent)) 86%, var(--t3-fg)) !important;
  }
  & :is([role="tablist"], [data-slot="tabs-list"], .inline-grid:has(> button[aria-pressed])):not(form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *) {
    background: color-mix(in srgb, var(--t3-surface, var(--dt-card)) 56%, transparent);
    border: 1px solid var(--t3-frost-edge, var(--ui-stroke-secondary));
    border-radius: 10px;
    flex-wrap: wrap;
  }
  & :is([role="tab"], [data-slot="tabs-trigger"], .inline-grid > button[aria-pressed]):not(form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *) {
    border-radius: 7px;
    font-family: var(--t3-label-font, inherit);
  }
  & :is([role="tab"], [data-slot="tabs-trigger"], .inline-grid > button[aria-pressed]):not(form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *):is([aria-selected="true"], [data-state="active"], [aria-pressed="true"]) {
    background: var(--ui-control-active-background) !important;
    box-shadow: inset 0 -2px var(--theme-primary, var(--ui-accent));
  }
  & :is([role="tab"], [data-slot="tabs-trigger"], .inline-grid > button[aria-pressed]):not(form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *):not(:disabled):hover {
    background: var(--ui-control-hover-background);
  }
  & [data-slot="switch"][data-state="checked"]:not(form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *) {
    background: var(--theme-primary, var(--ui-accent));
  }
  & :is(button, input, textarea, select, [role="tab"]):focus-visible:not(
    [data-variant="destructive"], [class*="destructive"], input[type="password"], form:has(input[type="password"]) *, div:has(> input[type="password"]) *,
    [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *
  ) {
    outline: 2px solid var(--theme-primary, var(--ui-accent)) !important;
    outline-offset: 2px;
  }
  /* In-tree settings-owned menus only. Portaled generic menus have no stable
     owner selector in this build, so leave them native rather than recoloring
     an unrelated/auth menu merely because Settings happens to be mounted. */
  & :is([data-slot="select-content"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"]):not(
    [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *
  ) {
    background: color-mix(in srgb, var(--t3-frost-fill) 30%, var(--t3-surface));
    border-color: var(--t3-frost-edge);
    border-radius: 12px;
    backdrop-filter: var(--t3-frost-filter, none);
    max-inline-size: calc(100vw - 24px);
  }
}
@media (prefers-reduced-transparency: reduce) {
  :root:is([data-hermes-theme="patrick-michelangelus"], [data-hermes-theme^="patrick-michelangelus-accent-"])
  [data-overlay-surface]:has([data-tour="overlay-nav"] [data-tour="nav-config:model"]) > div > [data-glass-raised] {
    background: var(--t3-surface, var(--dt-card)) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
}
@media (forced-colors: active) {
  :root:is([data-hermes-theme="patrick-michelangelus"], [data-hermes-theme^="patrick-michelangelus-accent-"])
  [data-overlay-surface]:has([data-tour="overlay-nav"] [data-tour="nav-config:model"]) {
    & [aria-current="page"], & [role="tab"][aria-selected="true"] { outline: 1px solid Highlight; }
    & :is(button, input, textarea, select):focus-visible:not([data-variant="destructive"], [class*="destructive"], input[type="password"], form:has(input[type="password"]) *, div:has(> input[type="password"]) *, [role="dialog"] *, [role="alertdialog"] *, [data-slot="dialog-content"] *) { outline-color: Highlight !important; }
  }
}
`;
export default {
  id: 'pm-settings-frost',
  name: 'Michelangelus Settings frost',
  register(ctx) {
    const style = document.createElement('style');
    style.dataset.pmSettingsFrost = '';
    style.textContent = stylesheet;
    ctx.onDispose(() => style.remove());
    document.head.append(style);
  }
};
