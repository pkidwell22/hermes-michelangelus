import { atom, host, useValue, useQuery, useQueryClient, PALETTE_AREA } from '@hermes/plugin-sdk'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

const ID = 'pm-session-details'
const CSS = `
.pm-details{height:100%;display:flex;flex-direction:column;overflow:clip;padding:14px 0 0;background:var(--t3-frost-fill,rgba(17,17,17,.65));backdrop-filter:var(--t3-frost-filter,blur(24px));color:var(--ui-text-primary,#f5f5f5);font:14px/1.5 var(--t3-label-font,Michelangelus,Georgia,serif);container-type:inline-size}
.pm-details .pd-workspace-frame,.pm-details .pd-scroll-body{scrollbar-gutter:stable;padding-inline:18px}
.pm-details .pd-workspace-frame{flex:none;overflow:hidden}
.pm-details .pd-scroll-body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;padding-bottom:24px}
.pm-details,.pm-details *{box-sizing:border-box}
.pm-details :is(button,input,select,summary){font-family:var(--t3-label-font,Michelangelus,Georgia,serif)!important}
.pm-details button{font-size:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0;text-align:left}
.pm-details button:disabled{opacity:.42;cursor:default}
.pm-details :is(button,summary):focus-visible{outline:2px solid #338ced;outline-offset:3px;border-radius:3px}
.pm-details button:hover:not(:disabled){color:#fff;background:#ffffff08}
.pm-details .pd-section{padding:17px 0;border-bottom:1px solid #ffffff0c}
.pm-details .pd-section:first-of-type{padding-top:0}
.pm-details h2{font-size:14px;font-weight:500;margin:0 0 13px;letter-spacing:0}
.pm-details .pm-workspace-tools{anchor-name:--pm-sidebar-tools;position:relative;z-index:4;height:28px;display:flex;align-items:flex-start;gap:4px;margin:0 0 12px;border-radius:7px;background:transparent;backdrop-filter:none;font-size:12px}
.pm-details .pm-workspace-tools[data-rows="2"]{height:56px}
.pm-details .pd-fold{display:inline-flex;align-items:center;justify-content:center;width:24px;height:28px;flex:none;border-radius:5px;-webkit-app-region:no-drag}
.pm-details .pd-tabs{display:flex;align-items:center;gap:2px;min-width:0;height:28px;flex:none}
.pm-details .pd-tab{display:inline-flex;align-items:center;justify-content:center;height:28px;white-space:nowrap;padding:0 4px;border-radius:5px;color:var(--ui-text-tertiary,#999);-webkit-app-region:no-drag}
.pm-details .pd-tab[aria-selected="true"]{color:var(--ui-text-primary,#eee);background:color-mix(in srgb,var(--ui-text-primary,#eee) 6%,transparent)}
.pm-details:has(.pm-workspace-tools:is([data-folded="true"],[data-view="files"]))>.pd-scroll-body{display:none!important}
/* Only the recognized unified island is projected. The native tree, pane DOM,
   handlers and saved weights remain owned by Hermes; no pane is copied/moved. */
:root[data-pm-sidebar-ready="true"] [data-tree-split="pm-right-column"] {
  --pd-sidebar-header:54px;justify-content:flex-start;--pd-settings-height:128px;
  & > div:has(> [data-tree-group="pm-details-group"]:not([data-pane-host])){flex:1 1 0px!important;min-height:0!important}
  & > div:has(> [data-tree-group="pm-controls-group"]:not([data-pane-host])){flex:0 0 var(--pd-settings-height)!important;min-height:0!important}
}
/* Shrink the frosted card, not the outer horizontal sizing track. */
:root[data-pm-sidebar-ready="true"][data-pm-sidebar-folded="true"] [data-tree-split="pm-right-column"] {
  align-self:flex-start;height:calc(var(--pd-sidebar-header) + var(--pd-settings-height) + 2px);max-height:calc(100% - 16px);
}
:root[data-pm-sidebar-ready="true"][data-pm-sidebar-rows="2"] [data-tree-split="pm-right-column"]{--pd-sidebar-header:82px}
:root[data-pm-sidebar-ready="true"] [data-tree-group="pm-details-group"]>[data-panel-header]{height:0!important;min-height:0!important;padding:0!important;border:0!important;overflow:hidden!important}
:root[data-pm-sidebar-ready="true"]:is([data-pm-sidebar-view="workspace"],[data-pm-sidebar-folded="true"]) [data-tree-split="pm-right-column"] > div:has(> :is([data-tree-group="pm-files-group"],[data-tree-group="pm-review-group"]):not([data-pane-host])){display:none!important}
:root[data-pm-sidebar-ready="true"][data-pm-sidebar-view="files"][data-pm-sidebar-folded="false"] [data-tree-split="pm-right-column"] {
  & > div:has(> :is([data-tree-group="pm-files-group"],[data-tree-group="pm-review-group"]):not([data-pane-host])){flex:1 1 0px!important;min-height:0!important;overflow:hidden}
}
:root[data-pm-sidebar-ready="true"]:is([data-pm-sidebar-view="files"],[data-pm-sidebar-folded="true"]) [data-tree-split="pm-right-column"] > div:has(> [data-tree-group="pm-details-group"]:not([data-pane-host])){flex:0 0 var(--pd-sidebar-header)!important;min-height:0!important}
/* Separate native keep-alive hosts are siblings of the tree, not its children. */
:root[data-pm-sidebar-ready="true"]:is([data-pm-sidebar-view="workspace"],[data-pm-sidebar-folded="true"]) :is([data-pane-host="files"][data-tree-group="pm-files-group"],[data-pane-host="review"][data-tree-group="pm-review-group"]){display:none!important}
:root[data-pm-session-chat="true"][data-pm-sidebar-ready="true"]:is([data-pm-sidebar-view="files"],[data-pm-sidebar-folded="true"]) [data-pm-native-control]{visibility:hidden!important;pointer-events:none!important}
/* One combined view has one native, non-draggable 50/50 seam. Prevent saved
   sash weights and minimums from changing either half of this projection. */
:root[data-pm-sidebar-ready="true"] [data-tree-split="pm-right-column"] > div > [data-sash-overlap]{display:none!important}
:root[data-pm-sidebar-ready="true"] [data-tree-split="pm-right-column"] > div:has(> [data-tree-group="pm-review-group"]:not([data-pane-host])){border-top:1px solid var(--ui-stroke-secondary,#ffffff18)}
@container(max-width:260px){.pm-details .pm-workspace-tools{font-size:11px;gap:2px}.pm-details .pd-tab{padding-inline:3px}}
.pm-details .pd-env{display:flex;align-items:center;gap:12px;min-height:34px;font-size:15px}
.pm-details .pd-env>span:nth-child(2){min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.pm-details .pd-icon{display:inline-flex;align-items:center;justify-content:center;width:18px;height:20px;flex:none;color:#999}
.pm-details .pd-icon svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.pm-details .pd-gear{padding:4px;border-radius:5px}
.pm-details .pd-muted{color:#999}
.pm-details .pd-heading{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:15px;margin:2px 0 7px;font-variant-numeric:tabular-nums}
.pm-details .pd-meter{height:4px;display:flex;gap:1px;background:#2c2c2c;border-radius:3px;overflow:hidden;margin-bottom:11px}
.pm-details .pd-meter span{height:100%;min-width:0;flex-shrink:0;border-radius:1px}
.pm-details .pd-row{display:grid;grid-template-columns:11px minmax(0,1fr) 52px 44px;align-items:center;column-gap:10px;min-height:25px;color:#999;font-size:14px;font-variant-numeric:tabular-nums}
.pm-details .pd-row .pd-number{text-align:right;white-space:nowrap}
.pm-details .pd-row .pd-percent{color:#e3e3e3}
.pm-details .pd-swatch{width:10px;height:10px;border-radius:2px}
.pm-details .pd-row .pd-label{min-width:0;overflow-wrap:anywhere}
.pm-details .pd-mcp-row{display:grid;grid-template-columns:16px minmax(0,1fr);gap:9px;align-items:center;min-height:24px;color:var(--ui-text-secondary,#bbb)}
.pm-details .pd-mcp-mark{width:16px;height:16px;display:grid;place-items:center}
.pm-details .pd-mcp-mark img,.pm-details .pd-mcp-mark svg{display:block;width:16px;height:16px;object-fit:contain}
.pm-details .pd-gap{margin-top:22px}
.pm-details details{margin-top:8px;color:#999}
.pm-details summary{list-style:none;display:flex;gap:12px;align-items:center;min-height:26px;cursor:pointer}
.pm-details summary::before{content:'›';width:12px;font-size:20px;line-height:1;flex:none}
.pm-details details[open]>summary::before{transform:rotate(90deg)}
.pm-details summary .pd-count{margin-left:auto;color:#777;font-variant-numeric:tabular-nums}
.pm-details .pd-detail-body{padding:7px 0 9px 24px;font-size:12px;overflow-wrap:anywhere;line-height:1.5}
.pm-details .pd-compact{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:22px;color:#999;font-size:13px}
.pm-details .pd-compact button,.pm-details .pd-confirm button{padding:4px 9px;border-radius:7px;background:#3a3a3a;color:#eee;white-space:nowrap}
.pm-details .pd-note{font-size:11px;line-height:1.45;color:#777;margin:10px 0 0;overflow-wrap:anywhere}
.pm-details .pd-link-row{display:flex;align-items:center;gap:9px;width:100%;min-height:27px}
.pm-details .pd-link-row .pd-right{margin-left:auto;color:#888;font-size:13px}
.pm-details .pd-output{display:flex;align-items:center;gap:12px;width:100%;min-height:31px}
.pm-details .pd-output>span:nth-child(2){flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pm-details .pd-output small{color:#888;font-size:12px}
.pm-details .pd-confirm{padding:12px 0;color:#bbb;font-size:12px}
.pm-details .pd-confirm>div{display:flex;gap:8px;margin-top:8px}
/* Status rows share the section gutters, including when a native value is unavailable. */
.pm-details :is(.pd-performance-row,.pd-environment-row){display:grid;grid-template-columns:minmax(0,1fr) minmax(0,45%);align-items:center;gap:10px;min-height:30px;color:var(--ui-text-secondary,#bbb)}
.pm-details :is(.pd-performance-row,.pd-environment-row)>span{min-width:0;overflow-wrap:anywhere}
.pm-details :is(.pd-performance-row,.pd-environment-row)>:last-child{color:var(--ui-text-primary,#eee);text-align:end;min-width:0}
.pm-details :is(.pd-performance-row,.pd-environment-row)>.pd-native-slot{justify-content:flex-end;font:inherit}
.pm-details :is(.pd-performance-row,.pd-environment-row)>.pd-native-slot>.pd-muted{min-width:0;overflow-wrap:anywhere}
.pm-details .pd-performance-row{font-variant-numeric:tabular-nums}
@container(max-width:260px){.pm-details :is(.pd-performance-row,.pd-environment-row){grid-template-columns:minmax(0,1fr) minmax(0,50%)}}
.pm-details .pd-native-slot{position:relative;min-width:0;display:flex;align-items:center;font-size:12px}
.pm-details .pd-section-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:13px}
.pm-details .pd-section-heading h2{margin:0}
.pm-details .pd-section.pd-audio{padding-block:12px}
.pm-details .pd-audio .pd-section-heading{align-items:center;margin-bottom:2px}
.pm-details .pd-audio .pd-library{font:12px/1.3 var(--t3-label-font,Michelangelus,Georgia,serif);color:var(--ui-text-secondary,#bbb);padding:4px 0 4px 10px;border:0;background:transparent}
.pm-details .pd-audio .pd-library:hover{color:var(--ui-text-primary,#eee);text-decoration:underline;text-underline-offset:3px}
.pm-details .pd-audio .pd-library:focus-visible{outline:2px solid var(--ui-accent);outline-offset:2px}
.pm-details .pd-audio-eyebrow{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ui-text-quaternary,#888);margin-bottom:8px}

.pm-details .pd-disclosure-section{padding:8px 0}
.pm-details .pd-disclosure{margin:0}
.pm-details .pd-disclosure>summary{display:grid;grid-template-columns:18px minmax(0,1fr) auto 10px;gap:8px;min-height:38px;padding:7px 10px;border-radius:7px}
.pm-details .pd-disclosure>summary::before{content:none}
.pm-details .pd-disclosure>summary::after{content:'›';font-size:18px;line-height:1;justify-self:end}
.pm-details .pd-disclosure[open]>summary::after{transform:rotate(90deg)}
.pm-details .pd-disclosure>summary:hover{background:#ffffff06}
.pm-details .pd-disclosure h2{margin:0;font-size:14px}
.pm-details .pd-disclosure .pd-trailing{font-size:12px;color:var(--ui-text-quaternary,#888);text-align:right;font-variant-numeric:tabular-nums}
.pm-details .pd-disclosure-body{padding:5px 10px 10px 36px;font-size:12px;color:var(--ui-text-secondary,#bbb);overflow-wrap:anywhere}
.pm-details .pd-disclosure-body p{margin:4px 0 10px}
.pm-details .pd-secondary{padding:5px 0;font-size:12px;text-decoration:underline;text-underline-offset:3px}
.pm-details :is(.pd-output,.pd-link-row,.pd-disclosure>summary,.pd-secondary){box-sizing:border-box;width:calc(100% - 8px);margin:2px 4px;padding:8px 12px;border-radius:10px;text-align:left;background:transparent}
.pm-details :is(.pd-output,.pd-link-row,.pd-disclosure>summary,.pd-secondary):hover{background:color-mix(in srgb,var(--t3-fg,#f5f5f5) 5%,transparent)}
.pm-details :is(.pd-output,.pd-link-row,.pd-disclosure>summary,.pd-secondary):focus-visible{outline:1px solid var(--ui-accent,#346bf1);outline-offset:1px}
@container(max-width:260px){.pm-details .pd-workspace-frame{padding-inline:12px}.pm-details .pd-row{grid-template-columns:9px minmax(0,1fr) 43px 38px;column-gap:7px;font-size:12px}.pm-details .pd-env{font-size:13px}.pm-details .pd-compact{flex-wrap:wrap}}
`
const CONTEXT_MIN_WIDTH = '248px'
const CONTEXT_MAX_WIDTH = '379px' // 363px visible sidebar + 16px horizontal margins.
const ISLAND_CSS = `
/* The Workspace disclosure replaces the native sidebar toggle in this header only. */
:root[data-pm-session-chat="true"]:has(.pm-workspace-tools[data-active="true"]) [data-titlebar-cluster="right"] > button:is([aria-label="Layout editor"],[aria-label="HUD mode"],[data-tour="right-pane-toggle"]) {display:none!important}
[data-tree-split] > div:has(> [data-tree-split="pm-right-column"]) { min-width:${CONTEXT_MIN_WIDTH}!important; max-width:${CONTEXT_MAX_WIDTH}!important; }
[data-tree-split="pm-right-column"] {
  box-sizing:border-box;margin:8px 10px 8px 6px;min-width:0;min-height:0;
  border:1px solid color-mix(in srgb,var(--t3-fg,#f5f5f5) 16%,transparent);
  border-radius:22px;overflow:hidden;
  background:var(--t3-frost-fill,rgba(17,17,17,.48));
  -webkit-backdrop-filter:var(--t3-frost-filter,blur(24px));
  backdrop-filter:var(--t3-frost-filter,blur(24px));
}
/* Match the chat tab strip and the Michelangelus sidebar section labels. */
:root:is([data-hermes-theme="patrick-michelangelus"],[data-hermes-theme^="patrick-michelangelus-accent-"]) .pm-workspace-tools .pd-tab[aria-selected="true"] {
  background:transparent!important;border-radius:0;box-shadow:inset 0 -2px var(--ui-accent,var(--t3-primary));color:var(--t3-fg);
}
:root:is([data-hermes-theme="patrick-michelangelus"],[data-hermes-theme^="patrick-michelangelus-accent-"]) .pm-workspace-tools .pd-tab[aria-selected="false"] {color:color-mix(in srgb,var(--t3-fg) 74%,transparent)}
:root:is([data-hermes-theme="patrick-michelangelus"],[data-hermes-theme^="patrick-michelangelus-accent-"]):has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"] {
  &::before {font-family:var(--t3-label-font);font-variant-caps:small-caps;letter-spacing:.045em;color:color-mix(in srgb,var(--t3-fg) 78%,transparent);border-bottom:1px solid color-mix(in srgb,var(--t3-fg) 12%,transparent)}
  & button:has(.font-mono.tabular-nums) .font-mono, & button:has(.font-semibold) > .font-semibold {font-family:var(--t3-label-font)!important;font-size:12px!important;font-weight:400!important}
  & button:has(.font-mono.tabular-nums) .font-mono {text-align:left;width:auto!important}
  & button.text-primary:has(> .truncate) {color:var(--t3-fg)!important}
  & button.text-primary:has(> .truncate) > svg {color:var(--ui-accent,var(--t3-primary))}
  & button.text-primary:has(> .truncate):hover > .truncate {text-decoration:underline;text-underline-offset:3px}
}
[data-tree-split="pm-right-column"]:hover {
  border-color:color-mix(in srgb,var(--t3-fg,#f5f5f5) 24%,transparent);
}
[data-tree-split="pm-right-column"] :is(.pm-details,.pm-controls-target) {
  background:transparent;-webkit-backdrop-filter:none;backdrop-filter:none;
}
[data-tree-split="pm-right-column"] :is([data-tree-group],[data-panel-header],aside,[data-slot="sidebar"]) {
  background-color:transparent;
}
@media(prefers-reduced-transparency:reduce) {
  [data-tree-split="pm-right-column"] {background:#111;-webkit-backdrop-filter:none;backdrop-filter:none}
}
`
const CONTROLS_CSS = `
.pm-controls-target{anchor-name:--pm-live-controls;width:100%;height:100%;min-height:84px;background:var(--t3-frost-fill,rgba(17,17,17,.65));backdrop-filter:var(--t3-frost-filter,blur(24px))}
@supports (position-anchor: --pm-live-controls) {
  :root:has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"] {
    position:fixed;position-anchor:--pm-live-controls;position-visibility:anchors-visible;
    inset:auto;left:anchor(left);top:anchor(top);width:anchor-size(width);height:anchor-size(height);
    z-index:30;box-sizing:border-box;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(28px,max-content);align-content:start;align-items:center;
    gap:6px 8px;padding:10px 12px;overflow:auto;border:0;background:transparent;
    font-family:var(--t3-label-font,Michelangelus,Georgia,serif);font-size:13px;
  }
  :root:has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"]>div {
    display:contents;
  }
  :root:has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"]::before {
    content:"App settings";grid-column:1/-1;min-height:18px;align-self:start;color:var(--ui-text-secondary,#bbb);font-size:12px;line-height:18px;padding:0 7px 3px;
  }
  /* Do not hide unknown plugin menus just because they have two labels. */
  :root:has(.pm-controls-target[data-active="true"]) [data-pm-context-duplicate] {display:none}
  :root:has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"] :is(button,a) {
    height:28px;min-height:28px;min-width:0;max-width:100%;padding-inline:7px;border-radius:7px;font-size:12px;justify-content:flex-start;
  }
  :root:has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"]>div>div {height:28px;min-height:28px;min-width:0;max-width:100%;align-items:center;align-self:start}
  :root:has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"] .hermes-radio-bar {grid-column:1/-1;width:100%;height:34px;min-height:34px;gap:4px;margin-bottom:4px}
  :root:has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"]>div>:has(>.hermes-radio-bar) {grid-column:1/-1;height:34px}
  :root:has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"] .hermes-radio-bar .radio-name {max-width:none}
  :root:has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"] .hermes-radio-action {width:28px;padding:5px}
  :root:has(.pm-controls-target[data-active="true"]) [data-slot="statusbar"]>div>:is(button,a,div) {overflow:hidden}
}
`
function ControlsPanel(){
  const visible=useValue(host.paneVisibility(`${ID}:controls`))
  useEffect(()=>{
    const selector='[data-slot="statusbar"]'
    let bar=null
    const tagged=new Set()
    const sync=()=>{
      const next=new Set()
      for(const node of bar?.querySelectorAll(':scope>div:last-child>button[aria-haspopup="menu"]')||[]){
        const spans=[...node.children].filter(child=>child.matches('span.truncate'))
        if(spans.length===2&&/^\[[█░]{10}\]\s*~?\d{1,3}%/.test(spans[1].textContent||'')){next.add(node);node.toggleAttribute('data-pm-context-duplicate',true)}
      }
      for(const node of tagged)if(!next.has(node))node.removeAttribute('data-pm-context-duplicate')
      tagged.clear();for(const node of next)tagged.add(node)
    }
    const meter=new MutationObserver(sync)
    // Watch direct ancestors only for removal/replacement of the bar, not transcript edits.
    const mount=new MutationObserver(()=>{if(!bar?.isConnected)bind()})
    const bind=()=>{
      mount.disconnect();meter.disconnect();bar=document.querySelector(selector)
      if(bar){meter.observe(bar,{childList:true,characterData:true,subtree:true});for(let n=bar.parentElement;n;n=n.parentElement)mount.observe(n,{childList:true})}
      else mount.observe(document.body,{subtree:true,childList:true})
      sync()
    }
    bind();return()=>{mount.disconnect();meter.disconnect();tagged.forEach(node=>node.removeAttribute('data-pm-context-duplicate'))}
  },[])
  return jsxs('div',{className:'pm-controls-target','data-active':String(visible),'aria-label':'App settings',children:[jsx('style',{children:CONTROLS_CSS+ISLAND_CSS})]})
}
const unifiedLayout={type:'split',id:'pm-unified-root',orientation:'row',weights:[.18,.60,.22],children:[
  {type:'group',id:'pm-sessions',panes:['sessions'],active:'sessions'},
  {type:'group',id:'pm-workspace',panes:['workspace','preview','terminal'],active:'workspace'},
  {type:'split',id:'pm-right-column',orientation:'column',weights:[.62,.17,.17,.38],children:[
    {type:'group',id:'pm-details-group',panes:[`${ID}:panel`],active:`${ID}:panel`},
    {type:'group',id:'pm-files-group',panes:['files'],active:'files',minimized:true},
    {type:'group',id:'pm-review-group',panes:['review'],active:'review',minimized:true},
    {type:'group',id:'pm-controls-group',panes:[`${ID}:controls`],active:`${ID}:controls`}
  ]}
]}
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0
const count = value => !finite(value) ? '—' : value >= 1e6 ? `${(value / 1e6).toFixed(1).replace(/\.0$/, '')}M` : value >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(Math.round(value))
const icons = {
  device: ['M5 3h14v12H5z','M2 18h20l-1 3H3z'], folder: ['M3 5h7l3 3h8v12H3z'],
  gear: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8','M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z'],
  server: ['M4 3h16v18H4z','M4 12h16','M8 7h3','M8 17h3'], output: ['M8 3h12v15H8z','M4 7h4v14h8v-3']
}
const Icon = ({name}) => jsx('span',{className:'pd-icon','aria-hidden':true,children:jsx('svg',{viewBox:'0 0 24 24',children:(icons[name]||icons.output).map((d,i)=>jsx('path',{d},i))})})
const expected = [
  ['messages','Messages','#e65c57'], ['mcp_tools','MCP tools','#ed681e'], ['system_tools','System tools','#ed681e'],
  ['system_prompt','System prompt','#04a889'], ['skills','Skills','#999'], ['mcp_instructions','MCP server instructions','#999'],
  ['memory','Memory files','#d59600'], ['agents','Custom agents','#338ced']
]
function normalizeCategories(breakdown) {
  const raw=Array.isArray(breakdown?.categories)?breakdown.categories.filter(c=>finite(c.tokens)&&typeof c.label==='string'):[]
  if (!raw.length) return expected.map(([id,label,color])=>({id,label,color,tokens:null}))
  const appearance = c => {
    const byId={conversation:[0,'#e65c57'],messages:[0,'#e65c57'],tool_definitions:[1,'#ed681e'],system_tools:[1,'#ed681e'],mcp_tools:[1,'#ed681e'],system_prompt:[2,'#04a889'],memory:[3,'#d59600'],subagent_definitions:[4,'#338ced'],agents:[4,'#338ced']}
    if(byId[c.id])return byId[c.id]
    const key=`${c.id} ${c.label}`.toLowerCase()
    if(/conversation|messages|history/.test(key))return [0,'#e65c57']
    if(/subagent|agent.*definition/.test(key))return [4,'#338ced']
    if(/mcp.*tool/.test(key))return [1,'#ed681e']
    if(/tool/.test(key))return [1,'#ed681e']
    if(/system/.test(key))return [2,'#04a889']
    if(/memory/.test(key))return [3,'#d59600']
    if(/agent/.test(key))return [4,'#338ced']
    if(/skill/.test(key))return [5,'#999']
    if(/mcp/.test(key))return [6,'#999']
    return [8,/^#[0-9a-f]{3,8}$/i.test(c.color||'')?c.color:'#999']
  }
  return raw.map(c=>({...c,color:appearance(c)[1],order:appearance(c)[0]})).sort((a,b)=>a.order-b.order)
}
function MeterRow({label,tokens,color,max}) {
  return jsxs('div',{className:'pd-row',children:[jsx('span',{className:'pd-swatch',style:{background:color}}),jsx('span',{className:'pd-label',children:label}),jsx('span',{className:'pd-number',children:count(tokens)}),jsx('span',{className:'pd-number pd-percent',children:finite(tokens)&&max>0?`${(tokens/max*100).toFixed(1)}%`:'—'})]})
}
async function ownerRoute(owner) {
  const routes=await host.profileRoutes()
  const matches=routes.filter(r=>(r.connectionId||'local')===(owner.connectionId||'local')&&r.profile===owner.profile)
  if(matches.length!==1)throw new Error('Session connection is unavailable.')
  return matches[0]
}
async function requestOwned(owner,method,params={},timeout,guard=()=>true) {
  const route=await ownerRoute(owner)
  if(!guard())throw new Error('Session focus changed before dispatch.')
  return host.requestProfile(route,method,params,timeout)
}
// Native CSS anchors track scrolling/layout in Chromium, not in React frames.
// Observe only clipping boundaries; never write scroll coordinates from JS.
function useRowVisibility(ref,active=true){
  const [visible,setVisible]=useState(false)
  useLayoutEffect(()=>{
    if(!active){setVisible(false);return}
    const node=ref.current,root=node?.closest('.pd-scroll-body,.pm-details')
    if(!node||!root)return
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting&&entry.intersectionRatio>=0.999),{root,threshold:[0,0.999,1]})
    observer.observe(node)
    return()=>observer.disconnect()
  },[active])
  return visible
}
const sidebarStates=new Map()
function sidebarGroups(){
  const split=document.querySelector('[data-tree-split="pm-right-column"]')
  if(!split||!split.closest('[data-tree-split="pm-unified-root"]'))return null
  const groups=['pm-details-group','pm-files-group','pm-review-group','pm-controls-group'].map(id=>[...split.children].map(track=>track.querySelector(`:scope > [data-tree-group="${id}"]:not([data-pane-host])`)).find(Boolean))
  return groups.every(Boolean)?{split,groups}:null
}
function WorkspaceTools({active,scope}) {
  const [state,setState]=useState(()=>sidebarStates.get(scope)||{view:'workspace',workspace:false,files:false})
  const view=state.view,folded=state[view],label=view==='files'?'Files & Review':'Workspace'
  const action=`${folded?'Expand':'Collapse'} ${label}`
  const update=fn=>setState(previous=>{const next=fn(previous);sidebarStates.delete(scope);sidebarStates.set(scope,next);if(sidebarStates.size>64)sidebarStates.delete(sidebarStates.keys().next().value);return next})
  const select=view=>{
    // This is the host's real native reveal, including dismissal/minimize state.
    // Never replace the file tree with another filesystem or RPC implementation.
    if(view==='files'&&sidebarGroups()){host.revealPane?.('files');host.revealPane?.('review')}
    update(previous=>({...previous,view}))
  }
  const toggle=()=>update(previous=>({...previous,[previous.view]:!previous[previous.view]}))
  const ref=useRef(null),visible=useRowVisibility(ref,active),[base,setBase]=useState(null)
  useLayoutEffect(()=>{
    if(!active)return
    const container=ref.current?.closest('.pm-details')
    if(!container)return
    const cluster=document.querySelector('[data-titlebar-cluster="right"]')
    let alive=true
    const measure=()=>{
      if(!alive||!ref.current)return
      const r=ref.current.getBoundingClientRect(),tabs=ref.current.querySelector('.pd-tabs'),fold=ref.current.querySelector('.pd-fold')
      // Measure the original cluster with its real current (possibly hidden)
      // actions. Do not force child visibility; parent icon removals survive.
      const tools=cluster?.getBoundingClientRect().width||0
      const rows=r.width<(tabs?.getBoundingClientRect().width||0)+(fold?.getBoundingClientRect().width||24)+tools+12?2:1
      const next={x:r.left,y:r.top,w:r.width,tools,rows,ready:!!sidebarGroups()}
      setBase(old=>JSON.stringify(old)===JSON.stringify(next)?old:next)
    }
    const resize=new ResizeObserver(measure);resize.observe(ref.current);resize.observe(container);if(cluster)resize.observe(cluster)
    const mutation=new MutationObserver(changes=>{
      const structural='[data-tree-split],[data-tree-group],[data-titlebar-cluster]'
      if(changes.some(change=>change.type==='attributes'||cluster?.contains(change.target)||[...change.addedNodes,...change.removedNodes].some(node=>node.nodeType===1&&(node.matches?.(structural)||node.querySelector?.(structural)))))measure()
    })
    mutation.observe(document.body,{childList:true,subtree:true});if(cluster)mutation.observe(cluster,{attributes:true,subtree:true,attributeFilter:['class','style','hidden']})
    window.addEventListener('resize',measure);window.addEventListener('pointerup',measure,true)
    document.fonts?.ready.then(measure)
    measure()
    return()=>{alive=false;resize.disconnect();mutation.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('pointerup',measure,true)}
  },[active])
  useLayoutEffect(()=>{
    const root=document.documentElement,ready=active&&base?.ready
    root.setAttribute('data-pm-sidebar-ready',String(!!ready))
    root.setAttribute('data-pm-sidebar-view',view);root.setAttribute('data-pm-sidebar-folded',String(folded));root.setAttribute('data-pm-sidebar-rows',String(base?.rows||2))
    return()=>{['ready','view','folded','rows'].forEach(key=>root.removeAttribute(`data-pm-sidebar-${key}`))}
  },[active,base?.ready,base?.rows,view,folded])
  const selector=':root:not([data-pm-session-chat="false"]):has(.pm-workspace-tools[data-active="true"]) [data-titlebar-cluster="right"]'
  const css=active&&base?`
${selector}{position:fixed;inset:auto;left:${base.x+base.w-base.tools}px;top:${base.y+(base.rows===2?28:0)}px;width:max-content;height:28px;box-sizing:border-box;display:flex;align-items:center;justify-content:flex-end;padding:0;gap:0;translate:none;z-index:70;transform:none;visibility:${visible?'visible':'hidden'}!important;pointer-events:none!important;}
${selector}>*{pointer-events:${visible?'auto':'none'}!important;}`:''
  const keydown=event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return
    event.preventDefault();const next=event.key==='Home'?'workspace':event.key==='End'?'files':view==='workspace'?'files':'workspace'
    if(next==='files'&&!base?.ready)return
    select(next);ref.current?.querySelector(`[data-sidebar-tab="${next}"]`)?.focus()
  }
  return jsxs('div',{ref,className:'pm-workspace-tools','data-active':String(active),'data-view':view,'data-folded':String(folded),'data-rows':String(base?.rows||2),children:[
    jsx('button',{type:'button',className:'pd-fold pd-muted',title:action,'aria-label':action,'aria-expanded':!folded,onClick:toggle,children:jsx('svg',{'aria-hidden':true,width:12,height:12,viewBox:'0 0 16 16',children:jsx('path',{d:folded?'M6 3.5 10.5 8 6 12.5':'M3.5 6 8 10.5 12.5 6',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'})})}),
    jsxs('div',{className:'pd-tabs',role:'tablist','aria-label':'Sidebar view',onKeyDown:keydown,children:[
      jsx('button',{type:'button',className:'pd-tab',role:'tab',id:'pm-sidebar-workspace-tab','data-sidebar-tab':'workspace','aria-controls':'pm-sidebar-workspace-body','aria-selected':view==='workspace',tabIndex:view==='workspace'?0:-1,onClick:()=>select('workspace'),children:'Workspace'}),
      jsx('button',{type:'button',className:'pd-tab',role:'tab','data-sidebar-tab':'files','aria-selected':view==='files',tabIndex:view==='files'?0:-1,disabled:!base?.ready,onClick:()=>select('files'),children:'Files & Review'})
    ]}),jsx('style',{children:css})
  ]})
}
const nativeSelector={
  connection:'[data-slot="statusbar"] [data-slot="connection-switcher"]',
  backend:'[data-slot="statusbar"]>div:first-child>button[aria-haspopup="menu"]:has(svg:is(.tabler-icon-activity,.tabler-icon-alert-circle,.lucide-activity,.lucide-circle-alert,.lucide-alert-circle),.glyph-spinner)',
  workspace:'[data-slot="statusbar"]>div:first-child>button[aria-haspopup="menu"]:has(svg:is(.tabler-icon-folder-open,.lucide-folder-open))',
  commands:'[data-slot="statusbar"]>div:first-child>button:has(svg:is(.tabler-icon-command,.lucide-command))',
  terminal:'[data-slot="statusbar"]>div:last-child>button:has(svg:is(.lucide-terminal,.tabler-icon-terminal-2))',
  running:'[data-slot="statusbar"]>div:last-child>div:has(>svg:is(.lucide-loader-circle,.tabler-icon-loader-2)):has(>span.truncate + span.truncate)',
  audio:'[data-slot="statusbar"] .hermes-radio-bar'
}
// Visually project the ORIGINAL control. React keeps its DOM, handlers, player,
// tooltip and state; no clone, reparent, replacement terminal or media element.
// Bundled app marks: calendly.com/media/favicon/icon-32x32.png,
// openrouter.ai/favicon/glyph.png, todoist.com/favicon.ico, and the Mac PhotoCraft.icns.
const mcpMarks = new Map(Object.entries({"calendly": "data:image/png;base64,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", "openrouter-media": "data:image/png;base64,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", "todoist": "data:image/png;base64,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", "photocraft": "data:image/png;base64,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"}))
function McpServerRow({server}) {
  const name=(typeof server==='string'?server:server?.name||server?.id)||'Server'
  const mark=mcpMarks.get(String(name).trim().toLowerCase())
  const icon=mark?jsx('img',{src:mark,alt:'',width:16,height:16}):jsx('svg',{viewBox:'0 0 24 24',width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round',children:jsx('path',{d:'M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4'})})
  return jsxs('div',{className:'pd-mcp-row',children:[jsx('span',{className:'pd-mcp-mark','aria-hidden':'true',children:icon}),jsx('span',{children:name})]})
}
function NativeSlot({kind,fallback,height=30,onAvailability}){
  const ref=useRef(null),[node,setNode]=useState(null),visible=useRowVisibility(ref)
  useLayoutEffect(()=>{
    let element=null
    const discover=()=>{
      const next=document.querySelector(nativeSelector[kind])
      if(next===element)return
      element?.removeAttribute('data-pm-native-control');element=next
      element?.setAttribute('data-pm-native-control',kind);setNode(element);onAvailability?.(!!element)
    }
    const observer=new MutationObserver(discover);observer.observe(document.body,{childList:true,subtree:true});discover()
    return()=>{observer.disconnect();element?.removeAttribute('data-pm-native-control')}
  },[kind,onAvailability])
  const anchor=`--pm-native-${kind}`
  const selector=`:root:not([data-pm-session-chat="false"]):has(.pm-details) [data-pm-native-control="${kind}"]`
  const css=!node?'':`${selector}{position:fixed!important;position-anchor:${anchor}!important;position-visibility:anchors-visible;inset:auto!important;left:anchor(left)!important;top:anchor(top)!important;width:anchor-size(width)!important;height:anchor-size(height)!important;min-height:0!important;max-width:none!important;box-sizing:border-box!important;margin:0!important;padding:0 7px!important;display:flex!important;align-items:center;justify-content:flex-start;background:transparent!important;border:0!important;z-index:71!important;visibility:${visible?'visible':'hidden'}!important;pointer-events:${visible?'auto':'none'}!important;}`
  const runningCSS=kind==='running'?`${selector}{justify-content:flex-end!important;padding:0!important;font:14px/1.5 var(--t3-label-font,Michelangelus,Georgia,serif)!important;gap:4px!important}${selector} span{font:inherit!important}${selector}>span.truncate:first-of-type{display:none!important}`:''
  const environmentCSS=['connection','backend','workspace','commands'].includes(kind)?`${selector}{justify-content:flex-end!important;padding:0!important;font:14px/1.5 var(--t3-label-font,Michelangelus,Georgia,serif)!important;gap:6px!important;text-align:right;color:var(--ui-text-primary,#eee)}${selector}>button{width:100%;justify-content:flex-end!important;padding:0!important;font:inherit!important;gap:6px!important;background:transparent!important}${selector} span{font:inherit!important}${selector}>button .flex{flex:0 1 auto!important;justify-content:flex-end}`:''
  const audioCSS=kind==='audio'?`
    ${selector}{display:grid!important;grid-template-columns:minmax(0,1fr) 32px 30px;grid-template-rows:72px 26px 19px;align-content:start;column-gap:8px!important;row-gap:5px!important;padding:0!important;color:var(--ui-text-primary,#eee)}
    ${selector} .hermes-radio-waveform{grid-column:1/-1;grid-row:1;width:100%!important;max-width:none!important;height:72px!important;opacity:.9;color:var(--ui-accent,#346bf1)}${selector} .hermes-radio-waveform-layer{inset:0}
    ${selector}>button:has(.radio-name){grid-column:1;grid-row:2;width:100%!important;min-width:0;height:26px!important;padding:0!important;background:transparent!important;border:0!important;color:inherit!important;justify-content:flex-start;font:16px/1.3 var(--t3-label-font,Michelangelus,Georgia,serif)!important}
    ${selector} .radio-name{font:inherit!important;max-width:none!important;text-align:left}
    ${selector} .hermes-radio-action{grid-row:2/4;align-self:center;justify-self:center;width:30px!important;height:30px!important;padding:5px!important;border-radius:50%!important;justify-content:center!important;color:var(--ui-text-secondary,#bbb)!important}
    ${selector} .hermes-radio-action:nth-of-type(2){grid-column:2;width:28px!important;height:28px!important;border:1px solid var(--ui-text-tertiary,#999)!important;background:transparent!important;color:var(--ui-text-primary,#eee)!important}
    ${selector} .hermes-radio-action-icon,${selector} .hermes-radio-action-icon>svg{width:14px;height:14px}
    ${selector} .hermes-radio-progress{display:block;grid-column:1;grid-row:3;margin:0;font-size:12px;line-height:1.3;color:var(--ui-text-secondary,#bbb)}
    /* Only radio stations have a Next button. Give its track back to episode and Music titles. */
    ${selector}:not(:has(.hermes-radio-action ~ .hermes-radio-action)){grid-template-columns:minmax(0,1fr) 28px}
    ${selector}:has(.hermes-radio-progress input){grid-template-rows:72px 28px auto;row-gap:7px!important}
    ${selector}:has(.hermes-radio-progress input) .hermes-radio-action{grid-row:2;justify-self:end}
    ${selector} .hermes-radio-progress:has(input){grid-column:1/-1;align-self:start;width:100%}
    :root:has(${nativeSelector.audio} .hermes-radio-progress input) .pd-native-audio{min-height:145px}
    ${selector} .hermes-radio-action:hover{color:var(--ui-accent)!important}
    ${selector}>button:focus-visible{outline:2px solid var(--ui-accent);outline-offset:1px}`:''
  return jsxs('div',{ref,className:`pd-native-slot pd-native-${kind}`,style:{height,anchorName:anchor},children:[!node&&jsx('span',{className:'pd-muted',children:fallback}),jsx('style',{children:css+runningCSS+environmentCSS+audioCSS})]})
}
function Performance({sid,owner,scope,current,busy}){
  const liveUsage=useValue(host.state.focusedUsage),client=useQueryClient(),enabled=!!sid&&!!owner
  const usage=useQuery({queryKey:[ID,scope,'usage'],queryFn:()=>requestOwned(owner,'session.usage',{session_id:sid},undefined,current),enabled,retry:false,staleTime:0,refetchInterval:busy?5000:false,refetchOnWindowFocus:false})
  useEffect(()=>{if(enabled)void client.invalidateQueries({queryKey:[ID,scope,'usage']})},[liveUsage,busy,scope,enabled,client])
  useEffect(()=>{
    const tagged=new Set()
    const sync=()=>document.querySelectorAll('[data-slot="statusbar"]>div:last-child>div:has(>svg:is(.lucide-zap,.tabler-icon-bolt)),[data-slot="statusbar"]>div:last-child>div:has(>svg:is(.lucide-layers,.tabler-icon-layers-intersect-2))').forEach(node=>{node.setAttribute('data-pm-performance-duplicate','');tagged.add(node)})
    const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true});sync()
    return()=>{observer.disconnect();tagged.forEach(node=>node.removeAttribute('data-pm-performance-duplicate'))}
  },[])
  // These are the SAME backend-normalized fields consumed by native statusbar.
  // Never derive cache hit from input/cache_read: provider denominators differ.
  // SDK focusedUsage is projected from the focused session state (not the
  // active gateway). Prefer that native stream; RPC is the initial fallback.
  const stats=enabled&&current()?usage.data:null,stream=enabled&&current()?liveUsage:null
  const speed=finite(stream?.avg_tps)?stream.avg_tps:stats?.avg_tps,hit=finite(stream?.cache_hit_pct)?stream.cache_hit_pct:stats?.cache_hit_pct
  const tps=finite(speed)?`${Math.round(speed)} t/s`:'—',cache=finite(hit)&&hit<=100?`${Math.round(hit)}%`:'—'
  return jsxs('section',{className:'pd-section','data-pm-performance':'','data-active':String(enabled),children:[
    jsx('style',{children:':root:has([data-pm-performance][data-active="true"]) [data-pm-performance-duplicate]{display:none!important}'}),
    jsx('h2',{children:'Performance'}),
    jsxs('div',{className:'pd-performance-row',children:[jsx('span',{children:'Current turn'}),enabled?jsx(NativeSlot,{kind:'running',fallback:busy?'Working':'Idle'}):jsx('span',{children:'—'})]}),
    jsxs('div',{className:'pd-performance-row',title:'Rolling output tokens / API latency over approximately the last 10 calls, not latest-turn speed.',children:[jsx('span',{children:'Output speed'}),jsx('span',{'data-pm-tps':'',children:tps})]}),
    jsxs('div',{className:'pd-performance-row',title:'Session cache-read tokens / canonical prompt tokens (fresh input + cache read + cache write), normalized by Hermes.',children:[jsx('span',{children:'Prompt cache hit rate'}),jsx('span',{'data-pm-cache':'',children:cache})]}),
    jsx('p',{className:'pd-note',children:'Speed: rolling API calls · Cache: session aggregate. Unreported telemetry is shown as —.'})
  ]})
}
function AudioSection(){
  const [available,setAvailable]=useState(false)
  const openLibrary=()=>{let answer=null;window.dispatchEvent(new CustomEvent('hermes:rss-radio:v1',{detail:{version:1,kind:'library',respond:value=>{answer=value}}}));if(!answer?.ok)document.querySelector('.hermes-radio-bar .radio-name')?.closest('button')?.click()}
  return jsxs('section',{className:'pd-section pd-audio',children:[
    jsxs('div',{className:'pd-section-heading',children:[jsx('h2',{children:'Audio'}),jsx('button',{className:'pd-library',disabled:!available,onClick:openLibrary,children:'Library'})]}),
    jsx(NativeSlot,{kind:'audio',height:130,fallback:'Radio is not enabled.',onAvailability:setAvailable}),
    null
  ]})
}
function Environment({owner}){
  return jsxs('section',{className:'pd-section pd-environment',children:[
    jsx('h2',{children:'Environment'}),
    ...[['connection','App connection'],['backend','App backend'],['workspace','Native workspace'],['commands','Commands']].map(([kind,label])=>jsxs('div',{className:'pd-environment-row',children:[jsx('span',{className:'pd-environment-label',children:label}),jsx(NativeSlot,{kind,fallback:'Not available'})]},kind)),
    jsx('p',{className:'pd-note',children:owner?`Focused chat: ${owner.profile} · ${owner.connectionId||'local'}`:'Session owner unresolved'}),
    jsx('p',{className:'pd-note',children:'Connection and backend follow the app selection. Workspace is the native workspace selector.'})
  ]})
}
function InlineInventory({title,icon,detail,children}){
  return jsx('section',{className:'pd-section pd-disclosure-section',children:jsxs('details',{className:'pd-disclosure',children:[
    jsxs('summary',{children:[jsx(Icon,{name:icon}),jsx('h2',{children:title}),jsx('span',{className:'pd-trailing',children:detail})]}),
    jsx('div',{className:'pd-disclosure-body',children})
  ]})})
}
// Refresh identity outlives a pane mount, but is unique to this plugin load.
// Reopening a busy chat must never resurrect its pre-switch query cache entry.
const contextInstance=crypto.randomUUID(),lastContextReadings=new Map()
let contextRevisionClock=0
const hasContextWindow=reading=>reading&&finite(reading.context_max)&&reading.context_max>0&&finite(reading.context_used)
function rememberContext(scope,reading){
  if(!hasContextWindow(reading))return
  lastContextReadings.delete(scope);lastContextReadings.set(scope,reading)
  if(lastContextReadings.size>64)lastContextReadings.delete(lastContextReadings.keys().next().value)
}
// Keep refresh generations separate from the pane lifecycle so model changes
// preserve scroll, disclosures and native controls. Coalesce related signals.
function useContextRevision(sid,owner,current) {
  const [revision,setRevision]=useState(()=>++contextRevisionClock),guard=useRef(current)
  guard.current=current
  const scope=ownerKey(owner)
  useEffect(()=>{
    if(!sid||!owner)return
    let timer=0,lastModel=host.state.model?.get()||''
    const refresh=()=>{if(!timer&&guard.current())timer=setTimeout(()=>{timer=0;if(guard.current())setRevision(++contextRevisionClock)},0)}
    const changed=event=>{
      if((event.session_id||event.payload?.session_id)!==sid)return
      if((event.profile??host.state.profile?.get())!==owner.profile)return
      if((event.connectionId??host.state.connectionId?.get()??'local')!==(owner.connectionId||'local'))return
      if(event.type==='session.updated'){
        if(event.payload?.operation!=='model')return
      }else{
        const model=event.payload?.model
        if(typeof model!=='string'||!model||model===lastModel)return
        lastModel=model
      }
      refresh()
    }
    // Token ticks render directly; only model/window/compression changes need
    // to remeasure categories. session.info also carries unrelated turn state.
    const signature=()=>{const usage=host.state.focusedUsage.get();return JSON.stringify([usage?.model,usage?.context_max,usage?.compressions])}
    let lastUsage=signature()
    const usageChanged=()=>{const next=signature();if(next!==lastUsage){lastUsage=next;refresh()}}
    const stops=[host.state.model?.listen(refresh),host.state.focusedUsage.listen(usageChanged),host.onEvent?.('session.info',changed),host.onEvent?.('session.updated',changed)]
    return()=>{clearTimeout(timer);stops.forEach(stop=>stop?.())}
  },[sid,scope])
  return revision
}
function DetailsPanel({sid,owner,lifecycle}) {
  const busy=useValue(host.state.busy),liveUsage=useValue(host.state.focusedUsage)
  const detailsVisible=useValue(host.paneVisibility(`${ID}:panel`))
  const client=useQueryClient(),scope=JSON.stringify([owner?.connectionId,owner?.profile,sid])
  const alive=useRef(true)
  useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
  const current=()=>alive.current&&lifecycle.isActive()&&host.paneVisibility(`${ID}:panel`).get()&&host.state.focusedSessionId.get()===sid&&ownerKey(host.state.focusedSessionOwner?.get())===ownerKey(owner)
  const [confirm,setConfirm]=useState(false),[compacting,setCompacting]=useState(false),[notice,setNotice]=useState('')
  const enabled=!!sid&&!!owner,contextRevision=useContextRevision(sid,owner,current)
  const latestContextRevision=useRef(contextRevision)
  latestContextRevision.current=contextRevision
  const breakdown=useQuery({queryKey:[ID,scope,'context',contextInstance,contextRevision],queryFn:async({signal})=>{
    const reading=await requestOwned(owner,'session.context_breakdown',{session_id:sid},undefined,()=>current()&&!signal.aborted&&latestContextRevision.current===contextRevision)
    if(signal.aborted||!current()||latestContextRevision.current!==contextRevision)throw new Error('Context reading is no longer current.')
    rememberContext(scope,reading)
    return reading
  },placeholderData:previous=>hasContextWindow(previous)?previous:lastContextReadings.get(scope),enabled,retry:false,staleTime:30000,refetchOnWindowFocus:false})

  const servers=useQuery({queryKey:[ID,scope,'mcp'],queryFn:()=>requestOwned(owner,'mcp.servers.list',{},undefined,current),enabled,retry:false,staleTime:60000,refetchOnWindowFocus:false})
  useEffect(()=>{if(!busy&&sid)void client.invalidateQueries({queryKey:[ID,scope,'context']})},[busy,scope,sid,client])
  const reading=enabled&&current()?breakdown.data:null
  // Agent eviction during a model switch can temporarily report a zero window.
  // Keep the last useful reading, explicitly labelled as such, never 0 / 0.
  const b=hasContextWindow(reading)?reading:enabled&&current()?lastContextReadings.get(scope)||reading:null
  // A just-selected model can arrive before the prior model's last usage tick.
  // Never apply that tick's window/count to the new model's breakdown.
  const live=busy&&b?.model&&liveUsage?.model===b.model&&finite(liveUsage.context_used)&&liveUsage.context_max>0&&finite(liveUsage.context_max)&&(breakdown.isPlaceholderData||!hasContextWindow(reading)||liveUsage.context_max===reading.context_max)?liveUsage:null
  const base=live||(hasContextWindow(b)?b:{}),max=finite(base.context_max)?base.context_max:null,used=finite(base.context_used)?base.context_used:null
  const percent=max>0&&used!==null?Math.min(100,used/max*100):null,free=max>0&&used!==null?Math.max(0,max-used):null,categories=normalizeCategories(b)
  const lastReported=hasContextWindow(b)?` Showing last reported values${b.model?' for '+b.model:''}.`:''
  const contextNote=!enabled?'Waiting for a resolved session.':breakdown.isError?'Context refresh unavailable.'+lastReported:breakdown.isFetching&&b?'Updating context…'+lastReported:reading&&!hasContextWindow(reading)?'Context window not reported yet.'+lastReported:!b?'Loading context breakdown…':`${base.context_estimated!==false?'Estimated usage. ':''}Category estimates refresh on model changes and at turn end.${live?' Usage is live.':''}`
  const contextModel=typeof b?.model==='string'&&b.model?b.model:null
  const pending=!breakdown.isPlaceholderData&&!breakdown.isError&&!breakdown.isFetching?reading?.deferred_model:null
  const pendingLabel=pending?.state==='queued'?'Next turn':pending?.state==='confirmation_required'?'Awaiting approval':null
  const nextModel=typeof pending?.model==='string'&&pending.model?pending.model:null
  const sum=categories.reduce((n,c)=>n+(finite(c.tokens)?c.tokens:0),0),segmentsTotal=Math.max(max||0,sum,1)

  const serverRows=Array.isArray(servers.data)?servers.data:Array.isArray(servers.data?.servers)?servers.data.servers:[]
  const contextFiles=Array.isArray(b?.context_files)?b.context_files:[]
  const nav=path=>()=>host.navigate(path)
  const compact=async()=>{
    const generation=lifecycle.generation
    const allowed=()=>current()&&generation===lifecycle.generation&&!host.state.busy.get()
    if(!enabled||compacting||!allowed()){setConfirm(false);return}
    setCompacting(true);setConfirm(false);setNotice('Compacting this conversation…')
    try{await requestOwned(owner,'session.compress',{session_id:sid},120000,allowed);if(!allowed())return;await client.invalidateQueries({queryKey:[ID,scope,'context']});if(allowed())setNotice('Conversation compacted.')}catch{if(allowed())setNotice('Could not compact this conversation. No retry was sent.')}finally{if(current()&&generation===lifecycle.generation)setCompacting(false)}
  }
  return jsxs('aside',{className:'pm-details','aria-label':'Session details',children:[
    jsx('style',{children:CSS+ISLAND_CSS}),
    jsx('div',{className:'pd-workspace-frame',children:jsx(WorkspaceTools,{active:detailsVisible,scope})}),
    jsxs('div',{className:'pd-scroll-body',id:'pm-sidebar-workspace-body',role:'tabpanel','aria-labelledby':'pm-sidebar-workspace-tab',children:[
    jsxs('section',{className:'pd-section',children:[
    jsx('h2',{children:'Context'}),
    contextModel&&jsx('div',{className:'pd-context-model pd-note',children:`Context for: ${contextModel}`},'context-model'),
    pendingLabel&&nextModel&&jsx('div',{className:'pd-deferred-model pd-note',children:`${pendingLabel}: ${nextModel}`},'deferred-model'),
    jsxs('div',{className:'pd-heading',children:[jsx('span',{children:percent===null?(enabled?'Context pending':'Waiting for session'):`${Math.round(percent)}% used`}),jsx('span',{className:'pd-muted',children:`${count(used)} / ${count(max)}`})]}),jsx('div',{className:'pd-meter','aria-label':'Context breakdown',children:categories.filter(c=>finite(c.tokens)).map(c=>jsx('span',{title:`${c.label}: ${count(c.tokens)}`,style:{width:`${c.tokens/segmentsTotal*100}%`,background:c.color}},c.id))}),categories.map(c=>jsx(MeterRow,{...c,max},c.id)),jsx('div',{className:'pd-gap',children:jsx(MeterRow,{label:'Free space',tokens:free,color:'#2b2b2b',max})}),
    jsxs('details',{children:[jsxs('summary',{children:['MCP servers',jsx('span',{className:'pd-count',children:servers.data?String(serverRows.length):'—'})]}),jsx('div',{className:'pd-detail-body',children:serverRows.length?serverRows.map((server,i)=>jsx(McpServerRow,{server},i)):servers.isError?'Server inventory unavailable.':'No server inventory reported.'})]},'mcp-servers'),
    jsxs('details',{children:[jsxs('summary',{children:['Context files',jsx('span',{className:'pd-count',children:b?String(contextFiles.length):'—'})]}),jsx('div',{className:'pd-detail-body',children:contextFiles.length?contextFiles.map((f,i)=>jsx('div',{title:f.path,children:`${f.label||f.path} · ${count(f.est_tokens)}`},i)):'No file breakdown reported.'})]},'context-files'),
    jsxs('div',{className:'pd-compact',children:[jsx('span',{children:'Compact this conversation'}),jsx('button',{disabled:!enabled||busy||compacting,onClick:()=>{if(current())setConfirm(true)},children:compacting?'Compacting…':'Compact session'})]}),
    confirm&&jsxs('div',{className:'pd-confirm',children:['Summarize this conversation to free context? The detailed history may no longer be in the active prompt.',jsxs('div',{children:[jsx('button',{onClick:compact,children:'Compact'}),jsx('button',{onClick:()=>setConfirm(false),children:'Cancel'})]})]}),
    jsx('p',{className:'pd-note',children:contextNote}),notice&&jsx('p',{className:'pd-note',role:'status',children:notice})]}),
    jsx(AudioSection,{}),
    jsx(Performance,{sid,owner,scope,current,busy}),
    jsx(Environment,{owner}),
    jsx('section',{className:'pd-section',children:[jsx('h2',{children:'Terminal'}),jsx(NativeSlot,{kind:'terminal',fallback:'Native terminal control not available.'})]}),
    jsxs(InlineInventory,{title:'Connectors',icon:'server',detail:enabled&&servers.data?`${serverRows.length} MCP`:'Not reported',children:[jsx('p',{children:'MCP servers for the focused chat owner. This is not the full connector catalogue.'}),...(enabled?serverRows:[]).map((server,index)=>jsx('div',{children:typeof server==='string'?server:server.name||server.id||'MCP server'},index)),!serverRows.length&&jsx('p',{children:servers.isError?'MCP inventory unavailable.':'No MCP inventory reported.'}),jsx('button',{className:'pd-secondary',onClick:nav('/capabilities?tab=connectors'),children:'Open full connector management ↗'})]}),
    jsxs(InlineInventory,{title:'Outputs',icon:'output',detail:'Not linked',children:[jsx('p',{children:'Current-session output inventory is not connected to this sidebar.'}),jsx('button',{className:'pd-secondary',onClick:nav('/artifacts'),children:'Open full artifact library (all sessions) ↗'})]}),
    jsxs(InlineInventory,{title:'Servers',icon:'server',detail:'Not reported',children:[jsx('p',{children:'Development-server inventory is not available in this sidebar.'}),jsx('button',{className:'pd-secondary',onClick:nav('/command-center?section=system'),children:'Open full system tools ↗'})]})
    ]})
  ]})
}
const ownerKey=owner=>owner?JSON.stringify([owner.connectionId||'local',owner.profile]):null
function Panel({lifecycle}){
  const sid=useValue(host.state.focusedSessionId)
  const generation=useValue(lifecycle.epoch)
  const visible=useValue(host.paneVisibility(`${ID}:panel`))
  const focusedOwner=host.state.focusedSessionOwner?useValue(host.state.focusedSessionOwner):null
  if(!visible)return null
  return jsx(DetailsPanel,{sid,owner:focusedOwner,lifecycle},JSON.stringify([ownerKey(focusedOwner),sid,generation]))
}
// The SDK exposes no route-classifier atom. Native render slots supply the
// lifecycle instead: a visible composer owns chat chrome, a workspace page
// header vetoes it (even beside a split chat), and overlays unmount titlebar.
// Never infer chat from a retained focused id or maintain a pathname blacklist.
// Older packaged hosts have no layout.chatCompanion projection. Reorder the
// existing flex tracks of the unified layout without moving webviews or panes.
function legacyRail(ctx, markers, visible, paneOf){
  const rootSel='[data-tree-split="pm-unified-root"]',key='pm-session-details.railSizes.v1'
  let last='',lastTarget='',frame=0,drag=null,dead=false
  const css=document.createElement('style');document.head.append(css)
  let sizes={};try{sizes=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(sizes))}catch{}}
  const group=t=>t.querySelector(':scope > [data-tree-group],:scope > [data-tree-split]')
  const id=t=>{const g=group(t);return g?.dataset.treeSplit||g?.dataset.treeGroup||''}
  const sel=t=>{const g=group(t);return `${rootSel} > div:has(> [${g.dataset.treeSplit?'data-tree-split':'data-tree-group'}="${globalThis.CSS.escape(id(t))}"])`}
  // Inline panes carry no data-pane-id on the packaged renderer. Chat surfaces
  // do carry the same data-composer-target the app uses to route input.
  const targetOf=n=>n?.closest?.('[data-composer-target]')?.getAttribute('data-composer-target')||''
  const isChatTarget=t=>t==='main'||t.startsWith('tile:')
  const model=()=>{
    const root=document.querySelector(rootSel);if(!root||document.documentElement.dataset.pmSessionChat!=='true'||document.querySelector('[data-layout-edit="true"]'))return
    const tracks=[...root.children],rail=tracks.find(t=>id(t)==='pm-right-column');if(!rail||!rail.getBoundingClientRect().width)return
    const chats=[...markers.chat].filter(visible),selected=host.state.focusedStoredSessionId?.get(),tile=selected&&`session-tile:${selected}`,tileTarget=selected&&`tile:${selected}`
    const chat=chats.find(n=>paneOf(n)===last)||chats.find(n=>paneOf(n)===tile)||chats.find(n=>targetOf(n)===lastTarget)||chats.find(n=>targetOf(n)===tileTarget)||chats.find(n=>paneOf(n)==='workspace')||chats.find(n=>targetOf(n)==='main')||chats[0]
    const at=tracks.find(t=>chat&&t.contains(chat));if(!at||at===rail||tracks.some(t=>!id(t)))return
    const order=tracks.filter(t=>t!==rail);order.splice(order.indexOf(at)+1,0,rail);return {root,tracks,order}
  }
  // A minimized native group becomes a vertical tab strip. Keep its visual
  // order, but let Hermes own its collapsed width, even between paints.
  const verticalRail='[role="tablist"][aria-orientation="vertical"] [data-tree-tab]'
  const minimized=t=>t.matches(`:has(> [data-tree-group] ${verticalRail})`)
  const flexOf=v=>v.fixed?`0 1 ${v.n}px`:`${v.n} ${v.n} 0px`
  // The unified layout has no projection outside chat, but Sessions still owes
  // the user the width they chose. Resolve that one track on demand.
  const sessionsRow=()=>{const root=document.querySelector(rootSel),t=root&&[...root.children].find(x=>id(x)==='pm-sessions'),v=t&&sizes[id(t)];return t&&v&&Number.isFinite(v.n)&&v.n>0?{t,v}:null}
  const paint=()=>{
    frame=0;if(dead)return
    const m=model();let rules=''
    if(m)for(const [i,t] of m.order.entries()){
      const track=sel(t),v=sizes[id(t)]
      rules+=`${track}{order:${i}!important}\n`
      if(v&&Number.isFinite(v.n)&&v.n>0)rules+=`${track}:not(:has(> [data-tree-group] ${verticalRail})){flex:${flexOf(v)}!important}\n`
    }else if(!document.querySelector('[data-layout-edit="true"]')){
      // Projection inactive: emit the saved Sessions width and nothing else, so
      // every other track keeps its native inline sizing and no rule duplicates
      // the chat projection's copy of this same declaration.
      const row=sessionsRow()
      if(row)rules+=`${sel(row.t)}:not(:has(> [data-tree-group] ${verticalRail})){flex:${flexOf(row.v)}!important}\n`
    }
    if(css.textContent!==rules)css.textContent=rules
  }
  const schedule=()=>{if(!frame&&!dead)frame=requestAnimationFrame(paint)}
  const remember=e=>{const p=paneOf(e.target);if(p==='workspace'||p?.startsWith('session-tile:')){last=p;lastTarget='';schedule();return}const t=targetOf(e.target);if(isChatTarget(t)){lastTarget=t;last='';schedule()}}
  const seam=e=>{
    const h=e.target.closest?.('[data-sash-overlap]');if(!h)return
    const root=document.querySelector(rootSel);if(!root||h.parentElement?.parentElement!==root||document.querySelector('[data-layout-edit="true"]'))return
    const m=model(),b=h.parentElement,shown=(m?m.order:[...root.children]).filter(t=>t.getBoundingClientRect().width>0),i=shown.indexOf(b),a=shown[i-1]
    if(i<0||!a||minimized(a)||minimized(b))return
    // Without the projection the only seam this rail owns is the one Sessions
    // itself borders, in displayed order; its neighbor is never re-saved.
    if(!m){
      if(id(a)==='pm-sessions')return {h,sessions:a,neighbor:b,direction:1}
      if(id(b)==='pm-sessions')return {h,sessions:b,neighbor:a,direction:-1}
      return
    }
    const next=shown[i+1],browser=id(b)==='pm-right-column'&&next&&!minimized(next)&&next.querySelector('[aria-selected="true"]:is([data-tree-tab="preview"],[data-tree-tab^="preview-tile:"])')?next:null
    const original=m.tracks.filter(t=>shown.includes(t));if(!browser&&original[original.indexOf(b)-1]===a&&!Object.keys(sizes).length)return
    return {h,a,b,shown,browser}
  }
  // Outside chat the seam still moves, but only the Sessions entry is written to
  // the shared saved sizes: the neighbor keeps its native width and geometry.
  const plainDown=(e,s)=>{
    const ca=getComputedStyle(s.sessions),cb=getComputedStyle(s.neighbor),a=s.sessions.getBoundingClientRect().width,b=s.neighbor.getBoundingClientRect().width
    const min=Math.max(64,parseFloat(ca.minWidth)||0),max=parseFloat(ca.maxWidth)||Infinity,bmin=Math.max(64,parseFloat(cb.minWidth)||0),bmax=parseFloat(cb.maxWidth)||Infinity
    const fixed=parseFloat(ca.flexGrow)===0,start=e.clientX,prior=sizes
    let moved=false
    const move=v=>{
      if(v.pointerId!==e.pointerId)return
      const delta=s.direction*(v.clientX-start);if(!delta&&!moved)return
      const d=Math.max(Math.max(min-a,b-bmax),Math.min(Math.min(max-a,b-bmin),delta))
      if(delta)moved=true
      sizes={...sizes,['pm-sessions']:{fixed,n:Math.max(1,a+d)}}
      paint()
    };const end=v=>{if(v&&v.pointerId!==e.pointerId)return;const cancel=!v||v.type==='pointercancel';if(cancel||!moved)sizes=prior;else save();s.h.removeEventListener('pointermove',move);s.h.removeEventListener('pointerup',end);s.h.removeEventListener('pointercancel',end);s.h.removeEventListener('lostpointercapture',end);drag=null;paint()};drag=end;s.h.setPointerCapture(e.pointerId);s.h.addEventListener('pointermove',move);s.h.addEventListener('pointerup',end);s.h.addEventListener('pointercancel',end);s.h.addEventListener('lostpointercapture',end)}
  const down=e=>{if(e.button!==0||drag)return;const s=seam(e);if(!s)return;e.preventDefault();e.stopPropagation();if(s.sessions)return plainDown(e,s);const tracks=s.shown.filter(t=>!minimized(t)).map(t=>{const c=getComputedStyle(t);return {t,w:t.getBoundingClientRect().width,fixed:parseFloat(c.flexGrow)===0,min:Math.max(64,parseFloat(c.minWidth)||0),max:parseFloat(c.maxWidth)||Infinity}}),a=tracks.find(x=>x.t===s.a),b=tracks.find(x=>x.t===s.b);const start=e.clientX,prior={...sizes};const browser=tracks.find(x=>x.t===s.browser)
    const move=v=>{
      if(v.pointerId!==e.pointerId)return
      const delta=v.clientX-start
      const d=Math.max(Math.max(a.min-a.w,b.w-b.max),Math.min(Math.min(a.max-a.w,b.w-b.min),delta))
      // When the rail reaches its ceiling, give the rest of this leftward drag to Browser.
      const spill=browser&&delta<d?Math.max(0,Math.min(d-delta,a.w+d-a.min,browser.max-browser.w)):0
      for(const x of tracks)sizes[id(x.t)]={fixed:x.fixed,n:Math.max(1,x.w+(x===a?d-spill:x===b?-d:x===browser?spill:0))}
      paint()
    };const end=v=>{if(v&&v.pointerId!==e.pointerId)return;const cancel=!v||v.type==='pointercancel';if(cancel)sizes=prior;else save();s.h.removeEventListener('pointermove',move);s.h.removeEventListener('pointerup',end);s.h.removeEventListener('pointercancel',end);s.h.removeEventListener('lostpointercapture',end);drag=null;schedule()};drag=end;s.h.setPointerCapture(e.pointerId);s.h.addEventListener('pointermove',move);s.h.addEventListener('pointerup',end);s.h.addEventListener('pointercancel',end);s.h.addEventListener('lostpointercapture',end)}
  const reset=e=>{const s=seam(e);if(!s)return;e.preventDefault();e.stopPropagation();if(s.sessions){delete sizes['pm-sessions']}else sizes={};save();paint()}
  const observer=new MutationObserver(changes=>{if(changes.some(x=>x.type==='attributes'||[...x.addedNodes,...x.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('[data-tree-split],[data-tree-group],[data-pane-id]')||n.querySelector?.('[data-tree-split],[data-tree-group],[data-pane-id]')))))schedule()});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-pane-hidden','inert','hidden']});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-pm-session-chat','data-layout-edit']})
  document.addEventListener('focusin',remember,true);document.addEventListener('pointerdown',remember,true);document.addEventListener('pointerdown',down,true);document.addEventListener('dblclick',reset,true);window.addEventListener('resize',schedule);const stop=host.state.focusedStoredSessionId?.listen(()=>{last='';lastTarget='';schedule()});schedule()
  ctx.onDispose(()=>{dead=true;drag?.();observer.disconnect();stop?.();cancelAnimationFrame(frame);css.remove();document.removeEventListener('focusin',remember,true);document.removeEventListener('pointerdown',remember,true);document.removeEventListener('pointerdown',down,true);document.removeEventListener('dblclick',reset,true);window.removeEventListener('resize',schedule)})
}

