import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
const URL = "https://nrxmivvqwcyelqxfrelz.supabase.co";
const KEY = "sb_publishable_5fqLOu2xFkW0S4LxpJQPkw_MfqKwSIg"; // Public client key, NEVER service_role
const sb = createClient(URL, KEY, {auth:{flowType:"pkce",persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $ = id => document.getElementById(id);
let currentUser=null, generation=0;
function message(text){$("auth-status").textContent=text;}
function state(user){currentUser=user; $("auth-email").textContent=user?.email||"";$("auth-panel").hidden=!!user;$("account-panel").hidden=!user;}
function broadcast(detail){document.dispatchEvent(new CustomEvent("dutch-auth-state",{detail}));}
async function refreshUser(){
  const turn=++generation;
  const {data:{user},error}=await sb.auth.getUser();
  if(turn!==generation)return;
  if(error||!user){state(null);broadcast({user:null});return;}
  state(user);
  const [profile,submissions]=await Promise.all([
    sb.from("learner_profiles").select("level,daily_minutes,goal,explanation_language").eq("user_id",user.id).maybeSingle(),
    sb.from("learning_submissions").select("exercise_id,answer_nl,created_at").eq("user_id",user.id).eq("lesson_id","demo-day32").order("created_at",{ascending:false}).limit(200)
  ]);
  if(turn!==generation)return;
  const answers={};
  if(!submissions.error) for(const entry of submissions.data||[]) if(!(entry.exercise_id in answers)) answers[entry.exercise_id]=entry.answer_nl;
  message(profile.error||submissions.error?"已登入，但雲端資料讀取失敗。請稍後重試。":"已登入，雲端紀錄已載入。");
  broadcast({user,profile:profile.data||null,answers,loadError:!!(profile.error||submissions.error)});
}
window.dutchCloud={
  get user(){return currentUser;},
  async loadCurriculum(){
    if(!currentUser)throw new Error("請先登入");
    const owner=currentUser.id;
    const {data,error}=await sb.from("learner_curriculum_state")
      .select("drafts,studied,reviews,updated_at").eq("user_id",owner).maybeSingle();
    if(error)throw error;
    if(!currentUser || currentUser.id!==owner)throw new Error("登入帳戶已更改；請重新操作");
    return data;
  },
  async saveCurriculum(snapshot){
    if(!currentUser)throw new Error("請先登入");
    const owner=currentUser.id;
    if(!snapshot || ["drafts","studied","reviews"].some(k =>
      !snapshot[k] || Array.isArray(snapshot[k]) || typeof snapshot[k]!=="object"
    ))throw new Error("學習資料格式無效");
    const payload=JSON.stringify(snapshot);
    if(payload.length>45000)throw new Error("學習資料過大，暫時無法上傳");
    const {error}=await sb.from("learner_curriculum_state").upsert({
      user_id:owner,drafts:snapshot.drafts,studied:snapshot.studied,
      reviews:snapshot.reviews,updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
    if(error)throw error;
    if(!currentUser || currentUser.id!==owner)throw new Error("儲存期間登入帳戶已更改；請重新登入核對");
  },
  async saveSettings(p){
    if(!currentUser)throw new Error("請先登入");
    const {error}=await sb.from("learner_profiles").upsert({
      user_id:currentUser.id,level:p.level,daily_minutes:Number(p.minutes),
      goal:p.goal,explanation_language:p.language,updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
    if(error)throw error;
  },
  async saveAnswers(answers){
    if(!currentUser)throw new Error("請先登入");
    const rows=Object.entries(answers).filter(([id,answer])=>Number.isInteger(Number(id))&&Number(id)>=1&&Number(id)<=12&&typeof answer==="string"&&answer.trim()).map(([id,answer])=>({
      user_id:currentUser.id,lesson_id:"demo-day32",exercise_id:Number(id),answer_nl:answer.trim().slice(0,1500)
    }));
    if(!rows.length)throw new Error("請先填寫至少一題");
    const {error}=await sb.from("learning_submissions").insert(rows);
    if(error)throw error;
    return rows.length;
  }
};
$("signin-form").addEventListener("submit",async e=>{
  e.preventDefault();
  const email=$("signin-email").value.trim();
  if(!email)return;
  $("signin-send").disabled=true;message("正在發送登入電郵…");
  try{
    const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
    if(error)throw error;
    message("已發送登入連結。請檢查電郵，包括垃圾郵件；如果失敗，請核對 Supabase Auth Redirect URLs。");
  }catch(err){message("登入連結未能發送："+(err.message||"未知錯誤"));}
  finally{$("signin-send").disabled=false;}
});
$("signout").addEventListener("click",async()=>{message("正在登出…");const {error}=await sb.auth.signOut();if(error)message("登出失敗："+error.message);});
sb.auth.onAuthStateChange(()=>{queueMicrotask(()=>{void refreshUser();});});
void refreshUser();
