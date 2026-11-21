import {host, useValue, PALETTE_AREA, ROUTES_AREA} from '@hermes/plugin-sdk'
import {useEffect,useState} from 'react'
import {jsx, jsxs} from 'react/jsx-runtime'

// Work library: the Chrome import stays local (IndexedDB) and is never
// consulted by the research actions. Research metadata is read from the app's
// own projects RPC, and draft writes go through the app's composer bus. No
// page injection, no implicit history read and no send.
const ID='pm-browser-library', route='/pm-browser-library', key='work-library-v1'
const RESEARCH_DB='pm-browser-research-local', RESEARCH_STORE='entries'
const MAX_TITLE=300, MAX_EXCERPT=4000, MAX_NOTE=2000

/** Only absolute http(s) URLs without credentials are accepted. */
function safeURL(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null}catch{return null}}
function bookmarks(raw){
  if(!/NETSCAPE-Bookmark-file-1/i.test(raw))throw Error('Choose an HTML file exported by Chrome Bookmark Manager.')
  // Template contents are inert: embedded icons, scripts and other resources never load.
  const template=document.createElement('template');template.innerHTML=raw
  const stack=[], out=[]
  function visit(parent,level){if(level>128)throw Error('Bookmark nesting is too deep.');let folder='';for(const e of parent.children){
    if(e.tagName==='H3')folder=e.textContent.trim()
    else if(e.tagName==='A'){const url=safeURL(e.getAttribute('href'));if(url)out.push({url,title:e.textContent.trim()||url,folder:stack.slice(),kind:'bookmark'})}
    else if(e.tagName==='DL'){if(folder)stack.push(folder);visit(e,level+1);if(folder)stack.pop();folder=''}
    else if(['DT','P','DD'].includes(e.tagName))visit(e,level+1)
  }}visit(template.content,0);return out
}
function history(raw,days){const list=JSON.parse(raw)['Browser History'];if(!Array.isArray(list))throw Error('Choose a Chrome Takeout Browser History JSON file.');const out=[],now=Date.now(),min=days==='all'?0:now-Number(days)*86400000;for(const e of list){if(!e)continue;const url=safeURL(e.url),time=Number(e.time_usec)/1000;if(url&&Number.isFinite(time)&&time>0&&time>=min&&time<=now)out.push({url,title:String(e.title||url),kind:'history',time})}return out}
function merge(a,b){const m=new Map();for(const r of [...a,...b]){const k=JSON.stringify([r.kind,r.folder||[],r.url,r.kind==='bookmark'?r.title:'']);if(!m.has(k)||(r.time||0)>(m.get(k).time||0))m.set(k,r)}return [...m.values()]}
const btn=(label,onClick,disabled=false)=>jsx('button',{className:'rounded border px-3 py-1',type:'button',onClick,disabled,children:label})
// Do not use synced preferences or the gateway for browser history.
function library(action,batch){return new Promise((resolve,reject)=>{
  const open=indexedDB.open('pm-browser-library-local',1);open.onupgradeneeded=()=>open.result.createObjectStore('libraries');open.onerror=()=>reject(Error('Local storage unavailable.'));
  open.onsuccess=()=>{const db=open.result,tx=db.transaction('libraries',action==='read'?'readonly':'readwrite'),store=tx.objectStore('libraries');let next=[];
    tx.oncomplete=()=>{db.close();resolve(next)};tx.onabort=()=>{db.close();reject(Error('Local storage transaction failed.'))};
    if(action==='erase'){store.delete(key);return}const req=store.get(key);req.onsuccess=()=>{next=req.result||[];if(action==='save'){next=merge(next,batch);store.put(next,key)}};
  }})}

// ── research model ──────────────────────────────────────────────────────────
// Every scope carries the owning gateway + profile + project. A bare profile
// name is not enough: two gateways can expose the same profile name, so a key
// that omitted the connection would leak one gateway's research into another's.

