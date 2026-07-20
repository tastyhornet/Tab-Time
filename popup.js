// popup dashboard

const dataKey = "tt_data";

function todayKey() {
  const d = new Date();
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

// favicon via google s2, no extra permission needed
function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

async function load() {
  const store = await chrome.storage.local.get(dataKey);
  const data = store[dataKey] || {};
  const day = data[todayKey()] || {};

  const entries = Object.entries(day).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, sec]) => acc + sec, 0);
  const max = entries.length ? entries[0][1] : 0;

  document.getElementById("total").textContent = fmt(total);

  const list = document.getElementById("list");
  const empty = document.getElementById("empty");
  list.innerHTML = "";

  if (!entries.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  for (const [domain, sec] of entries) {
    const li = document.createElement("li");
    li.className = "site";

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

    const time = document.createElement("span");
    time.className = "site-time";
    time.textContent = fmt(sec);

    top.appendChild(nameWrap);
    top.appendChild(time);

    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = (max ? Math.max(3, (sec / max) * 100) : 0) + "%";
    bar.appendChild(fill);

    li.appendChild(top);
    li.appendChild(bar);
    list.appendChild(li);
  }
}

load();
