// background worker, tracks active tab time per site per day

const sessionKey = "tt_session"; // { domain, startTs, active }
const dataKey = "tt_data";       // { "YYYY-MM-DD": { domain: seconds } }

// date as YYYY-MM-DD
function todayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// clean domain, or null if it's not a real site
function domainFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return null; // skip chrome://, file:, etc
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function getSession() {
  const r = await chrome.storage.local.get(sessionKey);
  return r[sessionKey] || null;
}

async function setSession(session) {
  await chrome.storage.local.set({ [sessionKey]: session });
}

// add seconds to a domain on the day startTs falls in
async function commitSeconds(domain, seconds, startTs) {
  if (!domain || seconds <= 0) return;
  const key = todayKey(startTs);
  const r = await chrome.storage.local.get(dataKey);
  const data = r[dataKey] || {};
  if (!data[key]) data[key] = {};
  data[key][domain] = (data[key][domain] || 0) + seconds;
  await chrome.storage.local.set({ [dataKey]: data });
}

// flush time on the current session then start a fresh one
async function flushAndStart(nextDomain, active) {
  const now = Date.now();
  const session = await getSession();
  if (session && session.active && session.domain) {
    const elapsed = Math.round((now - session.startTs) / 1000);
    if (elapsed > 0) await commitSeconds(session.domain, elapsed, session.startTs);
  }
  await setSession({ domain: nextDomain || null, startTs: now, active: !!active && !!nextDomain });
}

// domain of the focused window's active tab
async function getActiveDomain() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  if (!tab) return null;
  return domainFromUrl(tab.url);
}

async function refresh() {
  const domain = await getActiveDomain();
  await flushAndStart(domain, !!domain);
}

// events

function boot() {
  chrome.alarms.create("tt_flush", { periodInMinutes: 1 });
  refresh();
}

chrome.runtime.onInstalled.addListener(boot);
chrome.runtime.onStartup.addListener(boot);

chrome.tabs.onActivated.addListener(() => refresh());

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) refresh();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "tt_flush") refresh();
});
