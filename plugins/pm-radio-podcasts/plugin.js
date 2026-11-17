import {
  atom, Button, createBudgetedLoop, GlyphSpinner, icons, Popover, PopoverContent, PopoverTrigger, randomUuid,
  RowButton, SearchField, STATUSBAR_AREAS, Tip, usePluginI18n, host,
  useQuery, useValue
} from '@hermes/plugin-sdk'
import { useEffect, useRef, useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

const ID = 'pm-radio-podcasts'
const NIGHTRIDE = 'https://stream.nightride.fm/'
const PRESETS = [
  { id: 'chillsynth', name: 'Chillsynth', description: 'Soft focus · warm synths', provider: 'Nightride FM', url: `${NIGHTRIDE}chillsynth.mp3`, homepage: 'https://nightride.fm/?station=chillsynth' },
  { id: 'nightride', name: 'Nightride', description: 'Synthwave · after hours', provider: 'Nightride FM', url: `${NIGHTRIDE}nightride.mp3`, homepage: 'https://nightride.fm/' },
  { id: 'darksynth', name: 'Darksynth', description: 'Dark electronics · high energy', provider: 'Nightride FM', url: `${NIGHTRIDE}darksynth.mp3`, homepage: 'https://nightride.fm/?station=darksynth' },
  { id: 'spacesynth', name: 'Spacesynth', description: 'Cosmic synths · retro futures', provider: 'Nightride FM', url: `${NIGHTRIDE}spacesynth.mp3`, homepage: 'https://nightride.fm/?station=spacesynth' },
  { id: 'paradise-main', name: 'Main Mix', description: 'Eclectic · human selected', provider: 'Radio Paradise', url: 'https://stream.radioparadise.com/aac-128', homepage: 'https://radioparadise.com/' },
  { id: 'paradise-mellow', name: 'Mellow Mix', description: 'A gentler pace', provider: 'Radio Paradise', url: 'https://stream.radioparadise.com/mellow-flac', homepage: 'https://radioparadise.com/' },
  { id: 'eve-radio', name: 'EVE Radio', description: 'GamingNow · EVE community radio', provider: 'GamingNow', url: 'https://media01.gamingnow.net:8010/erweb.mp3', homepage: 'https://gamingnow.net/eve-radio/' }
]

const EN = {
  radio: 'Radio', browse: 'Choose a station', play: 'Play radio', pause: 'Pause radio', next: 'Next station',
  live: 'Live', paused: 'Paused', connecting: 'Connecting', error: 'Stream unavailable', retry: 'Try again',
  search: 'Find a station…', volume: 'Volume', audioOnly: 'Audio playing · visualizer unavailable',
  mute: 'Mute radio', unmute: 'Unmute radio', save: 'Pin station', unsave: 'Unpin station',
  visit: 'Visit station website', artistProfile: 'Visit artist profile',
  noResults: 'No stations found', searchHint: 'Search by station name. Try jazz, ambient, or house.',
  searchError: 'Station search is unavailable. Your presets still work.', searching: 'Searching stations',
  directory: 'Search powered by Radio Browser', note: 'Live radio · next switches stations',
  streamError: 'This stream could not connect. Try again or choose another station.',
  close: 'Close radio', nowPlaying: 'Now playing', elsewhere: 'Paused — playing in another window',
  'chillsynthDescription': 'Soft focus · warm synths', 'nightrideDescription': 'Synthwave · after hours',
  'darksynthDescription': 'Dark electronics · high energy', 'spacesynthDescription': 'Cosmic synths · retro futures',
  'paradise-mainDescription': 'Eclectic · human selected', 'paradise-mellowDescription': 'A gentler pace'
}
const LOCALES = {
  en: EN,
  ja: { ...EN, artistProfile: 'アーティストのプロフィールを開く', audioOnly: '再生中 · 波形を表示できません', radio: 'ラジオ', browse: 'ステーションを選択', play: 'ラジオを再生', pause: 'ラジオを一時停止', next: '次のステーション', live: 'ライブ', paused: '一時停止', connecting: '接続中', error: '再生できません', retry: '再試行', search: 'ステーションを検索…', volume: '音量', mute: 'ミュート', unmute: 'ミュート解除', save: 'ステーションを固定', unsave: '固定を解除', visit: '公式サイトを開く', noResults: '見つかりませんでした', searchHint: '名前で検索。jazz、ambient、house など。', searchError: '検索できません。おすすめは再生できます。', searching: '検索中', directory: 'Radio Browser による検索', note: 'ライブ放送 · 次へでステーションを切り替え', streamError: '接続できませんでした。再試行するか別のステーションを選んでください。', close: 'ラジオを閉じる', nowPlaying: '再生中', elsewhere: '別のウィンドウで再生中', 'chillsynthDescription': 'やさしい集中 · 暖かなシンセ', 'nightrideDescription': 'シンセウェーブ · 深夜', 'darksynthDescription': 'ダークな電子音 · 高揚感', 'spacesynthDescription': '宇宙的シンセ · レトロな未来', 'paradise-mainDescription': '多彩な選曲 · 人がキュレーション', 'paradise-mellowDescription': 'ゆったりした時間' },
  zh: { ...EN, artistProfile: '访问艺人主页', audioOnly: '正在播放 · 无法显示波形', radio: '电台', browse: '选择电台', play: '播放电台', pause: '暂停电台', next: '下一个电台', live: '直播', paused: '已暂停', connecting: '正在连接', error: '无法播放', retry: '重试', search: '搜索电台…', volume: '音量', mute: '静音', unmute: '取消静音', save: '置顶电台', unsave: '取消置顶', visit: '访问电台网站', noResults: '没有找到电台', searchHint: '按名称搜索，例如 jazz、ambient 或 house。', searchError: '暂时无法搜索，精选电台仍可使用。', searching: '正在搜索', directory: '搜索由 Radio Browser 提供', note: '直播电台 · 下一首将切换电台', streamError: '无法连接，请重试或选择其他电台。', close: '关闭电台', nowPlaying: '正在播放', elsewhere: '已暂停，正在其他窗口播放', 'chillsynthDescription': '轻松专注 · 温暖合成器', 'nightrideDescription': '合成器浪潮 · 深夜', 'darksynthDescription': '暗黑电子 · 充满能量', 'spacesynthDescription': '宇宙合成器 · 复古未来', 'paradise-mainDescription': '多元风格 · 人工精选', 'paradise-mellowDescription': '放慢节奏' },
  'zh-hant': { ...EN, artistProfile: '造訪藝人主頁', audioOnly: '播放中 · 無法顯示波形', radio: '電台', browse: '選擇電台', play: '播放電台', pause: '暫停電台', next: '下一個電台', live: '直播', paused: '已暫停', connecting: '正在連線', error: '無法播放', retry: '重試', search: '搜尋電台…', volume: '音量', mute: '靜音', unmute: '取消靜音', save: '釘選電台', unsave: '取消釘選', visit: '造訪電台網站', noResults: '找不到電台', searchHint: '按名稱搜尋，例如 jazz、ambient 或 house。', searchError: '暫時無法搜尋，精選電台仍可使用。', searching: '正在搜尋', directory: '搜尋由 Radio Browser 提供', note: '直播電台 · 下一首會切換電台', streamError: '無法連線，請重試或選擇其他電台。', close: '關閉電台', nowPlaying: '正在播放', elsewhere: '已暫停，正在其他視窗播放', 'chillsynthDescription': '輕鬆專注 · 溫暖合成器', 'nightrideDescription': '合成器浪潮 · 深夜', 'darksynthDescription': '暗黑電子 · 充滿能量', 'spacesynthDescription': '宇宙合成器 · 復古未來', 'paradise-mainDescription': '多元風格 · 人工精選', 'paradise-mellowDescription': '放慢節奏' }
}

// Disk plugins are not scanned by Tailwind. Only plugin layout lives here;
// Button, SearchField and Popover own their own chrome.
const CSS = `
.hermes-radio-podcasts-link{display:block;width:100%;padding:10px 12px;margin-bottom:8px;border:1px solid var(--ui-stroke-secondary);border-radius:8px;background:var(--ui-control-background,transparent);color:var(--ui-text-primary);font:inherit;text-align:left;cursor:pointer}
.hermes-radio-podcasts-link:hover{background:var(--ui-control-hover-background)}
.hermes-radio-bar{display:flex;align-items:center;gap:2px;height:100%;color:var(--ui-text-tertiary)}
.hermes-radio-waveform{position:relative;height:24px;width:100%;font-family:var(--font-mono,monospace);font-size:12px;line-height:12px;color:var(--ui-text-tertiary);opacity:.45;overflow:hidden;flex-shrink:0}
.hermes-radio-waveform-layer{position:absolute;inset:0;display:grid;grid-template-columns:repeat(var(--radio-columns),minmax(0,1fr));grid-auto-rows:12px}
.hermes-radio-waveform-layer>span{text-align:center;min-width:0}
.hermes-radio-waveform-layer:nth-child(1){opacity:.12}
.hermes-radio-waveform-layer:nth-child(2){opacity:.28}
.hermes-radio-waveform[data-compact=true]{width:40px;height:12px;margin-inline:2px}
.hermes-radio-next{display:flex;align-items:center;width:12px;height:12px}
.hermes-radio-waveform[data-active=true]{color:var(--ui-accent);opacity:1}
.hermes-radio-signal{height:48px;padding:5px 6px 0;min-width:0}
.hermes-radio-track{display:flex;align-items:center;gap:5px;height:19px;min-width:0;font-size:11px;line-height:16px;color:var(--ui-text-secondary)}
.hermes-radio-track-text{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:0}
.hermes-radio-track[data-track=true]{color:var(--ui-text-primary)}
.hermes-radio-artist{min-width:0;max-width:55%;flex-shrink:1;font-size:inherit;font-weight:inherit}
.hermes-radio-artist>span{overflow:hidden;text-overflow:ellipsis}
.hermes-radio-track-separator{flex-shrink:0;color:var(--ui-text-quaternary)}
.hermes-radio-bar .radio-name{max-width:112px;min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;text-align:left}
.hermes-radio-bar .hermes-radio-action{width:16px;height:16px;padding:0;flex-shrink:0}
.hermes-radio-action-icon{display:flex;align-items:center;justify-content:center;width:12px;height:12px;flex-shrink:0;overflow:hidden}
.hermes-radio-website{display:flex;width:24px;height:24px;flex-shrink:0}
.hermes-radio-panel{width:292px;max-width:calc(100vw - 24px)}
.hermes-radio-search{display:flex;align-items:center;height:32px;padding:0 4px 4px}
.hermes-radio-search-field{flex:1;min-width:0}
.hermes-radio-search-field input{flex:1;width:0;min-width:0}
.hermes-radio-search .hermes-radio-search-field{border:0}
.hermes-radio-search-loader{display:flex;align-items:center;justify-content:center;width:16px;flex-shrink:0;font-size:12px;color:var(--ui-text-tertiary)}
.hermes-radio-list{height:168px;max-height:calc(100dvh - 180px);min-height:80px;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable}
.hermes-radio-row{display:flex;align-items:center;gap:4px;border-radius:4px}
.hermes-radio-row[data-current=true]{background:var(--chrome-action-hover)}
.hermes-radio-row[data-current=true] .hermes-radio-row-name{color:var(--ui-accent)}
.hermes-radio-row:hover{background:var(--chrome-action-hover)}
.hermes-radio-row [aria-pressed=true]{color:var(--ui-accent)}
.hermes-radio-pin{opacity:0;pointer-events:none}
.hermes-radio-row:hover .hermes-radio-pin,.hermes-radio-row:focus-within .hermes-radio-pin{opacity:1;pointer-events:auto}
@media(hover:none){.hermes-radio-pin{opacity:1;pointer-events:auto}}
.hermes-radio-row-main{display:flex;align-items:center;gap:8px;flex:1;min-width:0;text-align:left;height:24px;padding:2px 6px;cursor:pointer;border-radius:4px}
.hermes-radio-row-main:focus-visible{outline:1px solid var(--ui-accent);outline-offset:-1px}
.hermes-radio-row-icon{display:flex;align-items:center;justify-content:center;width:14px;flex-shrink:0;color:var(--ui-text-tertiary);opacity:0}
.hermes-radio-row:hover .hermes-radio-row-icon,.hermes-radio-row:focus-within .hermes-radio-row-icon,.hermes-radio-row[data-current=true] .hermes-radio-row-icon{opacity:1}
.hermes-radio-row[data-current=true] .hermes-radio-row-icon{color:var(--ui-accent)}
.hermes-radio-row-copy{min-width:0;flex:1}
.hermes-radio-row-name{display:block;font-size:12px;line-height:17px;color:var(--ui-text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hermes-radio-volume{display:flex;align-items:center;gap:4px;height:28px;padding:2px 2px 0}
.hermes-radio-volume-space{flex:1;min-width:6px}
.hermes-radio-volume input{width:76px;min-width:0;height:3px;accent-color:var(--ui-accent);cursor:pointer}
.hermes-radio-error{font-size:11px;line-height:17px;color:var(--ui-text-secondary);padding:4px 4px 12px}

.hermes-radio-panel{width:420px;max-width:calc(100vw - 28px);max-height:min(calc(100vh - 48px),var(--radix-popover-content-available-height,calc(100vh - 48px)));overflow:auto;background:var(--t3-frost-fill,var(--ui-bg-primary,#17191d));backdrop-filter:var(--t3-frost-filter,blur(24px));border:1px solid var(--ui-stroke-secondary,#ffffff18);border-radius:18px;font-family:var(--t3-label-font,Georgia,serif)}
.hermes-episode-library{padding:16px;color:var(--ui-text-primary,#eee);--hel-dates-height:0px;--hel-now-height:0px}
.hermes-episode-library:has(.hel-filters){--hel-dates-height:70px}.hermes-episode-library:has(.hel-now){--hel-now-height:145px}
.hel-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:10px}.hel-heading h2{font-size:23px;font-weight:400;line-height:1.2;margin:0}.hel-heading>span{font-size:11px;white-space:nowrap;color:var(--ui-text-tertiary,#999);font-variant-numeric:tabular-nums}
.hel-tabs{display:flex;gap:14px;border-bottom:1px solid var(--ui-stroke-secondary,#ffffff18);margin-bottom:12px}.hel-tabs button{padding:8px 1px;border:0;border-bottom:2px solid transparent;font-family:inherit;font-size:12px;color:var(--ui-text-tertiary,#999);background:transparent;cursor:pointer}.hel-tabs button[aria-selected=true]{border-bottom-color:var(--ui-accent,#346bf1);color:var(--ui-text-primary,#fff)}
.hermes-episode-library :is(input,select,button){box-sizing:border-box;font-family:inherit;min-width:0}.hermes-episode-library :is(input,select){border:1px solid var(--ui-stroke-secondary,#ffffff18);border-radius:8px;background:color-mix(in srgb,var(--ui-text-primary,#fff) 4%,transparent);color:var(--ui-text-primary,#eee);padding:7px 9px;font-size:12px;color-scheme:dark}.hel-search{width:100%;font-size:13px!important;line-height:1.5;margin-bottom:8px}
.hel-collections{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin:0 0 10px}.hel-collections button{display:flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid transparent;border-radius:7px;background:transparent;color:var(--ui-text-secondary,#bbb);font-size:11px;cursor:pointer}.hel-collections button[aria-pressed=true]{border-color:color-mix(in srgb,var(--ui-accent,#346bf1) 35%,transparent);background:color-mix(in srgb,var(--ui-accent,#346bf1) 9%,transparent);color:var(--ui-text-primary,#eee)}.hel-collections span{opacity:.65;font-size:10px;font-variant-numeric:tabular-nums}
.hel-tools{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:6px;align-items:center}.hel-tools select{width:100%;font-size:11px;padding:6px 7px}.hel-dates{border:1px solid var(--ui-stroke-secondary,#ffffff18);border-radius:7px;background:transparent;color:var(--ui-text-secondary,#bbb);padding:6px 8px;font-size:11px;cursor:pointer}.hel-dates[aria-expanded=true]{color:var(--ui-text-primary,#eee);border-color:var(--ui-accent,#346bf1)}
.hel-filters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px;padding:10px 0;border-top:1px solid var(--ui-stroke-secondary,#ffffff18)}.hel-filters label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--ui-text-tertiary,#999)}.hel-filters input{width:100%}.hel-reset,.hel-refresh{border:0;background:transparent;color:var(--ui-text-secondary,#bbb);font-size:11px;margin:8px 0 0;padding:4px 0;cursor:pointer}
.hel-station{display:flex;align-items:center;gap:10px;width:100%;padding:10px 8px;border:0;border-radius:9px;background:transparent;color:var(--ui-text-primary,#eee);font:inherit;text-align:left;cursor:pointer}.hel-station:hover{background:var(--ui-control-hover-background,#ffffff08)}.hel-station>span:nth-child(2){flex:1;display:flex;flex-direction:column;gap:3px}.hel-station strong{font-weight:400;font-size:16px}.hel-station small{font-size:11px;color:var(--ui-text-tertiary,#999)}
.hel-list{max-height:clamp(90px,calc(var(--radix-popover-content-available-height,600px) - 240px - var(--hel-dates-height) - var(--hel-now-height)),390px);overflow:auto;margin-top:10px;overscroll-behavior:contain;scrollbar-gutter:stable}.hel-episode{padding:10px 8px;border-bottom:1px solid var(--ui-stroke-secondary,#ffffff10);border-radius:7px}.hel-episode:hover{background:color-mix(in srgb,var(--ui-text-primary,#fff) 2%,transparent)}.hel-episode[data-current=true]{border-left:2px solid var(--ui-accent,#346bf1);padding-left:6px;background:color-mix(in srgb,var(--ui-accent,#346bf1) 5%,transparent)}
.hel-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;line-height:1.5;color:var(--ui-text-tertiary,#999)}.hel-meta>span{min-width:0}.hel-read{background:transparent;border:0;border-radius:4px;padding:1px 3px;color:var(--ui-text-tertiary,#999);font-size:10px;white-space:nowrap;cursor:pointer}.hel-read[data-unread=true]{color:var(--ui-accent,#346bf1)}.hel-episode h3{font-size:16px;line-height:1.35;font-weight:400;margin:4px 0 7px;overflow-wrap:anywhere}
.hel-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.hel-actions>span{margin-right:auto;font-size:10px;color:var(--ui-text-tertiary,#999);font-variant-numeric:tabular-nums}.hel-actions button{border:1px solid var(--ui-stroke-secondary,#ffffff18);border-radius:7px;background:transparent;color:var(--ui-text-primary,#eee);padding:5px 8px;font-size:11px;cursor:pointer}.hel-actions .hel-play{border-color:color-mix(in srgb,var(--ui-accent,#346bf1) 30%,transparent);background:color-mix(in srgb,var(--ui-accent,#346bf1) 11%,transparent)}.hel-play:hover{background:color-mix(in srgb,var(--ui-accent,#346bf1) 22%,transparent)}.hel-more summary{list-style:none;cursor:pointer;min-width:26px;min-height:26px;text-align:center;line-height:24px;font-size:18px;border-radius:7px;color:var(--ui-text-secondary,#bbb)}.hel-more summary::-webkit-details-marker{display:none}.hel-more summary:hover{background:var(--ui-control-hover-background,#ffffff08)}.hel-more[open] summary{margin-left:auto}.hel-actions .hel-mark{color:var(--ui-text-secondary,#bbb);margin-top:3px;white-space:nowrap}.hel-actions button:disabled{opacity:.5;cursor:wait}
.hel-episode progress{width:100%;height:3px;accent-color:var(--ui-accent,#346bf1);margin-top:7px}.hel-empty{padding:20px 8px;color:var(--ui-text-tertiary,#999);font-size:13px;line-height:1.5}.hel-error{font-size:12px;color:var(--ui-text-primary,#eee);padding:10px;border-left:2px solid var(--ui-accent,#346bf1)}.hermes-episode-library :focus-visible{outline:2px solid var(--ui-accent,#346bf1);outline-offset:2px}
.hel-now{padding-top:14px;margin-top:12px;border-top:1px solid var(--ui-stroke-secondary,#ffffff18)}.hel-now-title{font-size:16px;font-weight:400;line-height:1.4}.hel-now-meta{font-size:11px;color:var(--ui-text-tertiary,#999);margin:6px 0}.hel-now .hermes-radio-action{width:30px;height:30px;padding:7px;border:0;border-radius:8px;background:transparent;color:inherit}.hel-now a{font-size:12px;color:var(--ui-accent,#346bf1)}.hel-return{background:transparent;border:0;padding:6px 0;color:var(--ui-text-tertiary,#999);font-size:12px;font-family:inherit;cursor:pointer}
.hermes-radio-native-indicator{grid-column:1/-1;grid-row:1}.hermes-radio-progress{display:none}.hermes-radio-progress input{display:block;width:100%;accent-color:var(--ui-accent,#346bf1);height:4px;margin:4px 0 8px;padding:0}.hermes-radio-progress>div{display:flex;justify-content:space-between;font-size:11px;font-variant-numeric:tabular-nums;color:var(--ui-text-tertiary,#999)}
.hermes-radio-waveform{font-family:var(--dt-font-mono,monospace)!important}.hermes-radio-bar .hermes-radio-waveform[data-compact=true]{width:64px;height:24px}.hermes-radio-waveform:not([data-compact=true]){height:36px}
`

function httpsUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch { return null }
}

