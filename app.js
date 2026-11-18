'use strict';
/* استلام الخام — العلا · v2.1.1 (مقاسات حسب الصنف والعبوة من sizes.js المشترك؛ 125 برتقال خارج التصدير؛ البلدي رجع)
   كل البيانات على الجهاز ده بس: سجلات العربيات في IndexedDB (rcv_data) + نسخة فورية للمسودة المفتوحة في localStorage،
   والصور في IndexedDB (rcv_photos). السجل القديم rcv_v1 لا يُمسح أبدًا (الإعدادات لسه فيه). */
const APP_VER='2.1.1';
const KEY='rcv_v1',MIG='rcv_mig2',OPEN='rcv_open2',LIVE='rcv_live2',FB='rcv_fb2';
const OR_SIZES=['أكبر من 36','36','40','48','56','64','72','80','88','100','113','أصغر من 113'];
const VAR=[['navel','برتقال أبوسرة'],['valencia','برتقال صيفي (فالنسيا)'],['baladi','برتقال بلدي'],['lemon','ليمون'],['mclem','أفندي كلمنتينا'],['mfrem','أفندي فريمونت'],['murk','موركوت كيني'],['murs','موركوت إسباني']];
const VAR_LEGACY=[]; // البلدي رجع اختيار للعربات الجديدة (نفس مقاسات البرتقال)
/* الصنف ← مجموعة جدول المقاسات (sizes.js) */
const VGRP={navel:'orange',valencia:'orange',baladi:'orange',lemon:'lemon',mclem:'mand',mfrem:'mand',murk:'mand',murs:'mand'};
const grpOf=v=>VGRP[v]||'';
const packOfRec=rec=>{const g=grpOf(rec.h.variety),p=window.ALS&&ALS.PK[rec.h.pack];return p&&p.g===g?p:null};
const packLbl=rec=>{const p=packOfRec(rec);return p?p.label:''};
const DEFS=[ // id,name,class(d = مسبب عفن, M تشوه رئيسي, m تشوه ثانوي),only
['navrot','عفن السرة','d','navel'],['oleo','البقع الزيتية','d'],['plug','القطف الغائر (نتشة)','d'],['bruise','الكدمات','d'],['cut','الجروح','d'],['fly','ذبابة الفاكهة','d'],['soft','الليونة','d'],['tabh','التبحير','d'],['split','تشققات','d'],['sun','لسعة شمس شديدة','d'],['deep','خدش عميق','d'],['wet','ثمار مبللة','d'],['ocause','مسببات أخرى','d'],
['wind','خدوش ريح','m'],['mite','حلم صدأي / تربس','m'],['scale','حشرة قشرية','m'],['sunl','لسعة شمس خفيفة','m'],['green2','اخضرار لون','m'],['shape','تشوه شكل','M'],['crease','تجعد القشرة (Creasing)','M'],['bignav','سرة كبيرة','M','navel'],['puff','انتفاخ القشرة (Puffiness)','M','mur'],['other','تشوهات أخرى','m']];
const CLS={d:'مسببات الأعفان (معرض للعفن)',M:'تشوهات رئيسية (محلي/عصير)',m:'عيوب ثانوية (تتحسب تصدير)'};
const DSET={bands:'60,80,100,120,140,160,180,200,220,250',murMin:80,murMax:250,orExp:'36,40,48,56,64,72,80,88,100,113',decOk:3,decMax:8,expOk:75,expMin:50,decMult:1.5,defTol:10,defMult:0.5,sample:200};
const CF=[['cover','الغطاء',['متغطية','مكشوفة جزئيًا','مكشوفة']],['clean','نظافة العربية',['نظيفة','مقبولة','وسخة']],['temp','حرارة الثمار',['طبيعية','دافية','سخنة']],['cratec','حالة الصناديق',['سليمة','بعض الكسر/زيادة تعبئة','سيئة']],['odor','الريحة',['طبيعية','ريحة خفيفة','ريحة تخمر']],['wet','بلل الثمار',['ناشفة','بلل خفيف','مبلولة']]];
const SETF=[['bands','حدود شرائح وزن الموركوت (جم)','text'],['murMin','أقل وزن موركوت للتصدير (جم)'],['murMax','أكبر وزن موركوت للتصدير (جم)'],['orExp','أحجام البرتقال للتصدير','text'],['decOk','مسببات أعفان مقبولة بدون خصم ≤ %'],['decMax','أقصى مسببات للقبول بخصم ≤ %'],['expOk','نسبة تصدير للقبول ≥ %'],['expMin','أقل نسبة تصدير قبل الرفض %'],['decMult','معامل خصم المسببات (× الزيادة)'],['defTol','تشوهات رئيسية مسموحة %'],['defMult','معامل خصم العيوب الزايدة'],['sample','ثمار العينة المستهدفة']];

const $=s=>document.querySelector(s);
const n=v=>+v||0, f1=v=>(Math.round(v*10)/10).toLocaleString('en'), f0=v=>Math.round(v).toLocaleString('en'), pc=v=>f1(v)+'%';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const VN=Object.fromEntries(VAR), DN=Object.fromEntries(DEFS.map(d=>[d[0],d[1]]));DN.truck='صور العربية';
function toast(t,ms){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(toast._t);toast._t=setTimeout(()=>e.style.display='none',ms||2200)}
function cairoParts(d){return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(d||new Date()).map(x=>[x.type,x.value]))}
function cairoNowLocal(){const p=cairoParts();return `${p.year}-${p.month}-${p.day}T${p.hour==='24'?'00':p.hour}:${p.minute}`}
function fmtLocal(s){const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);if(!m)return s||'';return `${m[3]}/${m[2]}/${m[1]}`+(m[4]?` ${m[4]}:${m[5]}`:'')}
function fmtTs(ts){if(!ts)return '';const p=cairoParts(new Date(ts));return `${p.day}/${p.month}/${p.year} ${p.hour==='24'?'00':p.hour}:${p.minute}`}
function fmtTime(ts){const p=cairoParts(new Date(ts));return `${p.hour==='24'?'00':p.hour}:${p.minute}:${p.second}`}

/* ---------- الإعدادات (في rcv_v1 زي ما هي – متوافقة مع النسخة القديمة) ---------- */
let OLD,ST;
function legacyBlank(){return{h:{code:'',dt:cairoNowLocal(),variety:'navel'},c:{},sz:{},wts:'',mode:'cnt',d:{},dn:{},notes:''}}
function loadOld(){try{OLD=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!OLD||typeof OLD!=='object')OLD={cur:legacyBlank(),set:{...DSET},hist:[]};if(!Array.isArray(OLD.hist))OLD.hist=[];OLD.set={...DSET,...OLD.set};if(!OLD.set.v2){OLD.set.decOk=DSET.decOk;OLD.set.decMax=DSET.decMax;OLD.set.v2=1}ST=OLD.set}
function saveSet(){OLD.set=ST;try{localStorage.setItem(KEY,JSON.stringify(OLD))}catch(e){toast('تعذر حفظ الإعدادات: '+e.name)}}

/* ---------- IndexedDB مع إعادة فتح الاتصال تلقائيًا (سفاري الآيفون بيقفل الاتصال لما الكاميرا تفتح أو الشاشة تقفل) ---------- */
/* لو سفاري قافل IndexedDB (زي وضع Lockdown في الآيفون) المتغير indexedDB نفسه مش موجود ← أي استخدام مباشر = ReferenceError.
   عشان كده: فحص آمن + تخزين بديل للصور (Cache Storage ثم localStorage) والسجلات (localStorage) */
const HAS_IDB=(()=>{try{return typeof indexedDB!=='undefined'&&!!indexedDB&&typeof indexedDB.open==='function'}catch(e){return false}})();
let IDB_LAST='';
function errTxt(e){if(!e)return 'خطأ غير معروف';if(typeof e!=='object')return String(e);const nm=e.name||'Error',m=e.message||'';return m&&m!==nm?nm+': '+m:nm}
function IDB(name,ver,up,check){let p=null;
 const noIDB=()=>{const e=new Error('IndexedDB غير متاح في المتصفح ده');e.name='NotSupportedError';return e};
 const req=v=>new Promise((ok,no)=>{let r,done=false;try{r=v?indexedDB.open(name,v):indexedDB.open(name)}catch(e){return no(e)}
  const tm=setTimeout(()=>{if(done)return;done=true;const e=new Error('فتح IndexedDB اتأخر/اتعطل (blocked)');e.name='TimeoutError';no(e)},8000);
  r.onupgradeneeded=e=>{try{up(r.result,e.oldVersion,r.transaction)}catch(x){console.error(x)}};
  r.onsuccess=()=>{const d=r.result;if(done){try{d.close()}catch(e){}return}done=true;clearTimeout(tm);ok(d)};
  r.onerror=e=>{try{e&&e.preventDefault&&e.preventDefault()}catch(x){}if(done)return;done=true;clearTimeout(tm);no(r.error||new Error('IndexedDB open error'))};
  r.onblocked=()=>{}});
 async function openDb(){if(!HAS_IDB)throw noIDB();let d;
  try{d=await req(ver)}catch(e){if(e&&e.name==='VersionError')d=await req(0);else throw e}
  let good=false;try{good=check(d)}catch(e){good=false}
  if(!good){const v=d.version+1;try{d.close()}catch(e){}d=await req(v)}
  d.onclose=()=>{p=null};d.onversionchange=()=>{try{d.close()}catch(e){}p=null};return d}
 const open=()=>p||(p=openDb().catch(e=>{p=null;throw e}));
 async function run(store,mode,fn){let last;for(let a=0;a<3;a++){try{const d=await open();return await new Promise((ok,no)=>{const t=d.transaction(store,mode);const s=t.objectStore(store);let res;const q=fn(s);if(q)q.onsuccess=()=>{res=q.result};t.oncomplete=()=>ok(res);t.onerror=()=>no(t.error||(q&&q.error));t.onabort=()=>no(t.error||new DOMException('abort','AbortError'))})}catch(e){last=e;IDB_LAST=errTxt(e);if(!e||e.name==='QuotaExceededError'||e.name==='DataCloneError'||e.name==='ConstraintError'||e.name==='NotSupportedError'||e.name==='SecurityError'||e.name==='TimeoutError'||e instanceof ReferenceError||e instanceof TypeError)throw e;p=null;await new Promise(r=>setTimeout(r,120*(a+1)))}}throw last}
 return{run}}
const PDB=IDB('rcv_photos',1,(d,ov,tx)=>{const s=d.objectStoreNames.contains('ph')?tx.objectStore('ph'):d.createObjectStore('ph',{keyPath:'id',autoIncrement:true});if(!s.indexNames.contains('code'))s.createIndex('code','code')},
 d=>d.objectStoreNames.contains('ph')&&d.transaction('ph','readonly').objectStore('ph').indexNames.contains('code'));
const TDB=IDB('rcv_data',1,d=>{if(!d.objectStoreNames.contains('trucks'))d.createObjectStore('trucks',{keyPath:'id'})},d=>d.objectStoreNames.contains('trucks'));

