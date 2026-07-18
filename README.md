# Tab Time

Tab Time tracks how much time you spend on each website. Think of the screen time
tracker on your phone, except it's pointed at your browser tabs instead of your
apps.

It really started from one slightly uncomfortable question: where does the day
actually go? For me the answer was three or four sites, over and over.

## What it does

Open the popup and you get the day at a glance. Total time sits up top, then every
site you've visited, ranked from worst to least, each with a little bar so the big
offenders jump out. Want to check yesterday, or last Tuesday? The ‹ and › arrows
walk you back through earlier days.

If a site is eating too much of your time, put a limit on it. Click it in the
popup for a quick one, or open the manage limits page when you want the whole list
with a last-7-days column beside each site. Go over and a small red ! shows up on
the toolbar icon. It won't slam the door on you or anything, it's just a nudge.

Two things it tries to be careful about. It only counts the tab you're actually
looking at, and it stops the clock when you go idle (after about 60 seconds) or
click away to another app, so the numbers reflect real attention and not the
fifteen tabs you opened and forgot. And nothing leaves your machine. It all lives
in chrome.storage.local. No account, no sync, no server quietly reading your
history.

## Install

1. Open chrome://extensions (or edge://extensions).
2. Turn on developer mode, top right.
3. Click load unpacked and pick this TabTime folder.
4. Pin the icon, then click it to open the dashboard.

## How it works

Everything runs out of background.js, a service worker that watches for tab
switches, window focus changes, and the browser going idle. Each time one of those
fires, it banks the time you spent on the last site and starts the clock on the
new one. There's also an alarm that ticks once a minute to save partial time, and
that part matters more than it sounds. Manifest V3 likes to put service workers to
sleep when they go quiet, and without that periodic save you'd lose whatever time
hadn't been written down yet.

## Files

- manifest.json - the MV3 manifest
- background.js - the tracking service worker
- popup.html / popup.css / popup.js - the dashboard
- options.html / options.css / options.js - the limits and settings page
- icons/ - toolbar icons