function cleanLine(value,max){return String(value==null?'':value).replace(/\s+/g,' ').trim().slice(0,max)}
function cleanBlock(value,max){return String(value==null?'':value).replace(/\r\n?/g,'\n').replace(/[ \t]+$/gm,'').trim().slice(0,max)}
function normalizeOwner(owner){
  return {
    connectionId:String(owner&&owner.connectionId||'').trim()||'local',
    profile:String(owner&&owner.profile||'').trim()||'default'
  }
}
function baseName(value){
  const parts=String(value||'').replace(/[/\\]+$/,'').split(/[/\\]/).filter(Boolean)
  return parts[parts.length-1]||''
}
function titleFromURL(value){
  const safe=safeURL(value);if(!safe)return ''
  try{const u=new URL(safe);const last=u.pathname.split('/').filter(Boolean).pop();return cleanLine(last?decodeURIComponent(last):u.hostname,MAX_TITLE)||u.hostname}catch{return ''}
}
function hostOf(value){try{return new URL(value).host}catch{return String(value||'')}}
function projectRef(project){
  if(!project)return {id:'',name:'Home',path:''}
  return {
    id:String(project.id||'').trim(),
    name:cleanLine(project.name,120)||'Project',
    path:String(project.primary_path||project.path||'').trim()
  }
}
function scopeKey(owner,project){
  const o=normalizeOwner(owner), p=projectRef(project)
  return JSON.stringify([o.connectionId,o.profile,p.id?'id:'+p.id:(p.path?'path:'+p.path:'home')])
}
function projectFromResolved(result,cwd){
  const found=result&&result.project
  if(found&&found.id)return projectRef(found)
  const path=String(cwd||'').trim()
  if(!path)return null
  return {id:'cwd:'+path,name:baseName(path)||'Workspace',path,synthetic:true}
}
function projectOptions(projects,suggested){
  const seen=new Set(), out=[]
  const add=project=>{const ref=projectRef(project);if(!ref.id||seen.has(ref.id))return;seen.add(ref.id);out.push(ref)}
  if(suggested)add(suggested)
  const list=Array.isArray(projects)?[...projects]:[]
  list.sort((a,b)=>String(a&&a.name||'').localeCompare(String(b&&b.name||'')))
  for(const project of list)if(!(project&&project.archived))add(project)
  return out
}
function selectedProjectRef(id,projects,suggested){
  if(!id)return null
  const list=[...(Array.isArray(projects)?projects:[]),...(suggested?[suggested]:[])]
  const found=list.find(project=>String(project&&project.id||'')===id)
  return found?projectRef(found):{id,name:id,path:''}
}
function entryFor(input,owner,project,now=Date.now()){
  const url=safeURL(input&&input.url)
  if(!url)throw Error('Enter a web address beginning with http:// or https://.')
  const o=normalizeOwner(owner), p=projectRef(project)
  const source=['bookmark','preview','manual'].includes(input&&input.source)?input.source:'manual'
  return {
    id:'r_'+now.toString(36)+'_'+Math.random().toString(36).slice(2,8),
    savedAt:now,
    scope:scopeKey(o,p),
    owner:o,
    project:p,
    url,
    title:cleanLine(input&&input.title,MAX_TITLE)||titleFromURL(url)||url,
    excerpt:cleanBlock(input&&input.excerpt,MAX_EXCERPT),
    note:cleanLine(input&&input.note,MAX_NOTE),
    source
  }
}
/** Research actions only ever use bookmarks the user pointed at. History rows
 *  stay copy-only: they are a visit log, not a research selection. */
function researchEligible(row){return Boolean(row&&row.kind==='bookmark'&&safeURL(row.url))}
function entryInScope(entry,owner){return Boolean(entry&&entry.scope===scopeKey(owner,entry.project))}
function entryInProject(entry,owner,projectId){
  return entryInScope(entry,owner)&&entry.scope===scopeKey(owner,projectId?{id:projectId}:null)
}
function sortResearch(list){return [...list].sort((a,b)=>(b&&b.savedAt||0)-(a&&a.savedAt||0))}
function citationText(entry){
  const lines=['Research reference — '+(entry.title||entry.url),entry.url]
  if(entry.excerpt)lines.push('','Excerpt: '+entry.excerpt)
  if(entry.note)lines.push('','Note: '+entry.note)
  return lines.join('\n')
}
/** Read-only draft check, then append. Never replaces the draft and never
 *  submits: the composer bus fails closed when no visible surface owns the
 *  addressed chat. */