/* ---------- تخزين الصور البديل (لما IndexedDB مش متاح أو فشل) ---------- */
const PHX='rcv_phidx',PHK='rcv_ph_',PHC='rcv_photos_c1';
let CACHE_OK=null;
async function phCache(){if(CACHE_OK===false)return null;try{if(typeof caches==='undefined'||!caches||!window.isSecureContext)throw 0;const c=await caches.open(PHC);CACHE_OK=true;return c}catch(e){CACHE_OK=false;return null}}
const phUrl=id=>location.origin+'/__rcvph/'+encodeURIComponent(id);
function phIdx(){try{const a=JSON.parse(localStorage.getItem(PHX));return Array.isArray(a)?a:[]}catch(e){return[]}}
function phIdxSet(a){localStorage.setItem(PHX,JSON.stringify(a))}
function quotaErr(m){const e=new Error(m||'localStorage full');e.name='QuotaExceededError';return e}
async function phAddLocal(rec,file,o){const id='L'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 const meta={id,code:rec.code,rid:rec.rid,cause:rec.cause,w:rec.w,h:rec.h,t:rec.t};let cerr=null;
 const c=o&&o.blob?await phCache():null;
 if(c){try{await c.put(phUrl(id),new Response(o.blob,{headers:{'content-type':o.blob.type||'image/jpeg'}}));meta.st='c';const a=phIdx();a.push(meta);try{phIdxSet(a)}catch(e){try{await c.delete(phUrl(id))}catch(x){}throw e}return meta}catch(e){cerr=e}}
 // localStorage: صورة أصغر (800px جودة 0.6) لأن المساحة محدودة، مع ترك مساحة احتياطية لبيانات العربيات
 const tries=[[800,0.6],[640,0.5],[480,0.45]];let last=cerr;
 for(const [mx,q] of tries){let d;
  try{d=(await shrinkPhoto(file,mx,q,true)).data}catch(e){if(o&&o.blob&&o.blob.size<9e5&&typeof FileReader!=='undefined'){d=await blobToData(o.blob)}else throw e}
  try{localStorage.setItem(PHK+id,d)}catch(e){last=e;continue}
  const a=phIdx();meta.st='l';meta.w=meta.w||mx;a.push(meta);
  try{phIdxSet(a);localStorage.setItem('rcv_probe','x'.repeat(300000));localStorage.removeItem('rcv_probe');return meta}
  catch(e){last=e;try{localStorage.removeItem('rcv_probe')}catch(x){}try{localStorage.removeItem(PHK+id)}catch(x){}try{phIdxSet(phIdx().filter(m=>m.id!==id))}catch(x){}}}
 if(last&&last.name==='QuotaExceededError'){const q=quotaErr('مساحة التخزين البديل على الجهاز امتلت');q.alt=1;throw q}
 throw last||quotaErr()}
async function phDelLocal(id){try{phIdxSet(phIdx().filter(m=>m.id!==id))}catch(e){}try{localStorage.removeItem(PHK+id)}catch(e){}try{const c=await phCache();if(c)await c.delete(phUrl(id))}catch(e){}}
async function phOf(code){let a=[],ierr=null;
 if(HAS_IDB){try{a=(await PDB.run('ph','readonly',s=>s.index('code').getAll(code)))||[]}catch(e){ierr=e}}
 const loc=phIdx().filter(m=>m.code===code);
 for(const m of loc){try{if(m.st==='l'){const d=localStorage.getItem(PHK+m.id);if(d)a.push({...m,data:d})}else if(m.st==='c'){const c=await phCache();const r=c&&await c.match(phUrl(m.id));if(r)a.push({...m,blob:await r.blob()})}}catch(e){}}
 if(ierr&&!a.length&&HAS_IDB)throw ierr;
 return a.sort((x,y)=>(x.t||0)-(y.t||0))}
let persistAsked=false;function askPersist(){if(persistAsked)return;persistAsked=true;try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}

/* ---------- السجلات ---------- */
let RECS=[];   // كل العربيات (مسودات + تقارير)
let CUR=null;  // العربية المفتوحة في الخطوات
function lsGet(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
async function putRec(r){try{if(!HAS_IDB)throw new Error('no idb');await TDB.run('trucks','readwrite',s=>s.put(clone(r)));const fb=lsGet(FB);if(fb&&fb[r.id]){delete fb[r.id];lsSet(FB,fb)}return true}catch(e){const fb=lsGet(FB)||{};fb[r.id]=r;if(!lsSet(FB,fb)){toast('⚠ مساحة التخزين ممتلئة – البيانات ممكن متتحفظش',5000);return false}return 'fb'}}
async function loadRecs(){let all=[];if(HAS_IDB){try{all=await TDB.run('trucks','readonly',s=>s.getAll())||[]}catch(e){}}
 const m=new Map(all.map(r=>[r.id,r]));const fb=lsGet(FB)||{};Object.values(fb).forEach(r=>{const o=m.get(r.id);if(!o||(r.updated||0)>(o.updated||0)){m.set(r.id,r);if(HAS_IDB)putRec(r)}});
 const lv=lsGet(LIVE);if(lv&&lv.id){const o=m.get(lv.id);if(!o||(lv.updated||0)>(o.updated||0)){m.set(lv.id,lv);putRec(lv)}}
 RECS=[...m.values()];}
function recById(id){return RECS.find(r=>r.id===id)}
const newId=()=>'T'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const hasData=c=>!!(c&&c.h&&(c.h.plate||c.h.supplier||c.h.driver||n(c.h.gross)||Object.values(c.sz||{}).some(v=>n(v))||Object.values(c.d||{}).some(v=>n(v))||(c.wts||'').trim()));
const sig=c=>JSON.stringify([c.h,c.c,c.sz,c.wts,c.mode,c.d,c.dn,c.notes]);
function fromLegacy(t,status){const ts=Date.now();return{id:'L'+status[0]+'-'+(t.h.code||newId()),code:t.h.code,status,archived:false,step:6,h:clone(t.h),c:clone(t.c||{}),sz:clone(t.sz||{}),wts:t.wts||'',mode:t.mode||'cnt',d:clone(t.d||{}),dn:clone(t.dn||{}),notes:t.notes||'',created:ts,updated:ts,issuedAt:status==='issued'?ts:null,setSnap:status==='issued'?{...ST}:null,legacy:1}}
async function migrate(){if(localStorage.getItem(MIG))return;const have=new Set(RECS.map(r=>r.id));const out=[];
 OLD.hist.forEach(t=>{if(t&&t.h&&t.h.code){const r=fromLegacy(t,'issued');if(t.r&&t.r.decision)r.legacyR=t.r;if(!have.has(r.id))out.push(r)}});
 const c=OLD.cur;if(c&&c.h&&hasData(c)){const hh=OLD.hist.find(t=>t&&t.h&&t.h.code==c.h.code);if(!hh||sig(hh)!==sig(c)){const r=fromLegacy(c,'draft');if(hh)r.notes=(r.notes||'');if(!have.has(r.id))out.push(r)}}
 let ok=true;for(const r of out){RECS.push(r);if((await putRec(r))!==true)ok=false}
 if(ok)localStorage.setItem(MIG,new Date().toISOString())}
async function uniqueCode(dt){const d=String(dt||cairoNowLocal()).slice(0,10).replace(/-/g,'');const used=new Set([...RECS.map(r=>r.code),...OLD.hist.map(t=>t&&t.h&&t.h.code),OLD.cur&&OLD.cur.h&&OLD.cur.h.code].filter(Boolean));
 for(let i=1;i<1000;i++){const c='RT-'+d+'-'+String(i).padStart(3,'0');if(used.has(c))continue;try{const ph=await phOf(c);if(ph&&ph.length)continue}catch(e){}return c}return 'RT-'+d+'-'+Date.now()}
async function newTruck(){const dt=cairoNowLocal();const ts=Date.now();const r={id:newId(),code:await uniqueCode(dt),status:'draft',archived:false,step:0,sv:2,h:{code:'',dt,variety:'',pack:''},c:{},sz:{},wts:'',mode:'cnt',d:{},dn:{},notes:'',created:ts,updated:ts};r.h.code=r.code;RECS.push(r);await putRec(r);askPersist();go('#w/'+r.id+'/0')}

/* حفظ فوري: نسخة متزامنة في localStorage + IndexedDB خلال لحظة */
let saveT=null;
function touch(){if(!CUR)return;CUR.updated=Date.now();lsSet(LIVE,CUR);lsSet(OPEN,{id:CUR.id,step:CUR.step});clearTimeout(saveT);saveT=setTimeout(flush,250);const e=$('#ls');if(e)e.textContent='✓ اتحفظ تلقائيًا '+fmtTime(CUR.updated)}
async function flush(){clearTimeout(saveT);saveT=null;if(CUR){const ok=await putRec(CUR);const e=$('#ls');if(e&&ok==='fb')e.textContent='✓ اتحفظ تلقائيًا '+fmtTime(CUR.updated)+' · تخزين بديل على الجهاز'+(HAS_IDB?'':' (IndexedDB مقفول في سفاري)');else if(e&&ok===false)e.textContent='⚠ تعذر الحفظ – مساحة التخزين على الجهاز ممتلئة'}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&CUR){lsSet(LIVE,CUR);flush()}});
window.addEventListener('pagehide',()=>{if(CUR){lsSet(LIVE,CUR);flush()}});

/* ---------- الحسابات: نفس معادلات وحدود النسخة السابقة بالحرف (بدون أي تغيير) ---------- */
const isMurV=v=>grpOf(v)==='mand'||String(v||'').startsWith('mur');
function bandsOf(st){const b=String(st.bands).split(/[,،\s]+/).map(Number).filter(x=>x>0).sort((a,b)=>a-b);const r=[{k:'<'+b[0],lo:0,hi:b[0]}];for(let i=0;i<b.length-1;i++)r.push({k:b[i]+'-'+b[i+1],lo:b[i],hi:b[i+1]});r.push({k:'>'+b[b.length-1],lo:b[b.length-1],hi:1e9});return r}
/* القديم (سجلات قبل 2.1.0 من غير عبوة): نفس قائمة OR_SIZES وإعداد orExp زي ما هي — حساباتها ما اتغيرتش.
   الجديد: الصنف ← العبوة ← مقاسات العبوة دي بس + «أكبر من» و«أصغر من» (خارج التصدير).
   من 2.1.1: مقاس 125 في برتقال 14/15 ك والجامبو بيتكتب ويتقاس عادي (قطر ووزن) بس مش تصدير — التصدير بيقف عند 113. */
function packSizes(rec){const p=packOfRec(rec);return p&&p.sizes?p.sizes.map(String):null}
function sizeKeysOf(rec,st){if(isMurV(rec.h.variety))return bandsOf(st).map(b=>b.k);const L=packSizes(rec);if(L)return ['أكبر من '+L[0]].concat(L,['أصغر من '+L[L.length-1]]);if(rec.sv||!rec.h.variety)return [];return OR_SIZES}
function isExpOf(k,rec,st){if(isMurV(rec.h.variety)){const b=bandsOf(st).find(x=>x.k==k);return !!(b&&b.lo>=n(st.murMin)&&b.hi<=n(st.murMax))}const p=packOfRec(rec);if(p&&window.ALS&&ALS.isExport)return ALS.isExport(grpOf(rec.h.variety),p,k);return String(st.orExp).split(/[,،\s]+/).includes(k)}
/* القطر ووزن الحبة التقريبي جنب كل مقاس (خط خفيف) */
function szInfo(k,rec,st,compact){if(!window.ALS)return '';const g=grpOf(rec.h.variety);
 if(isMurV(rec.h.variety)){const b=bandsOf(st).find(x=>x.k==k);if(!b)return '';const p=packOfRec(rec);const o=ALS.band(b.lo,b.hi>=1e9?0:b.hi,p&&p.kg);return compact?(o.dia?'≈'+o.dia+' مم':''):ALS.bandText(o,p&&p.kg)}
 if(!/^\d+$/.test(k)||!g)return '';const p=packOfRec(rec)||(g==='orange'||g==='lemon'?ALS.PK[g==='lemon'?'l15':'c15']:null);const o=ALS.info(g,p,k);return compact?ALS.compact(o):ALS.text(o)}
