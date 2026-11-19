"use strict";
(() => {
  const $=id=>document.getElementById(id);
  let accountId=null;
  const prefixes={
    drafts:"dutch-learning-curriculum-v1-",
    studied:"dutch-learning-curriculum-v1-",
    reviews:"dutch-review-v1-"
  };
  function storageKey(kind,id=accountId){
    const base=prefixes[kind];
    return base+"account-"+id+(kind==="reviews"?"":"-"+kind);
  }
  function read(kind){
    try{
      const value=JSON.parse(localStorage.getItem(storageKey(kind))||"{}");
      return value&&!Array.isArray(value)&&typeof value==="object"?value:{};
    }catch{return {};}
  }
  const valid=record=>record&&!Array.isArray(record)&&typeof record==="object";
  function snapshot(){
    return {drafts:read("drafts"),studied:read("studied"),reviews:read("reviews")};
  }
  function status(text){$("sync-status").textContent=text;}
  function refreshControls(){
    const available=!!accountId&&!!window.dutchCloud?.user?.id&&window.dutchCloud.user.id===accountId;
    $("upload-curriculum").disabled=!available;
    $("download-curriculum").disabled=!available;
    if(!available)status("訪客模式：請先登入先可以使用課程雲端同步。");
  }
  function setBusy(busy){
    $("upload-curriculum").disabled=busy;
    $("download-curriculum").disabled=busy;
    if(!busy)refreshControls();
  }
  $("upload-curriculum").addEventListener("click",async()=>{
    if(!accountId||accountId!==window.dutchCloud?.user?.id)return status("請先登入");
    const owner=accountId;
    const data=snapshot();
    if(!confirm("將目前裝置嘅課程草稿、完成標記同重溫紀錄上傳？會覆蓋此帳戶原有嘅雲端課程進度。"))return;
    setBusy(true);status("正在上傳課程進度…");
    try{
      const current=await window.dutchCloud.loadCurriculum();
      if(owner!==accountId)throw new Error("登入帳戶已改變");
      if(current && !confirm("雲端已有課程紀錄（最後更新："+current.updated_at+"）。確定要用本機內容覆蓋雲端版本？"))return status("已取消上傳，雲端紀錄保持不變。");
      await window.dutchCloud.saveCurriculum(data);
      if(owner!==accountId)throw new Error("登入帳戶已改變");
      status("課程草稿、完成標記同重溫紀錄已上傳。");
    }catch(error){status("上傳失敗："+(error.message||"未知錯誤"));}
    finally{setBusy(false);}
  });
  $("download-curriculum").addEventListener("click",async()=>{
    if(!accountId||accountId!==window.dutchCloud?.user?.id)return status("請先登入");
    const owner=accountId;
    setBusy(true);status("正在查詢雲端課程進度…");
    try{
      const cloud=await window.dutchCloud.loadCurriculum();
      if(owner!==accountId)throw new Error("登入帳戶已改變");
      if(!cloud)return status("雲端未有已儲存課程進度。");
      if(["drafts","studied","reviews"].some(k=>!valid(cloud[k])))throw new Error("雲端資料格式不正確");
      if(!confirm("下載雲端版本會覆蓋此裝置現有課程草稿、完成標記同重溫紀錄。確定繼續？"))return status("已取消下載，本機進度保持不變。");
      // Preserve a rollback snapshot locally before overwriting.
      const backupKey="dutch-learning-backup-"+owner;
      try{localStorage.setItem(backupKey,JSON.stringify({saved_at:new Date().toISOString(),...snapshot()}));}
      catch{throw new Error("無法建立本機備份；已取消覆蓋");}
      const previous=snapshot();
      try{
        for(const kind of ["drafts","studied","reviews"])localStorage.setItem(storageKey(kind,owner),JSON.stringify(cloud[kind]));
      }catch(error){
        for(const kind of ["drafts","studied","reviews"]){
          try{localStorage.setItem(storageKey(kind,owner),JSON.stringify(previous[kind]));}catch{}
        }
        throw new Error("無法完整寫入本機課程紀錄");
      }
      document.dispatchEvent(new Event("dutch-curriculum-restored"));
      status("已還原雲端課程進度；原本本機內容已保留一份備份。");
    }catch(error){status("下載失敗："+(error.message||"未知錯誤"));}
    finally{setBusy(false);}
  });
  document.addEventListener("dutch-auth-state",event=>{
    accountId=event.detail.user?.id||null;
    refreshControls();
  });
  refreshControls();
})();
