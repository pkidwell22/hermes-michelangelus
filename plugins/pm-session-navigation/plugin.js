// Theme companion: style the existing buttons; let Hermes own actions, focus order and drag.
const THEME = ':root:is([data-hermes-theme="patrick-michelangelus"],[data-hermes-theme^="patrick-michelangelus-accent-"])'
const S = THEME + ' [data-tour="sessions-sidebar"]'
const M = S + ' ul:has(> li [data-tour="sidebar-nav-new-session"])'
const B = M + ' > li button:has(> [data-tour^="sidebar-nav-"])'
const N = B + ':has(> [data-tour="sidebar-nav-new-session"])'
const DOCKED = S + ':not([data-narrow-overlay] *)'
const SEARCH_ROW = S + ' div:has(> div > input[placeholder]):has(+ [data-sessions-mode])'
const SEARCH = SEARCH_ROW + ' > div:has(> input[placeholder])'
const ON = ':is(:hover,:focus-visible,[class~="bg-(--ui-control-active-background)"],[aria-current="page"])'
const order = ['new-session','messaging','artifacts','cron','kanban:nav','hermes-rss:navigation','hermes-rss:podcasts-navigation','capabilities','hermes-tailscale:nav']
const css = `
/* The native macOS window rounds at about 16 CSS px (32 Retina px). */
${DOCKED}::before,${THEME} [data-tree-split="pm-right-column"]{border-radius:16px}
${S}{--pm-navigation-control-radius:10px;--pm-navigation-control-height:34px}
/* Match the Workspace island without changing the width of the split track. */
${DOCKED}{isolation:isolate;padding:0 6px 8px 10px;border-color:transparent!important;background-color:transparent!important}
${DOCKED}::before{
  content:"";position:absolute;z-index:-1;pointer-events:none;
  inset:var(--titlebar-height,28px) 6px 8px 10px;
  border:1px solid var(--t3-frost-edge,color-mix(in srgb,var(--ui-text-primary) 16%,transparent));
  background:var(--t3-frost-fill,rgba(17,17,17,.48));
  backdrop-filter:var(--t3-frost-filter,blur(24px));
}
${DOCKED}:hover::before{border-color:color-mix(in srgb,var(--t3-fg) 24%,transparent)}
@media(prefers-reduced-transparency:reduce){
  ${DOCKED}::before{background:var(--t3-surface,#111);backdrop-filter:none}
}
${M}{gap:0!important;padding-block:3px 5px!important}
${B}{height:26px!important;min-height:26px!important;width:100%;box-sizing:border-box;padding:2px 10px!important;gap:10px!important;align-items:center;border:1px solid transparent!important;border-radius:7px!important;background:transparent!important;box-shadow:none!important;font:400 14px/20px var(--t3-label-font,Michelangelus,Georgia,serif)!important;color:var(--ui-text-primary)!important}
${B}>[data-tour]{font:inherit!important}
${B}>:first-child{width:16px;min-width:16px;text-align:center;color:var(--ui-text-secondary)!important}
${B}${ON}{background:color-mix(in srgb,var(--ui-text-primary) 7%,transparent)!important}
${B}${ON}>:first-child,${B}${ON}>:first-child svg{color:var(--ui-accent)!important}
${B}:focus-visible{outline:2px solid var(--ui-accent)!important;outline-offset:-2px}
${M}>li:has([data-tour="sidebar-nav-hermes-rss:navigation"]),${M}>li:has([data-tour="sidebar-nav-capabilities"]){margin-top:5px}
${N}{height:var(--pm-navigation-control-height)!important;margin:0 0 5px!important;border-color:var(--t3-frost-edge,color-mix(in srgb,var(--ui-text-primary) 16%,transparent))!important;border-radius:var(--pm-navigation-control-radius)!important;background:color-mix(in srgb,var(--ui-text-primary) 5%,transparent)!important}
${N}:hover{background:color-mix(in srgb,var(--ui-text-primary) 9%,transparent)!important}
${N}>:first-child{display:none!important}
${N}::before{content:"";width:16px;height:16px;flex:none;background:linear-gradient(currentColor,currentColor) center/12px 1.5px no-repeat,linear-gradient(currentColor,currentColor) center/1.5px 12px no-repeat}
${N} [data-slot="kbd-group"]{gap:2px}
${N} kbd{border:0!important;background:transparent!important;box-shadow:none!important;min-width:0;padding:0 1px}
/* Share the New session row's edges and icon/text rhythm. Keep native search and Clear. */
${SEARCH_ROW}{display:flex;padding-inline:0;padding-block:2px 6px}
${SEARCH}{box-sizing:border-box;width:100%;min-width:0;min-height:var(--pm-navigation-control-height);padding:0 10px;gap:10px;opacity:1;border:1px solid var(--ui-stroke-secondary);border-radius:var(--pm-navigation-control-radius);background:color-mix(in srgb,var(--ui-text-primary) 3%,transparent)}
${SEARCH}:focus-within{border-color:var(--ui-accent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ui-accent) 25%,transparent)}
${SEARCH}>svg:first-child{width:16px;height:16px;color:var(--ui-text-secondary)}
${SEARCH}>input{min-width:0;font:400 13px/20px var(--t3-label-font,Michelangelus,Georgia,serif)}
${SEARCH}>input::placeholder{color:var(--ui-text-secondary)}
`
export default {id:'pm-session-navigation',name:'Michelangelus · Sessions navigation',register(ctx){
  const style=document.createElement('style');style.textContent=css;document.head.append(style)
  let disposeOrder=null,disposeLabel=null
  const clear=()=>{disposeLabel?.();disposeLabel=null;disposeOrder?.();disposeOrder=null}
  const sync=()=>{const active=document.documentElement.matches(':is([data-hermes-theme="patrick-michelangelus"],[data-hermes-theme^="patrick-michelangelus-accent-"])')
    if(active&&!disposeOrder){
      disposeOrder=ctx.register({id:'order',area:'sidebarNav.prefs',order:1000,data:{order}})
      disposeLabel=ctx.i18n?.registerAppLocale?.('en',{translations:{'sidebar.nav.artifacts':'Gallery'}})
    }
    if(!active)clear()
  }
  const watch=new MutationObserver(sync);watch.observe(document.documentElement,{attributes:true,attributeFilter:['data-hermes-theme']});sync()
  ctx.onDispose(()=>{watch.disconnect();clear();style.remove()})
}}