function validStation(value) {
  return value && typeof value.id === 'string' && typeof value.name === 'string' && httpsUrl(value.url)
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]), credentials: 'omit' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

let directoryServers = ['https://de1.api.radio-browser.info']
let discovered = false
async function searchStations(text, signal) {
  if (!discovered) {
    try {
      const servers = await fetchJson(`${directoryServers[0]}/json/servers`, signal)
      const hosts = [...new Set(servers.map(server => server.name).filter(name => /^[a-z0-9-]+\.api\.radio-browser\.info$/.test(name)))]
      if (hosts.length) directoryServers = hosts.map(name => `https://${name}`).sort(() => Math.random() - 0.5)
      discovered = true
    } catch (error) {
      if (signal.aborted) throw error
    }
  }
  const params = new URLSearchParams({ name: text, limit: '60', hidebroken: 'true', order: 'votes', reverse: 'true' })
  for (const server of directoryServers.slice(0, 3)) {
    try {
      const rows = await fetchJson(`${server}/json/stations/search?${params}`, signal)
      const seen = new Set()
      return rows.flatMap(row => {
        const url = httpsUrl(row.url_resolved)
        if (!url || !row.stationuuid || !row.name || row.hls || seen.has(url)) return []
        seen.add(url)
        return [{ id: row.stationuuid, name: row.name.trim(), url, provider: 'Radio Browser', description: row.tags?.split(',').slice(0, 2).join(' · ') || '', homepage: httpsUrl(row.homepage) }]
      })
    } catch (error) {
      if (signal.aborted) throw error
    }
  }
  throw new Error('Directory unavailable')
}

function sameStation(a, b) {
  return a.id === b.id || a.url === b.url
}

function uniqueStations(items) {
  const ids = new Set()
  const urls = new Set()
  return items.filter(item => {
    if (ids.has(item.id) || urls.has(item.url)) return false
    ids.add(item.id)
    urls.add(item.url)
    return true
  })
}