function defsOf(rec){const v=rec.h.variety;return DEFS.filter(d=>!d[3]||(d[3]=='navel'?v=='navel':isMurV(v)))}
function weightsOf(rec){return(rec.wts||'').split(/[^\d.]+/).map(Number).filter(x=>x>0)}
const stOf=rec=>rec.status==='issued'&&rec.setSnap?rec.setSnap:ST;
function compute(rec,st){st=st||stOf(rec);const h=rec.h,mur=isMurV(h.variety);
 h.net=Math.max(0,n(h.gross)-n(h.tare))||'';h.avgc=n(h.crates)&&h.net?Math.round(h.net/n(h.crates)*10)/10:'';
 const keys=sizeKeysOf(rec,st);let cnt={};let wl=[];
 if(mur&&rec.mode=='w'){wl=weightsOf(rec);const B=bandsOf(st);keys.forEach(k=>cnt[k]=0);wl.forEach(w=>{const b=B.find(b=>w>=b.lo&&w<b.hi)||B[B.length-1];cnt[b.k]++})}
 else keys.forEach(k=>cnt[k]=n(rec.sz[k]));
 const N=keys.reduce((a,k)=>a+cnt[k],0);const nc=Math.max(5,Math.min(12,Math.round(Math.sqrt(n(h.crates)||300)/3)+(n(h.crates)>300?2:0)));
 const defs=defsOf(rec);const by={d:0,M:0,m:0};defs.forEach(([k,,c])=>by[c]+=n(rec.d[k]));
 const isE=k=>isExpOf(k,rec,st);
 const off=keys.filter(k=>!isE(k)).reduce((a,k)=>a+cnt[k],0);const net=n(h.net)/1000;
 const P=x=>N?x/N*100:0;const dec=P(by.d),maj=P(by.M),mi=P(by.m);
 const sound=1-(by.d+by.M)/(N||1);const exp=Math.max(0,P(N-by.d-by.M)-P(off)*sound);const rej=dec;const loc=Math.max(0,100-exp-rej);
 let avgW=wl.length?wl.reduce((a,b)=>a+b,0)/wl.length:(n(h.sampKg)&&N?n(h.sampKg)*1000/N:0);
 let decision,cl;const ded=Math.max(0,dec-st.decOk)*st.decMult+Math.max(0,maj-st.defTol)*st.defMult;
 const why=[];if(N){if(dec>st.decMax)why.push(`مسببات الأعفان ${pc(dec)} أعلى من حد الرفض ${st.decMax}%`);if(exp<st.expMin)why.push(`نسبة التصدير ${pc(exp)} أقل من الحد الأدنى ${st.expMin}%`);if(dec>st.decOk&&dec<=st.decMax)why.push(`مسببات الأعفان ${pc(dec)} أعلى من المسموح ${st.decOk}% (خصم ${pc(Math.max(0,dec-st.decOk)*st.decMult)})`);if(maj>st.defTol)why.push(`التشوهات الرئيسية ${pc(maj)} أعلى من المسموح ${st.defTol}% (خصم ${pc(Math.max(0,maj-st.defTol)*st.defMult)})`);if(exp>=st.expMin&&exp<st.expOk)why.push(`نسبة التصدير ${pc(exp)} أقل من ${st.expOk}% المطلوبة للقبول الكامل`);}
 if(!N){decision='أدخل العينة';cl='mid'}else if(dec>st.decMax||exp<st.expMin){decision='رفض';cl='bad'}else if(ded>0){decision='قبول مع خصم '+pc(ded);cl='mid'}else if(exp<st.expOk){decision='قبول بملاحظة';cl='mid'}else{decision='قبول';cl='ok';why.push(`مسببات الأعفان ${pc(dec)} ≤ ${st.decOk}% والتصدير ${pc(exp)} ≥ ${st.expOk}%`)}
 const warn=[];if(n(h.gross)&&n(h.tare)&&n(h.gross)<=n(h.tare))warn.push('الوزن القائم لازم يكون أكبر من الفارغ');if(n(h.sampN)&&N&&n(h.sampN)!=N)warn.push(`مجموع الأحجام ${N} ثمرة لا يساوي حجم العينة المسجل ${n(h.sampN)} ثمرة`);if(by.d+by.M+by.m>N&&N)warn.push(`مجموع المسببات والتشوهات (${by.d+by.M+by.m}) أكبر من عدد ثمار العينة (${N})`);if(N&&N<100)warn.push(`العينة ${N} ثمرة فقط – الموصى به ${st.sample} ثمرة على الأقل`);if(avgW&&(avgW<40||avgW>600))warn.push(`متوسط وزن الثمرة ${f0(avgW)} جم غير منطقي – راجع وزن العينة`);if(n(h.crates)&&n(h.net)){const a=n(h.net)/n(h.crates);if(a<10||a>30)warn.push(`متوسط وزن الصندوق ${f1(a)} كجم غير معتاد – راجع العدد أو الأوزان`)}if(n(h.color)&&(n(h.color)<1||n(h.color)>5))warn.push('اللون من 1 إلى 5');
 const tchk=CF.filter(([k])=>n(rec.c[k])>0).map(([k,l,o])=>l+': '+o[n(rec.c[k])]);
 const dedF=N&&cl!='bad'?ded:0;
 const dtxt=cl=='bad'?'رفض':dedF>0?`قبول مع خصم ${dedF.toFixed(1)}% = ${Math.round(Math.round(n(h.net))*dedF/100).toLocaleString('en')} كجم`:decision;
 return{why,warn,mjr:maj,N,cnt,keys,by,dec,maj,mi,exp,loc,rej,net,avgW,decision,cl,ded:dedF,defs,off,tchk,nc,wl,isE,dtxt,mur,st,P}}
function lr(fr,total){const raw=fr.map(f=>f*total),b=raw.map(Math.floor);let d=Math.round(total)-b.reduce((a,c)=>a+c,0);raw.map((r,i)=>[r-b[i],i]).sort((a,c)=>c[0]-a[0]).forEach(([,i])=>{if(d>0){b[i]++;d--}});return b}

/* ---------- الصور: تصغير لـ 1280px JPEG 0.7 وتخزين Blob في IndexedDB ---------- */
const URLS=new Map();
function phSrc(p){if(p.data)return p.data;if(!p.blob)return '';let u=URLS.get(p.id);if(!u){u=URL.createObjectURL(p.blob);URLS.set(p.id,u)}return u}
function loadImgEl(src){return new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>no(new DOMException('decode','EncodingError'));im.src=src})}
async function shrinkPhoto(file,max=1280,q=0.7,asData=false){let bmp=null,im=null,u=null;
 if(typeof createImageBitmap==='function'){try{bmp=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){try{bmp=await createImageBitmap(file)}catch(e2){bmp=null}}}
 if(!bmp){u=URL.createObjectURL(file);try{im=await loadImgEl(u)}catch(e){URL.revokeObjectURL(u);throw e}}
 const sw=bmp?bmp.width:im.naturalWidth,sh=bmp?bmp.height:im.naturalHeight;if(!sw||!sh)throw new DOMException('decode','EncodingError');
 const sc=Math.min(1,max/Math.max(sw,sh));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(sw*sc));c.height=Math.max(1,Math.round(sh*sc));
 const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bmp||im,0,0,c.width,c.height);
 if(bmp&&bmp.close)bmp.close();if(u)URL.revokeObjectURL(u);
 if(asData){const data=c.toDataURL('image/jpeg',q);const o2={data,w:c.width,h:c.height};c.width=c.height=1;if(!data||data.length<100)throw new DOMException('encode','EncodingError');return o2}
 let blob=await new Promise(r=>{try{c.toBlob(r,'image/jpeg',q)}catch(e){r(null)}});
 if(!blob){const d=c.toDataURL('image/jpeg',q);blob=await (await fetch(d)).blob()}
 const out={blob,w:c.width,h:c.height};c.width=c.height=1;return out}
const blobToData=b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(b)});
function phErr(e){const nm=e&&e.name||'';if(nm==='QuotaExceededError'&&e.alt)return 'مساحة الصور في التخزين البديل لسفاري امتلت – امسح صور قديمة من عربيات خلصت، أو اقفل Lockdown Mode للموقع ده من «aA» ← إعدادات موقع الويب';if(nm==='QuotaExceededError')return 'مساحة التخزين على الجهاز ممتلئة – فضّي مساحة على التليفون وجرب تاني';if(nm==='EncodingError')return 'الصورة دي مش مدعومة – صورها تاني من الكاميرا أو اختار صورة JPEG';return 'تعذر حفظ الصورة ('+errTxt(e)+') – جرب تاني'}
async function addPhotos(cause,inp){if(!CUR)return;const files=[...(inp.files||[])];inp.value='';if(!files.length)return;askPersist();
 const st=document.getElementById('ps_'+cause);let ok=0,alt=0,err='';
 for(const f of files){if(st){st.className='phst';st.textContent='⏳ جاري حفظ الصورة…'}
  try{let o;try{o=await shrinkPhoto(f)}catch(e){if(e&&e.name==='EncodingError'&&f.size&&f.size<8e6)o={blob:f,w:0,h:0,orig:1};else throw e}
   const rec={code:CUR.code,rid:CUR.id,cause,blob:o.blob,w:o.w,h:o.h,t:Date.now()};
   let saved=false;
   if(HAS_IDB){try{try{await PDB.run('ph','readwrite',s=>s.add(rec))}catch(e){if(e&&rec.blob&&typeof FileReader!=='undefined'&&e.name!=='QuotaExceededError'&&e.name!=='NotSupportedError'&&e.name!=='TimeoutError'){/* بعض نسخ سفاري (التصفح الخاص) مش بتقبل Blob في IndexedDB ← نخزنها نص */delete rec.blob;rec.data=await blobToData(o.blob);await PDB.run('ph','readwrite',s=>s.add(rec))}else throw e}saved=true}catch(e){console.warn('IDB photo save failed → fallback',e)}}
   if(!saved){await phAddLocal(rec,f,o);alt++}
   ok++}catch(e){err=phErr(e);console.error(e)}}
 if(st){st.className='phst '+(err?'e':'o');st.textContent=err?'⚠ '+err:'✓ اتحفظت '+(ok>1?ok+' صور':'الصورة')}
 if(err)toast('⚠ '+err,6000);else toast('✓ اتحفظت الصورة'+(alt?' (تخزين بديل)':''));
 CUR.phTs=Date.now();touch();await showThumbs()}
async function delPhoto(id){if(!confirm('تمسح الصورة دي؟'))return;if(typeof id==='string'&&/^\d+$/.test(id))id=+id;try{if(typeof id==='string'&&id[0]==='L')await phDelLocal(id);else await PDB.run('ph','readwrite',s=>s.delete(id))}catch(e){toast('تعذر مسح الصورة ('+errTxt(e)+')')}const u=URLS.get(id);if(u){URL.revokeObjectURL(u);URLS.delete(id)}await showThumbs()}
async function showThumbs(){if(!CUR)return;let L=[];try{L=await phOf(CUR.code)}catch(e){}document.querySelectorAll('.ths[data-cause]').forEach(d=>{const k=d.dataset.cause;d.innerHTML=L.filter(p=>p.cause==k).map(p=>`<div><img src="${phSrc(p)}" alt=""><button type=button onclick="delPhoto('${p.id}')">×</button></div>`).join('')})}
const phBtn=(cause,label)=>`<label class=phbtn>📷 ${label||'صورة'}<input type=file accept="image/*" multiple onchange="addPhotos('${cause}',this)"></label>`;

/* ---------- التنقل ---------- */
function go(h){if(location.hash===h)route();else location.hash=h}
window.addEventListener('hashchange',route);
const V=()=>$('#view');
async function route(){const h=location.hash||'#home';const p=h.slice(1).split('/');
 if(CUR&&!(p[0]==='w'&&p[1]===CUR.id)){await flush();CUR=null}
 document.body.dataset.v=p[0];
 if(p[0]==='w'){const r=recById(p[1]);if(!r)return go('#home');if(r.status!=='draft'){return go('#r/'+r.id)}CUR=r;CUR.step=Math.max(0,Math.min(STEPS.length-1,+p[2]||0));lsSet(OPEN,{id:CUR.id,step:CUR.step});lsSet(LIVE,CUR);putRec(CUR);renderStep();window.scrollTo(0,0);return}
 lsSet(OPEN,null);
 if(p[0]==='r'){const r=recById(p[1]);if(!r)return go('#home');return renderReport(r)}
 if(p[0]==='set')return renderSettings();
 if(p[0]==='guide'){V().innerHTML='<div class=card id=guideV><h2>إرشادات الاستلام خطوة بخطوة</h2>'+$('#guideT').innerHTML+'</div>';return}
 renderHome()}

