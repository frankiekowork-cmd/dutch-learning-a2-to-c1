"use strict";
(() => {
  // Explicit release gate. Never enable until live API, RLS, budgets and privacy are reviewed.
  const ENABLED = false;
  const $ = id => document.getElementById(id);
  const add = (tag,text) => { const e=document.createElement(tag); if(text!==undefined)e.textContent=text; return e; };
  const signedIn = () => !!window.dutchCloud?.user;
  function renderGrading(result,target) {
    target.replaceChildren();
    const verdict = {correct:"答案正確",acceptable_alternative:"正確嘅其他表達",needs_revision:"建議修改"};
    target.append(add("strong",verdict[result.verdict]||"AI 建議"));
    for(const text of [
      result.corrected_nl,
      result.explanation_en,
      result.explanation_zh,
      ...(Array.isArray(result.issues)?result.issues.map(x=>
        (x.suggested||"")+" — "+(x.explanation_en||"")+" / "+(x.explanation_zh||"")):[])
    ]) if(typeof text==="string"&&text.trim())target.append(add("p",text));
    target.append(add("p","AI 批改可能有錯；唔代表正式 CEFR 評估。"));
  }
  document.querySelectorAll("#questions-list .question").forEach((card,index)=>{
    const btn=add("button",ENABLED?"使用 AI 批改答案":"AI 批改尚未啟用");
    btn.type="button";
    btn.disabled=!ENABLED;
    const output=add("div");
    output.setAttribute("role","status");
    output.className="comparison";
    output.hidden=true;
    btn.addEventListener("click",async()=>{
      const answer=card.querySelector("textarea").value.trim();
      output.hidden=false;
      if(!signedIn()){output.textContent="請先登入";return;}
      if(!answer){output.textContent="請先輸入荷蘭文答案";return;}
      btn.disabled=true;
      output.textContent="正在分析答案…";
      try{
        const level=$("preferences").elements.namedItem("level").value||"A2";
        const feedback=await window.dutchCloud.tutor({
          mode:"grade",exercise_id:index+1,level,answer_nl:answer
        });
        renderGrading(feedback,output);
      }catch(e){output.textContent="暫時無法批改："+(e.message||"未知錯誤");}
      finally{btn.disabled=!ENABLED;}
    });
    card.append(btn,output);
  });
  const ask=$("ask-ai");
  ask.disabled=!ENABLED;
  ask.textContent=ENABLED?"向 AI 老師提問":"向 AI 老師提問（尚未啟用）";
  ask.addEventListener("click",async()=>{
    const question=$("question-draft").value.trim();
    const result=$("ai-answer");
    result.replaceChildren();
    if(!signedIn()){result.textContent="請先登入";return;}
    if(!question){result.textContent="請先輸入問題";return;}
    ask.disabled=true;result.textContent="正在準備回應…";
    try{
      const level=$("preferences").elements.namedItem("level").value||"A2";
      const feedback=await window.dutchCloud.tutor({mode:"ask",level,question});
      result.replaceChildren();
      for(const value of [feedback.answer_nl,feedback.answer_en,feedback.answer_zh,...(Array.isArray(feedback.examples_nl)?feedback.examples_nl:[])])
        if(typeof value==="string")result.append(add("p",value));
      result.append(add("p","AI 回應僅供學習參考，請核實重要資訊。"));
    }catch(e){result.textContent="暫時無法回答："+(e.message||"未知錯誤");}
    finally{ask.disabled=!ENABLED;}
  });
})();