// BEGIN MAC MUSIC TRANSPORT
// Only typed IDs/numbers cross this boundary; names are display-only data.
function musicRequest(input) {
  const actions = {
    playlists:['offset'], tracks:['playlistId','offset'], status:[],
    play:['playlistId','trackId','index'], next:['playlistId','trackId','index'], previous:['playlistId','trackId','index'],
    resume:['playlistId','trackId','index'], pause:['trackId'], seek:['playlistId','trackId','index','value'], volume:['playlistId','trackId','index','value']
  }
  if (!input || typeof input !== 'object' || !Object.hasOwn(actions,input.action)) throw Error('Unsupported Music command.')
  const fields=actions[input.action]
  if (Object.keys(input).some(key=>key!=='action'&&!fields.includes(key)) || fields.some(key=>!Object.hasOwn(input,key))) throw Error('Invalid Music command fields.')
  for (const key of fields) {
    const value=input[key]
    if (key.endsWith('Id') && (typeof value!=='string'||! /^[0-9A-F]{16}$/.test(value))) throw Error('Invalid Music ID.')
    if (['index','offset'].includes(key) && (!Number.isSafeInteger(value)||value<0||value>1000000)) throw Error('Invalid Music '+key+'.')
    if (key==='value' && (!Number.isFinite(value)||value<0||value>(input.action==='volume'?100:864000))) throw Error('Invalid Music value.')
  }
  return {...input}
}
function musicScript(input) {
  const r=musicRequest(input),literal=value=>JSON.stringify(value)
  const playlist=r.playlistId?`set selectedPlaylist to first user playlist whose persistent ID is ${literal(r.playlistId)}`:''
  let body
  if(r.action==='playlists'||r.action==='tracks'){
    const collection=r.action==='playlists'?'user playlists':'tracks of selectedPlaylist'
    body=`tell application id "com.apple.Music"
      ${playlist}
      set totalRows to count of ${collection}
      my deadline(startedAt)
      set rowsOut to current application's NSMutableArray's array()
      set lastRow to ${r.offset+8}
      if lastRow > totalRows then set lastRow to totalRows
      if ${r.offset} < totalRows then
        repeat with rowNumber from ${r.offset+1} to lastRow
          if (current date) - startedAt > 12 then error "Music listing timed out. Retry explicitly."
          set rowItem to item rowNumber of ${collection}
          my deadline(startedAt)
          set rowID to persistent ID of rowItem
          my deadline(startedAt)
          set rowName to my clipped(name of rowItem, 96)
          my deadline(startedAt)
          ${r.action==='tracks'?`set rowArtist to my clipped(artist of rowItem, 64)
          my deadline(startedAt)
          set rowDuration to duration of rowItem
          my deadline(startedAt)
          set rowOut to my recordOf({"id", "name", "index", "artist", "duration"}, {rowID, rowName, rowNumber - 1, rowArtist, rowDuration})`:`set rowOut to my recordOf({"id", "name"}, {rowID, rowName})`}
          rowsOut's addObject:rowOut
        end repeat
      end if
    end tell
    set nextOffset to current application's NSNull's |null|()
    if lastRow < totalRows then set nextOffset to lastRow
    set resultOut to my recordOf({"rows", "total", "offset", "next"}, {rowsOut, totalRows, ${r.offset}, nextOffset})`
  }else if(r.action==='status')body='set resultOut to my snapshot(startedAt)'
  else if(r.action==='pause')body=`set beforeOut to my snapshot(startedAt)
    if (beforeOut's objectForKey:"state") as text is not "stopped" then
      if (beforeOut's objectForKey:"trackId") as text is ${literal(r.trackId)} then
        tell application id "com.apple.Music" to pause
      end if
    end if
    set resultOut to my snapshot(startedAt)`
  else{
    let action=''
    if(['play','next','previous'].includes(r.action))action='play (item targetIndex of tracks of selectedPlaylist) once true'
    if(r.action==='resume')action='play'
    if(r.action==='seek')action=`if ${r.value} > duration of (item targetIndex of tracks of selectedPlaylist) then error "Seek is outside this track."
      set player position to ${r.value}`
    if(r.action==='volume')action=`set sound volume to ${Math.round(r.value)}`
    body=`tell application id "com.apple.Music"
      ${playlist}
      my deadline(startedAt)
      set targetIndex to ${r.index+1}
      set trackCount to count of tracks of selectedPlaylist
      my deadline(startedAt)
      if targetIndex > trackCount then error "Playlist changed. Browse it again."
      if persistent ID of (item targetIndex of tracks of selectedPlaylist) is not ${literal(r.trackId)} then error "Playlist changed. Browse it again."
      my deadline(startedAt)
      ${r.action!=='play'?`if persistent ID of current track is not ${literal(r.trackId)} then error "Music changed outside Hermes. Select a track again."`:''}
      my deadline(startedAt)
      ${r.action==='next'?'set targetIndex to targetIndex + 1':r.action==='previous'?'set targetIndex to targetIndex - 1':''}
      if targetIndex < 1 or targetIndex > trackCount then error "End of the selected playlist."
      set targetID to persistent ID of (item targetIndex of tracks of selectedPlaylist)
      my deadline(startedAt)
      ${action}
      my deadline(startedAt)
    end tell
    set resultOut to my snapshot(startedAt)
    resultOut's setObject:${literal(r.playlistId)} forKey:"playlistId"
    resultOut's setObject:(targetIndex - 1) forKey:"index"
    resultOut's setObject:targetID forKey:"targetTrackId"`
  }
  // The native gateway explicitly refuses JXA and interpreter carriers. Keep
  // the literal AppleScript visible to its approval classifier; do not bypass it.
  return `-- hermes-music-request: ${JSON.stringify(r)}
use framework "Foundation"
use scripting additions
on recordOf(keyList, itemList)
  set resultRecord to current application's NSMutableDictionary's dictionary()
  repeat with keyNumber from 1 to count of keyList
    resultRecord's setObject:(item keyNumber of itemList) forKey:(item keyNumber of keyList)
  end repeat
  return resultRecord
end recordOf
on clipped(rawText, limitCount)
  set displayText to rawText as text
  if (count of characters of displayText) > limitCount then set displayText to text 1 thru limitCount of displayText
  return displayText
end clipped
on deadline(startTime)
  if (current date) - startTime > 12 then error "Music command timed out. Inspect Music before retrying."
end deadline
on snapshot(startTime)
  with timeout of 8 seconds
    tell application id "com.apple.Music"
      set playbackState to player state as text
      my deadline(startTime)
      set positionNumber to 0
      set durationNumber to 0
      set currentID to current application's NSNull's |null|()
      set titleText to ""
      set artistText to ""
      set volumeNumber to sound volume
      my deadline(startTime)
      if playbackState is not "stopped" then
        set playingTrack to current track
        my deadline(startTime)
        set currentID to persistent ID of playingTrack
        my deadline(startTime)
        set titleText to my clipped(name of playingTrack, 96)
        my deadline(startTime)
        set artistText to my clipped(artist of playingTrack, 64)
        my deadline(startTime)
        set durationNumber to duration of playingTrack
        my deadline(startTime)
        set positionNumber to player position
        my deadline(startTime)
      end if
    end tell
  end timeout
  return my recordOf({"state", "time", "duration", "trackId", "title", "artist", "volume"}, {playbackState, positionNumber, durationNumber, currentID, titleText, artistText, volumeNumber})
end snapshot
set startedAt to current date
with timeout of 8 seconds
  ${body}
end timeout
set outputData to current application's NSJSONSerialization's dataWithJSONObject:resultOut options:0 |error|:(missing value)
if outputData is missing value then error "Music response could not be encoded."
set outputText to (current application's NSString's alloc()'s initWithData:outputData encoding:4) as text
if (count of characters of outputText) > 3500 then error "Music result exceeded the safe response size."
return outputText`
}
function musicCommand(input) {
  const request=musicRequest(input),quote=value=>"'"+value.replaceAll("'","'\\''")+"'"
  return '/usr/bin/osascript -e '+quote(musicScript(request))
}
// END MAC MUSIC TRANSPORT