/* ---------- الرئيسية ---------- */
let showArch=false;
const STORE_NOTE=()=>HAS_IDB?'':`<div class=warnb>⚠ سفاري على الجهاز ده قافل التخزين الأساسي (IndexedDB) – غالبًا بسبب <span dir=ltr>Lockdown Mode</span>. البرنامج شغال عادي وبيحفظ البيانات والصور في تخزين بديل، بس مساحة الصور فيه أقل. للأفضل: في سفاري اضغط «aA» ← «إعدادات موقع الويب» واقفل <span dir=ltr>Lockdown Mode</span> للموقع ده بس.</div>`;
function renderHome(){$('#ls').textContent='';
 const act=RECS.filter(r=>!r.archived);const dr=act.filter(r=>r.status==='draft').sort((a,b)=>b.updated-a.updated);const is=act.filter(r=>r.status==='issued').sort((a,b)=>(b.issuedAt||b.updated)-(a.issuedAt||a.updated));const ar=RECS.filter(r=>r.archived).sort((a,b)=>b.updated-a.updated);
 const who=r=>esc([r.h.supplier,r.h.plate&&('عربية '+r.h.plate)].filter(Boolean).join(' · ')||'بدون بيانات لسه');
 const drH=dr.map(r=>`<div class=li><div class=m><b>${esc(r.code)} <span class=chip>خطوة ${r.step+1} من ${STEPS.length}</span></b><span>${who(r)} · آخر تعديل ${fmtTs(r.updated)}</span></div><div class=a><button onclick="go('#w/${r.id}/${r.step}')">كمّل ←</button><button class="gr sm" onclick="archive('${r.id}',1)">أرشفة</button></div></div>`).join('');
 const isH=is.map(r=>{const R=compute(clone(r));return `<div class=li><div class=m><b>${esc(r.code)} <span class="chip ${R.cl}">${esc(R.cl=='bad'?'رفض':R.ded>0?'خصم '+pc(R.ded):R.decision)}</span></b><span>${who(r)} · ${fmtLocal(r.h.dt)} · مسببات ${pc(R.dec)} · تصدير ${pc(R.exp)}</span></div><div class=a><button onclick="go('#r/${r.id}')">التقرير</button><button class="gr sm" onclick="archive('${r.id}',1)">أرشفة</button></div></div>`}).join('');
 const arH=ar.map(r=>`<div class=li><div class=m><b>${esc(r.code)}</b><span>${who(r)} · ${r.status==='issued'?'تقرير صادر':'مسودة'}</span></div><div class=a><button class="gr sm" onclick="archive('${r.id}',0)">استرجاع</button>${r.status==='issued'?`<button class=sm onclick="go('#r/${r.id}')">عرض</button>`:''}</div></div>`).join('');
 V().innerHTML=`<button class=big onclick="newTruck()">➕ استلام عربية جديدة</button><div style="height:12px"></div>
 <div class=card><h2>جاري التسجيل (${dr.length})</h2>${drH||'<p class=note>مفيش عربيات تحت التسجيل.</p>'}</div>
 <div class=card><h2>تقارير صادرة (${is.length})</h2>${isH||'<p class=note>لسه مفيش تقارير.</p>'}${is.length?'<div style="margin-top:8px"><button class="gr sm" onclick="exportCSV()">⬇ تصدير Excel</button></div>':''}</div>
 ${ar.length?`<div class=card><h2 style="display:flex;justify-content:space-between">الأرشيف (${ar.length}) <button class="gr sm" onclick="showArch=!showArch;renderHome()">${showArch?'إخفاء':'عرض'}</button></h2>${showArch?arH:''}</div>`:''}
 ${STORE_NOTE()}<div class=card><p class=note style="margin:0">📱 كل البيانات والصور محفوظة على <b>الجهاز ده بس</b> وبتتحفظ تلقائيًا أول بأول، حتى لو التليفون قفل. مفيش حاجة بتتمسح غير لو انت أرشفتها. للأمان على الآيفون: من سفاري اضغط مشاركة ← «إضافة إلى الشاشة الرئيسية» وافتح البرنامج من الأيقونة.</p><p class=note style="margin:6px 0 0">نسخة ${APP_VER} · <a href="https://alrashed-station.netlify.app/">برامج المحطة</a> · <a href="https://alrashed-station.netlify.app/counter.html">عدّ الحبات</a></p></div>`}
async function archive(id,v){const r=recById(id);if(!r)return;if(v&&!confirm('تنقل '+r.code+' للأرشيف؟ (مش هتتمسح، وتقدر ترجعها)'))return;r.archived=!!v;r.updated=Date.now();await putRec(r);renderHome()}

/* ---------- الخطوات ---------- */
const STEPS=[{t:'بيانات العربية'},{t:'الأوزان'},{t:'فحص العربية وصورها'},{t:'العينة'},{t:'الأحجام'},{t:'المسببات والتشوهات'},{t:'المراجعة وإصدار التقرير'}];
const stepTitle=i=>i===4&&isMurV(CUR.h.variety)?'شرائح الوزن (الأحجام)':STEPS[i].t;
const fld=(g,k,l,o={})=>`<label class="f${o.req?' req':''}" ${o.full?'style="grid-column:1/-1"':''}>${l}<input data-g=${g} data-k="${esc(k)}" id="f_${k}" type=${o.type||'text'} ${o.ro?'readonly':''} inputmode=${o.im||(o.type==='number'?'decimal':'text')} value="${esc(CUR[g]?CUR[g][k]??'':'')}" ${o.ph?`placeholder="${esc(o.ph)}"`:''}></label>`;
function renderStep(){const i=CUR.step,L=STEPS.length;compute(CUR);
 const top=`<div class=wz-top><div class=wz-h><b>${stepTitle(i)}</b><span>خطوة ${i+1} من ${L}</span></div><div class=dots>${STEPS.map((s,j)=>`<button type=button aria-label="${s.t}" class="${j===i?'on':j<i?'done':''}" onclick="goStep(${j},1)"></button>`).join('')}</div><div class=wz-code>${esc(CUR.code)}${CUR.h.supplier?' · '+esc(CUR.h.supplier):''}</div></div>`;
 const body=[stTruck,stW,stChk,stSamp,stSz,stDef,stRev][i]();
 const nav=`<div class=wz-nav><div>${i>0?`<button class="gr back" onclick="goStep(${i-1},1)">→ السابق</button>`:`<button class="gr back" onclick="go('#home')">خروج</button>`}${i<L-1?`<button onclick="next()">التالي ←</button>`:`<button onclick="issue()">✅ إصدار التقرير</button>`}</div></div>`;
 V().innerHTML=top+`<div id=stepBody>${body}</div><div id=stepErr></div>`+nav;
 $('#ls').textContent=CUR.updated?'✓ محفوظ تلقائيًا '+fmtTime(CUR.updated):'';live();showThumbs()}
function goStep(j,noVal){if(!CUR)return;CUR.step=j;touch();go('#w/'+CUR.id+'/'+j)}
function next(){const e=validate(CUR.step);if(e){$('#stepErr').innerHTML=`<div class=err>${e}</div>`;$('#stepErr').scrollIntoView({behavior:'smooth',block:'center'});return}goStep(CUR.step+1)}
function validate(i){const h=CUR.h,R=compute(CUR);
 if(i===0){if(!h.dt)return 'سجّل التاريخ والوقت';if(!String(h.plate||'').trim()&&!String(h.supplier||'').trim())return 'اكتب رقم العربية أو اسم المورّد على الأقل';if(CUR.sv&&!h.variety)return 'اختار الصنف';const g=grpOf(h.variety);if(CUR.sv&&(g==='orange'||g==='lemon')&&!packOfRec(CUR))return 'اختار العبوة علشان تظهر المقاسات المناسبة'}
 if(i===1){if(n(h.gross)<0||n(h.tare)<0)return 'الأوزان لازم تكون موجبة';if(n(h.gross)&&n(h.tare)&&n(h.gross)<=n(h.tare))return 'الوزن القائم لازم يكون أكبر من الفارغ'}
 if(i===3){if(!(n(h.sampN)>0))return 'اكتب عدد ثمار العينة'}
 if(i===4){if(!R.keys.length)return 'اختار الصنف والعبوة الأول من خطوة «بيانات العربية»';if(!R.N)return 'سجّل أعداد الأحجام';if(n(h.sampN)&&R.N!==n(h.sampN))return `مجموع الأحجام ${R.N} ثمرة ≠ عدد العينة ${n(h.sampN)} ثمرة (${R.N>n(h.sampN)?'زيادة '+(R.N-n(h.sampN)):'ناقص '+(n(h.sampN)-R.N)}).<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><button class=sm onclick="fixSamp()">خلّي عدد العينة = ${R.N}</button><button class="sm gr" onclick="document.getElementById('stepErr').innerHTML=''">هراجع الأعداد</button></div>`}
 if(i===5){const t=R.by.d+R.by.M+R.by.m;if(R.N&&t>R.N)return `مجموع المسببات والتشوهات (${t}) أكبر من عدد ثمار العينة (${R.N}) – كل ثمرة تتسجل مرة واحدة تحت أكبر عيب فيها`}
 return ''}
function fixSamp(){const R=compute(CUR);CUR.h.sampN=String(R.N);touch();goStep(5)}

function stTruck(){const h=CUR.h;return `<div class=card><div class=grid>
 <label class=f>كود العربية<input readonly value="${esc(CUR.code)}" style="direction:ltr;text-align:right"></label>
 ${fld('h','dt','التاريخ والوقت',{type:'datetime-local',req:1})}
 ${fld('h','plate','رقم العربية',{req:1})}${fld('h','driver','السواق')}${fld('h','supplier','المورّد / المزرعة',{req:1})}${fld('h','region','المنطقة')}
 <label class="f req">الصنف (اختاره الأول)<select data-g=h data-k=variety>${h.variety?'':'<option value="" selected>— اختار الصنف —</option>'}${VAR.filter(v=>!VAR_LEGACY.includes(v[0])||h.variety==v[0]).map(v=>`<option value=${v[0]} ${h.variety==v[0]?'selected':''}>${v[1]}</option>`).join('')}</select></label>
 ${packField()}
 ${fld('h','crates','عدد الصناديق',{type:'number',im:'numeric'})}</div><p class=note>* رقم العربية أو المورّد على الأقل.</p></div>`}
function packField(){const h=CUR.h,g=grpOf(h.variety),L=window.ALS&&g?ALS.packsFor(g):[];const req=g==='orange'||g==='lemon';
 const ph=!h.variety?'اختار الصنف الأول':g==='mand'?'— وزن الصندوق (اختياري) —':(CUR.sv?'— اختار العبوة —':'— قائمة المقاسات القديمة —');
 return `<label class="f${req&&CUR.sv?' req':''}">العبوة (المقاسات بتظهر حسبها)<select data-g=h data-k=pack ${h.variety?'':'disabled'}><option value="" ${packOfRec(CUR)?'':'selected'}>${ph}</option>${L.map(p=>`<option value=${p.id} ${h.pack==p.id?'selected':''}>${p.label}${p.sizes?' — '+p.sizes.join('، '):''}</option>`).join('')}</select></label>`}
function stW(){return `<div class=card><div class=grid>${fld('h','gross','الوزن القائم (كجم)',{type:'number'})}${fld('h','tare','الفارغ (كجم)',{type:'number'})}${fld('h','net','الصافي (كجم)',{ro:1})}${fld('h','avgc','متوسط وزن الصندوق (كجم)',{ro:1})}</div><p class=note>الفارغ ممكن يتسجل بعد التنزيل – ارجع للخطوة دي في أي وقت قبل إصدار التقرير.</p><div id=lw></div></div>`}
function stChk(){return `<div class=card>${CF.map(([k,l,o])=>`<div class=chkrow><b>${l}</b><div class=seg>${o.map((x,j)=>`<button type=button class="${n(CUR.c[k])==j?'on':''}" onclick="setChk('${k}',${j},this)">${x}</button>`).join('')}</div></div>`).join('')}
 <label class=f>ملاحظات<textarea data-g=notes rows=2>${esc(CUR.notes||'')}</textarea></label></div>
 <div class=card><h3 style="margin-top:0">صور العربية والصناديق</h3>${phBtn('truck','صور العربية')}<div class=phst id=ps_truck></div><div class=ths data-cause=truck></div></div>`}
