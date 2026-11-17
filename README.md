# استلام الخام — العلا

Static site on Render (alola-receiving.onrender.com). Login via alola-maggi-auth (app id `receiving`) — `auth-gate.js` unchanged.

v2.0.1: official Alola letterhead (header + footer) on the A4 report PDF / print view.

v2.0.0: step-by-step wizard (7 steps), instant autosave (IndexedDB `rcv_data` + localStorage mirror of the open draft),
photos resized to 1280px JPEG and stored as Blobs in IndexedDB `rcv_photos` (auto-reconnect for iOS Safari),
per-truck report on screen + A4 PDF (canvas-rendered, share via navigator.share / download / WhatsApp text).
Legacy `rcv_v1` (settings + old history) is read and migrated once, never deleted. Calculations/thresholds unchanged.
Data stays on the device only.