// BEGIN MAC MUSIC CONTROLLER
const MUSIC_LEASE='hermes.mac-music.playback.v1'
let musicQueue=Promise.resolve(),musicQueued=0
function musicEnqueue(work) {
  if(musicQueued>=12)return Promise.reject(Error('Music is busy. Wait for the current command.'))
  musicQueued++
  const next=musicQueue.catch(()=>{}).then(()=>navigator.locks?.request?navigator.locks.request('hermes.mac-music.native.v1',work):work())
  musicQueue=next
  return next.finally(()=>musicQueued--)
}
function createMacMusic(ctx,player) {
  const owner=()=>JSON.stringify([host.state.connectionId?.get(),host.state.profile.get()])
  let bound=owner(),epoch=0,disposed=false,route=null,sessionId=null,bare=false
  const saved=()=>{
    const value=ctx.storage.get('music.selection.v1.'+bound,[])
    return Array.isArray(value)?value.filter(p=>p&&/^[0-9A-F]{16}$/.test(p.id)&&typeof p.name==='string').slice(0,128):[]
  }
  const empty=()=>({connected:false,pending:false,playlists:[],nextPlaylist:0,playlistTotal:0,selected:saved(),attached:{},loading:null,browsing:null,tracks:null,now:null,owned:null,error:''})
  const state=atom(empty()),patch=values=>state.set({...state.get(),...values})
  function check(captured=bound,token=epoch){if(disposed||owner()!==captured||bound!==captured||epoch!==token)throw Error('Music profile or playback selection changed. Try the current selection again.')}
  async function localRoute(){
    if(!/Mac/.test(navigator.platform))throw Error('Music integration requires this Mac and the native Music app.')
    const connection=host.state.connectionId?.get(),profile=host.state.profile.get()
    const connections=await host.connections()
    if(!connection||!connections.some(c=>c.id===connection&&c.kind==='local'))throw Error('Select a verified local Hermes connection; Music never runs on remote machines.')
    const routes=(await host.profileRoutes()).filter(r=>r.connectionId===connection&&r.profile===profile)
    if(routes.length!==1)throw Error('Select one local Hermes profile before connecting Music.')
    const focused=host.state.focusedSessionOwner?.get()
    sessionId=focused?.connectionId===connection&&focused?.profile===profile?host.state.focusedSessionId?.get():null
    return {...routes[0]}
  }
  function message(error){const text=String(error?.message||error).slice(0,600);return /1743|not authorized|automation|permission|timed? out/i.test(text)?text+' Music may require macOS Automation approval (System Settings → Privacy & Security → Automation). Approve the requesting Hermes/helper process yourself, then retry Connect. No sign-in or library changes are performed.':text}
  async function native(input,pinned=route,pinnedSession=sessionId){
    if(!pinned)throw Error('Connect Music first.')
    const command=musicCommand(input)
    let response
    try{
      response=await host.requestProfile(pinned,'shell.exec',{command,...(!bare&&pinnedSession?{session_id:pinnedSession}:{})},25000)
    }catch(error){
      // Retry ONLY a schema rejection, never a timeout/uncertain execution.
      if(!/invalid[ _]params|extra[ _]forbidden|extra inputs/i.test(String(error?.message||error)))throw error
      if(!pinnedSession)throw Error('This gateway needs a local chat session. Open a chat in this profile, then Connect Music again.')
      response=await host.requestProfile(pinned,'shell.exec',{command,...(bare?{session_id:pinnedSession}:{})},25000)
      bare=!bare
    }
    if(response?.code!==0)throw Error(String(response?.stderr||'Native Music command failed or timed out.').slice(0,500))
    let result
    try{if(typeof response.stdout!=='string'||response.stdout.length>3500)throw Error();result=JSON.parse(response.stdout)}catch{throw Error('Music returned an incomplete or redacted response. Nothing was imported; retry explicitly.')}
    if(['tracks','playlists'].includes(input.action)){
      if(!Array.isArray(result?.rows)||result.rows.length>8||!Number.isSafeInteger(result.total)||result.total<0||result.offset!==input.offset||!(result.next===null||Number.isSafeInteger(result.next)&&result.next>input.offset)||result.rows.some(r=>!r||typeof r.id!=='string'||!/^[0-9A-F]{16}$/.test(r.id)||typeof r.name!=='string'||r.name.length>96||input.action==='tracks'&&(!Number.isSafeInteger(r.index)||r.index<0||typeof r.artist!=='string'||!Number.isFinite(r.duration)||r.duration<0)))throw Error('Music returned invalid playlist/track data.')
    }else if(!result||!['playing','paused','stopped','fast forwarding','rewinding'].includes(result.state)||!(result.trackId===null||typeof result.trackId==='string'&&/^[0-9A-F]{16}$/.test(result.trackId))||['time','duration','volume'].some(k=>!Number.isFinite(result[k])||result[k]<0)||typeof result.title!=='string'||typeof result.artist!=='string')throw Error('Music status is unavailable or invalid.')
    if(['play','next','previous','resume','seek','volume'].includes(input.action)&&(!Number.isSafeInteger(result.index)||result.index<0||result.playlistId!==input.playlistId||typeof result.targetTrackId!=='string'||!/^[0-9A-F]{16}$/.test(result.targetTrackId)))throw Error('Music returned an invalid playback target.')
    return result
  }
  function lease(){
    try{const value=JSON.parse(window.localStorage.getItem(MUSIC_LEASE));return value&&typeof value.trackId==='string'&&/^[0-9A-F]{16}$/.test(value.trackId)?value:null}catch{return null}
  }
  async function pauseLease(pinned=route,pinnedSession=sessionId){
    const value=lease();if(!value)return null
    const result=await native({action:'pause',trackId:value.trackId},pinned,pinnedSession)
    if(!['paused','stopped'].includes(result.state))throw Error('Music is still playing or changed outside Hermes. Pause Music manually before starting radio or a podcast.')
    window.localStorage.removeItem(MUSIC_LEASE)
    return result
  }
  async function run(work,{connect=false}={}){
    const captured=bound,token=epoch
    if(state.get().pending)throw Error('Music is busy. Wait for the current command.')
    patch({pending:true,error:''})
    try{return await musicEnqueue(async()=>{check(captured,token);if(!connect&&!state.get().connected)throw Error('Connect Music first.');const result=await work(()=>check(captured,token));check(captured,token);return result})}
    catch(error){if(!disposed&&bound===captured&&epoch===token)patch({error:message(error)});throw error}
    finally{if(!disposed&&bound===captured&&epoch===token)patch({pending:false})}
  }
  async function connect(){const captured=bound,token=epoch;const result=await run(async guard=>{const pinned=await localRoute();guard();route=pinned;const result=await native({action:'playlists',offset:0});guard();patch({connected:true,playlists:result.rows,nextPlaylist:result.next,playlistTotal:result.total});return result},{connect:true});for(const p of state.get().selected){check(captured,token);await browse(p.id)}return result}
  async function morePlaylists(){return run(async guard=>{const offset=state.get().nextPlaylist;if(offset===null)return;const result=await native({action:'playlists',offset});guard();patch({playlists:[...new Map([...state.get().playlists,...result.rows].map(p=>[p.id,p])).values()],nextPlaylist:result.next,playlistTotal:result.total})})}
  async function select(id,enabled){
    if(!state.get().connected||state.get().pending)throw Error('Connect Music and wait before choosing playlists.')
    const p=[...state.get().playlists,...state.get().selected].find(p=>p.id===id)
    if(!p)throw Error('Choose a listed playlist.')
    const selected=state.get().selected.filter(p=>p.id!==id)
    if(enabled){if(selected.length>=128)throw Error('Choose at most 128 playlists.');selected.push({id:p.id,name:p.name})}
    patch({selected,...(!enabled&&state.get().browsing===id?{browsing:null,tracks:null}:{}),...(!enabled&&state.get().owned?.playlistId===id?{owned:null}:{}),error:''})
    ctx.storage.set('music.selection.v1.'+bound,selected)
    if(enabled)return browse(id)
    const attached={...state.get().attached};delete attached[id];patch({attached})
  }
  async function browse(id,refresh=false){
    if(!state.get().selected.some(p=>p.id===id))throw Error('Only explicitly selected playlists can be browsed.')
    const cached=state.get().attached[id];
    if(cached&&!refresh){check();patch({browsing:id,tracks:cached,error:''});return cached}
    const captured=bound,token=epoch;
    return run(async guard=>{
      let offset=0,total=null;const rows=[];
      patch({browsing:id,tracks:null,loading:{id,loaded:0,total:null}});
      try {
        for(;;){
          guard();if(!state.get().selected.some(p=>p.id===id))throw Error('Playlist is no longer selected.');
          const page=await native({action:'tracks',playlistId:id,offset});guard();
          if(total===null)total=page.total;
          const expected=Math.min(8,total-offset),next=offset+page.rows.length;
          if(page.total!==total||expected<0||page.rows.length!==expected||page.rows.some((r,i)=>r.index!==offset+i)||page.next!==(next===total?null:next))throw Error('Playlist changed while adding songs. Refresh songs to retry; the partial list is not complete.');
          rows.push(...page.rows);
          const tracks={rows:[...rows],total,offset:0,next:null,complete:next===total};
          patch({tracks,loading:{id,loaded:rows.length,total}});
          if(page.next===null){patch({attached:{...state.get().attached,[id]:tracks}});return tracks}
          offset=page.next;
        }
      }finally{if(!disposed&&bound===captured&&epoch===token)patch({loading:null})}
    });
  }
  function cancelLoad(){if(state.get().loading){epoch++;patch({pending:false,loading:null,error:'Adding songs cancelled. Use Refresh songs to finish adding this playlist.'})}}
  async function play(row){return run(async guard=>{
    const s=state.get(),playlistId=s.browsing
    if(!s.selected.some(p=>p.id===playlistId)||!s.tracks?.rows.some(t=>t.id===row.id&&t.index===row.index))throw Error('Browse a selected playlist and choose a listed track.')
    const request=musicRequest({action:'play',playlistId,trackId:row.id,index:row.index})
    guard();player.pauseForMusic();player.announceMusic?.()
    // Reserve the typed target before dispatch: an uncertain result must not
    // let a later radio start skip the native pause handshake.
    window.localStorage.setItem(MUSIC_LEASE,JSON.stringify({trackId:row.id,owner:bound}))
    const result=await native(request);guard();patch({now:result,owned:{playlistId,trackId:result.targetTrackId,index:result.index}});return result
  })}
  async function control(action,value){return run(async guard=>{
    const s=state.get(),owned=s.owned
    if(!owned||!s.selected.some(p=>p.id===owned.playlistId))throw Error('Choose a track from a selected playlist first.')
    const request=action==='pause'?{action,trackId:owned.trackId}:{action,...owned,...(['seek','volume'].includes(action)?{value}:{})}
    musicRequest(request)
    if(['resume','next','previous'].includes(action)){player.pauseForMusic();player.announceMusic?.();window.localStorage.setItem(MUSIC_LEASE,JSON.stringify({trackId:owned.trackId,owner:bound}))}
    const result=await native(request);guard()
    if(['resume','next','previous'].includes(action))window.localStorage.setItem(MUSIC_LEASE,JSON.stringify({trackId:result.targetTrackId,owner:bound}))
    if(action==='pause'&&!['paused','stopped'].includes(result.state))throw Error('Music is still playing. Pause Music manually; the current track changed outside Hermes.')
    if(action==='pause')window.localStorage.removeItem(MUSIC_LEASE)
    patch({now:result,owned:{...owned,trackId:result.targetTrackId||owned.trackId,index:result.index??owned.index}});return result
  })}
  async function refresh(){
    if(!state.get().connected||state.get().pending)return state.get().now
    const captured=bound,token=epoch
    try{return await run(async guard=>{const result=await native({action:'status'});guard();patch({now:result});return result})}
    catch(error){if(!disposed&&bound===captured&&epoch===token)patch({connected:false,now:null});throw error}
  }
  async function beforeAudio(){
    // Also fences a queued Music start before the explicit radio/episode start.
    return musicEnqueue(async()=>{
      const value=lease();if(!value)return
      const captured=bound,token=epoch,pinned=await localRoute();check(captured,token)
      const result=await pauseLease(pinned);check(captured,token)
      if(result)patch({now:result})
    }).catch(error=>{if(!disposed)patch({error:message(error)});throw error})
  }
  function changed(){
    if(bound===owner())return
    const pinned=route,pinnedSession=sessionId,wasConnected=state.get().connected,oldOwner=bound
    epoch++;bound=owner();route=null;sessionId=null;bare=false;state.set(empty())
    // Cleanup uses only the captured local route, never the new ambient profile.
    if(wasConnected&&pinned)void musicEnqueue(()=>lease()?.owner===oldOwner?pauseLease(pinned,pinnedSession):null).catch(()=>{})
  }
  const unprofile=host.state.profile.subscribe(changed),unconnection=host.state.connectionId.subscribe(changed)
  ctx.onDispose(()=>{disposed=true;epoch++;unprofile();unconnection()})
  return {state,connect,morePlaylists,select,browse,cancelLoad,play,control,refresh,beforeAudio}
}
// END MAC MUSIC CONTROLLER