function setChk(k,j,b){CUR.c[k]=String(j);b.parentNode.querySelectorAll('button').forEach((x,i)=>x.classList.toggle('on',i===j));touch()}
function stSamp(){return `<div class=card><div class=grid>${fld('h','sampN','عدد ثمار العينة',{type:'number',im:'numeric',req:1})}${fld('h','sampKg','وزن العينة (كجم)',{type:'number'})}</div>
 <p class=note>المستهدف ${esc(ST.sample)} ثمرة على الأقل · عدد الصناديق المقترح للعينة: <b id=nc></b> صندوق (من القدام والنص والورا، ومن فوق والنص وتحت).</p><div id=lsamp></div></div>
 <div class=card><h3 style="margin-top:0">الجودة (اختياري)</h3><div class=grid>${fld('h','brix','بريكس %',{type:'number'})}${fld('h','acid','حموضة %',{type:'number'})}${fld('h','juice','عصير %',{type:'number'})}${fld('h','color','لون القشرة 1-5',{type:'number'})}</div></div>`}
function tallyRow(g,k,label,sub,out){const v=CUR[g][k]??'';return `<div class="tr${out?' out':''}"><div class=tl>${label}<small>${sub}</small></div><button type=button class=st onclick="inc('${g}',this,-1)">−</button><input data-g=${g} data-k="${esc(k)}" type=number inputmode=numeric min=0 value="${esc(v)}"><button type=button class=st onclick="inc('${g}',this,1)">+</button><div class=tp data-p="${esc(k)}"></div></div>`}
function inc(g,b,d){const i=b.parentNode.querySelector('input');const v=Math.max(0,n(i.value)+d);i.value=v||'';CUR[g][i.dataset.k]=i.value;touch();live()}
function stSz(){const st=ST,mur=isMurV(CUR.h.variety);let s=`<div class=sumbar id=szsum></div>`;
 if(mur)s+=`<div class=seg style="margin-bottom:10px"><button type=button class="${CUR.mode!='w'?'on':''}" onclick="CUR.mode='cnt';touch();renderStep()">عدد لكل شريحة وزن</button><button type=button class="${CUR.mode=='w'?'on':''}" onclick="CUR.mode='w';touch();renderStep()">أوزان الثمار فردية</button></div>`;
 if(mur&&CUR.mode=='w')s+=`<div class=card><label class=f>أوزان الثمار بالجرام (افصل بمسافة أو فاصلة)<textarea data-g=wts rows=5 inputmode=decimal>${esc(CUR.wts)}</textarea></label><div id=wsum class=note></div></div>`;
 else{const keys=sizeKeysOf(CUR,st);if(!keys.length)return `<div class=warnb>${CUR.h.variety?'اختار العبوة':'اختار الصنف والعبوة'} الأول علشان تظهر المقاسات المناسبة.</div><button class=sm onclick="goStep(0,1)">→ بيانات العربية</button>`;
  s+=`<p class=note style="margin:0 0 6px"><b>${esc(VN[CUR.h.variety]||'')}</b>${packLbl(CUR)?' · '+esc(packLbl(CUR)):(mur?'':' · قائمة المقاسات القديمة')}</p><div class=card>${keys.map(k=>{const e=isExpOf(k,CUR,st);const zi=szInfo(k,CUR,st);return tallyRow('sz',k,mur?k+' جم':(/^\d+$/.test(k)?'حجم '+k:k),(e?'تصدير':'خارج التصدير')+(zi?`<span class=szd>${esc(zi)}</span>`:''),!e)}).join('')}</div>`}
 return s+`<p class=note>عدّ كل ثمار العينة حسب الحجم – المجموع لازم يساوي عدد العينة (${n(CUR.h.sampN)||'—'}). الأحجام الباهتة خارج مقاسات ${packLbl(CUR)?'العبوة':'التصدير حسب الإعدادات'}. القطر من جدول مقاسات البرتقال والليمون، و≈ = تقريبي.</p>`}
function stDef(){const defs=defsOf(CUR);let s=`<div class=sumbar id=dfsum></div><p class=note>كل ثمرة تتسجل مرة واحدة تحت <b>أكبر عيب فيها</b>. صوّر كل سبب من زرار 📷 جنبه.</p>`;
 ['d','M','m'].forEach(c=>{const L=defs.filter(d=>d[2]==c);s+=`<div class=grp><span>${CLS[c]}</span><span id=gt_${c}></span></div><div class=card style="padding-top:4px">`+L.map(([k,l])=>`<div class=dfx>${tallyRow('d',k,l,'',false)}<div class=more>${phBtn(k)}<input data-g=dn data-k=${k} placeholder="ملاحظة" value="${esc(CUR.dn[k]||'')}"></div><div class=phst id=ps_${k}></div><div class=ths data-cause=${k}></div></div>`).join('')+'</div>'});return s}