function sessionLifecycle(ctx) {
  const markers={chat:new Set(),page:new Set(),shell:new Set()}
  let active=false,disposed=false,timer=0,unregister=[]
  const focusedPane=host.state.focusedChatPaneId
  const anchor=atom(null)
  if(focusedPane)ctx.register({id:'chat-companion',area:'layout.chatCompanion',data:{
    pane:`${ID}:panel`,companionPanes:[`${ID}:controls`],legacySplit:'pm-right-column',legacyPanes:['files','review'],anchor
  }})
  const epoch=atom(0),bump=()=>epoch.set(epoch.get()+1)
  const paneOf=node=>{
    const layer=node.closest('[data-pane-id],[data-pane-host]')
    return layer?.getAttribute('data-pane-id')??layer?.getAttribute('data-pane-host')
  }
  const visible=node=>{
    const pane=paneOf(node)
    return node.isConnected&&!node.closest('[data-pane-hidden],[inert],[hidden]')&&(!pane||host.paneVisibility(pane).get())
  }
  const chatMarker=()=>{
    if(disposed||![...markers.shell].some(visible)||[...markers.page].some(visible))return
    const focused=focusedPane?.get()
    return [...markers.chat].find(node=>visible(node)&&(!focusedPane||(focused&&paneOf(node)===focused)))
  }
  if(!focusedPane)legacyRail(ctx,markers,visible,paneOf)
  const wantsChat=()=>Boolean(chatMarker())
  const style=document.createElement('style')
  style.dataset.pmSessionLifecycle=''
  style.textContent=`
:root[data-pm-session-chat="false"] [data-tree-split] > div:has(> [data-tree-split="pm-right-column"]),
:root[data-pm-session-chat="false"] [data-pane-host]:is([data-tree-group="pm-details-group"],[data-tree-group="pm-files-group"],[data-tree-group="pm-review-group"],[data-tree-group="pm-controls-group"]){display:none!important}
`
  // Keep the native Files/Review contributions, user layout, widths and Close
  // preferences intact. Only the wrapper of our named island leaves the grid.
  if(!focusedPane)document.head.append(style)
  const lifecycle={epoch,get generation(){return epoch.get()},isActive:wantsChat}
  const sync=()=>{
    timer=0
    if(disposed)return
    const marker=chatMarker(),next=Boolean(marker)
    anchor.set(marker?paneOf(marker)??null:null)
    document.documentElement.setAttribute('data-pm-session-chat',String(next))
    if(next===active)return
    active=next;bump()
    if(next){
      unregister=[
        ctx.register({id:'panel',area:'panes',title:'Session details',data:{placement:'right',width:CONTEXT_MIN_WIDTH,minWidth:CONTEXT_MIN_WIDTH,maxWidth:CONTEXT_MAX_WIDTH,dock:{pane:'workspace',pos:'right'}},render:()=>jsx(Panel,{lifecycle})}),
        ctx.register({id:'controls',area:'panes',title:'App settings',data:{placement:'right',width:CONTEXT_MIN_WIDTH,minWidth:CONTEXT_MIN_WIDTH,maxWidth:CONTEXT_MAX_WIDTH,height:'128px',minHeight:'84px',maxHeight:'180px',...(focusedPane?{dock:{pane:`${ID}:panel`,pos:'bottom'}}:{})},render:()=>jsx(ControlsPanel,{})})
      ]
    }else{const stops=unregister;unregister=[];stops.forEach(stop=>stop())}
  }
  const schedule=()=>{if(!disposed&&!timer)timer=setTimeout(sync,0)}
  function Marker({kind}){
    const ref=useRef(null)
    useLayoutEffect(()=>{
      const node=ref.current;markers[kind].add(node);schedule()
      // Pane visibility also follows collapsed sides, tab focus and overlays.
      const pane=paneOf(node)
      const stop=pane?host.paneVisibility(pane).listen(schedule):null
      return()=>{markers[kind].delete(node);stop?.();schedule()}
    },[kind])
    return jsx('span',{ref,'aria-hidden':true,style:{display:'none'}})
  }
  ctx.register({id:'chat-lifecycle',area:'composer.top',render:()=>jsx(Marker,{kind:'chat'})})
  ctx.register({id:'page-lifecycle',area:'workspace.pageHeader',render:()=>jsx(Marker,{kind:'page'})})
  ctx.register({id:'shell-lifecycle',area:'titleBar.center',render:()=>jsx(Marker,{kind:'shell'})})
  const observer=new MutationObserver(schedule)
  observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-pane-hidden','inert','hidden']})
  const stopPane=focusedPane?.listen(schedule)
  const focusSignature=()=>JSON.stringify([host.state.focusedSessionId.get(),host.state.focusedStoredSessionId?.get(),ownerKey(host.state.focusedSessionOwner?.get())])
  let lastFocus=focusSignature()
  const focusChanged=()=>{const next=focusSignature();if(next!==lastFocus){lastFocus=next;bump()}}
  const focusStops=[host.state.focusedSessionId,host.state.focusedStoredSessionId,host.state.focusedSessionOwner].filter(Boolean).map(store=>store.listen(focusChanged))
  sync()
  ctx.onDispose(()=>{disposed=true;anchor.set(null);bump();clearTimeout(timer);observer.disconnect();stopPane?.();focusStops.forEach(stop=>stop());unregister.forEach(stop=>stop());style.remove();document.documentElement.removeAttribute('data-pm-session-chat')})
  return lifecycle
}
export default {id:ID,name:'Session details',description:'Reference-style right sidebar using live Hermes context and native controls.',register(ctx){
  const lifecycle=sessionLifecycle(ctx)
  ctx.register({id:'one-sidebar',area:'layouts',title:'Michelangelus unified sidebar',data:unifiedLayout})
  ctx.register({id:'open',area:PALETTE_AREA,data:{id:'pm-session-details.open',label:'Session details: show right sidebar',run:()=>{
    if(!lifecycle.isActive())return
    host.revealPane?.(`${ID}:panel`);host.revealPane?.(`${ID}:controls`)
  }}})
}}