function createPlayer(ctx) {
  const saved = ctx.storage.get('local.favorites', [])
  const favorites = atom(uniqueStations(Array.isArray(saved) ? saved.filter(validStation) : []))
  const previous = ctx.storage.get('local.station', null)
  const station = atom(validStation(previous) ? previous : PRESETS[0])
  const storedVolume = ctx.storage.get('local.volume', 25)
  const volume = atom(Number.isFinite(storedVolume) ? Math.max(0, Math.min(100, storedVolume)) : 25)
  const status = atom('paused')
  const meterMode = atom('levels')
  const plainStreams = new Set()
  const open = atom(false)
  const episode = atom(null)
  const position = atom({ time: 0, duration: 0 })
  let lastPersistAt=0
  function persistProgress(force=false,completed=false){
    const e=episode.get();if(!e||!audio||!Number.isFinite(audio.duration)||audio.duration<=0)return
    if(!force&&Date.now()-lastPersistAt<5000)return
    lastPersistAt=Date.now()
    window.dispatchEvent(new CustomEvent('hermes:rss-library:v1',{detail:{version:1,kind:'progress',owner:e.owner,id:e.id,time:audio.currentTime||0,duration:audio.duration,completed:completed||audio.ended}}))
  }
  ctx.addEventListener(window,'beforeunload',()=>persistProgress(true))
  let episodeUrl = null
  let audio = null
  let audioContext = null
  let source = null
  let analyser = null
  let output = null
  const waveformData = new Float32Array(2048)
  let generation = 0
  let playGeneration = -1
  let timeout = null
  let disposed = false
  let lastVolume = volume.get() || 25
  const bus = new BroadcastChannel('hermes:radio:playback')
  const windowId = randomUuid()
  let suspendedForMusic = false
  let toggleAttempt = 0
  function pauseForMusic() {
    suspendedForMusic = true
    toggleAttempt++
    persistProgress(true)
    clearTimeout(timeout)
    if (audio) audio.pause()
    status.set('paused')
  }
  const music = createMacMusic(ctx, { pauseForMusic, announceMusic: () => bus.postMessage({ type: 'play', sender: windowId }) })

  function stop(nextStatus = 'paused') {
    persistProgress(true)
    generation++
    clearTimeout(timeout)
    source?.disconnect()
    analyser?.disconnect()
    output?.disconnect()
    output = null
    source = null
    analyser = null
    if (audioContext?.state === 'running') void audioContext.suspend()
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audio.remove()
      audio = null
    }
    if (episodeUrl) URL.revokeObjectURL(episodeUrl)
    episodeUrl = null
    episode.set(null)
    position.set({ time: 0, duration: 0 })
    status.set(nextStatus)
  }

  async function play(next = station.get(), analyse = true) {
    if (disposed || !validStation(next)) return
    stop()
    const token = generation
    suspendedForMusic = false
    station.set(next)
    ctx.storage.set('local.station', next)
    status.set('connecting')
    try { await music.beforeAudio() } catch { if (token === generation) status.set('error'); return }
    if (disposed || token !== generation || suspendedForMusic) return
    bus.postMessage({ type: 'play', sender: windowId })
    const element = new Audio()
    audio = element
    element.dataset.hermesRadioAudio = 'true'
    element.hidden = true
    element.preload = 'none'
    // Try real analysis for every station, not a host allowlist. If CORS or
    // the audio graph fails, retry once with ordinary media playback.
    const metered = analyse && !plainStreams.has(next.url)
    meterMode.set(metered ? 'levels' : 'activity')
    if (metered) element.crossOrigin = 'anonymous'
    element.volume = metered ? 1 : volume.get() / 100
    document.body.append(element)
    const current = () => !disposed && token === generation
    const fail = () => {
      if (!current()) return
      if (metered) {
        plainStreams.add(next.url)
        void play(next, false)
      } else stop('error')
    }
    element.addEventListener('playing', () => {
      if (current()) { clearTimeout(timeout); playGeneration = token; status.set('live') }
    })
    // Browser/media controls can pause the element outside our buttons.
    // Reflect that state instead of showing a frozen trace as live playback.
    // Non-destructive: an external controller (macOS media keys, a dictation
    // tool pausing audio to listen) may resume the same element afterwards,
    // so the stream must survive. The plugin's own Pause control stays
    // destructive — toggle() advances the generation first, so the pause
    // event it triggers fails the current() guard and still runs stop().
    element.addEventListener('pause', () => {
      if (current() && element.paused && !element.ended) status.set('paused')
    })
    element.addEventListener('waiting', () => {
      if (current()) { status.set('connecting'); clearTimeout(timeout); timeout = setTimeout(fail, 15000) }
    })
    element.addEventListener('error', fail)
    element.addEventListener('ended', fail)
    timeout = setTimeout(fail, 15000)
    element.src = next.url
    try {
      if (metered) {
        audioContext ??= new AudioContext()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = waveformData.length
        source = audioContext.createMediaElementSource(element)
        output = audioContext.createGain()
        output.gain.value = volume.get() / 100
        source.connect(analyser)
        analyser.connect(output)
        output.connect(audioContext.destination)
        await audioContext.resume()
        if (!current()) return
      }
      if (suspendedForMusic || !current()) return
      await element.play()
    } catch { fail() }
  }

  function toggle() {
    const attempt = ++toggleAttempt
    suspendedForMusic = false
    if (episode.get() && audio) {
      if (!audio.paused) { clearTimeout(timeout); audio.pause(); status.set('paused') }
      else {
        const token = generation, element = audio
        status.set('connecting')
        void music.beforeAudio().then(() => { if (!disposed && attempt === toggleAttempt && token === generation && audio === element) return element.play() }).catch(() => { if (attempt === toggleAttempt && token === generation) status.set('error') })
      }
      return
    }
    if (status.get() === 'live' || status.get() === 'connecting') stop()
    else {
      const token = generation
      void music.beforeAudio().then(() => {
        if (!disposed && attempt === toggleAttempt && token === generation && !suspendedForMusic && !resume()) void play()
      }).catch(() => { if (attempt === toggleAttempt && token === generation) status.set('error') })
    }
  }

  // Dictation tools (Fluid Voice) pause the stream to hear the microphone,
  // then deliver the transcript as a paste-like insertion into the focused
  // field. No media-session resume event ever follows, so the only
  // renderer-visible "dictation is done" signal is the text itself arriving
  // in the composer. On that signal the plugin resumes the preserved stream.
  // Never resumed on window focus — that would override an intentional pause.
  // Returns false when the stream is not intact (fresh start, the plugin's
  // own destructive Pause, a stop from another window), so callers can fall
  // back to a full reconnect.
  function resume() {
    // An intentional podcast pause must never be undone by composer paste.
    if (episode.get() || suspendedForMusic) return false
    if (disposed || !audio || generation !== playGeneration || status.get() !== 'paused') return false
    const token = generation
    status.set('connecting')
    void audio
      .play()
      .then(() => {
        if (!disposed && token === generation) { clearTimeout(timeout); status.set('live') }
      })
      .catch(() => {
        if (!disposed && token === generation) stop('error')
      })
    return true
  }

  function next() {
    if (episode.get()) { stop(); return }
    const queue = uniqueStations([...favorites.get(), ...PRESETS, station.get()])
    const index = queue.findIndex(item => sameStation(item, station.get()))
    void play(queue[(index + 1) % queue.length])
  }

  function setVolume(value) {
    const nextVolume = Math.max(0, Math.min(100, value))
    volume.set(nextVolume)
    if (output) output.gain.value = nextVolume / 100
    else if (audio) audio.volume = nextVolume / 100
    ctx.storage.set('local.volume', nextVolume)
  }

  function mute() {
    if (volume.get()) { lastVolume = volume.get(); setVolume(0) }
    else setVolume(lastVolume)
  }

  function favorite(item) {
    const current = favorites.get()
    const nextFavorites = current.some(value => sameStation(value, item)) ? current.filter(value => !sameStation(value, item)) : [...current, item]
    favorites.set(nextFavorites)
    ctx.storage.set('local.favorites', nextFavorites)
  }

  bus.onmessage = event => {
    if (event.data?.type === 'play' && event.data.sender !== windowId) stop('elsewhere')
  }

  // Dictation completion: Fluid Voice delivers the transcript as a paste into
  // the focused editable field (its Electron delivery path is a guarded ⌘V,
  // a real DOM paste event). resume() no-ops unless the stream was paused
  // externally and is still intact, so ordinary pastes while stopped, errored
  // or intentionally paused (the plugin's own Pause is destructive) do nothing.
  const onTextInserted = event => {
    const target = event.target
    const editable = target instanceof HTMLTextAreaElement
      || target instanceof HTMLInputElement
      || (target instanceof HTMLElement && target.isContentEditable)
    if (editable) void resume()
  }
  document.addEventListener('paste', onTextInserted)
  function owner() { return JSON.stringify([host.state.connectionId?.get() || 'local', host.state.profile.get()]) }
  function seek(value) {
    if (!episode.get() || !audio || !Number.isFinite(value) || !Number.isFinite(audio.duration)) return
    audio.currentTime = Math.max(0, Math.min(audio.duration, value))
    position.set({ time: audio.currentTime, duration: audio.duration })
    persistProgress(true)
  }
  function mountVideo(container) {
    const element = audio
    if (!container || element?.tagName !== 'VIDEO') return () => {}
    element.hidden = false
    element.style.width = '100%'
    element.style.maxHeight = '180px'
    container.append(element)
    return () => { if (audio === element) { element.hidden = true; document.body.append(element) } }
  }
  function playEpisode(detail) {
    if (disposed || detail.owner !== owner() || !(detail.blob instanceof Blob) || detail.blob.size <= 0 || detail.blob.size > 512 * 1024 * 1024 || typeof detail.title !== 'string' || typeof detail.id !== 'string' || !/^(audio|video)\//.test(detail.mediaType || '')) return false
    stop()
    const token = generation
    lastPersistAt=0
    suspendedForMusic = false
    episode.set({ id: detail.id, title: detail.title.slice(0, 1000), source: httpsUrl(detail.source), owner: detail.owner, mediaType: detail.mediaType })
    meterMode.set('activity')
    bus.postMessage({ type: 'play', sender: windowId })
    const element = document.createElement(detail.mediaType.startsWith('video/') ? 'video' : 'audio')
    audio = element
    episodeUrl = URL.createObjectURL(detail.blob)
    element.dataset.hermesPodcastMedia = 'true'
    element.preload = 'metadata'
    element.volume = volume.get() / 100
    element.hidden = true
    document.body.append(element)
    const current = () => !disposed && generation === token
    const update = () => { if (current()) {position.set({ time: element.currentTime || 0, duration: Number.isFinite(element.duration) ? element.duration : 0 });persistProgress()} }
    element.addEventListener('loadedmetadata',()=>{if(!current())return;if(Number.isFinite(detail.resumeAt)&&detail.resumeAt>0&&detail.resumeAt<element.duration-1)element.currentTime=detail.resumeAt;update();persistProgress(true)})
    element.addEventListener('durationchange', update)
    element.addEventListener('timeupdate', update)
    element.addEventListener('seeked', update)
    element.addEventListener('playing', () => { if (current()) { clearTimeout(timeout); status.set('playing') } })
    element.addEventListener('pause', () => { if (current() && !element.ended) { clearTimeout(timeout); status.set('paused');persistProgress(true) } })
    element.addEventListener('ended', () => { if (current()) { clearTimeout(timeout); update(); status.set('ended');persistProgress(true,true) } })
    element.addEventListener('error', () => { if (current()) { clearTimeout(timeout); status.set('error') } })
    element.src = episodeUrl
    status.set('connecting')
    timeout = setTimeout(() => { if (current()) { element.pause(); status.set('error') } }, 15000)
    void (async()=>{
      await music.beforeAudio();if(!current()||suspendedForMusic)return
      try{
        audioContext??=new AudioContext();await audioContext.resume();if(!current())return
        if(audioContext.state!=='running')throw Error('Audio analysis unavailable')
        source=audioContext.createMediaElementSource(element);analyser=audioContext.createAnalyser();analyser.fftSize=waveformData.length;output=audioContext.createGain();output.gain.value=volume.get()/100
        source.connect(analyser);analyser.connect(output);output.connect(audioContext.destination);element.volume=1;meterMode.set('levels')
      }catch{if(source&&audioContext?.state==='running'){source.disconnect();source.connect(audioContext.destination)}output=null;element.volume=volume.get()/100;meterMode.set('activity')}
      if(current()&&!suspendedForMusic&&status.get()!=='error')await element.play()
    })().catch(()=>{if(current()){clearTimeout(timeout);status.set('error')}})
    open.set(true)
    return true
  }
  // This is a NEW, versioned same-renderer candidate protocol. The existing
  // BroadcastChannel remains playback arbitration only, never a media API.
  ctx.addEventListener(window, 'hermes:rss-radio:v1', event => {
    const detail = event.detail
    if (detail?.version !== 1 || typeof detail.respond !== 'function') return
    if (detail.kind === 'available') detail.respond({ ok: !disposed, token: windowId+':'+generation })
    else if (detail.kind === 'library') {open.set(true);detail.respond({ok:!disposed})}
    else if (detail.kind === 'episode') detail.respond({ ok: playEpisode(detail), error: 'Invalid episode or profile changed.' })
  })
  const profileChanged = () => { if (episode.get() && episode.get().owner !== owner()) stop() }
  const unsubscribeProfile = host.state.profile.subscribe(profileChanged)
  const unsubscribeConnection = host.state.connectionId?.subscribe(profileChanged)
  function waveform(columns) {
    if (!analyser || !['live','playing'].includes(status.get())) return Array(columns).fill(0)
    analyser.getFloatTimeDomainData(waveformData)
    // Bar envelope, not a bipolar trace: each column reports the peak magnitude
    // in its slice so the meter can anchor to a flat base. Rising-edge trigger
    // keeps the pattern stable horizontally; fixed display gain with soft
    // saturation makes speech legible without normalizing noise or inventing levels.
    const span = Math.floor(audioContext.sampleRate * .004)
    let start = 0
    for (let i = 1; i < waveformData.length - span; i++) {
      if (waveformData[i - 1] < 0 && waveformData[i] >= 0) { start = i; break }
    }
    return Array.from({ length: columns }, (_, x) => {
      const from = start + Math.floor(x * span / columns)
      const to = start + Math.floor((x + 1) * span / columns)
      let peak = 0
      for (let i = from; i < to; i++) { const value = Math.abs(waveformData[i]); if (value > peak) peak = value }
      return Math.tanh(peak * 4)
    })
  }

  ctx.onDispose(() => {
    disposed = true
    unsubscribeProfile()
    unsubscribeConnection?.()
    document.removeEventListener('paste', onTextInserted)
    stop()
    bus.close()
    if (audioContext) void audioContext.close()
  })
  return { station, favorites, volume, status, meterMode, open, episode, position, seek, mountVideo, playEpisode, play, stop, toggle, next, setVolume, mute, favorite, waveform, music }
}

function brailleBars(levels, rows = 2) {
  const width = levels.length / 2
  const cells = Array(width * rows).fill(0)
  const dots = [[1, 2, 4, 64], [8, 16, 32, 128]]
  const total = rows * 4
  const bottom = total - 1
  levels.forEach((level, x) => {
    const v = Math.max(0, Math.min(1, Number(level) || 0))
    // Always light the bottom dot row so the meter keeps a flat, fixed base;
    // levels only extend upward from it.
    const lit = 1 + Math.round(v * (total - 1))
    for (let point = bottom; point > bottom - lit; point--) {
      cells[Math.floor(point / 4) * width + Math.floor(x / 2)] |= dots[x % 2][point % 4]
    }
  })
  return cells.map(cell => String.fromCharCode(0x2800 | cell))
}

function Waveform({ player, compact = false }) {
  const [{width,rows},setGeometry]=useState({width:compact?24:48,rows:compact?2:3})
  const ref = useRef(null)
  useEffect(()=>{const observer=new ResizeObserver(([entry])=>{const width=Math.max(8,Math.min(64,Math.floor(entry.contentRect.width/7))),rows=Math.max(2,Math.min(8,Math.floor(entry.contentRect.height/12)));setGeometry(old=>old.width===width&&old.rows===rows?old:{width,rows})});observer.observe(ref.current);return()=>observer.disconnect()},[])
  const status = useValue(player.status)
  const mode = useValue(player.meterMode)
  const station = useValue(player.station)
  const active = status === 'live' || status === 'playing'
  const baseline = brailleBars(Array(width * 2).fill(0), rows)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const blank = Array(width * rows).fill('⠀')
    const flat = brailleBars(Array(width * 2).fill(0), rows)
    const layers = [...node.children]
    const paint = (layer, cells) => cells.forEach((cell, i) => {
      if (layers[layer].children[i].textContent !== cell) layers[layer].children[i].textContent = cell
    })
    let history = [blank, blank],smoothed=Array(width*2).fill(0)
    const reset = () => { history = [blank, blank]; paint(0, blank); paint(1, blank); paint(2, flat) }
    reset()
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let step = 0
    // Phosphor-style persistence: two dim previous frames, no glow or fake signal.
    // Inspired by hubertlim/oscilloscope_playground (MIT); see README.
    const loop = createBudgetedLoop(() => {
      if (!active || motion.matches) return
      if (mode === 'activity') {
        // No amplitude source (e.g. native Music): a small bump travels along the flat base.
        const pos = Math.floor(step++ / 2) % (width + 12) - 6
        const levels = Array.from({ length: width * 2 }, (_, i) => { const d = Math.abs(i / 2 - pos); return d < 4 ? 0.55 * (1 - d / 4) : 0 })
        paint(0, blank); paint(1, blank); paint(2, brailleBars(levels, rows))
      } else {
        const samples=player.waveform(width*2);smoothed=smoothed.map((value,i)=>value+(samples[i]-value)*.7);const cells = brailleBars(smoothed, rows)
        paint(0, history[0]); paint(1, history[1]); paint(2, cells)
        history = [history[1], cells]
      }
    }, { fps: 24, pauseWhenUnfocused: false, idleWhen: () => !active || motion.matches })
    const updateMotion = () => { reset(); loop.wake() }
    motion.addEventListener('change', updateMotion)
    return () => { loop.dispose(); motion.removeEventListener('change', updateMotion) }
  }, [active, mode, player, rows, width, station.url])
  return jsx('div', { ref, className: 'hermes-radio-waveform', style: { '--radio-columns': width }, 'data-radio-meter': width, 'data-compact': compact, 'data-meter-mode': mode, 'data-active': active, 'aria-hidden': true,
    children: [0, 1, 2].map(layer => jsx('span', { className: 'hermes-radio-waveform-layer', children: baseline.map((cell, i) => jsx('span', { children: layer === 2 ? cell : '⠀' }, i)) }, layer)) })
}

