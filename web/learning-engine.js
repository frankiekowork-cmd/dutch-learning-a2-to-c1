"use strict";
(function(root){
 const DAY_MS=86400000;
 const schedule=[1,3,7,14,30];
 function validDate(s){const d=new Date(s);return Number.isFinite(d.getTime())?d:null;}
 function dueOn(timestamp,day=Date.now()){const d=validDate(timestamp);return !!d&&d.getTime()<=day;}
 function update(old,correct,now=new Date().toISOString()){
   const previous=old&&typeof old==="object"?old:{};
   const oldStreak=Number.isInteger(previous.streak)&&previous.streak>=0?previous.streak:0;
   const streak=correct?Math.min(5,oldStreak+1):0;
   const delay=correct?schedule[Math.min(streak-1,schedule.length-1)]:1;
   return {streak,last_attempt_at:now,last_correct:!!correct,next_review_at:new Date(new Date(now).getTime()+delay*DAY_MS).toISOString(),attempts:Math.max(0,Number(previous.attempts)||0)+1};
 }
 function getDue(questions,progress,now=Date.now()){
   return questions.filter(q=>progress[q.id] && dueOn(progress[q.id].next_review_at,now));
 }
 function recommendation(lessons,preferences,studied,questions,progress,now=Date.now()){
   const due=getDue(questions,progress,now);
   if(due.length){const lesson=lessons.find(l=>l.id===due[0].lesson_id);if(lesson)return {lesson,reason:"review",dueCount:due.length};}
   const level=preferences.level||"A2";
   const byLevel=lessons.filter(x=>x.level===level);
   const remaining=byLevel.filter(x=>!studied[x.id]);
   const choice=remaining.find(x=>x.goal===preferences.goal)||remaining[0]||byLevel.find(x=>x.goal===preferences.goal)||byLevel[0]||lessons[0];
   return choice?{lesson:choice,reason:remaining.includes(choice)?"new":"repeat",dueCount:0}:null;
 }
 root.LEARNING_ENGINE={update,getDue,recommendation,dueOn};
})(typeof window!=="undefined"?window:globalThis);