async function addResearchToDraft(entry,composer,sessionId,current=()=>true){
  if(!entry)return {ok:false,error:'No research item selected.'}
  if(!composer||typeof composer.getDraft!=='function'||typeof composer.insertText!=='function')
    return {ok:false,error:'The draft surface is unavailable in this Desktop build.'}
  const text=citationText(entry)
  if(!text.trim())return {ok:false,error:'This research item has nothing to add.'}
  const stale={ok:false,error:'The focused chat changed, so no reference was added.'}
  if(!current())return stale
  let existing
  try{existing=await composer.getDraft(sessionId)}
  catch{return {ok:false,error:'Could not read that chat’s draft, so nothing was changed.'}}
  if(!current())return stale
  if(existing===null)return {ok:false,error:'That chat is not open, so its draft was not changed. Open the chat and try again.'}
  let added=false
  try{added=await composer.insertText(sessionId,text,{mode:'block'})}
  catch{return {ok:false,error:'The draft did not accept the reference, so nothing was changed.'}}
  if(!added)return {ok:false,error:'The draft did not accept the reference, so nothing was changed.'}
  return {ok:true,text}
}
/** Parse the prompt the native preview's Annotate → Add to chat flow writes
 *  into the composer draft. This reads the draft only; the page itself is
 *  never scripted or inspected. The LAST prompt in the draft wins. */
function parseAnnotateDraft(value){
  const raw=String(value==null?'':value).replace(/\r\n?/g,'\n')
  const heads=Array.from(raw.matchAll(/^I left (?:a comment|\d+ comments?) on (https?:\/\/\S+) in the in-app browser\./gm))
  if(!heads.length)return null
  const head=heads[heads.length-1]
  const url=safeURL(head[1])
  if(!url)return null
  const comments=[]
  let current=null
  for(const line of raw.slice(head.index+head[0].length).split('\n')){
    const trimmed=line.trim()
    const start=/^Comment (\d+)\s*$/.exec(trimmed)
    if(start){
      if(current)comments.push(current)
      current={number:Number(start[1]),target:'',note:''}
      continue
    }
    if(!current)continue
    if(/^Group \d+ —/.test(trimmed)||/^Image \d+ marks the target/.test(trimmed)){
      comments.push(current);current=null;continue
    }
    const target=/^Target:\s*(.*)$/.exec(trimmed)
    if(target){current.target=target[1].trim();continue}
    const note=/^Note:\s*(.*)$/.exec(trimmed)
    if(note){current.note=note[1].trim();continue}
  }
  if(current)comments.push(current)
  const useful=comments.filter(comment=>comment.target||comment.note)
  return useful.length?{url,comments:useful}:null
}
function previewExcerpt(parsed){
  return parsed.comments.map(comment=>comment.note||comment.target).filter(Boolean).join('\n\n')
}

// ── research storage ────────────────────────────────────────────────────────
// A separate database from the work library, so the existing import path and
// its `work-library-v1` record are untouched. Reads are by scope index.

function memoryAdapter(){
  const items=new Map()
  return {
    async getAll(scope){return [...items.values()].filter(entry=>entry.scope===scope)},
    async get(id){return items.get(id)},
    async put(entry){items.set(entry.id,JSON.parse(JSON.stringify(entry)))},
    async delete(id){items.delete(id)}
  }
}
function createResearchStore(adapter){
  return {
    async list(scope){return sortResearch(await adapter.getAll(scope)).filter(entry=>entry&&entry.scope===scope)},
    async save(entry){
      if(!entry||!entry.scope)throw Error('Research entry is missing its scope.')
      if(entry.scope!==scopeKey(entry.owner,entry.project))throw Error('Research entry scope does not match its owner.')
      await adapter.put(entry)
      return entry
    },
    async remove(id,scope){
      const entry=await adapter.get(id)
      if(!entry||entry.scope!==scope)return false
      await adapter.delete(id)
      return true
    }
  }
}
function indexedDBAdapter(){
  const open=()=>new Promise((resolve,reject)=>{
    const request=indexedDB.open(RESEARCH_DB,1)
    request.onupgradeneeded=()=>{
      const db=request.result
      if(!db.objectStoreNames.contains(RESEARCH_STORE)){
        const store=db.createObjectStore(RESEARCH_STORE,{keyPath:'id'})
        store.createIndex('scope','scope',{unique:false})
      }
    }
    request.onerror=()=>reject(Error('Local research storage unavailable.'))
    request.onsuccess=()=>resolve(request.result)
  })
  async function run(mode,operation){
    const db=await open()
    try{
      return await new Promise((resolve,reject)=>{
        let result
        const tx=db.transaction(RESEARCH_STORE,mode)
        try{result=operation(tx.objectStore(RESEARCH_STORE))}
        catch(error){reject(error);return}
        tx.oncomplete=()=>resolve(result)
        tx.onabort=()=>reject(Error('Local research storage transaction failed.'))
        tx.onerror=()=>reject(Error('Local research storage transaction failed.'))
      })
    }finally{db.close()}
  }
  return {
    getAll(scope){return run('readonly',store=>new Promise((resolve,reject)=>{
      const request=store.index('scope').getAll(scope)
      request.onsuccess=()=>resolve(request.result||[])
      request.onerror=()=>reject(Error('Could not read research items.'))
    }))},
    get(id){return run('readonly',store=>new Promise((resolve,reject)=>{
      const request=store.get(id)
      request.onsuccess=()=>resolve(request.result)
      request.onerror=()=>reject(Error('Could not read the research item.'))
    }))},
    put(entry){return run('readwrite',store=>store.put(entry))},
    delete(id){return run('readwrite',store=>store.delete(id))}
  }
}
const researchStore=createResearchStore(indexedDBAdapter())