function NextArrow() {
  return jsxs('span', { className: 'hermes-radio-next', 'aria-hidden': true, children: [
    jsx(icons.Play, { style: { width: 7, height: 12, flexShrink: 0 }, fill: 'currentColor' }),
    jsx(icons.Play, { style: { width: 7, height: 12, flexShrink: 0, marginLeft: -2 }, fill: 'currentColor' })
  ] })
}

function SmallAction({ label, icon, onClick, size = 'micro', pressed, className, busy = false }) {
  return jsx(Tip, { label, children: jsx(Button, {
    variant: 'ghost', size, className: `hermes-radio-action ${className ?? ''}`, 'aria-label': label, 'aria-pressed': pressed, onClick,
    children: jsx('span', { className: 'hermes-radio-action-icon', children: busy ? jsx(GlyphSpinner, { ariaLabel: label }) : jsx(icon, {}) })
  }) })
}

function trackCredit(source) {
  const raw = typeof source?.title === 'string' ? source.title.trim() : ''
  const explicit = source?.artist || source?.metadata?.artist
  const parts = raw.match(/^(.+?)\s[-–—]\s(.+)$/)
  const artist = typeof explicit === 'string' ? explicit.trim() : parts?.[1].trim() || ''
  // Only separate an explicit artist prefix when it actually matches.
  const title = parts && parts[1].trim() === artist ? parts[2].trim() : raw
  return { artist: raw ? artist : '', title }
}

async function artistRequest(path, signal, ctx) {
  // The lock and persisted timestamp pace lookups across desktop windows.
  return navigator.locks.request('hermes:radio:artist-lookup', { signal }, async () => {
    const delay = Math.max(0, 1100 - (Date.now() - ctx.storage.get('local.artistRequestAt', 0)))
    if (delay) await new Promise(resolve => setTimeout(resolve, delay))
    signal.throwIfAborted()
    ctx.storage.set('local.artistRequestAt', Date.now())
    const response = await fetch(`https://musicbrainz.org/ws/2/${path}`, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]), credentials: 'omit',
      headers: { 'User-Agent': 'HermesRadio/1.0 (https://github.com/NousResearch/hermes-agent)' }
    })
    if (!response.ok) throw new Error(`Artist lookup: HTTP ${response.status}`)
    return response.json()
  })
}

function artistProfile(relations) {
  const links = (relations ?? []).filter(item => !item.ended).flatMap(item => {
    const href = httpsUrl(item.url?.resource)
    if (!href) return []
    const url = new URL(href)
    if (url.hostname === 'open.spotify.com' && /^\/artist\/[a-zA-Z0-9]{22}\/?$/.test(url.pathname)) return [{ href, rank: 0 }]
    if (item.type === 'bandcamp' && /^[^.]+\.bandcamp\.com$/.test(url.hostname) && url.pathname === '/') return [{ href, rank: 1 }]
    if (item.type === 'official homepage' && !['open.spotify.com', 'bandcamp.com'].includes(url.hostname)) return [{ href, rank: 2 }]
    return []
  })
  return links.sort((a, b) => a.rank - b.rank)[0]?.href ?? null
}

function normalizedArtist(name) {
  return name.normalize('NFKC').trim().toLowerCase()
}

async function resolveArtist(artist, signal, ctx) {
  // Apple's public artist search supplies direct profile URLs without API keys.
  // Prefer it over a slow/unavailable MusicBrainz lookup; never use song results.
  const params = new URLSearchParams({ term: artist, entity: 'musicArtist', limit: '10' })
  try {
    const result = await fetchJson(`https://itunes.apple.com/search?${params}`, signal)
    const matches = (result.results ?? []).filter(item => item.wrapperType === 'artist' && normalizedArtist(item.artistName) === normalizedArtist(artist))
    if (matches.length > 1) return null
    if (matches.length === 1) {
      const href = httpsUrl(matches[0].artistLinkUrl)
      if (href) {
        const url = new URL(href)
        if (url.hostname === 'music.apple.com' && /^\/[a-z]{2}\/artist\/[^/]+\/\d+$/.test(url.pathname)) {
          url.search = ''
          return url.href
        }
      }
    }
  } catch (error) {
    if (signal.aborted) throw error
  }
  return resolveMusicBrainzArtist(artist, signal, ctx)
}

async function resolveMusicBrainzArtist(artist, signal, ctx) {
  const escaped = artist.replace(/[+\-!(){}\[\]^"~*?:\\/&|]/g, '\\$&')
  const params = new URLSearchParams({ query: `artist:"${escaped}"`, fmt: 'json', limit: '5' })
  const result = await artistRequest(`artist/?${params}`, signal, ctx)
  const matches = (result.artists ?? []).filter(item => normalizedArtist(item.name) === normalizedArtist(artist))
  // Never turn the top fuzzy match or an ambiguous artist name into a credit.
  if (matches.length !== 1 || matches[0].score !== 100 || result.artists.length === 5) return null
  const id = matches[0].id
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id)) return null
  const profile = await artistRequest(`artist/${id}?inc=url-rels&fmt=json`, signal, ctx)
  return artistProfile(profile.relations)
}

function Signal({ player, ctx }) {
  const t = usePluginI18n(ID)
  const station = useValue(player.station)
  const status = useValue(player.status)
  const mode = useValue(player.meterMode)
  const stream = new URL(station.url)
  const endpoints = {
    'stream.nightride.fm': `${NIGHTRIDE}status-json.xsl`,
    'media01.gamingnow.net': 'https://media01.gamingnow.net:8010/status-json.xsl'
  }
  const endpoint = endpoints[stream.hostname]
  const metadata = useQuery({
    queryKey: [ID, 'metadata', endpoint],
    queryFn: ({ signal }) => fetchJson(endpoint, signal),
    enabled: status === 'live' && Boolean(endpoint),
    staleTime: 20000, refetchInterval: status === 'live' ? 25000 : false, retry: 1
  })
  const sources = metadata.data?.icestats?.source
  const source = (Array.isArray(sources) ? sources : sources ? [sources] : []).find(source => source.listenurl?.endsWith(stream.pathname))
  const track = status === 'live' && typeof source?.title === 'string' ? source.title : ''
  const credit = trackCredit(track ? source : null)
  const artist = useQuery({
    queryKey: [ID, 'artist-profile', credit.artist],
    queryFn: ({ signal }) => resolveArtist(credit.artist, signal, ctx),
    enabled: Boolean(credit.artist), staleTime: 86400000, gcTime: 86400000,
    retry: 1, retryDelay: 3000, refetchOnWindowFocus: false
  })
  const artistUrl = credit.artist ? artist.data : null
  const text = status === 'live' ? track || (mode === 'activity' ? t('audioOnly') : '') : t(status)
  return jsxs('div', { className: 'hermes-radio-signal', children: [
    jsx(Waveform, { player }),
    jsxs('div', { className: 'hermes-radio-track', 'data-track': Boolean(track), role: 'status', children: [
      status === 'connecting' && jsx(GlyphSpinner, { ariaLabel: t('connecting') }),
      credit.artist && (artistUrl ? jsx(Tip, { label: `${t('artistProfile')}: ${credit.artist}`, children: jsx(Button, {
        variant: 'text', size: 'inline', asChild: true, className: 'hermes-radio-artist',
        children: jsxs('a', { href: artistUrl, target: '_blank', rel: 'noopener noreferrer',
          'aria-label': `${t('artistProfile')}: ${credit.artist}`,
          onClick: event => { event.preventDefault(); void ctx.os.openExternal(artistUrl) },
          children: [jsx('span', { children: credit.artist }), jsx(icons.ExternalLink, { style: { width: 10, height: 10 }, 'aria-hidden': true })]
        })
      }) }) : jsx('span', { className: 'hermes-radio-track-text', children: credit.artist })),
      credit.artist && jsx('span', { className: 'hermes-radio-track-separator', 'aria-hidden': true, children: '—' }),
      jsx(Tip, { label: text || undefined, children: jsx('span', { className: 'hermes-radio-track-text', children: credit.artist ? credit.title : text }) })
    ] })
  ] })
}

function StationRow({ station, player }) {
  const t = usePluginI18n(ID)
  const current = sameStation(useValue(player.station), station)
  const status = useValue(player.status)
  const active = status === 'live' || status === 'connecting'
  const failed = current && status === 'error'
  const saved = useValue(player.favorites).some(item => sameStation(item, station))
  return jsxs('div', { className: 'hermes-radio-row', 'data-current': current, 'data-pinned': saved, children: [
    jsxs(RowButton, { className: 'hermes-radio-row-main', 'aria-label': `${t(failed ? 'retry' : current && active ? 'pause' : 'play')}: ${station.name}`, title: failed ? t('streamError') : undefined, 'aria-current': current ? 'true' : undefined,
      onClick: () => current ? player.toggle() : void player.play(station), children: [
        jsx('span', { className: 'hermes-radio-row-icon', role: failed ? 'status' : undefined, 'aria-label': failed ? t('error') : undefined, children: jsx(failed ? icons.AlertCircle : current && active ? icons.Pause : icons.Play, { size: 12 }) }),
        jsx('span', { className: 'hermes-radio-row-copy', children: jsx('span', { className: 'hermes-radio-row-name', children: station.name }) })
      ] }),
    jsx(SmallAction, { label: `${t(saved ? 'unsave' : 'save')}: ${station.name}`, icon: icons.Pin, onClick: () => player.favorite(station), size: 'icon-xs', pressed: saved, className: 'hermes-radio-pin' })
  ] })
}

function Stations({ player, podcasts=[], onPodcast=()=>{} }) {
  const t = usePluginI18n(ID)
  const favorites = useValue(player.favorites)
  const current = useValue(player.station)
  const [browseStation, setBrowseStation] = useState(() => player.station.get())
  const listRef = useRef(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const text = search.trim()
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
  }, [text])
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text), 350)
    return () => clearTimeout(timer)
  }, [text])
  const result = useQuery({
    queryKey: [ID, 'search', query], queryFn: ({ signal }) => searchStations(query, signal),
    enabled: query.length >= 2 && text === query && !podcasts.some(p=>p.title.toLowerCase().includes(text.toLowerCase())), staleTime: 300000, retry: false
  })
  const matches = item => [item.name, item.description, item.provider].some(value => value?.toLowerCase().includes(text.toLowerCase()))
  const local = uniqueStations([...favorites, ...PRESETS]).filter(matches)
  const remote = text.length >= 2 && query === text ? result.data ?? [] : []
  const results = uniqueStations([...local, ...remote])
  // Keep the previously prepended row until the search changes: selecting a
  // result must not remove a row above it and move the target under the pointer.
  const anchored = results.some(item => sameStation(item, browseStation)) ? results : [browseStation, ...results]
  const items = anchored.some(item => sameStation(item, current)) ? anchored : [current, ...anchored]
  const pending = text.length >= 2 && (text !== query || result.isFetching)
  const searchFailed = text.length >= 2 && query === text && result.isError
  return jsxs('div', { children: [
    jsx('div', { className: 'hermes-radio-search', 'data-filled': Boolean(search), children: jsx(SearchField, {
      value: search, onChange: value => { setBrowseStation(player.station.get()); setSearch(value) }, placeholder: t('search'),
      containerClassName: 'hermes-radio-search-field',
      trailingAction: pending ? jsx('span', { className: 'hermes-radio-search-loader', children: jsx(GlyphSpinner, { ariaLabel: t('searching') }) }) : null
    }) }),
    jsxs('div', { ref: listRef, className: 'hermes-radio-list', 'data-radio-pending': pending, children: [
      ...podcasts.filter(p=>p.title.toLowerCase().includes(text.toLowerCase())).map(p=>jsxs('button',{type:'button',className:'hel-station',onClick:()=>onPodcast(p),children:[jsx('span',{'aria-hidden':true,children:'▷'}),jsxs('span',{children:[jsx('strong',{children:p.title}),jsx('small',{children:`${p.count} episodes`})]}),jsx('small',{children:`${p.unread} unread`}),jsx('span',{'aria-hidden':true,children:'›'})]},p.id)),
      ...items.map(station => jsx(StationRow, { station, player }, station.id)),
      searchFailed && jsx('div', { className: 'hermes-radio-error', role: 'status', children: t('searchError') }),
      !pending && !searchFailed && text && results.length === 0 && jsx('div', { className: 'hermes-radio-error', role: 'status', children: t('noResults') })
    ] })
  ] })
}

