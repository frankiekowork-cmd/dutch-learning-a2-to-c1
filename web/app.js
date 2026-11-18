"use strict";
const course=window.COURSE;const key="dutch-learning-day32-draft-v1";
const $=id=>document.getElementById(id);
let draft=[];try{const raw=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(raw))draft=raw.map(x=>typeof x==="string"?x:"");}catch{};
const save=()=>{try{localStorage.setItem(key,JSON.stringify(draft));$("save-status").textContent="答案已儲存在此瀏覽器。";}catch{$("save-status").textContent="無法儲存至瀏覽器，請立即匯出答案。";}};
function node(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
document.querySelectorAll("nav button").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".pane").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active");}));
const list=$("words-list");const head=node("div","word");["Nederlands","English","繁體中文"].forEach(t=>head.append(node("span","",t)));list.append(head);course.words.forEach(w=>{const row=node("div","word");[w.nl,w.en,w.zh].forEach(t=>row.append(node("span","",t)));list.append(row);});
course.questions.forEach((q,i)=>{const card=node("article","question");card.append(node("h3","",`${i+1}. ${q.en}`));card.append(node("p","",q.zh));const input=node("textarea");input.setAttribute("aria-label",`第${i+1}題荷蘭語答案`);input.value=draft[i]||"";input.addEventListener("input",()=>{draft[i]=input.value;save();});card.append(input);const hint=node("div","hint hidden","詞庫："+q.bank);hint.dataset.hint="";card.append(hint);const sample=node("div","sample hidden","參考："+q.sample_nl);sample.dataset.sample="";card.append(sample);$("questions").append(card);});
$("hints").addEventListener("change",e=>document.querySelectorAll("[data-hint]").forEach(x=>x.classList.toggle("hidden",!e.target.checked)));
$("show-samples").addEventListener("click",()=>document.querySelectorAll("[data-sample]").forEach(x=>x.classList.toggle("hidden")));
$("export").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({day:32,exported_at:new Date().toISOString(),answers:course.questions.map((q,i)=>({question:i+1,answer:draft[i]||""}))},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="day32-answers.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$("clear").addEventListener("click",()=>{if(!confirm("確定清空此瀏覽器中的 Day 32 草稿？請先匯出備份。"))return;draft=[];document.querySelectorAll(".question textarea").forEach(x=>x.value="");save();});
