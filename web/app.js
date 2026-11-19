"use strict";
const course=window.COURSE;
const PREFIX="dutch-learning-prototype-v2-";
let accountId=null;
const scopedKey = key => (accountId ? "account-"+accountId+"-"+key : "guest-"+key);
const defaults={name:"",level:"A2",minutes:"15",goal:"daily",language:"zh-en"};
const el=id=>document.getElementById(id);
function load(key,fallback){try{const raw=JSON.parse(localStorage.getItem(PREFIX+key));return raw??fallback;}catch{return fallback;}}
function store(key,value){try{localStorage.setItem(PREFIX+key,JSON.stringify(value));return true;}catch{return false;}}
const safe=(value)=>String(value??"");
let prefs={...defaults,...load(scopedKey("preferences"),load("preferences",{}))};
let answers=load(scopedKey("answers"),load("answers",{}));if(!answers||Array.isArray(answers)||typeof answers!=="object")answers={};
function tab(name){document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));document.querySelectorAll(".pane").forEach(s=>s.classList.toggle("active",s.id===name));}
document.querySelectorAll("nav button").forEach(b=>b.addEventListener("click",()=>tab(b.dataset.tab)));
const form=el("preferences");for(const [key,value] of Object.entries(prefs)){if(form.elements.namedItem(key))form.elements.namedItem(key).value=value;}
form.addEventListener("submit",async e=>{e.preventDefault();const data=new FormData(form);prefs={name:safe(data.get("name")).trim().slice(0,60),level:safe(data.get("level")),minutes:safe(data.get("minutes")),goal:safe(data.get("goal")),language:safe(data.get("language"))};const ok=store(scopedKey("preferences"),prefs);el("settings-status").textContent=ok?"設定已儲存在呢個瀏覽器。":"無法本機儲存。";if(window.dutchCloud?.user){try{await window.dutchCloud.saveSettings(prefs);el("settings-status").textContent="設定已同步至帳戶（顯示名稱只儲存在本機）。";}catch(error){el("settings-status").textContent="本機設定已儲存，但雲端同步失敗："+error.message;}}refresh();});
function refresh(){el("welcome").textContent=prefs.name?"歡迎，"+prefs.name:"歡迎開始學習";el("current-level").textContent=prefs.level;el("session-minutes").textContent=prefs.minutes+" 分鐘";el("progress-count").textContent=Object.values(answers).filter(x=>typeof x==="string"&&x.trim()).length+" / "+course.questions.length;const goals={daily:"生活對話",work:"職場及求職",exam:"考試準備"};el("learning-path").textContent="目前選擇："+prefs.level+" · "+(goals[prefs.goal]||"日常生活")+" · 每日 "+prefs.minutes+" 分鐘。將來會根據程度測試與答題表現安排課程；暫時只有一組示範練習，並未啟用個人化推薦。";}
function make(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
const words=el("words-list");const heading=make("div",undefined,"word");["Nederlands","English","繁體中文"].forEach(v=>heading.append(make("span",v)));words.append(heading);course.words.forEach(w=>{const row=make("div",undefined,"word");[w.nl,w.en,w.zh].forEach(v=>row.append(make("span",v)));words.append(row);});
const questions=el("questions-list");course.questions.forEach(q=>{const box=make("article",undefined,"question");box.append(make("h3",q.id+". "+q.en),make("p",q.zh));const input=make("textarea");input.setAttribute("aria-label","第 "+q.id+" 題嘅荷蘭文答案");input.value=answers[q.id]||"";input.addEventListener("input",()=>{answers[q.id]=input.value;el("save-status").textContent=store(scopedKey("answers"),answers)?"答案已儲存在本機。":"無法儲存答案。";refresh();});box.append(input);const hint=make("div","詞庫："+q.bank,"hint hidden");hint.dataset.hint="true";box.append(hint);const compare=make("button","對照參考答案");compare.type="button";const feedback=make("div",undefined,"comparison hidden");compare.addEventListener("click",()=>{feedback.replaceChildren();feedback.append(make("strong","參考句子："),make("p",q.sample_nl));feedback.append(make("p","你嘅答案："+(input.value.trim()||"（尚未作答）")));feedback.append(make("p","請比較語序、動詞變位、冠詞同用詞。呢度未有 AI 判分；不同句式亦可能正確。"));feedback.classList.toggle("hidden");});box.append(compare,feedback);questions.append(box);});
el("hints").addEventListener("change",e=>document.querySelectorAll("[data-hint]").forEach(x=>x.classList.toggle("hidden",!e.target.checked)));
el("start-practice").addEventListener("click",()=>tab("practice"));
el("export").addEventListener("click",()=>{const output={schema_version:2,exported_at:new Date().toISOString(),preferences:prefs,answers:course.questions.map(q=>({question_id:q.id,answer:answers[q.id]||""}))};const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download="dutch-learning-my-answers.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
el("clear").addEventListener("click",()=>{if(!confirm("確定清除呢個瀏覽器入面全部示範練習答案？建議先匯出。"))return;answers={};document.querySelectorAll("#questions-list textarea").forEach(t=>t.value="");store(scopedKey("answers"),answers);el("save-status").textContent="本機答案已清除。";refresh();});
el("question-draft").value=load(scopedKey("question-draft"),"");el("question-draft").addEventListener("input",e=>{el("question-status").textContent=store(scopedKey("question-draft"),e.target.value)?"草稿已儲存在本機。":"無法儲存草稿。";});
refresh();

el("cloud-save").addEventListener("click", async event => {
  if (!window.dutchCloud?.user) {
    el("save-status").textContent = "請先用電郵登入，先可以同步答案。";
    return;
  }
  const button = event.currentTarget;
  button.disabled = true;
  el("save-status").textContent = "正在同步答案…";
  try {
    const count = await window.dutchCloud.saveAnswers(answers);
    el("save-status").textContent = "已成功將 " + count + " 題儲存到你嘅帳戶。";
  } catch (err) {
    el("save-status").textContent = "雲端同步失敗：" + (err.message || "未知錯誤");
  } finally { button.disabled = false; }
});

document.addEventListener("dutch-auth-state", event => {
  const { user, profile, answers: cloudAnswers, loadError } = event.detail;
  accountId = user?.id || null;
  prefs = { ...defaults, ...load(scopedKey("preferences"), {}) };
  answers = load(scopedKey("answers"), {});
  if (!answers || Array.isArray(answers) || typeof answers !== "object") answers = {};
  if (user && !loadError) {
    if (profile) {
      prefs = {
        ...prefs,
        level: profile.level,
        minutes: String(profile.daily_minutes),
        goal: profile.goal,
        language: profile.explanation_language
      };
    }
    answers = { ...answers, ...cloudAnswers };
    store(scopedKey("answers"), answers);
    store(scopedKey("preferences"), prefs);
  }
  for (const [field, value] of Object.entries(prefs)) {
    if (form.elements.namedItem(field)) form.elements.namedItem(field).value = value;
  }
  course.questions.forEach((q, i) => {
    const input = document.querySelectorAll("#questions-list textarea")[i];
    if (input) input.value = answers[q.id] || "";
  });
  el("question-draft").value = load(scopedKey("question-draft"), "");
  el("save-status").textContent = user
    ? "已切換至你嘅帳戶；雲端同步需要按「儲存答案到雲端」。"
    : "訪客模式：答案只儲存在呢個瀏覽器。";
  refresh();
});