function Transport({ player, ctx }) {
  const t = usePluginI18n(ID)
  const volume = useValue(player.volume)
  const station = useValue(player.station)
  const status = useValue(player.status)
  const active = status === 'live' || status === 'connecting'
  return jsxs('div', { className: 'hermes-radio-volume', children: [
    jsx(SmallAction, { label: t(active ? 'pause' : 'play'), icon: active ? icons.Pause : icons.Play, busy: status === 'connecting', size: 'icon-xs', onClick: player.toggle }),
    jsx(SmallAction, { label: t('next'), icon: NextArrow, size: 'icon-xs', onClick: player.next }),
    jsx('span', { className: 'hermes-radio-volume-space' }),
    jsx(SmallAction, { label: t(volume ? 'mute' : 'unmute'), icon: volume ? icons.Volume2 : icons.VolumeX, onClick: player.mute, size: 'icon-xs' }),
    jsx('input', { type: 'range', min: 0, max: 100, step: 1, value: volume, 'aria-label': t('volume'), onChange: event => player.setVolume(Number(event.target.value)) }),
    jsx('span', { className: 'hermes-radio-website', children: httpsUrl(station.homepage) && jsx(SmallAction, { label: t('visit'), icon: icons.ExternalLink, size: 'icon-xs', onClick: () => void ctx.os.openExternal(station.homepage) }) })
  ] })
}

