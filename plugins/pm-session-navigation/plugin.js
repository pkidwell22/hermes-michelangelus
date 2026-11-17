// Theme companion: style the existing buttons; let Hermes own actions, focus order and drag.
const BASE = 'patrick-michelangelus'
const S = ':root[data-hermes-theme="patrick-michelangelus"] [data-tour="sessions-sidebar"]'
const M = S + ' ul:has(> li [data-tour="sidebar-nav-new-session"])'
const B = M + ' > li button:has(> [data-tour^="sidebar-nav-"])'
const N = B + ':has(> [data-tour="sidebar-nav-new-session"])'
const ON = ':is(:hover,:focus-visible,[class~="bg-(--ui-control-active-background)"],[aria-current="page"])'
const order = ['new-session','messaging','artifacts','cron','kanban:nav','hermes-rss:navigation','hermes-rss:podcasts-navigation','capabilities','hermes-tailscale:nav']
const css = `
${M}{gap:0!important;padding-block:3px 5px!important}
${B}{height:26px!important;min-height:26px!important;width:100%;box-sizing:border-box;padding:2px 10px!important;gap:10px!important;align-items:center;border:1px solid transparent!important;border-radius:7px!important;background:transparent!important;box-shadow:none!important;font:400 14px/20px var(--t3-label-font,Michelangelus,Georgia,serif)!important;color:var(--ui-text-primary)!important}
${B}>[data-tour]{font:inherit!important}
${B}>:first-child{width:16px;min-width:16px;text-align:center;color:var(--ui-text-secondary)!important}
${B}${ON}{background:color-mix(in srgb,var(--ui-text-primary) 7%,transparent)!important}
${B}${ON}>:first-child,${B}${ON}>:first-child svg{color:var(--ui-accent)!important}
${B}:focus-visible{outline:2px solid var(--ui-accent)!important;outline-offset:-2px}
${M}>li:has([data-tour="sidebar-nav-hermes-rss:navigation"]),${M}>li:has([data-tour="sidebar-nav-capabilities"]){margin-top:5px}
${N}{height:34px!important;margin:0 0 5px!important;border:1px solid color-mix(in srgb,var(--ui-text-primary) 24%,transparent)!important;border-radius:9px!important}
${N}>:first-child{display:none!important}
${N}::before{content:"";width:16px;height:16px;flex:none;background:linear-gradient(currentColor,currentColor) center/12px 1.5px no-repeat,linear-gradient(currentColor,currentColor) center/1.5px 12px no-repeat}
${N} kbd{border:0!important;background:transparent!important;box-shadow:none!important;min-width:0;padding:0 1px}
`
export default {id:'pm-session-navigation',name:'Michelangelus · Sessions navigation',register(ctx){
  const style=document.createElement('style');style.textContent=css;document.head.append(style)
  let disposeOrder=null
  const sync=()=>{const active=document.documentElement.dataset.hermesTheme===BASE
    if(active&&!disposeOrder)disposeOrder=ctx.register({id:'order',area:'sidebarNav.prefs',order:1000,data:{order}})
    if(!active&&disposeOrder){disposeOrder();disposeOrder=null}
  }
  const watch=new MutationObserver(sync);watch.observe(document.documentElement,{attributes:true,attributeFilter:['data-hermes-theme']});sync()
  ctx.onDispose(()=>{watch.disconnect();disposeOrder?.();style.remove()})
}}