// ── projects ────────────────────────────────────────────────────────────────
// Project metadata comes from the focused chat's own gateway, never from the
// active socket by assumption. An ambiguous owner fails closed.

function ownerRoute(owner){
  const o=normalizeOwner(owner)
  if(!o.connectionId||o.connectionId==='local')return o.profile
  return {connectionId:o.connectionId,profile:o.profile,targetProfile:o.profile}
}
async function projectRequest(owner,method,params){
  const o=normalizeOwner(owner)
  const body={...(params||{}),profile:o.profile}
  if(typeof host.requestProfile==='function')return host.requestProfile(ownerRoute(owner),method,body)
  if(o.connectionId!=='local')throw Error('This Desktop build cannot route to that gateway.')
  return host.request(method,body)
}

// ── page ────────────────────────────────────────────────────────────────────

const blankCapture=()=>({url:'',title:'',excerpt:'',note:'',source:'manual'})
const shortId=value=>String(value||'').slice(0,8)
const sourceLabel=source=>source==='bookmark'?'bookmark':source==='preview'?'browser selection':'manual'

function ownerIdentity(owner){
  if(!owner)return null
  const o=normalizeOwner(owner)
  return JSON.stringify([o.connectionId,o.profile])
}

function Page({ctx}){
  const owner=useValue(host.state.focusedSessionOwner)
  const stored=useValue(host.state.focusedStoredSessionId)
  const runtime=useValue(host.state.focusedSessionId)
  return jsx(ScopedPage,{ctx},JSON.stringify([ownerIdentity(owner),stored,runtime]))
}