function stRev(){const R=compute(CUR),h=CUR.h;const miss=[];if(!n(h.gross))miss.push('الوزن القائم');if(!n(h.tare))miss.push('الوزن الفارغ');if(!R.N)miss.push('الأحجام');
 const sec=(t,j,v)=>`<div class=li><div class=m><b>${t}</b><span>${v}</span></div><div class=a><button class="ol sm" onclick="goStep(${j},1)">تعديل</button></div></div>`;
 return `<div class="dec ${R.cl}"><div class=note style="color:inherit">القرار المتوقع</div><div class=dv>${esc(R.dtxt)}</div>${R.why.length?`<ul>${R.why.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:''}</div>
 ${miss.length?`<div class=warnb>ناقص: ${miss.join('، ')}</div>`:''}${R.warn.map(w=>`<div class=warnb>⚠ ${esc(w)}</div>`).join('')}
 <div class=card>${sec('بيانات العربية',0,esc([fmtLocal(h.dt),h.plate&&'عربية '+h.plate,h.supplier,VN[h.variety],packLbl(CUR),h.crates&&h.crates+' صندوق'].filter(Boolean).join(' · ')))}
 ${sec('الأوزان',1,`قائم ${f0(n(h.gross))} · فارغ ${f0(n(h.tare))} · صافي ${f0(n(h.net))} كجم`)}
 ${sec('فحص العربية',2,esc(R.tchk.join(' · ')||'كله طبيعي'))}
 ${sec('العينة',3,`${n(h.sampN)} ثمرة${n(h.sampKg)?' · '+h.sampKg+' كجم':''}${R.avgW?' · متوسط الثمرة '+f0(R.avgW)+' جم':''}`)}
 ${sec(stepTitle(4),4,`${R.N} ثمرة · تصدير ${R.N-R.off} · خارج التصدير ${R.off}`)}
 ${sec('المسببات والتشوهات',5,`مسببات ${R.by.d} (${pc(R.dec)}) · رئيسية ${R.by.M} (${pc(R.maj)}) · ثانوية ${R.by.m} (${pc(R.mi)})`)}</div>
 <p class=note>بعد الإصدار التقرير بيتثبت بالإعدادات الحالية، وتقدر تعدّله بعدين من زرار «تعديل».</p>`}

/* تحديث الأرقام فورًا بدون إعادة رسم الشاشة (عشان الكيبورد ما يقفلش) */
function live(){if(!CUR)return;const R=compute(CUR),h=CUR.h,i=CUR.step;
 const sv=(id,v)=>{const e=document.getElementById(id);if(e&&e.value!=v)e.value=v};sv('f_net',h.net);sv('f_avgc',h.avgc);
 if(i===1){const e=$('#lw');if(e)e.innerHTML=R.warn.filter(w=>/الوزن|الصندوق/.test(w)).map(w=>`<div class=warnb>⚠ ${esc(w)}</div>`).join('')+(n(h.net)?`<p style="font-weight:800;font-size:18px;margin:8px 0 0">الصافي: ${f0(n(h.net))} كجم (${f1(n(h.net)/1000)} طن)</p>`:'')}
 if(i===3){const e=$('#nc');if(e)e.textContent=n(h.crates)?R.nc:'6–10';const w=$('#lsamp');if(w)w.innerHTML=R.avgW&&(R.avgW<40||R.avgW>600)?`<div class=warnb>⚠ متوسط وزن الثمرة ${f0(R.avgW)} جم غير منطقي – راجع وزن العينة</div>`:''}
 if(i===4){const S=n(h.sampN),N=R.N,b=$('#szsum');if(b){const st=!S?'':N===S?'okk':'bad';b.className='sumbar '+st;b.innerHTML=`<div class=row><span class=big>المجموع ${N}${S?' من '+S:''}</span><span>${!S?'':N===S?'✓ مطابق للعينة':N<S?'باقي '+(S-N):'زيادة '+(N-S)}</span></div><div class=row><span>تصدير: ${N-R.off} (${pc(R.P(N-R.off))})</span><span>خارج التصدير: ${R.off} (${pc(R.P(R.off))})</span></div>`}
  const mx=Math.max(1,...R.keys.map(k=>R.cnt[k]));document.querySelectorAll('.tp[data-p]').forEach(e=>{const c=R.cnt[e.dataset.p]||0;e.innerHTML=c?`${pc(R.P(c))}<i style="width:${c/mx*100}%"></i>`:''});
  const w=$('#wsum');if(w)w.textContent=R.wl.length+' ثمرة – '+R.keys.map(k=>k+': '+R.cnt[k]).join(' | ')}
 if(i===5){const t=R.by.d+R.by.M+R.by.m,b=$('#dfsum');if(b){b.className='sumbar'+(R.N&&t>R.N?' bad':'');b.innerHTML=`<div class=row><span class=big>مسببات أعفان ${R.by.d} (${pc(R.dec)})</span><span>من ${R.N||'—'} ثمرة</span></div><div class=row><span>رئيسية ${R.by.M} (${pc(R.maj)})</span><span>ثانوية ${R.by.m} (${pc(R.mi)})</span><span>إجمالي ${t}</span></div>`}
  ['d','M','m'].forEach(c=>{const e=document.getElementById('gt_'+c);if(e)e.textContent=R.by[c]+' ثمرة · '+pc(R.P(R.by[c]))});
  document.querySelectorAll('.tp[data-p]').forEach(e=>{const c=n(CUR.d[e.dataset.p]);e.innerHTML=c?pc(R.P(c)):''})}}
document.addEventListener('input',e=>{const t=e.target,g=t.dataset.g;if(!g||!CUR)return;const k=t.dataset.k;
 if(g==='h'&&(k==='variety'||k==='pack'))return;
 if(g==='h'||g==='sz'||g==='d'||g==='dn'){CUR[g][k]=t.value}else if(g==='wts')CUR.wts=t.value;else if(g==='notes')CUR.notes=t.value;else return;
 touch();live()});
/* تغيير الصنف/العبوة: الأعداد المسجلة لمقاسات مش في القائمة الجديدة بتتحذّر قبلها. ما بتتمسحش – بتفضل محفوظة ومش بتتحسب، وترجع لو رجعت للاختيار القديم */
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.g!=='h'||!CUR||(t.dataset.k!=='variety'&&t.dataset.k!=='pack'))return;const k=t.dataset.k,old={variety:CUR.h.variety,pack:CUR.h.pack};
 const nh=Object.assign({},CUR.h,{[k]:t.value});if(k==='variety'){const g=grpOf(t.value);const p=window.ALS&&ALS.PK[nh.pack];if(p&&p.g!==g)nh.pack=''}
 const oldK=compute(clone(CUR)).keys;const tmp=clone(CUR);tmp.h=nh;const newK=sizeKeysOf(tmp,stOf(tmp));
 const lost=isMurV(old.variety)&&CUR.mode=='w'&&!isMurV(nh.variety)&&weightsOf(CUR).length?[weightsOf(CUR).length+' وزن ثمرة']:[];
 oldK.forEach(x=>{const v=n(CUR.sz[x]);if(v>0&&!newK.includes(x))lost.push((/^\d+$/.test(x)?'حجم '+x:x)+': '+v+' ثمرة')});
 if(lost.length&&!confirm('تنبيه: الأعداد دي مسجلة ومش موجودة في مقاسات الاختيار الجديد:\n'+lost.join('\n')+'\n\nلو كمّلت مش هتتحسب (هتفضل محفوظة وترجع لو رجعت للاختيار القديم)، ولازم تعدّ العينة تاني على المقاسات الجديدة.\n\nتكمل؟')){t.value=old[k]||'';return}
 CUR.h.variety=nh.variety;CUR.h.pack=nh.pack||'';touch();renderStep()});

async function issue(){for(let i=0;i<6;i++){const e=validate(i);if(e){if(confirm('في خطوة «'+stepTitle(i)+'» لازم تتراجع:\n'+e.replace(/<[^>]+>.*$/s,'')+'\n\nتروح للخطوة دي؟'))goStep(i,1);return}}
 const R=compute(CUR);if(!n(CUR.h.net)&&!confirm('الوزن الصافي مش متسجل – التقرير هيطلع بدون كيلوجرامات. تكمل؟'))return;
 if(!confirm('إصدار تقرير '+CUR.code+'؟\nالقرار: '+R.dtxt))return;
 CUR.status='issued';CUR.issuedAt=Date.now();CUR.setSnap={...ST};CUR.r={exp:R.exp,dec:R.dec,loc:R.loc,net:R.net,decision:R.decision,avgW:R.avgW,ded:R.ded,N:R.N};CUR.updated=Date.now();
 const id=CUR.id;await putRec(CUR);lsSet(LIVE,CUR);CUR=null;lsSet(OPEN,null);toast('✓ اتصدر التقرير');go('#r/'+id)}
async function reopen(id){const r=recById(id);if(!r)return;if(!confirm('تفتح التقرير للتعديل؟ هيرجع مسودة لحد ما تصدره تاني.'))return;r.status='draft';r.setSnap=null;r.step=6;r.updated=Date.now();await putRec(r);go('#w/'+id+'/6')}

/* ---------- التقرير ---------- */
function repData(r){const c=clone(r),R=compute(c,stOf(r)),h=c.h,N=R.N,net=Math.round(n(h.net));
 const vn=R.keys.map(k=>R.cnt[k]);const szKg=lr(vn.map(x=>N?x/N:0),N?net:0);
 const fE=R.exp/100,fW=R.rej/100,fL=Math.max(0,1-fE-fW);const [kE,kL,kW]=lr([fE,fL,fW],net);
 const rows=R.defs.map(d=>({k:d[0],l:d[1],c:d[2],x:n(c.d[d[0]]),nt:c.dn[d[0]]||''})).filter(o=>o.x>0).sort((a,b)=>b.x-a.x);
 const tot=R.by.d+R.by.M+R.by.m;
 return{c,R,h,N,net,vn,szKg,dist:[['تصدير',R.exp,kE,'سليم أو بعيب ثانوي وفي مقاسات التصدير'],['محلي / عصير',fL*100,kL,'عيوب رئيسية أو خارج مقاسات التصدير'],['معرض للعفن (مسببات)',R.rej,kW,'ثمار بها مسببات أعفان – تُفرز ولا تُصدَّر']],rows,tot,totP:N?tot/N*100:0}}
const kgS=x=>Math.round(x).toLocaleString('en')+' كجم',tS=x=>(x/1000).toFixed(2)+' طن';
function dateOf(r){return fmtLocal(r.h.dt)}
let PDFC={key:null,p:null,done:null};
const LH={header:'alola_header.png',footer:'alola_footer.png'};
const LHIMG={};async function loadLh(){await Promise.all(Object.values(LH).map(async s=>{if(LHIMG[s]!==undefined)return;try{LHIMG[s]=await loadImgEl(s)}catch(e){LHIMG[s]=null}}));return LHIMG}

async function renderReport(r){const D=repData(r),{R,h,N,net}=D;let PH=[];try{PH=await phOf(r.code)}catch(e){}
 const by=k=>PH.filter(p=>p.cause==k);const st=R.st;
 const kpi=(a,b,hl)=>`<div class="${hl?'hl':''}"><small>${a}</small><b>${b||'—'}</b></div>`;
 const P1=x=>N?(x/N*100).toFixed(1)+'%':'—';const mx=Math.max(1,...D.vn);
 const defTb=c=>{const L=D.rows.filter(o=>c==='d'?o.c=='d':o.c!='d');const t=L.reduce((a,o)=>a+o.x,0);return `<table class=t><tr><th>السبب</th><th>عدد</th><th>% من العينة</th><th>صور</th></tr>${L.map(o=>`<tr><td>${esc(o.l)}${o.nt?` <span class=note>– ${esc(o.nt)}</span>`:''}${o.c!='d'?` <span class=note>(${o.c=='M'?'رئيسي':'ثانوي'})</span>`:''}</td><td class=n>${o.x}</td><td class=n>${P1(o.x)}</td><td><div class=rths>${by(o.k).slice(0,4).map(p=>`<img src="${phSrc(p)}" alt="">`).join('')}</div></td></tr>`).join('')||'<tr><td colspan=4>لا يوجد</td></tr>'}<tr class=tot><td>الإجمالي</td><td class=n>${t}</td><td class=n>${P1(t)}</td><td></td></tr></table>`};
 const figs=PH.map(p=>`<figure><img src="${phSrc(p)}" alt=""><figcaption>${esc(DN[p.cause]||p.cause)}${p.cause!=='truck'?' — '+n(D.c.d[p.cause])+' ثمرة ('+P1(n(D.c.d[p.cause]))+')':''}</figcaption></figure>`).join('');
 V().innerHTML=`<div class=card style="padding:10px 14px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap"><h2 style="margin:0">تقرير استلام سيارة خام</h2><span class=note style="direction:ltr">${esc(r.code)} · ${dateOf(r)}</span></div></div>
 <div class="dec ${R.cl}"><div class=dv>${esc(R.dtxt)}</div>${R.why.length?`<ul>${R.why.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:''}</div>
 ${R.warn.map(w=>`<div class=warnb>⚠ ${esc(w)}</div>`).join('')}
 <div class=kpi>${kpi('المورّد',esc(h.supplier))}${kpi('التاريخ',dateOf(r))}${kpi('رقم العربية',esc(h.plate))}${kpi('الصنف',esc(VN[h.variety]||'')+(packLbl(r)?`<span class=szd>${esc(packLbl(r))}</span>`:''))}${kpi('الوزن الصافي',net?kgS(net):'')}${kpi('عدد الصناديق',n(h.crates)?n(h.crates)+' صندوق':'')}${kpi('العينة',N+' ثمرة'+(n(h.sampKg)?' / '+n(h.sampKg)+' كجم':''))}${kpi('متوسط وزن الثمرة',R.avgW?f0(R.avgW)+' جم'+(window.ALS&&ALS.infoByWeight(R.avgW)?`<span class=szd>قطر ≈ ${ALS.infoByWeight(R.avgW).dia} مم (تقريبي)</span>`:''):'')}
 ${kpi('مسببات الأعفان',pc(R.dec),1)}${kpi('إجمالي العيوب',pc(D.totP))}${kpi('نسبة التصدير',pc(R.exp),1)}${kpi('الخصم المقترح',R.ded>0?pc(R.ded)+' = '+kgS(net*R.ded/100):'لا يوجد')}</div>
 <div class=card style="margin-top:12px"><h3 style="margin-top:0">توزيع العربية التقديري</h3><table class=t><tr><th>البند</th><th>%</th><th></th><th>كجم</th></tr>${D.dist.map(d=>`<tr><td>${d[0]}</td><td class=n>${d[1].toFixed(1)}%</td><td style="width:30%"><span class=bar style="width:${Math.max(0,Math.min(100,d[1]))}%"></span></td><td class=n>${net?kgS(d[2]):'—'}</td></tr>`).join('')}</table>
 <h3>${R.mur?'شرائح الوزن':'توزيع الأحجام'} (${N} ثمرة)</h3><table class=t><tr><th>${R.mur?'الوزن (جم)':'الحجم'}</th><th>عدد</th><th>%</th><th></th><th>كجم</th></tr>${R.keys.map((k,i)=>`<tr${R.isE(k)?'':' style="color:#64748b"'}><td>${esc(k)}${R.isE(k)?'':' <span class=note>(خارج التصدير)</span>'}${(()=>{const z=szInfo(k,r,st);return z?`<span class=szd>${esc(z)}</span>`:''})()}</td><td class=n>${D.vn[i]}</td><td class=n>${P1(D.vn[i])}</td><td style="width:28%"><span class=bar style="width:${D.vn[i]/mx*100}%"></span></td><td class=n>${net?kgS(D.szKg[i]):'—'}</td></tr>`).join('')}<tr class=tot><td>الإجمالي</td><td class=n>${N}</td><td class=n>${N?'100%':'—'}</td><td>تصدير ${N-R.off} · خارج ${R.off}</td><td class=n>${net&&N?kgS(net):'—'}</td></tr></table>
 <p class=note>${n(h.sampN)?(n(h.sampN)==N?'✓ العدد يطابق حجم العينة المسجل':'⚠ لا يطابق حجم العينة المسجل '+n(h.sampN)):''} القطر من جدول مقاسات البرتقال والليمون في مصر، و≈ = تقريبي (عبوة 7 ك أو أفندي: العدد × 15 ÷ وزن العبوة ← أقرب صف)، ووزن الحبة = وزن العبوة ÷ العدد.</p>
 <h3>مسببات الأعفان <span class=note>(قبول ≤ ${st.decOk}% · رفض > ${st.decMax}%)</span></h3>${defTb('d')}
 <h3>التشوهات والعيوب <span class=note>(رئيسية مسموح ${st.defTol}%)</span></h3>${defTb('x')}
 <h3>فحص العربية عند الوصول</h3><table class=t>${CF.map(([k,l,o])=>{const i=n(D.c.c[k]);return `<tr><td>${l}</td><td class=n>${i?'✗':'✓'}</td><td>${o[i]}</td></tr>`}).join('')}</table>${D.c.notes?`<p><b>ملاحظات:</b> ${esc(D.c.notes)}</p>`:''}
 ${[h.brix&&'بريكس '+h.brix+'%',h.acid&&'حموضة '+h.acid+'%',h.juice&&'عصير '+h.juice+'%',h.color&&'لون القشرة '+h.color+' / 5'].filter(Boolean).length?`<p class=note>الجودة: ${esc([h.brix&&'بريكس '+h.brix+'%',h.acid&&'حموضة '+h.acid+'%',h.juice&&'عصير '+h.juice+'%',h.color&&'لون القشرة '+h.color+' / 5'].filter(Boolean).join(' · '))}</p>`:''}
 </div>
 ${PH.length?`<div class=card><h3 style="margin-top:0">الصور (${PH.length})</h3><div class=phg>${figs}</div></div>`:''}
 <p class=note>الحدود قيم افتراضية قابلة للتعديل في الإعدادات وليست مواصفة رسمية · كل ثمرة مسجلة تحت أكبر عيب فيها · صدر ${fmtTs(r.issuedAt)}</p>
 <div id=shareMsg></div>
 <div class=rbtns><div><button id=bShare onclick="sharePdf('${r.id}')">📤 مشاركة</button><button class=ol onclick="downloadPdf('${r.id}')">⬇ PDF</button><button class=ol onclick="printPdf('${r.id}')">🖨 طباعة</button><button class=ol onclick="waText('${r.id}')">واتساب</button><button class=gr onclick="reopen('${r.id}')">✏️ تعديل</button></div></div>`;
 $('#ls').textContent='';pdfFor(r)}
function summaryText(r){const D=repData(r),{R,h,net}=D;return [`تقرير استلام سيارة خام ${r.code}`,`التاريخ: ${dateOf(r)}`,h.supplier&&`المورّد: ${h.supplier}`,h.plate&&`رقم العربية: ${h.plate}`,`الصنف: ${VN[h.variety]}${packLbl(r)?' · '+packLbl(r):''}`,net&&`الوزن الصافي: ${kgS(net)}`,`القرار: ${R.dtxt}`,`مسببات الأعفان: ${pc(R.dec)} · إجمالي العيوب: ${pc(D.totP)} · التصدير: ${pc(R.exp)}`,`العينة: ${R.N} ثمرة`,'العلا لفرز الحاصلات الزراعية'].filter(Boolean).join('\n')}
function pdfFor(r){const key=r.id+':'+r.updated;if(PDFC.key===key&&PDFC.p)return PDFC.p;PDFC={key,done:null,p:null};PDFC.p=buildPdf(r).then(o=>{if(PDFC.key===key)PDFC.done=o;return o});PDFC.p.catch(e=>{console.error(e);PDFC.key=null});return PDFC.p}
async function buildPdf(r){const pages=await renderPages(r);const jp=[];for(const c of pages){const b=await new Promise(ok=>c.toBlob(ok,'image/jpeg',0.86));jp.push({bytes:new Uint8Array(await b.arrayBuffer()),w:c.width,h:c.height})}return{blob:makePdf(jp),pages,name:r.code.replace(/[^\w-]/g,'_')+'.pdf'}}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
async function sharePdf(id){const r=recById(id);if(!r)return;let o=PDFC.done&&PDFC.key===r.id+':'+r.updated?PDFC.done:null;
 if(!o){toast('⏳ جاري تجهيز الـ PDF…');try{o=await pdfFor(r)}catch(e){return toast('تعذر تجهيز الـ PDF: '+(e.name||e))}}
 const file=new File([o.blob],o.name,{type:'application/pdf'});
 if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'تقرير '+r.code,text:'تقرير استلام '+r.code});return}catch(e){if(e.name==='AbortError')return;if(e.name==='NotAllowedError'){toast('الـ PDF جاهز – اضغط «مشاركة PDF» تاني',4000);return}}}
 dl(o.blob,o.name);$('#shareMsg').innerHTML=`<div class=warnb>المشاركة المباشرة مش مدعومة هنا – اتنزل الملف ${esc(o.name)}. ابعته من واتساب كمرفق، أو ابعت ملخص نصي: <button class=sm onclick="waText('${r.id}')">واتساب نص</button></div>`}
