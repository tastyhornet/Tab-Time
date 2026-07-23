// limits + settings page

const dataKey = "tt_data";
const limitsKey = "tt_limits";

// seconds -> "1h 6m" / "29m" / "0m"
function fmt(seconds) {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function dayKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

// add up the last 7 days, per domain
function weekTotals(data) {
  const out = {};
  const now = Date.now();
  for (let i = 0; i < 7; i++) {
    const day = data[dayKey(now - i * 86400000)] || {};
    for (const [domain, sec] of Object.entries(day)) {
      out[domain] = (out[domain] || 0) + sec;
    }
  }
  return out;
}

async function getLimits() {
  const store = await chrome.storage.local.get(limitsKey);
  return store[limitsKey] || {};
}

async function saveLimit(domain, minutes) {
  const limits = await getLimits();
  if (!minutes || minutes <= 0) delete limits[domain];
  else limits[domain] = minutes;
  await chrome.storage.local.set({ [limitsKey]: limits });
}

async function load() {
  const store = await chrome.storage.local.get([dataKey, limitsKey]);
  const data = store[dataKey] || {};
  const limits = store[limitsKey] || {};
  const week = weekTotals(data);

  // show every site we've seen this week, plus any with a limit set
  const domains = new Set([...Object.keys(week), ...Object.keys(limits)]);
  const sorted = [...domains].sort((a, b) => (week[b] || 0) - (week[a] || 0));

  const rows = document.getElementById("rows");
  const empty = document.getElementById("empty");
  rows.innerHTML = "";

  if (!sorted.length) {
    empty.hidden = false;
    document.getElementById("weekNote").textContent = "";
    return;
  }
  empty.hidden = true;
  document.getElementById("weekNote").textContent = `${sorted.length} sites this week`;

  for (const domain of sorted) {
    const tr = document.createElement("tr");

    const siteTd = document.createElement("td");
    const cell = document.createElement("div");
    cell.className = "site-cell";
    const img = document.createElement("img");
    img.src = faviconUrl(domain);
    img.onerror = () => { img.style.visibility = "hidden"; };
    const name = document.createElement("span");
    name.textContent = domain;
    cell.appendChild(img);
    cell.appendChild(name);
    siteTd.appendChild(cell);

    const weekTd = document.createElement("td");
    weekTd.textContent = fmt(week[domain] || 0);

    const limitTd = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.className = "limit-input";
    input.placeholder = "—";
    if (limits[domain]) input.value = limits[domain];
    input.addEventListener("change", async () => {
      await saveLimit(domain, parseInt(input.value, 10));
    });
    limitTd.appendChild(input);

    const rmTd = document.createElement("td");
    const rm = document.createElement("button");
    rm.className = "remove";
    rm.textContent = "remove";
    rm.addEventListener("click", async () => {
      await saveLimit(domain, 0);
      load();
    });
    rmTd.appendChild(rm);

    tr.appendChild(siteTd);
    tr.appendChild(weekTd);
    tr.appendChild(limitTd);
    tr.appendChild(rmTd);
    rows.appendChild(tr);
  }
}

async function addLimit() {
  const siteEl = document.getElementById("newSite");
  const limitEl = document.getElementById("newLimit");
  let site = siteEl.value.trim().toLowerCase();
  const mins = parseInt(limitEl.value, 10);
  if (!site || !mins || mins <= 0) return;
  // strip protocol / www / paths if someone pastes a full url
  site = site.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  await saveLimit(site, mins);
  siteEl.value = "";
  limitEl.value = "";
  load();
}

document.getElementById("addBtn").addEventListener("click", addLimit);

load();