function ScopedPage({ctx}){
  const [rows,S]=useState([]),[pending,P]=useState(null),[file,F]=useState(null),[kind,K]=useState('bookmark'),[days,D]=useState('30'),[msg,M]=useState(''),[q,Q]=useState(''),[busy,B]=useState(false),[remove,R]=useState(false)
  const [research,setResearch]=useState([]),[projects,setProjects]=useState([]),[suggested,setSuggested]=useState(null)
  const [projectId,setProjectId]=useState(''),[projectTouched,setProjectTouched]=useState(false),[projectNote,setProjectNote]=useState('')
  const [capture,setCapture]=useState(blankCapture),[rmsg,setRmsg]=useState(''),[rbusy,setRbusy]=useState(false),[removeId,setRemoveId]=useState(null)

  const owner=useValue(host.state.focusedSessionOwner)
  const focusedStored=useValue(host.state.focusedStoredSessionId)
  const cwd=useValue(host.state.cwd)
  const focusedRuntime=useValue(host.state.focusedSessionId)
  const activeRuntime=useValue(host.state.activeSessionId)
  const ownerKey=ownerIdentity(owner)
  const currentChat=()=>!!ownerKey&&ownerKey===ownerIdentity(host.state.focusedSessionOwner.get())
    &&focusedStored===host.state.focusedStoredSessionId.get()&&focusedRuntime===host.state.focusedSessionId.get()
  const targetChat=focusedStored||'new'

  useEffect(()=>{let active=true;library('read').then(r=>{if(active)S(r)},()=>{if(active)M('Local library unavailable.')});return()=>{active=false}},[])

  useEffect(()=>{setProjectTouched(false)},[focusedStored])

  useEffect(()=>{
    let active=true
    setProjects([]);setSuggested(null);setProjectTouched(false);setProjectId('');setProjectNote('')
    if(!owner)return
    projectRequest(owner,'projects.list').then(payload=>{
      if(active)setProjects(Array.isArray(payload&&payload.projects)?payload.projects:[])
    },()=>{if(active)setProjectNote('Project list unavailable; saving to this chat’s workspace or Home.')})
    return()=>{active=false}
  },[ownerKey])

  useEffect(()=>{
    let active=true
    setSuggested(null)
    if(!owner)return
    const isPrimary=!focusedStored||Boolean(focusedRuntime&&activeRuntime&&focusedRuntime===activeRuntime)
    const path=String(cwd||'').trim()
    if(!isPrimary||!path)return
    projectRequest(owner,'projects.for_cwd',{cwd:path}).then(result=>{
      if(active)setSuggested(projectFromResolved(result,path))
    },()=>{if(active)setSuggested(projectFromResolved(null,path))})
    return()=>{active=false}
  },[ownerKey,cwd,focusedStored,focusedRuntime,activeRuntime])

  useEffect(()=>{if(!projectTouched)setProjectId(suggested&&suggested.id||'')},[suggested&&suggested.id,projectTouched])

  useEffect(()=>{
    let active=true
    setResearch([]);setRemoveId(null)
    if(!owner)return
    const scope=scopeKey(owner,projectId?{id:projectId}:null)
    researchStore.list(scope).then(list=>{if(active)setResearch(sortResearch(list))},()=>{if(active)setRmsg('Research storage unavailable.')})
    return()=>{active=false}
  },[ownerKey,projectId])

  const clear=()=>{P(null);F(null);M('');R(false)}
  async function preview(){B(true);P(null);try{if(!file||file.size>64*1024*1024)throw Error('Choose an export smaller than 64 MB.');const raw=await file.text();const parsed=kind==='bookmark'?bookmarks(raw):history(raw,days);const batch=merge([],parsed);P(batch);M(`${batch.length} ${kind==='bookmark'?'bookmark entries':'distinct history pages'} eligible. Confirm only if this file came from your Work profile.`)}catch(e){M(e instanceof SyntaxError?'Invalid export format.':e.message)}finally{B(false)}}
  async function save(){B(true);try{const next=await library('save',pending);S(next);P(null);M(`Saved locally. ${next.length} entries in Work.`)}catch{M('Could not save and verify the complete import. Try a smaller export.')}finally{B(false)}}
  async function erase(){B(true);try{await library('erase');S([]);clear();Q('');M('Work library removed. The Chrome source is unchanged.')}catch{M('Could not remove the library.')}finally{B(false)}}

  const selectedProject=selectedProjectRef(projectId,projects,suggested)
  const options=projectOptions(projects,suggested)
  const ownerText=owner?`${normalizeOwner(owner).profile} · ${normalizeOwner(owner).connectionId}`:'no single owner'
  const chatText=focusedStored?`chat ${shortId(focusedStored)}`:'a new draft'
  const destination=selectedProject?selectedProject.name:'Home'

  function useRow(row){
    if(!researchEligible(row)){setRmsg('Only bookmark rows can be used for research.');return}
    setCapture({url:row.url,title:row.title,excerpt:'',note:'',source:'bookmark'});setRmsg('Loaded into the capture form. Add an excerpt or note, then save or add to draft.')
  }
  async function copyURL(url){try{M(await ctx.os.writeClipboard(url)?'URL copied. Paste it into the Hermes browser.':'Clipboard unavailable.')}catch{M('Clipboard unavailable.')}}

  async function saveCapture(){
    if(rbusy)return
    if(!currentChat()){setRmsg('Focus one chat before saving.');return}
    setRbusy(true)
    try{
      const entry=entryFor(capture,owner,selectedProjectRef(projectId,projects,suggested))
      await researchStore.save(entry)
      const list=await researchStore.list(entry.scope)
      if(!currentChat())return
      setResearch(sortResearch(list))
      setRmsg(`Saved to ${entry.project.name}. ${list.length} research item${list.length===1?'':'s'} in this project.`)
    }catch(e){setRmsg(e instanceof Error?e.message:'Could not save the research item.')}
    finally{setRbusy(false)}
  }

  async function addCapture(){
    if(rbusy)return
    if(!owner){setRmsg('Focus one chat before adding to its draft.');return}
    setRbusy(true)
    try{
      const entry=entryFor(capture,owner,selectedProjectRef(projectId,projects,suggested))
      const result=await addResearchToDraft(entry,host.composer,targetChat,currentChat)
      setRmsg(result.ok?'Added to this chat’s draft. Nothing was sent.':result.error)
    }catch(e){setRmsg(e instanceof Error?e.message:'Could not add the reference to the draft.')}
    finally{setRbusy(false)}
  }

  async function addSaved(entry){
    if(rbusy)return
    if(!owner){setRmsg('Focus one chat before adding to its draft.');return}
    if(!entryInProject(entry,owner,projectId)){setRmsg('That item belongs to another profile or project, so it was not added.');return}
    setRbusy(true)
    try{
      const result=await addResearchToDraft(entry,host.composer,targetChat,currentChat)
      setRmsg(result.ok?'Added to this chat’s draft. Nothing was sent.':result.error)
    }catch{setRmsg('Could not add the reference to the draft.')}
    finally{setRbusy(false)}
  }

  async function addRow(row){
    if(rbusy)return
    if(!owner){setRmsg('Focus one chat before adding to its draft.');return}
    if(!researchEligible(row)){setRmsg('Only bookmark rows can be added as research.');return}
    setRbusy(true)
    try{
      const entry=entryFor({url:row.url,title:row.title,source:'bookmark'},owner,selectedProjectRef(projectId,projects,suggested))
      const result=await addResearchToDraft(entry,host.composer,targetChat,currentChat)
      setRmsg(result.ok?`Added “${entry.title}” to this chat’s draft. Nothing was sent.`:result.error)
    }catch(e){setRmsg(e instanceof Error?e.message:'Could not add the bookmark to the draft.')}
    finally{setRbusy(false)}
  }

  async function saveRow(row){
    if(rbusy)return
    if(!currentChat()){setRmsg('Focus one chat before saving.');return}
    if(!researchEligible(row)){setRmsg('Only bookmark rows can be saved as research.');return}
    setRbusy(true)
    try{
      const entry=entryFor({url:row.url,title:row.title,source:'bookmark'},owner,selectedProjectRef(projectId,projects,suggested))
      await researchStore.save(entry)
      const list=await researchStore.list(entry.scope)
      if(!currentChat())return
      setResearch(sortResearch(list))
      setRmsg(`Saved “${entry.title}” to ${entry.project.name}. ${list.length} research item${list.length===1?'':'s'} in this project.`)
    }catch(e){setRmsg(e instanceof Error?e.message:'Could not save the bookmark.')}
    finally{setRbusy(false)}
  }

  async function removeSaved(entry){
    if(rbusy)return
    if(!currentChat()||!entryInProject(entry,owner,projectId))return
    setRbusy(true)
    try{
      const scope=scopeKey(owner,entry.project)
      const removed=await researchStore.remove(entry.id,scope)
      const list=await researchStore.list(scope)
      if(!currentChat())return
      setResearch(sortResearch(list))
      setRmsg(removed?'Research item removed.':'That item belongs to another project or profile, so it was not removed.')
    }catch{setRmsg('Could not remove the research item.')}
    finally{setRbusy(false);setRemoveId(null)}
  }

  async function scanDraft(){
    if(rbusy)return
    if(!currentChat()){setRmsg('Focus one chat before reading its draft.');return}
    setRbusy(true)
    try{
      const draft=await host.composer.getDraft(targetChat)
      if(!currentChat())return
      if(draft===null){setRmsg('That chat is not open, so there is no draft to read.');return}
      const parsed=parseAnnotateDraft(draft)
      if(!parsed){setRmsg('No in-app browser comment was found in this chat’s draft. In the Browser tab, use Annotate, then Add to chat.');return}
      setCapture({url:parsed.url,title:titleFromURL(parsed.url),excerpt:previewExcerpt(parsed),note:'',source:'preview'})
      setRmsg(`Read ${parsed.comments.length} browser comment${parsed.comments.length===1?'':'s'} from this chat’s draft. Review below, then save or add to draft.`)
    }catch{setRmsg('Could not read this chat’s draft.')}
    finally{setRbusy(false)}
  }

  function showBrowser(){
    if(typeof ctx.runAction!=='function'){setRmsg('The Browser tab control is unavailable in this Desktop build.');return}
    const result=ctx.runAction('view.showBrowser')
    if(result&&result.ok===false)setRmsg(result.error||'The Browser tab is unavailable.')
    else setRmsg('Browser tab toggled. Use Annotate there, then Add to chat; nothing is sent.')
  }

  const needle=q.trim().toLowerCase(),hits=needle?rows.filter(r=>[r.title,r.url,...(r.folder||[])].some(v=>v.toLowerCase().includes(needle))).slice(0,100):[]
  const researchContext=owner
    ? `Saving to ${destination} · ${ownerText} · ${chatText}`
    : 'This view has no single chat owner, so project saving is off. Focus one chat and try again.'

  return jsxs('section',{className:'h-full overflow-auto p-5 space-y-3',children:[
    jsx('h2',{className:'text-xl',children:'Work browser library'}),
    jsx('p',{children:'Bookmarks and history stay on this device; nothing is sent to chat by the import. Research actions only use bookmarks you point at, never the history rows.'}),

    jsxs('section',{className:'rounded border p-3 space-y-2',children:[
      jsx('h3',{className:'text-base',children:'Browser research'}),
      jsx('p',{className:'text-sm',children:'The Browser tab’s Annotate control is the safe selection path: it writes a comment into this chat’s draft without sending anything. Read that draft here, add an optional excerpt or note, then save it to the project or add a reference to the draft. Research stays in this device’s local library, under the selected project; it is not written into the project folder.'}),
      jsx('p',{className:'text-sm',role:'status',children:researchContext}),
      jsxs('label',{className:'text-sm flex flex-wrap items-center gap-2',children:['Project',
        jsx('select',{'aria-label':'Research project',disabled:rbusy||!owner,value:projectId,onChange:e=>{setProjectTouched(true);setProjectId(e.target.value)},children:[
          jsx('option',{value:'',children:'Home (no project)'},'home'),
          ...options.map(project=>jsx('option',{value:project.id,children:project.path?`${project.name} — ${project.path}`:project.name},project.id))
        ]},'project-select')
      ]}),
      projectNote&&jsx('p',{className:'text-sm',children:projectNote}),
      jsxs('div',{className:'flex flex-wrap gap-2',children:[
        btn('Show Browser tab',showBrowser,rbusy),
        btn('Read browser selection from draft',scanDraft,rbusy||!owner)
      ]}),
      jsx('input',{'aria-label':'Research URL',className:'w-full rounded border px-2 py-1',disabled:rbusy,placeholder:'https://example.com/page',value:capture.url,onChange:e=>setCapture({...capture,url:e.target.value})}),
      jsx('input',{'aria-label':'Research title',className:'w-full rounded border px-2 py-1',disabled:rbusy,placeholder:'Title (optional)',value:capture.title,onChange:e=>setCapture({...capture,title:e.target.value})}),
      jsx('textarea',{'aria-label':'Research excerpt',className:'w-full rounded border px-2 py-1',disabled:rbusy,rows:3,placeholder:'Excerpt or browser selection (optional)',value:capture.excerpt,onChange:e=>setCapture({...capture,excerpt:e.target.value})}),
      jsx('input',{'aria-label':'Research note',className:'w-full rounded border px-2 py-1',disabled:rbusy,placeholder:'Note (optional)',value:capture.note,onChange:e=>setCapture({...capture,note:e.target.value})}),
      jsxs('div',{className:'flex flex-wrap gap-2',children:[
        btn(`Save to ${destination}`,saveCapture,rbusy||!owner),
        btn('Add to draft',addCapture,rbusy||!owner),
        btn('Clear',()=>{setCapture(blankCapture());setRmsg('')},rbusy)
      ]}),
      jsx('p',{role:'status',children:rmsg}),

      jsx('h4',{className:'text-sm font-medium pt-2',children:`Saved in ${destination}`}),
      !research.length&&jsx('p',{className:'text-sm',children:'No research saved in this project yet.'}),
      jsx('div',{className:'space-y-2','data-testid':'pm-research-items',children:research.map(entry=>jsxs('div',{className:'py-1',children:[
        jsx('strong',{children:entry.title}),
        jsx('div',{children:`${entry.project&&entry.project.name||'Home'} · ${hostOf(entry.url)} · ${sourceLabel(entry.source)}`}),
        entry.excerpt&&jsx('p',{className:'text-sm',children:entry.excerpt}),
        entry.note&&jsx('p',{className:'text-sm',children:`Note: ${entry.note}`}),
        jsxs('div',{className:'flex flex-wrap gap-2',children:[
          btn('Add to draft',()=>addSaved(entry),rbusy),
          btn('Copy URL',()=>copyURL(entry.url),rbusy),
          removeId===entry.id?btn('Confirm removal',()=>removeSaved(entry),rbusy):btn('Remove',()=>setRemoveId(entry.id),rbusy),
          removeId===entry.id&&btn('Cancel',()=>setRemoveId(null),rbusy)
        ]})
      ]},entry.id))})
    ]}),

    jsx('hr',{}),
    jsx('p',{children:'Choose an export from your Work Chrome profile for the local bookmark/history library. History is a separate, optional import.'}),
    jsx('select',{'aria-label':'Import type',disabled:busy,value:kind,onChange:e=>{clear();K(e.target.value)},children:['bookmark','history'].map(v=>jsx('option',{value:v,children:v==='bookmark'?'Bookmarks HTML':'History JSON (Google Takeout)'},v))}),
    kind==='history'&&jsx('select',{'aria-label':'History range',disabled:busy,value:days,onChange:e=>{P(null);M('');D(e.target.value)},children:['30','90','all'].map(v=>jsx('option',{value:v,children:v==='all'?'All available history':`Last ${v} days`},v))}),
    jsx('input',{type:'file','aria-label':'Chrome export',disabled:busy,accept:kind==='bookmark'?'.html,.htm':'.json',onChange:e=>{clear();F(e.target.files[0])}},kind),
    btn('Preview import',preview,!file||busy),
    pending&&btn('Import into Work',save,busy||!pending.length),
    jsx('p',{role:'status',children:msg}),

    jsx('hr',{}),
    jsx('input',{'aria-label':'Search Work library',placeholder:`Search ${rows.length} saved entries`,value:q,onChange:e=>Q(e.target.value)}),
    needle&&!hits.length&&jsx('p',{children:'No matches.'}),
    ...hits.map((r,i)=>jsxs('div',{className:'py-1',children:[
      jsx('strong',{children:r.title}),
      jsx('div',{children:`${r.folder&&r.folder.join(' / ')||r.kind} · ${hostOf(r.url)}`}),
      jsxs('div',{className:'flex flex-wrap gap-2',children:[
        btn('Copy URL',()=>copyURL(r.url),busy),
        researchEligible(r)&&btn('Save to project',()=>saveRow(r),rbusy),
        researchEligible(r)&&btn('Use for research',()=>useRow(r),rbusy),
        researchEligible(r)&&btn('Add to draft',()=>addRow(r),rbusy)
      ]})
    ]},i)),
    rows.length>0&&btn(remove?'Confirm removal of Work library':'Remove import',()=>remove?erase():R(true),busy),
    remove&&btn('Cancel removal',()=>R(false))
  ]})
}
export default {id:ID,name:'Work browser library',register(ctx){ctx.register({id:'page',area:ROUTES_AREA,data:{path:route},render:()=>jsx(Page,{ctx})});ctx.register({id:'open',area:PALETTE_AREA,data:{id:ID+'.open',label:'Import from Chrome',keywords:['bookmarks','history','work','browser library'],run:()=>host.navigate(route)}});ctx.register({id:'research',area:PALETTE_AREA,data:{id:ID+'.research',label:'Browser research capture',keywords:['research','browser','selection','project','draft','bookmark'],run:()=>host.navigate(route)}})}}

export {
  safeURL, bookmarks, history, merge,
  normalizeOwner, baseName, titleFromURL, hostOf, projectRef, scopeKey, projectFromResolved,
  projectOptions, selectedProjectRef, entryFor, researchEligible, entryInScope, entryInProject, sortResearch,
  citationText, addResearchToDraft, parseAnnotateDraft, previewExcerpt,
  memoryAdapter, createResearchStore, ownerRoute, projectRequest,
  MAX_TITLE, MAX_EXCERPT, MAX_NOTE
}