async function downloadPdf(id){const r=recById(id);try{const o=await pdfFor(r);dl(o.blob,o.name)}catch(e){toast('تعذر تجهيز الـ PDF')}}
function waText(id){const r=recById(id);window.open('https://wa.me/?text='+encodeURIComponent(summaryText(r)),'_blank')}
async function printPdf(id){const r=recById(id);toast('⏳ جاري التجهيز للطباعة…');let o;try{o=await pdfFor(r)}catch(e){return toast('تعذر التجهيز')}
 const pa=$('#printArea');pa.innerHTML=o.pages.map(c=>`<img src="${c.toDataURL('image/jpeg',0.9)}" alt="">`).join('');
 await Promise.all([...pa.querySelectorAll('img')].map(i=>i.decode?i.decode().catch(()=>{}):0));setTimeout(()=>window.print(),200)}

/* ---------- رسم التقرير على canvas (A4): صفحة البيانات والقرار، وبعدها صفحات الصور ---------- */
async function renderPages(r,opt={}){const D=repData(r),{R,h,N,net}=D,st=R.st;let PH=[];try{PH=await phOf(r.code)}catch(e){}
 try{await Promise.all(['400','700','800'].map(w=>document.fonts.load(w+' 24px Cairo')))}catch(e){}
 const IM=new Map();await Promise.all(PH.map(async p=>{try{const s=phSrc(p);if(s)IM.set(p.id,await loadImgEl(s))}catch(e){}}));await loadLh();const HDR=LHIMG[LH.header],FTR=LHIMG[LH.footer];
 const W=1240,H=1754,M=44,RX=W-M,CW=W-2*M;const FF='Cairo,"Geeza Pro","Noto Naskh Arabic",Tahoma,sans-serif';
 let x;const font=(s,w)=>{x.font=`${w||400} ${s}px ${FF}`};
 const T=(s,px,py,o={})=>{font(o.s||18,o.w);x.fillStyle=o.c||'#000';x.textAlign=o.a||'right';x.direction=o.d||'rtl';x.textBaseline='alphabetic';x.fillText(String(s??''),px,py,o.max||undefined)};
 const wrap=(s,maxW,sz,w)=>{font(sz,w);const out=[];let line='';String(s).split(/\s+/).forEach(wd=>{const t=line?line+' '+wd:wd;if(x.measureText(t).width>maxW&&line){out.push(line);line=wd}else line=t});if(line)out.push(line);return out};
 const cover=(img,dx,dy,dw,dh)=>{const sr=img.naturalWidth/img.naturalHeight,dr=dw/dh;let sw=img.naturalWidth,sh=img.naturalHeight,sx=0,sy=0;if(sr>dr){sw=sh*dr;sx=(img.naturalWidth-sw)/2}else{sh=sw/dr;sy=(img.naturalHeight-sh)/2}x.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh)};
 const box=(bx,by,bw,bh,lw)=>{x.strokeStyle='#000';x.lineWidth=lw||1;x.strokeRect(bx,by,bw,bh)};
 // جدول داخل عمود: rx = الحافة اليمين، w = العرض
 function tbl(rx,w,y,title,cols,rows){const sum=cols.reduce((a,c)=>a+c.w,0);cols=cols.map(c=>({...c,w:c.w/sum*w}));const rh=27,hh=27;
  x.fillStyle='#e6e6e6';x.fillRect(rx-w,y,w,30);x.fillStyle='#000';x.fillRect(rx-5,y,5,30);T(title,rx-12,y+22,{s:17,w:800,max:w-20});y+=32;
  x.fillStyle='#f3f3f3';x.fillRect(rx-w,y,w,hh);let cx=rx;cols.forEach(c=>{T(c.t,c.a==='c'?cx-c.w/2:cx-6,y+19,{s:13.5,w:700,c:'#333',a:c.a==='c'?'center':'right',max:c.w-6});cx-=c.w});y+=hh;
  rows.forEach(rw=>{if(rw.tot){x.fillStyle='#f3f3f3';x.fillRect(rx-w,y,w,rh);x.fillStyle='#000';x.fillRect(rx-w,y,w,1.5)}cx=rx;
   rw.c.forEach((v,i)=>{const c=cols[i];if(v&&typeof v==='object'&&v.bar!=null){const bw=Math.max(0,Math.min(1,v.bar))*(c.w-12);x.fillStyle='#666';x.fillRect(cx-6-bw,y+8,bw,11)}
    else{const o=v&&typeof v==='object'?v:{t:v};T(o.t,c.a==='c'?cx-c.w/2:cx-6,y+19,{s:15,w:rw.tot?800:(o.w||400),c:o.c||'#000',a:c.a==='c'?'center':'right',max:c.w-8});if(o.sub){font(15,rw.tot?800:(o.w||400));const mw=Math.min(x.measureText(String(o.t)).width,c.w-8);T(o.sub,cx-6-mw-8,y+19,{s:11.5,c:'#8a8a8a',max:Math.max(10,c.w-mw-20)})}}cx-=c.w});
   x.strokeStyle='#bbb';x.lineWidth=1;x.beginPath();x.moveTo(rx-w,y+rh);x.lineTo(rx,y+rh);x.stroke();y+=rh});
  box(rx-w,y-rows.length*rh-hh,w,rows.length*rh+hh,1);return y+10}
 /* 1) الورقة الواحدة: بنرسم على canvas طويل وبعدين بنصغّره لو لزم عشان يدخل صفحة A4 واحدة */
 const MM=H/297,HD=HDR?Math.round(HDR.naturalHeight/HDR.naturalWidth*W):Math.round(47.5*MM),FT=FTR?Math.round(FTR.naturalHeight/FTR.naturalWidth*W):Math.round(28*MM);
 const stamp=(pg,withHd)=>{const c=pg.getContext('2d');if(withHd&&HDR)c.drawImage(HDR,0,0,W,HD);if(FTR)c.drawImage(FTR,0,H-FT,W,FT)};
 const tall=document.createElement('canvas');tall.width=W;tall.height=3400;x=tall.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,3400);let y=8;
 T('تقرير استلام سيارة خام',RX,y+36,{s:30,w:800});
 T(r.code,M,y+18,{s:20,w:700,a:'left',d:'ltr'});T(dateOf(r),M,y+44,{s:18,a:'left',d:'ltr'});T([VN[h.variety]||'',packLbl(r)].filter(Boolean).join(' · '),M,y+70,{s:16,a:'left',c:'#333'});x.fillStyle='#000';x.fillRect(M,y+82,CW,3);y+=96;
 // البيانات الأساسية
 const K=[['المورّد',h.supplier],['رقم العربية',h.plate],['السواق',h.driver],['المنطقة',h.region],['عدد الصناديق',n(h.crates)?n(h.crates)+' صندوق':''],['متوسط الصندوق',h.avgc?h.avgc+' كجم':''],
  ['الوزن القائم',n(h.gross)?kgS(n(h.gross)):''],['الوزن الفارغ',n(h.tare)?kgS(n(h.tare)):''],['الوزن الصافي',net?kgS(net):'',1],['العينة',N+' ثمرة'+(n(h.sampKg)?' / '+n(h.sampKg)+' كجم':'')],['متوسط وزن الثمرة',R.avgW?f0(R.avgW)+' جم':''],['الجودة',[h.brix&&'بريكس '+h.brix,h.acid&&'حموضة '+h.acid,h.juice&&'عصير '+h.juice,h.color&&'لون '+h.color+'/5'].filter(Boolean).join(' · ')]];
 const kc=6,kw=CW/kc,kh=56;K.forEach((kv,i)=>{const cx=RX-(i%kc)*kw,cy=y+Math.floor(i/kc)*kh;box(cx-kw,cy,kw,kh,kv[2]?2.5:1);T(kv[0],cx-8,cy+20,{s:13.5,c:'#555',w:700});T(kv[1]||'—',cx-8,cy+46,{s:18,w:800,max:kw-14})});y+=2*kh+12;
 // صندوق القرار
 const why=R.why.flatMap(w=>wrap('• '+w,CW-300,16));const bh=Math.max(96,22+why.length*23+14);
 x.fillStyle={ok:'#dcfce7',mid:'#fef3c7',bad:'#fee2e2'}[R.cl]||'#f2f2f2';x.fillRect(M,y,CW,bh);box(M+1.5,y+1.5,CW-3,bh-3,3);T('القرار',RX-14,y+26,{s:15,w:700,c:'#444'});T(R.dtxt,RX-14,y+66,{s:30,w:800,max:270});
 x.fillStyle='#000';x.fillRect(RX-290,y+12,1.5,bh-24);why.forEach((l,i)=>T(l,RX-305,y+30+i*23,{s:16,w:600}));y+=bh+8;
 if(R.warn.length){const wl=R.warn.flatMap(w=>wrap('⚠ '+w,CW-24,15,700));const wh=wl.length*22+12;x.setLineDash([7,5]);box(M,y,CW,wh,1.5);x.setLineDash([]);wl.forEach((l,i)=>T(l,RX-12,y+24+i*22,{s:15,w:700}));y+=wh+8}
 // المؤشرات الرئيسية للقرار
 const KP=[['مسببات الأعفان',pc(R.dec),`قبول ≤ ${st.decOk}% · رفض > ${st.decMax}%`],['نسبة التصدير',pc(R.exp),`قبول ≥ ${st.expOk}% · رفض < ${st.expMin}%`],['تشوهات رئيسية',pc(R.maj),`المسموح ${st.defTol}%`],['إجمالي العيوب',pc(D.totP),`${D.tot} ثمرة من ${N}`],['الخصم المقترح',R.ded>0?pc(R.ded):'لا يوجد',R.ded>0&&net?kgS(net*R.ded/100):'']];
 const pw=CW/5,ph=78;KP.forEach((k,i)=>{const cx=RX-i*pw;box(cx-pw+3,y,pw-6,ph,2);T(k[0],cx-pw/2,y+22,{s:14.5,w:700,c:'#444',a:'center'});T(k[1],cx-pw/2,y+54,{s:27,w:800,a:'center'});T(k[2],cx-pw/2,y+72,{s:12.5,c:'#555',a:'center',max:pw-14})});y+=ph+10;
 // عمودين: يمين الأحجام + التوزيع + التشوهات · شمال المسببات + فحص العربية
 const gap=18,cw2=(CW-gap)/2,rR=RX,rL=M+cw2;const mx=Math.max(1,...D.vn);let yR=y,yL=y;
 yR=tbl(rR,cw2,yR,(R.mur?'شرائح الوزن':'توزيع الأحجام')+` (${N} ثمرة)`,[{t:R.mur?'الوزن جم':'الحجم',w:3.4},{t:'عدد',w:1,a:'c'},{t:'%',w:1.1,a:'c'},{t:'',w:1.4},{t:'كجم',w:1.5,a:'c'},{t:'تصدير',w:.9,a:'c'}],
  [...R.keys.map((k,i)=>({c:[{t:k,c:R.isE(k)?'#000':'#777',sub:szInfo(k,r,st,1)},String(D.vn[i]),N?(D.vn[i]/N*100).toFixed(1)+'%':'—',{bar:D.vn[i]/mx},net?f0(D.szKg[i]):'—',R.isE(k)?'✓':'✗']})),{tot:1,c:['الإجمالي',String(N),N?'100%':'—',`تصدير ${N-R.off} · خارج ${R.off}`,net&&N?f0(net):'—','']}]);
 {const z=R.keys.some(k=>szInfo(k,r,st,1));if(z){T('القطر من جدول مقاسات البرتقال والليمون · ≈ تقريبي · الجرامات = وزن الحبة التقريبي',rR-4,yR+6,{s:11.5,c:'#8a8a8a',max:cw2-8});yR+=18}}
 yR=tbl(rR,cw2,yR,'توزيع العربية التقديري',[{t:'البند',w:2.6},{t:'%',w:1.1,a:'c'},{t:'',w:2},{t:'كجم',w:1.4,a:'c'}],[...D.dist.map(d=>({c:[d[0],d[1].toFixed(1)+'%',{bar:d[1]/100},net?f0(d[2]):'—']})),{tot:1,c:['الإجمالي','100%','',net?f0(net):'—']}]);
 const phc=k=>PH.filter(p=>p.cause==k).length;
 const dRows=(L,ttl)=>{const t=L.reduce((a,o)=>a+o.x,0);return[...(L.length?L.map(o=>({c:[o.l+(o.c=='M'?' (رئيسي)':o.c=='m'?' (ثانوي)':'')+(o.nt?' – '+o.nt:''),String(o.x),N?(o.x/N*100).toFixed(1)+'%':'—',net&&N?f0(net*o.x/N):'—',phc(o.k)?String(phc(o.k)):'']})):[{c:['لا يوجد','','','','']}]),{tot:1,c:[ttl,String(t),N?(t/N*100).toFixed(1)+'%':'—',net&&N?f0(net*t/N):'—','']}]};
 const dCols=[{t:'السبب',w:3.6},{t:'عدد',w:.9,a:'c'},{t:'%',w:1.1,a:'c'},{t:'كجم',w:1.2,a:'c'},{t:'صور',w:.8,a:'c'}];
 yL=tbl(rL,cw2,yL,'مسببات الأعفان',dCols,dRows(D.rows.filter(o=>o.c=='d'),'إجمالي المسببات'));
 yR=tbl(rR,cw2,yR,'التشوهات والعيوب',dCols,dRows(D.rows.filter(o=>o.c!='d'),'إجمالي التشوهات'));
 yL=tbl(rL,cw2,yL,'فحص العربية عند الوصول',[{t:'البند',w:2},{t:'',w:.6,a:'c'},{t:'الحالة',w:2.6}],CF.map(([k,l,o])=>{const v=n(D.c.c[k]);return{c:[l,v?'✗':'✓',{t:o[v],w:v?800:400}]}}));
 if(D.c.notes){const L=wrap('ملاحظات الاستلام: '+D.c.notes,cw2-12,15);L.slice(0,4).forEach(l=>{T(l,rL-6,yL+16,{s:15});yL+=22});yL+=6}
 // صور مصغرة (في العمود الشمال لو فيه مكان)
 const PL=PH.filter(p=>IM.get(p.id));if(PL.length){const tw=(cw2-3*8)/4,th=tw*0.72;T(`صور (${PL.length}) – بالحجم الكامل في الصفحات التالية`,rL-6,yL+16,{s:14,w:700,c:'#444'});yL+=24;
  PL.slice(0,8).forEach((p,i)=>{const cx=rL-(i%4)*(tw+8),cy=yL+Math.floor(i/4)*(th+24);cover(IM.get(p.id),cx-tw,cy,tw,th);box(cx-tw,cy,tw,th,1);T(DN[p.cause]||'',cx-tw/2,cy+th+17,{s:12.5,a:'center',max:tw})});yL+=Math.ceil(Math.min(8,PL.length)/4)*(th+24)+6}
 y=Math.max(yR,yL)+6;
 // التوقيعات
 y+=40;const f3=CW/3;['مسئول الاستلام','مسئول الجودة','المورد / السائق'].forEach((l,i)=>{const cx=RX-i*f3;x.fillStyle='#000';x.fillRect(cx-f3+30,y,f3-60,1.5);T(l,cx-f3/2,y+24,{s:16,w:700,a:'center'})});y+=40;
 T('الحدود قيم افتراضية قابلة للتعديل في الإعدادات وليست مواصفة رسمية · كل ثمرة مسجلة تحت أكبر عيب فيها · صدر '+fmtTs(r.issuedAt||Date.now()),RX,y+14,{s:12.5,c:'#666'});y+=24;
 const contentH=y;const sheet=document.createElement('canvas');sheet.width=W;sheet.height=H;x=sheet.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);
 const bodyTop=HD+6,bodyBot=H-FT-22,bodyH=Math.max(200,bodyBot-bodyTop);const sc=Math.min(1,bodyH/contentH);const dw=W*sc;
 x.drawImage(tall,0,0,W,contentH,(W-dw)/2,bodyTop,dw,contentH*sc);tall.width=tall.height=1;
 const pages=[sheet];if(opt.sheetOnly){stamp(sheet,1);return pages}
 /* 2) صفحات الصور بالحجم الكامل (في ملف الـ PDF بعد الورقة الأساسية) */
 const photoTop=M+8,photoBot=H-FT-22;
 if(PL.length){let pg,yy2;const gw=(CW-20)/2,gh=470;const np=()=>{pg=document.createElement('canvas');pg.width=W;pg.height=H;x=pg.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);pages.push(pg);T('صور تقرير '+r.code,RX,photoTop+30,{s:24,w:800});T(dateOf(r),M,photoTop+30,{s:18,a:'left',d:'ltr'});x.fillStyle='#000';x.fillRect(M,photoTop+44,CW,2);yy2=photoTop+64};
  np();let i=0;PL.forEach(p=>{if(yy2+gh+40>photoBot){np();i=0}const col=i%2,cx=RX-col*(gw+20);cover(IM.get(p.id),cx-gw,yy2,gw,gh);box(cx-gw,yy2,gw,gh,1);
   T((DN[p.cause]||p.cause)+(p.cause!=='truck'?` — ${n(D.c.d[p.cause])} ثمرة (${N?(n(D.c.d[p.cause])/N*100).toFixed(1):0}%)`:''),cx-gw/2,yy2+gh+28,{s:19,w:700,a:'center',max:gw});if(col===1)yy2+=gh+46;i++});
  if(i%2===1){} }
 pages.forEach((p,i)=>{x=p.getContext('2d');stamp(p,i===0);if(pages.length>1)T(`صفحة ${i+1} من ${pages.length}`,W/2,H-FT-10,{s:13,c:'#888',a:'center'})});
 return pages}

