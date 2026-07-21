// popup dashboard

const dataKey = "tt_data";
const limitsKey = "tt_limits";

let offset = 0; // 0 = today, -1 = yesterday

function dayKeyForOffset(off) {
  const d = new Date();
  d.setDate(d.getDate() + off);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// seconds -> "1h 6m" / "29m" / "12s"
function fmt(seconds) {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function labelForOffset(off) {
  if (off === 0) return "Today";
  if (off === -1) return "Yesterday";
  return dayKeyForOffset(off).slice(5); // mm-dd
}

// favicon via google s2, no extra permission needed
function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

async function load() {
  const store = await chrome.storage.local.get([dataKey, limitsKey]);
  const data = store[dataKey] || {};
  const limits = store[limitsKey] || {};
  const key = dayKeyForOffset(offset);
  const day = data[key] || {};

  const entries = Object.entries(day).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, sec]) => acc + sec, 0);
  const max = entries.length ? entries[0][1] : 0;

  document.getElementById("dayLabel").textContent = labelForOffset(offset);
  document.getElementById("total").textContent = fmt(total);
  document.getElementById("nextDay").disabled = offset >= 0;

  const list = document.getElementById("list");
  const empty = document.getElementById("empty");
  list.innerHTML = "";

  if (!entries.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  for (const [domain, sec] of entries) {
    const limitMin = limits[domain];
    const over = limitMin && sec >= limitMin * 60;

    const li = document.createElement("li");
    li.className = "site";
    li.title = "Click to set a daily limit";

    const top = document.createElement("div");
    top.className = "site-top";

    const nameWrap = document.createElement("div");
    nameWrap.className = "site-name";
    const img = document.createElement("img");
    img.className = "favicon";
    img.src = faviconUrl(domain);
    img.onerror = () => { img.style.visibility = "hidden"; };
    const nameSpan = document.createElement("span");
    nameSpan.textContent = domain;
    nameWrap.appendChild(img);
    nameWrap.appendChild(nameSpan);
    if (limitMin) {
      const tag = document.createElement("span");
      tag.className = "limit-tag";
      tag.textContent = `limit ${limitMin}m`;
      nameWrap.appendChild(tag);
    }

    const time = document.createElement("span");
    time.className = "site-time";
    time.textContent = fmt(sec);

    top.appendChild(nameWrap);
    top.appendChild(time);

    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("div");
    fill.className = "bar-fill" + (over ? " over" : "");
    fill.style.width = (max ? Math.max(3, (sec / max) * 100) : 0) + "%";
    bar.appendChild(fill);

    li.appendChild(top);
    li.appendChild(bar);
    li.addEventListener("click", () => setLimit(domain, limitMin));
    list.appendChild(li);
  }
}

async function setLimit(domain, current) {
  const input = prompt(
    `Daily limit for ${domain} (minutes).\nLeave blank or 0 to remove.`,
    current || ""
  );
  if (input === null) return;
  const store = await chrome.storage.local.get(limitsKey);
  const limits = store[limitsKey] || {};
  const val = parseInt(input, 10);
  if (!val || val <= 0) delete limits[domain];
  else limits[domain] = val;
  await chrome.storage.local.set({ [limitsKey]: limits });
  load();
}

async function clearDay() {
  if (!confirm("Clear tracked time for this day?")) return;
  const store = await chrome.storage.local.get(dataKey);
  const data = store[dataKey] || {};
  delete data[dayKeyForOffset(offset)];
  await chrome.storage.local.set({ [dataKey]: data });
  load();
}

document.getElementById("prevDay").addEventListener("click", () => { offset--; load(); });
document.getElementById("nextDay").addEventListener("click", () => { if (offset < 0) { offset++; load(); } });
document.getElementById("clearBtn").addEventListener("click", clearDay);

// clear the "!" badge when the dashboard opens
chrome.action.setBadgeText({ text: "" });

load();
