// Saved-artifacts catalogue: a sidebar section fed by the app's own
// catalogue.json, with a sandboxed reader for published local pages.
import { host } from "@hermes/plugin-sdk";

// sidebar.mjs
var instances = /* @__PURE__ */ new WeakMap();
var NS = "http://www.w3.org/2000/svg";
function glyph(doc, path, className) {
  const svg = doc.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", className);
  const line = doc.createElementNS(NS, "path");
  line.setAttribute("d", path);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "currentColor");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  svg.append(line);
  return svg;
}
function registerCatalogue(ctx, host2, entries, openEntry, options = {}) {
  const doc = options.document ?? globalThis.document;
  const sidebar = options.sidebar ?? doc?.querySelector('[data-tour="sessions-sidebar"]');
  if (!sidebar) throw new Error("Catalogue needs a mounted sessions sidebar");
  instances.get(sidebar)?.dispose();
  const events = new doc.defaultView.AbortController();
  const eventOptions = { signal: events.signal };
  let disposed = false;
  let validatedConnection = null;
  let generation = 0;
  const eligible = () => !disposed && validatedConnection !== null && host2.state.profile.get() === "default" && host2.state.connectionId.get() === validatedConnection;
  const section = doc.createElement("section");
  section.dataset.hermesCatalogue = "";
  section.dataset.catalogueOpens = "confirmed";
  section.setAttribute("aria-label", "Saved artifacts");
  const header = doc.createElement("button");
  header.type = "button";
  header.className = "hc-header";
  const label = doc.createElement("span");
  label.textContent = "Artifacts";
  label.className = "min-w-0 truncate leading-none";
  const panelLabel = doc.createElement("span");
  panelLabel.className = "hc-panel-label flex min-w-0 items-center gap-2 pl-2 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-(--theme-primary)";
  const mark = doc.createElement("span");
  mark.className = "dither hc-mark";
  mark.setAttribute("aria-hidden", "true");
  panelLabel.append(mark, label);
  header.append(panelLabel, glyph(doc, "m6 4 4 4-4 4", "hc-caret"));
  const list = doc.createElement("ul");
  list.className = "hc-list";
  const id = `hermes-catalogue-${++registerCatalogue.sequence}`;
  list.id = id;
  header.setAttribute("aria-controls", id);
  const storageKey = "catalogue.expanded.local-default.v1";
  let expanded = true;
  try {
    expanded = ctx.storage.get(storageKey) !== false;
  } catch {
  }
  function fold(next, persist = true) {
    if (!next && list.contains(doc.activeElement)) header.focus();
    expanded = next;
    header.setAttribute("aria-expanded", String(next));
    header.title = next ? "Collapse saved artifacts" : "Expand saved artifacts";
    header.setAttribute("aria-label", header.title);
    list.hidden = !next;
    if (persist) {
      try {
        ctx.storage.set(storageKey, next);
      } catch {
      }
    }
  }
  fold(expanded, false);
  header.addEventListener("click", () => {
    if (eligible() && section.isConnected) fold(!expanded);
  }, eventOptions);
  section.addEventListener("keydown", (event) => {
    if (!eligible() || !section.isConnected || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      fold(false);
    }
    if (event.key === "ArrowRight" && event.target === header) {
      event.preventDefault();
      fold(true);
    }
  }, eventOptions);
  for (const entry of entries) {
    const li = doc.createElement("li");
    const row = doc.createElement("button");
    row.type = "button";
    row.dataset.catalogueEntry = entry.id;
    row.className = "hc-row";
    row.title = entry.title;
    const title = doc.createElement("span");
    title.textContent = entry.title;
    row.append(glyph(doc, "M4 2.5h5l3 3v8H4z M9 2.5v3h3 M6 8h4 M6 10.5h4", "hc-file"), title);
    row.addEventListener("click", () => {
      if (eligible() && section.isConnected) openEntry(entry);
    }, eventOptions);
    li.append(row);
    list.append(li);
  }
  const style = doc.createElement("style");
  style.textContent = `
[data-hermes-catalogue]{box-sizing:border-box;flex:0 0 auto;min-width:0;padding:0 0 4px;color:var(--ui-text-secondary,inherit);font-family:inherit}
[data-hermes-catalogue] button{box-sizing:border-box;-webkit-app-region:no-drag;cursor:pointer;min-width:0;max-width:100%;font-family:inherit;color:inherit;background:transparent;text-align:left}
[data-hermes-catalogue] .hc-header{display:flex;align-items:center;gap:4px;border:0;border-radius:4px;padding:6px 0 4px;line-height:1rem}
[data-hermes-catalogue] .hc-panel-label{display:flex;align-items:center;gap:.5rem;padding-left:.5rem;font-size:.64rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--theme-primary,var(--ui-accent,inherit))}
[data-hermes-catalogue] .hc-mark{flex:none;width:.5rem;height:.5rem;border-radius:1px;background:repeating-conic-gradient(currentColor 0% 25%,transparent 0% 50%) 0 0/.125rem .125rem}
[data-hermes-catalogue] .hc-caret{width:12px;height:12px;flex:none;opacity:.75;transform:rotate(90deg)}
[data-hermes-catalogue] [aria-expanded=false] .hc-caret{transform:none}
[data-hermes-catalogue] .hc-list{display:grid;grid-template-columns:minmax(0,1fr);gap:1px;list-style:none;padding:4px 0 8px;margin:0}
[data-hermes-catalogue] .hc-list[hidden]{display:none}
[data-hermes-catalogue] li{min-width:0;margin:0;padding:0}
[data-hermes-catalogue] .hc-row{display:flex;align-items:center;gap:8px;width:100%;min-height:28px;padding:4px 8px;border:1px solid transparent;border-radius:6px;font-size:13px;font-weight:400;line-height:18px}
[data-hermes-catalogue] .hc-row span{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
[data-hermes-catalogue] .hc-file{width:16px;height:16px;flex:none;color:var(--ui-text-tertiary,inherit)}
[data-hermes-catalogue] button:hover{background:var(--ui-control-hover-background,transparent);color:var(--ui-text-primary,inherit)}
[data-hermes-catalogue] button:focus-visible{outline:2px solid var(--sidebar-ring,var(--ui-accent,currentColor));outline-offset:-2px;background:var(--ui-control-hover-background,transparent);color:var(--ui-text-primary,inherit)}
@media(forced-colors:active){[data-hermes-catalogue] button:focus-visible{outline-color:Highlight}}
`;
  section.append(style, header, list);
  function hide() {
    section.remove();
  }
  function refresh() {
    if (!eligible()) {
      hide();
      return;
    }
    const stacks = sidebar.querySelectorAll("[data-sessions-mode]");
    const stack = stacks.length === 1 ? stacks[0] : null;
    const pins = stack?.querySelectorAll(":scope > [data-session-pin-drop]");
    const anchors = stack?.querySelectorAll(":scope > [data-session-unpin-drop]");
    const anchor = anchors?.length === 1 ? anchors[0] : null;
    const pin = pins?.length === 1 ? pins[0] : null;
    if (!anchor || !pin || stack.dataset.sessionsMode === "search" || !(pin.compareDocumentPosition(anchor) & doc.defaultView.Node.DOCUMENT_POSITION_FOLLOWING)) {
      hide();
      return;
    }
    if (anchor.previousElementSibling !== section) anchor.before(section);
  }
  async function validate() {
    const revision2 = ++generation;
    validatedConnection = null;
    hide();
    const connectionId = host2.state.connectionId.get();
    if (disposed || host2.state.profile.get() !== "default" || !connectionId) return;
    let connections;
    try {
      connections = await host2.connections();
    } catch {
      return;
    }
    if (disposed || revision2 !== generation || host2.state.profile.get() !== "default" || host2.state.connectionId.get() !== connectionId) return;
    if (!Array.isArray(connections) || !connections.some((c) => c.id === connectionId && c.kind === "local")) return;
    validatedConnection = connectionId;
    refresh();
  }
  const observer = new doc.defaultView.MutationObserver((records) => {
    if (records.some((record) => !section.contains(record.target))) refresh();
  });
  observer.observe(sidebar, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-sessions-mode"] });
  const unbind = [host2.state.profile.listen(validate), host2.state.connectionId.listen(validate)];
  const api = { refresh, dispose() {
    if (disposed) return;
    disposed = true;
    generation++;
    observer.disconnect();
    events.abort();
    for (const stop of unbind) stop();
    hide();
    instances.delete(sidebar);
  } };
  instances.set(sidebar, api);
  void validate();
  return api;
}
registerCatalogue.sequence = 0;

// mounted-sidebar.mjs
var selector = '[data-tour="sessions-sidebar"]';
function registerCatalogue2(ctx, host2, entries, openEntry, { document: doc = globalThis.document } = {}) {
  const mounted = /* @__PURE__ */ new Map();
  let dead = false;
  const observer = new doc.defaultView.MutationObserver(reconcile);
  function reconcile() {
    if (dead) return;
    const roots = new Set(doc.querySelectorAll(selector));
    for (const [el, api] of mounted) if (!roots.has(el)) {
      api.dispose();
      mounted.delete(el);
    }
    for (const el of roots) if (!mounted.has(el)) mounted.set(el, registerCatalogue(ctx, host2, entries, openEntry, { document: doc, sidebar: el }));
    observer.disconnect();
    if (!roots.size) {
      observer.observe(doc.documentElement, { childList: true, subtree: true });
      return;
    }
    const ancestors = /* @__PURE__ */ new Set();
    for (const el of roots) for (let p = el.parentElement; p; p = p.parentElement) ancestors.add(p);
    for (const p of ancestors) observer.observe(p, { childList: true });
  }
  reconcile();
  return () => {
    if (dead) return;
    dead = true;
    observer.disconnect();
    for (const api of mounted.values()) api.dispose();
    mounted.clear();
  };
}

// published-reader.mjs
import { SandboxedFrame } from "@hermes/plugin-sdk";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var revision = 0;
var ownerAtoms = (host2) => ["connectionId", "profile", "focusedSessionOwner"].map((key) => host2.state?.[key]);
function isLocalDefaultOwner(host2) {
  const owner = host2.state?.focusedSessionOwner?.get?.();
  return host2.state?.connectionId?.get?.() === "local" && host2.state?.profile?.get?.() === "default" && owner?.connectionId === "local" && owner?.profile === "default";
}
var permitted = (host2, isOwner) => {
  try {
    return isOwner(host2) === true;
  } catch {
    return false;
  }
};
function PublishedReader({ ctx, host: host2, entry, isOwner }) {
  const [state, setState] = useState({ src: null, error: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    const finish = (next) => {
      if (live) setState(next);
    };
    if (!permitted(host2, isOwner)) {
      finish({ src: null, error: "Publication unavailable for this owner." });
      return;
    }
    (async () => {
      try {
        const result = await ctx.files.readText("data", `publications/${entry.id}.html`);
        if (!live) return;
        if (!result?.ok || typeof result.text !== "string") throw new Error("unavailable");
        finish({ src: `data:text/html;charset=utf-8,${encodeURIComponent(result.text)}`, error: "" });
      } catch {
        finish({ src: null, error: "Publication unavailable. Publish it locally, then reopen." });
      }
    })();
    return () => {
      live = false;
    };
  }, [ctx, host2, entry.id, isOwner, attempt]);
  if (!permitted(host2, isOwner)) return jsx("p", { role: "status", children: "Publication unavailable for this owner." });
  const status = state.error || (state.src ? "" : `Opening ${entry.title}\u2026`);
  return jsxs("div", {
    "data-catalogue-reader": entry.id,
    style: { width: "100%", height: "100%", position: "relative" },
    children: [
      state.src && jsx(SandboxedFrame, { title: entry.title, src: state.src, style: { width: "100%", height: "100%", border: 0 } }),
      status && jsxs("div", {
        role: "status",
        style: { position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--ui-text-primary, CanvasText)", background: "var(--background, Canvas)" },
        children: [
          jsx("span", { children: status }),
          state.error && jsx("button", {
            type: "button",
            onClick: () => setAttempt((value) => value + 1),
            style: { marginTop: "0.75rem", border: "1px solid currentColor", borderRadius: "0.375rem", padding: "0.35rem 0.9rem", background: "transparent", color: "inherit", font: "inherit", cursor: "pointer" },
            children: "Retry"
          })
        ]
      })
    ]
  });
}
function openPublishedReader(ctx, host2, entry, isOwner = isLocalDefaultOwner) {
  if (!entry || typeof entry.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || entry.id.length > 64 || typeof entry.title !== "string" || !entry.title.trim() || entry.title.length > 180 || /[\x00-\x1f\x7f]/.test(entry.title)) {
    return { ok: false, error: "invalid-entry" };
  }
  if (!permitted(host2, isOwner)) return { ok: false, error: "wrong-owner" };
  if (typeof host2.openWorkspace !== "function" || typeof ctx.files?.readText !== "function") return { ok: false, error: "unavailable" };
  const publication = { id: entry.id, title: entry.title };
  const key = ++revision;
  let closed = false;
  let close;
  try {
    close = host2.openWorkspace(`pm-artifact-catalogue:reader:${publication.id}`, {
      title: publication.title,
      onClose: () => {
        closed = true;
      },
      render: () => jsx(PublishedReader, { ctx, host: host2, entry: publication, isOwner }, key)
    });
  } catch {
    return { ok: false, error: "open-failed" };
  }
  return { ok: true, close: () => {
    if (!closed) {
      closed = true;
      close();
    }
  } };
}

// open.mjs
var slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function parseCatalogue(raw) {
  if (typeof raw !== "string" || raw.length > 65536) return [];
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (data?.version !== 1 || !Array.isArray(data.entries)) return [];
  const entries = [], seen = /* @__PURE__ */ new Set();
  for (const r of data.entries.slice(0, 128)) {
    if (!r || typeof r.id !== "string" || !slug.test(r.id) || r.id.length > 64 || seen.has(r.id)) continue;
    if (typeof r.title !== "string" || !r.title.trim() || r.title.length > 100 || /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(r.title)) continue;
    const entry = { id: r.id, title: r.title.trim() };
    if (typeof r.nativeUrl === "string" && r.nativeUrl.length < 4096) {
      try {
        const u = new URL(r.nativeUrl);
        if (u.protocol === "file:" && !u.host && !u.search && !u.hash && /\.html?$/i.test(u.pathname) && u.href === r.nativeUrl) entry.nativeUrl = u.href;
      } catch {
      }
    }
    seen.add(entry.id);
    entries.push(Object.freeze(entry));
  }
  return entries;
}
function ownsCatalogue(host2) {
  const active = host2.state, focused = active.focusedSessionOwner?.get();
  return active.connectionId?.get() === "local" && active.profile?.get() === "default" && focused?.connectionId === "local" && focused.profile === "default";
}
function revealPublication(host2, doc, entry) {
  if (!ownsCatalogue(host2) || !entry.nativeUrl || typeof host2.revealPane !== "function") return false;
  const selector2 = '[data-tree-tab^="preview-tile:file:"], [data-pane-host^="preview-tile:file:"]:not([aria-hidden="true"]):not([inert])';
  const attempted = /* @__PURE__ */ new Set();
  for (const node of doc.querySelectorAll(selector2)) {
    if (node.closest('[inert],[hidden],[aria-hidden="true"]')) continue;
    const id = node.getAttribute("data-tree-tab") || node.getAttribute("data-pane-host");
    const at = id.indexOf("file://");
    if (at < 0 || attempted.has(id) || id.slice(at).replace(/#(?:[2-9]|[1-9]\d+)$/, "") !== entry.nativeUrl) continue;
    attempted.add(id);
    try {
      host2.revealPane(id);
      if (typeof host2.paneVisibility !== "function" || host2.paneVisibility(id).get() === true) return true;
    } catch {
    }
  }
  return false;
}

// registration.mjs
function startCatalogue(ctx, host2, { attach, reveal, reader }) {
  let active = false, disposed = false, generation = 0, detach = null;
  const readers = /* @__PURE__ */ new Map();
  const sync = () => {
    if (disposed) return;
    const allowed = ownsCatalogue(host2);
    if (active === allowed) return;
    active = allowed;
    const token = ++generation;
    detach?.();
    detach = null;
    if (!allowed || !ctx.files?.readText) return;
    const current = () => !disposed && token === generation && ownsCatalogue(host2);
    void ctx.files.readText("data", "catalogue.json").then((result) => {
      if (!current() || !result?.ok) return;
      const items = parseCatalogue(result.text);
      if (!items.length) return;
      detach = attach(ctx, host2, items, (entry) => {
        if (!current() || !items.includes(entry)) return;
        if (reveal(host2, globalThis.document, entry)) return;
        const opened = reader(ctx, host2, entry);
        if (opened?.ok && typeof opened.close === "function") readers.set(entry.id, opened.close);
        else if (opened?.ok === false) host2.notify?.({ kind: "error", message: "The saved publication could not open in this workspace." });
      });
    }).catch(() => {
      if (current()) host2.notify?.({ kind: "error", message: "Could not open the saved artifacts catalogue." });
    });
  };
  const stops = [host2.state.focusedSessionOwner, host2.state.connectionId, host2.state.profile].filter(Boolean).map((atom) => atom.listen(sync));
  ctx.onDispose(() => {
    disposed = true;
    ++generation;
    for (const stop of stops) stop();
    detach?.();
    detach = null;
    for (const close of readers.values()) close();
    readers.clear();
  });
  sync();
}

var stdin_default = { id: "pm-artifact-catalogue", name: "Saved artifacts", register(ctx) {
  if (new URLSearchParams(location.search).has("win")) return;
  startCatalogue(ctx, host, { attach: registerCatalogue2, reveal: revealPublication, reader: openPublishedReader });
} };
export {
  stdin_default as default
};
