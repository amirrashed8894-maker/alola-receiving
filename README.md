# استلام الخام — العلا

Static site on Render (alola-receiving.onrender.com). Login via alola-maggi-auth (app id `receiving`) — `auth-gate.js` unchanged.

v2.1.1: برتقال بلدي is again selectable on new trucks (same packs/sizes as other orange). Size 125 in orange 14/15 kg and jumbo stays selectable with diameter/weight, but is not counted as export (export stops at 113, as before). Legacy records (no pack) and all other calculations unchanged.

v2.1.0: sizes by variety → pack from shared `sizes.js` (same file in alola-production / alola-quality). New trucks pick الصنف first, then العبوة; only that pack's sizes show (+ «أكبر من»/«أصغر من» buckets). Diameter (Egypt orange/lemon count table) and approx fruit weight shown in light text on screen, report and PDF; 7 kg cartons and mandarin marked ≈ (count × 15 ÷ pack kg → nearest row). Legacy records (no pack) keep OR_SIZES + orExp unchanged. Variety/pack change warns; counts are kept, never deleted.

v2.0.1: official Alola letterhead (header + footer) on the A4 report PDF / print view.

v2.0.0: step-by-step wizard (7 steps), instant autosave (IndexedDB `rcv_data` + localStorage mirror of the open draft),
photos resized to 1280px JPEG and stored as Blobs in IndexedDB `rcv_photos` (auto-reconnect for iOS Safari),
per-truck report on screen + A4 PDF (canvas-rendered, share via navigator.share / download / WhatsApp text).
Legacy `rcv_v1` (settings + old history) is read and migrated once, never deleted. Calculations/thresholds unchanged.
Data stays on the device only.