function libraryRequest(kind,owner,extra={}){
  return new Promise((resolve,reject)=>{
    let settled=false;const timer=setTimeout(()=>{settled=true;reject(Error('Episode library did not respond. Check that RSS Reader is enabled.'))},kind==='play'?650000:10000);
    window.dispatchEvent(new CustomEvent('hermes:rss-library:v1',{detail:{version:1,kind,owner,...extra,respond:result=>{if(settled)return;settled=true;clearTimeout(timer);result?.ok?resolve(result):reject(Error(result?.error||'Library request failed.'))}}}));
  });
}
function clock(value){const n=Math.max(0,Math.floor(Number(value)||0)),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=String(n%60).padStart(2,'0');return h?`${h}:${String(m).padStart(2,'0')}:${s}`:`${m}:${s}`}
function selectEpisodes(rows,{query='',from='',to='',state='all',order='newest',season=''}={}){
  const q=query.trim().toLocaleLowerCase(),start=from?new Date(from+'T00:00:00').getTime():null,end=to?new Date(to+'T23:59:59.999').getTime():null;
  return rows.filter(row=>{
    const date=Date.parse(row.published||''),p=row.progress;
    if(season&&row.season!==season)return false;
    if(q&&!`${row.title} ${row.feed}`.toLocaleLowerCase().includes(q))return false;
    if(start!==null&&(!Number.isFinite(date)||date<start)||end!==null&&(!Number.isFinite(date)||date>end))return false;
    return state==='all'||state==='unread'&&!row.isRead||state==='read'&&row.isRead||state==='played'&&p?.completed||state==='progress'&&!p?.completed&&p?.time>0||state==='unplayed'&&!p?.completed&&!(p?.time>0);
  }).sort((a,b)=>{const delta=(Date.parse(b.published)||0)-(Date.parse(a.published)||0);return (order==='oldest'?-delta:delta)||a.title.localeCompare(b.title)});
}
function useMacMusic(music) {
  const state=useValue(music.state)
  useQuery({queryKey:[ID,'native-music',JSON.stringify([host.state.connectionId?.get(),host.state.profile.get()])],queryFn:()=>music.refresh(),enabled:state.connected,refetchInterval:3000,staleTime:2000,retry:false,refetchOnWindowFocus:false})
  return state
}
function MacMusicView({player}) {
  const music=player.music,s=useMacMusic(music)
  const invoke=work=>{try{Promise.resolve(work()).catch(()=>{})}catch{}}
  const shown=[...new Map([...s.playlists,...s.selected].map(p=>[p.id,p])).values()]
  const own=s.owned&&s.now?.trackId===s.owned.trackId,selected=own&&s.selected.some(p=>p.id===s.owned.playlistId)
  return jsxs('div',{'aria-label':'Mac Music library',children:[
    jsx('p',{className:'hel-now-meta',children:'Connect to the Music app on this Mac. macOS may ask for Automation approval for Hermes or its helper; approve it yourself. Only selected playlists appear here. Selecting a playlist adds all of its songs here automatically. Nothing plays or downloads until you choose to play.'}),
    jsx('div',{className:'hel-actions',children:jsx('button',{type:'button',disabled:s.pending,onClick:()=>invoke(()=>music.connect()),children:s.pending?'Working…':s.connected?'Refresh playlists':'Connect Music'})}),
    s.error&&jsx('p',{className:'hel-error',role:'alert',children:s.error}),
    s.connected&&jsxs('div',{children:[
      jsxs('details',{open:true,children:[jsx('summary',{className:'hel-return',children:'Choose playlists'}),
        jsx('p',{className:'hel-now-meta',children:'No playlists are selected automatically. Unchecking removes only this Hermes selection, never songs or playlists in Music.'}),
        jsx('div',{className:'hel-list',children:shown.map(p=>jsxs('div',{className:'hel-episode',children:[
          jsxs('label',{style:{display:'flex',gap:8,alignItems:'start',overflowWrap:'anywhere'},children:[jsx('input',{type:'checkbox',checked:s.selected.some(v=>v.id===p.id),disabled:s.pending,onChange:e=>invoke(()=>music.select(p.id,e.target.checked))}),jsxs('span',{children:[p.name,jsx('small',{className:'hel-now-meta',style:{display:'block'},children:p.id})]})]}),
          s.selected.some(v=>v.id===p.id)&&jsx('div',{className:'hel-actions',children:jsx('button',{type:'button',disabled:s.pending,onClick:()=>invoke(()=>music.browse(p.id)),children:s.attached[p.id]?`Show ${s.attached[p.id].total} songs`:'Add songs'})})
        ]},p.id))}),
        s.nextPlaylist!==null&&jsx('button',{className:'hel-refresh',disabled:s.pending,onClick:()=>invoke(()=>music.morePlaylists()),children:'More playlists'}),
        jsx('div',{className:'hel-now-meta',children:`${s.playlists.length} of ${s.playlistTotal} playlists listed · ${s.selected.length} selected`})
      ]}),
      s.loading&&jsxs('div',{className:'hel-actions',children:[jsx('span',{role:'status',children:`Adding songs: ${s.loading.loaded}${s.loading.total===null?'':' of '+s.loading.total}`}),jsx('button',{type:'button',onClick:()=>music.cancelLoad(),children:'Cancel loading'})]}),
      s.tracks&&jsxs('section',{'aria-label':'Selected playlist tracks',children:[
        jsx('h3',{className:'hel-now-title',children:s.selected.find(p=>p.id===s.browsing)?.name}),
        jsx('div',{className:'hel-now-meta',children:s.tracks.complete?`${s.tracks.total} songs attached`:`${s.tracks.rows.length} of ${s.tracks.total} songs loaded — incomplete`}),
        jsx('div',{className:'hel-list',children:s.tracks.rows.length?s.tracks.rows.map(row=>jsxs('article',{className:'hel-episode',children:[jsx('h3',{children:row.name}),jsxs('div',{className:'hel-actions',children:[jsx('span',{children:`${row.artist} · ${clock(row.duration)}`}),jsx('button',{className:'hel-play',type:'button','aria-label':'Play '+row.name,disabled:s.pending,onClick:()=>invoke(()=>music.play(row)),children:'Play in Music'})]})]},row.id+':'+row.index)):jsx('p',{className:'hel-empty',children:'This playlist has no available tracks.'})}),
        jsx('button',{className:'hel-refresh',disabled:s.pending,onClick:()=>invoke(()=>music.browse(s.browsing,true)),children:'Refresh songs'})
      ]}),
      s.now&&jsxs('section',{className:'hel-now','aria-label':'Music playback',children:[
        jsx('div',{className:'hel-now-title',children:s.now.title||'Music is stopped'}),
        jsx('div',{className:'hel-now-meta',role:'status',children:`${s.now.artist} · ${s.now.state} · ${clock(s.now.time)} / ${clock(s.now.duration)}`}),
        jsx('p',{className:'hel-now-meta',children:'Native Music audio; no waveform or amplitude data is available. Each chosen track plays once; Next/Previous stay within the selected playlist.'}),
        !own&&s.now.trackId&&jsx('p',{className:'hel-now-meta',children:'Music changed outside Hermes. Choose a listed track to control playback here.'}),
        own&&jsxs('div',{children:[
          jsx('input',{type:'range',min:0,max:s.now.duration||0,step:1,value:Math.min(s.now.time,s.now.duration),disabled:s.pending||!selected,'aria-label':'Seek Music track',style:{width:'100%'},onChange:e=>invoke(()=>music.control('seek',Number(e.target.value)))}),
          jsxs('div',{className:'hel-actions',children:[
            jsx('button',{disabled:s.pending||!selected,onClick:()=>invoke(()=>music.control('previous')),children:'Previous track'}),
            jsx('button',{disabled:s.pending||!selected,onClick:()=>invoke(()=>music.control(s.now.state==='playing'?'pause':'resume')),children:s.now.state==='playing'?'Pause Music':'Resume Music'}),
            jsx('button',{disabled:s.pending||!selected,onClick:()=>invoke(()=>music.control('next')),children:'Next track'}),
            jsxs('label',{children:['Music volume ',jsx('input',{type:'range',min:0,max:100,step:1,value:s.now.volume,disabled:s.pending||!selected,'aria-label':'Music volume',onChange:e=>invoke(()=>music.control('volume',Number(e.target.value)))})]})
          ]})
        ]})
      ]})
    ]})
  ]})
}
function EpisodeLibrary({player,ctx}){
  const profile=useValue(host.state.profile),connection=useValue(host.state.connectionId),owner=JSON.stringify([connection||'local',profile]);
  return jsx(EpisodeLibraryOwner,{player,ctx,owner},owner);
}
function EpisodeLibraryOwner({player,ctx,owner}){
  const [query,setQuery]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[state,setState]=useState('all'),[orders,setOrders]=useState({}),[season,setSeason]=useState(''),[datesOpen,setDatesOpen]=useState(false),[tab,setTab]=useState('stations'),[selectedFeed,setSelectedFeed]=useState(null),[pending,setPending]=useState(null),[error,setError]=useState('');
  const active=useValue(player.episode),position=useValue(player.position),status=useValue(player.status),mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[]);
  const current=()=>mounted.current&&owner===JSON.stringify([host.state.connectionId.get()||'local',host.state.profile.get()]);
  const list=useQuery({queryKey:['pm-radio-podcasts','library',owner],queryFn:()=>libraryRequest('list',owner),staleTime:0,retry:false,refetchOnWindowFocus:false});
  const rows=(list.data?.episodes||[]).map(row=>active?.id===row.id?{...row,progress:{...row.progress,time:position.time,duration:position.duration,completed:status==='ended'}}:row);
  const stations=[...new Map(rows.map(row=>[row.feedId,{id:row.feedId,title:row.feed||'Podcast'}])).values()].map(feed=>({...feed,count:rows.filter(row=>row.feedId===feed.id).length,unread:rows.filter(row=>row.feedId===feed.id&&!row.isRead).length}));
  const scoped=rows.filter(row=>!selectedFeed||row.feedId===selectedFeed),singleFeed=selectedFeed||(stations.length===1?stations[0].id:null);
  const sortKey=singleFeed||'__all__',showTitle=stations.find(s=>s.id===singleFeed)?.title||'';
  const order=orders[sortKey]||(/^stone choir$/i.test(showTitle.trim())?'oldest':'newest');
  const seasons=[...new Set(scoped.map(row=>row.season).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  const visible=selectEpisodes(scoped,{query,from,to,state,order,season});
  useEffect(()=>{const refresh=e=>{if(e.detail?.owner===owner)void list.refetch?.()};window.addEventListener('hermes-rss-library-changed',refresh);return()=>window.removeEventListener('hermes-rss-library-changed',refresh)},[owner,list.refetch]);
  const perform=async(row,kind)=>{
    if(pending)return;setPending(row.id);setError('');
    try{if(kind==='mark'&&active?.id===row.id)player.stop();await libraryRequest(kind,owner,{id:row.id,read:!row.isRead,completed:!row.progress?.completed,restart:!!row.progress?.completed||active?.id===row.id});if(current())await list.refetch()}catch(e){if(current())setError(e.message)}finally{if(current())setPending(null)}
  };
  return jsxs('section',{className:'hermes-episode-library','aria-label':'Audio library',children:[
    jsxs('header',{className:'hel-heading',children:[jsx('h2',{children:singleFeed&&tab==='episodes'?stations.find(s=>s.id===singleFeed)?.title||'Episodes':'Your library'}),jsx('span',{children:tab==='episodes'?`${visible.length} episodes`:'Radio & podcasts'})]}),
    jsxs('div',{className:'hel-tabs',role:'tablist','aria-label':'Library source',children:['stations','episodes','music'].map(value=>jsx('button',{type:'button',role:'tab','aria-selected':tab===value,onClick:()=>{if(value!==tab){setSelectedFeed(null);setSeason('')}setTab(value)},children:value==='episodes'?(selectedFeed?'Episodes':'All episodes'):value==='music'?'Music':'Stations'},value))}),
    tab==='music'?jsx(MacMusicView,{player}):tab==='stations'?jsxs('div',{children:[jsx(Stations,{player,podcasts:stations,onPodcast:feed=>{setSelectedFeed(feed.id);setTab('episodes');setQuery('');setSeason('')}}),jsx(Transport,{player,ctx})]}):jsxs('div',{children:[
      jsx('input',{className:'hel-search',type:'search',placeholder:'Search episodes or shows','aria-label':'Search episodes',value:query,onChange:e=>setQuery(e.target.value)}),
      seasons.length>0&&jsx('div',{className:'hel-collections','aria-label':'Published seasons',children:[jsx('button',{type:'button','aria-pressed':!season,onClick:()=>setSeason(''),children:'All seasons'}),...seasons.map(value=>jsxs('button',{type:'button','aria-pressed':season===value,onClick:()=>setSeason(value),children:[`Season ${value}`,jsx('span',{children:scoped.filter(row=>row.season===value).length})]},value))]}),
      jsxs('div',{className:'hel-tools',children:[
        jsx('select',{'aria-label':'Listening status',value:state,onChange:e=>setState(e.target.value),children:[['all','All episodes'],['unread','Unread'],['read','Read'],['progress','In progress'],['unplayed','Unplayed'],['played','Played / watched']].map(([value,label])=>jsx('option',{value,children:label},value))}),
        jsx('select',{'aria-label':'Episode order',value:order,onChange:e=>setOrders(current=>({...current,[sortKey]:e.target.value})),children:[jsx('option',{value:'newest',children:'Newest first'}),jsx('option',{value:'oldest',children:'Oldest first'})]}),
        jsx('button',{type:'button',className:'hel-dates','aria-expanded':datesOpen,onClick:()=>setDatesOpen(!datesOpen),children:from||to?'Dates applied':'Dates'})
      ]}),
      datesOpen&&jsxs('div',{className:'hel-filters',children:[
        jsxs('label',{children:['From',jsx('input',{type:'date','aria-label':'From date',value:from,onChange:e=>setFrom(e.target.value)})]}),
        jsxs('label',{children:['To',jsx('input',{type:'date','aria-label':'To date',value:to,min:from||undefined,onChange:e=>setTo(e.target.value)})]})
      ]}),
      (query||from||to||season||state!=='all')&&jsx('button',{className:'hel-reset',onClick:()=>{setQuery('');setFrom('');setTo('');setState('all');setSeason('')},children:'Clear filters'}),
      (error||list.isError)&&jsx('p',{className:'hel-error',role:'alert',children:error||'Episode library unavailable. Enable RSS Reader and retry.'}),
      list.isLoading&&jsx('p',{className:'hel-empty',children:'Loading your episodes…'}),
      jsx('div',{className:'hel-list',children:visible.length?visible.map(row=>{
        const p=row.progress||{},duration=p.duration||row.duration||0,played=p.completed,label=played?(row.video?'Watched':'Played'):p.time>0?`${clock(p.time)}${duration?' / '+clock(duration):''}`:duration?clock(duration):'Not played';
        return jsxs('article',{className:'hel-episode','data-current':active?.id===row.id,children:[
          jsxs('div',{className:'hel-meta',children:[jsx('span',{children:[singleFeed?'':row.feed,row.episodeNumber?'Episode '+row.episodeNumber:'',row.published?new Date(row.published).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Date unavailable'].filter(Boolean).join(' · ')}),jsx('button',{type:'button',className:'hel-read','data-unread':!row.isRead,disabled:!!pending,'aria-label':(row.isRead?'Mark unread: ':'Mark read: ')+row.title,onClick:()=>perform(row,'read'),children:row.isRead?'Read':'● Unread'})]}),
          jsx('h3',{children:row.title}),
          jsxs('div',{className:'hel-actions',children:[jsx('span',{children:label}),jsx('button',{type:'button',className:'hel-play',disabled:!!pending,onClick:()=>perform(row,'play'),children:pending===row.id?'Preparing…':active?.id===row.id?'Restart':played?'Replay':p.time>0?'Resume':row.downloaded?'Play':'Download & play'}),jsxs('details',{className:'hel-more',children:[jsx('summary',{'aria-label':'Actions for '+row.title,children:'⋯'}),jsx('button',{type:'button',className:'hel-mark',disabled:!!pending,onClick:()=>perform(row,'mark'),children:played?'Mark unplayed':'Mark played'})]})]}),
          duration>0&&p.time>0&&jsx('progress',{value:p.time,max:duration,'aria-label':'Episode progress'})
        ]},row.id)
      }):!list.isLoading&&jsx('p',{className:'hel-empty',children:'No episodes match. Clear the filters or refresh your podcast feed in RSS Reader.'})}),
      jsx('button',{className:'hel-refresh',type:'button',onClick:()=>list.refetch(),children:'Refresh library'})
    ]}),
    active&&jsx(EpisodePanel,{player,ctx}),
    tab!=='music'&&player.music.state.get().error&&jsx('p',{className:'hel-error',role:'alert',children:player.music.state.get().error})
  ]});
}
function CompactProgress({player}){
  const episode=useValue(player.episode),position=useValue(player.position);
  if(!episode)return jsx('div',{className:'hermes-radio-progress',children:jsx('span',{children:'Live radio'})});
  return jsxs('div',{className:'hermes-radio-progress',children:[jsx('input',{type:'range',min:0,max:position.duration||0,step:.1,value:position.time,disabled:!position.duration,'aria-label':'Seek current episode',onChange:e=>player.seek(Number(e.target.value))}),jsxs('div',{children:[jsx('span',{children:clock(position.time)}),jsx('span',{children:clock(position.duration)})]})]});
}

function EpisodePanel({ player, ctx }) {
  const episode = useValue(player.episode)
  const position = useValue(player.position)
  const status = useValue(player.status)
  const volume = useValue(player.volume)
  const video = useRef(null)
  useEffect(() => player.mountVideo(video.current), [player, episode])
  const stamp = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`
  if (!episode) return null
  return jsxs('section', { className:'hel-now', 'aria-label': 'Podcast playback', children: [
    jsx('div', {className:'hel-now-title', children: episode.title }),
    jsx('div', { ref: video }),
    jsx('div', {className:'hel-now-meta', role: 'status', children: status === 'error' ? 'Episode playback failed. Retry or open the source.' : `${status} · ${stamp(position.time)} / ${stamp(position.duration)}` }),
    jsx('input', { type: 'range', min: 0, max: position.duration || 0, step: .1, value: position.time, disabled: !position.duration, 'aria-label': 'Seek episode', style: { width: '100%' }, onChange: e => player.seek(Number(e.target.value)) }),
    jsxs('div', { className: 'hermes-radio-volume', children: [
      jsx(SmallAction, { label: status === 'playing' ? 'Pause episode' : 'Resume episode', icon: status === 'playing' ? icons.Pause : icons.Play, onClick: player.toggle }),
      jsx('input', { type: 'range', min: 0, max: 100, value: volume, 'aria-label': 'Episode volume', onChange: e => player.setVolume(Number(e.target.value)) }),
      episode.source && jsx('a', { href: episode.source, target: '_blank', rel: 'noopener noreferrer', onClick: e => { e.preventDefault(); void ctx.os.openExternal(episode.source) }, children: 'Source ↗' })
    ] }),
    jsx('button', { type: 'button',className:'hel-return', onClick: () => player.stop(), children: 'Return to radio' })
  ] })
}
function RadioBar({ player, ctx }) {
  const t = usePluginI18n(ID)
  const station = useValue(player.station)
  const episode = useValue(player.episode)
  const status = useValue(player.status)
  const open = useValue(player.open)
  const music = useMacMusic(player.music)
  const triggerRef = useRef(null)
  const [browseWidth, setBrowseWidth] = useState(null)
  const active = status === 'live' || status === 'playing' || status === 'connecting'
  const native = music.connected && !active && music.owned && music.now?.trackId === music.owned.trackId
  // Fit the name at rest. Freeze only while browsing so a selection cannot
  // move the open picker; there is no permanent empty label slot.
  const onOpenChange = value => {
    if (value) setBrowseWidth(triggerRef.current.getBoundingClientRect().width)
    player.open.set(value)
  }
  return jsxs('div', { className: 'hermes-radio-bar', 'data-tour': 'radio-player', 'data-radio-status': status, children: [
    native ? jsx('span', { className: 'hel-now-meta hermes-radio-native-indicator', children: 'Music' }) : jsx(Waveform, { player, compact: true }),
    jsxs(Popover, { open, onOpenChange, children: [
      jsx(PopoverTrigger, { asChild: true, children: jsx(Button, {
        ref: triggerRef, variant: 'ghost', size: 'micro', style: { width: open ? browseWidth : undefined },
        'aria-label': native ? `Music: ${music.now.title}` : episode ? `Podcast: ${episode.title}` : `${t('browse')}: ${station.name}`,
        children: jsx('span', { className: 'radio-name', children: native ? music.now.title : episode?.title || station.name })
      }) }),
      jsx(PopoverContent, { side: 'top', align: 'end', className: 'hermes-radio-panel', 'aria-label': t('radio'), 'data-tour': 'radio-panel', children:
        jsx(EpisodeLibrary, {player,ctx})
      })
    ] }),
    native ? jsx(SmallAction, { label: music.now.state === 'playing' ? 'Pause Music' : 'Resume Music', icon: music.now.state === 'playing' ? icons.Pause : icons.Play, busy: music.pending, onClick: () => { void player.music.control(music.now.state === 'playing' ? 'pause' : 'resume').catch(()=>{}) } }) : jsx(SmallAction, { label: episode ? active ? 'Pause episode' : 'Resume episode' : t(active ? 'pause' : 'play'), icon: active ? icons.Pause : icons.Play, busy: status === 'connecting', onClick: player.toggle }),
    !native && !episode && jsx(SmallAction, { label: t('next'), icon: NextArrow, onClick: player.next }),
    native ? jsx('span', { className: 'hel-now-meta hermes-radio-progress', children: clock(music.now.time) }) : jsx(CompactProgress,{player})
  ] })
}

export { artistProfile, resolveArtist, trackCredit }

export default {
  id: ID,
  name: 'Radio + Podcasts',
  description: 'Single radio and RSS episode player. Disable bundled Radio before enabling; preserves its saved favorites and station.',
  defaultEnabled: false,
  register(ctx) {
    ctx.i18n.register(LOCALES)
    if(!host.pluginDecisions?.get||!host.pluginDecisions?.listen){host.notify?.({kind:'error',message:'Radio + Podcasts requires desktop plugin-decision support.'});return}
    // Copy only known public radio preferences; leave the original untouched.
    if(!ctx.storage.get('migration.radio.v1',false)){
      for(const key of ['local.station','local.favorites','local.volume']){
        if(ctx.storage.get(key,null)!==null)continue
        try{const raw=window.localStorage.getItem('hermes.plugin.radio.'+key);if(raw!==null)ctx.storage.set(key,JSON.parse(raw))}catch{}
      }
      ctx.storage.set('migration.radio.v1',true)
    }
    let cleanup=null,disposed=false
    const sync=()=>{
      const allowed=!disposed&&host.pluginDecisions.get().radio===false
      if(!allowed){cleanup?.();cleanup=null;return}
      if(cleanup)return
      const stops=[]
      const local={...ctx,onDispose:fn=>stops.push(fn),addEventListener:(...args)=>{const stop=ctx.addEventListener(...args);stops.push(stop);return stop}}
      const style=document.createElement('style');style.textContent=CSS;document.head.append(style);stops.push(()=>style.remove())
      const player=createPlayer(local)
      stops.push(ctx.register({id:'player',area:STATUSBAR_AREAS.right,order:10,render:()=>jsx(RadioBar,{player,ctx:local})}))
      cleanup=()=>{for(const stop of stops.reverse())if(typeof stop==='function')stop()}
    }
    const unlisten=host.pluginDecisions.listen(sync)
    ctx.onDispose(()=>{disposed=true;unlisten();cleanup?.();cleanup=null})
    sync()
    if(!cleanup)host.notify?.({kind:'info',message:'Disable the bundled Radio plugin to activate Radio + Podcasts. Your original radio preferences are retained.'})
  }
}