function makePdf(imgs){const enc=new TextEncoder(),parts=[],off=[];let len=0;const push=b=>{if(typeof b==='string')b=enc.encode(b);parts.push(b);len+=b.length};
 const PW=595.28,PHt=841.89,cnt=2+imgs.length*3;push('%PDF-1.4\n%\u00ff\u00ff\n');
 const obj=(i,body)=>{off[i]=len;push(i+' 0 obj\n');body();push('\nendobj\n')};
 obj(1,()=>push('<< /Type /Catalog /Pages 2 0 R >>'));
 obj(2,()=>push('<< /Type /Pages /Count '+imgs.length+' /Kids ['+imgs.map((_,k)=>(3+k*3)+' 0 R').join(' ')+'] >>'));
 imgs.forEach((im,k)=>{const p=3+k*3,cs='q '+PW+' 0 0 '+PHt+' 0 0 cm /Im0 Do Q';
  obj(p,()=>push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PHt}] /Resources << /XObject << /Im0 ${p+1} 0 R >> >> /Contents ${p+2} 0 R >>`));
  obj(p+1,()=>{push(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`);push(im.bytes);push('\nendstream')});
  obj(p+2,()=>push(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`))});
 const xref=len;let xr='xref\n0 '+(cnt+1)+'\n0000000000 65535 f \n';for(let i=1;i<=cnt;i++)xr+=String(off[i]).padStart(10,'0')+' 00000 n \n';push(xr+`trailer\n<< /Size ${cnt+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
 return new Blob(parts,{type:'application/pdf'})}

/* ---------- الإعدادات ---------- */
async function renderSettings(){let est='',per='';try{const e=await navigator.storage.estimate();est=`المستخدم على الجهاز ≈ ${(e.usage/1048576).toFixed(1)} ميجا`}catch(e){}try{per=await navigator.storage.persisted()?'التخزين دائم ✓':'التخزين عادي (سفاري ممكن يمسحه لو البرنامج متفتحش أسابيع – أضفه للشاشة الرئيسية)'}catch(e){}
 V().innerHTML=`<div class=card><h2>الإعدادات (حدود قابلة للتعديل)</h2><div class=grid>${SETF.map(([k,l,t])=>`<label class=f>${l}<input data-set=${k} type=${t||'number'} inputmode=${t?'text':'decimal'} value="${esc(ST[k])}"></label>`).join('')}</div><p class=note>دي قيم افتراضية عملية وليست مواصفة رسمية. التغيير بيأثر على العربيات تحت التسجيل بس – التقارير الصادرة بتفضل بإعداداتها وقت الإصدار.</p><button class=gr onclick="resetSet()">رجّع الإعدادات الافتراضية</button></div>
 <div class=card><h2>البيانات</h2>${STORE_NOTE()}<p class=note>كل البيانات والصور على الجهاز ده بس. ${esc(est)}${est?' · ':''}${esc(per)}</p><button class=gr onclick="exportCSV()">⬇ تصدير Excel</button> <button class=gr onclick="backupJSON()">⬇ نسخة احتياطية (بدون صور)</button><p class=note>نسخة البرنامج ${APP_VER}</p></div>`}
document.addEventListener('input',e=>{const t=e.target,k=t.dataset.set;if(!k)return;ST[k]=t.type=='number'?n(t.value):t.value;saveSet();$('#ls').textContent='✓ اتحفظت الإعدادات'});
function resetSet(){if(!confirm('ترجع كل الإعدادات للقيم الافتراضية؟'))return;ST={...DSET,v2:1};saveSet();renderSettings()}
function exportCSV(){const H=['الكود','التاريخ','رقم العربية','السواق','المورد','المنطقة','الصنف','صناديق','الصافي كجم','ثمار العينة','متوسط وزن الثمرة جم','تصدير %','محلي %','مسببات أعفان %','إجمالي العيوب %','خصم %','القرار'];
 const rows=RECS.filter(r=>r.status==='issued'&&!r.archived).map(r=>{const D=repData(r),R=D.R,h=D.h;return[r.code,fmtLocal(h.dt),h.plate,h.driver,h.supplier,h.region,VN[h.variety],h.crates,h.net,R.N,Math.round(R.avgW),f1(R.exp),f1(R.loc),f1(R.dec),f1(D.totP),f1(R.ded),R.dtxt]});
 const csv='\ufeff'+[H,...rows].map(r=>r.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');dl(new Blob([csv],{type:'text/csv;charset=utf-8'}),'receiving.csv')}
function backupJSON(){dl(new Blob([JSON.stringify({app:'receiving',ver:APP_VER,at:new Date().toISOString(),records:RECS,settings:ST},null,1)],{type:'application/json'}),'receiving-backup.json')}

/* ---------- التشغيل ---------- */
(async function boot(){loadOld();await loadRecs();try{await migrate()}catch(e){console.error(e)}
 const o=lsGet(OPEN);if((!location.hash||location.hash==='#home')&&o&&o.id){const r=recById(o.id);if(r&&r.status==='draft'&&!r.archived){history.replaceState(null,'','#w/'+r.id+'/'+(o.step??r.step));toast('↩ رجعتلك لنفس العربية ونفس الخطوة')}}
 route()})();
