"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const lessons = window.LESSON_CATALOG || [];
  const quizzes = window.REVIEW_QUIZZES || [];
  const engine = window.LEARNING_ENGINE;
  const prefix = "dutch-review-v1-";
  let accountId = null;
  const storageKey = () => prefix + (accountId ? "account-" + accountId : "guest");
  function loadProgress() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey()) || "{}");
      return data && !Array.isArray(data) && typeof data === "object" ? data : {};
    } catch { return {}; }
  }
  function saveProgress(data) {
    try { localStorage.setItem(storageKey(), JSON.stringify(data)); return true; }
    catch { return false; }
  }
  function studiedLessons() {
    const key = "dutch-learning-curriculum-v1-" + (accountId ? "account-" + accountId : "guest") + "-studied";
    try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch { return {}; }
  }
  function prefs() {
    const form = $("preferences");
    return {
      level: form.elements.namedItem("level").value || "A2",
      goal: form.elements.namedItem("goal").value || "daily"
    };
  }
  const make = (tag, text, cls) => {
    const element = document.createElement(tag);
    if(text !== undefined) element.textContent = text;
    if(cls) element.className = cls;
    return element;
  };
  const levelLabel = q => q.level + " · " + q.skill;
  function summary() {
    const progress = loadProgress();
    const due = engine.getDue(quizzes, progress);
    const attempts = Object.values(progress).reduce((sum, item) => sum + (Number(item?.attempts) || 0), 0);
    const attempted = Object.values(progress).filter(item => item?.last_attempt_at).length;
    $("review-summary").textContent = "已練習 " + attempted + "/" + quizzes.length + " 道示範題，共提交 " + attempts + " 次；目前 " + due.length + " 題到期重溫。測驗表現並非 CEFR 認證。";
    $("review-due-summary").textContent = "示範題到期重溫：" + due.length + " 題；未做嘅題目唔計入過期。";
    const recommendation = engine.recommendation(lessons, prefs(), studiedLessons(), quizzes, progress);
    if(recommendation) {
      const reasons = { review:"有到期嘅重溫題目", new:"有未確認完成嘅課節", repeat:"目前程度嘅示範課節均已標記完成，可再複習" };
      $("next-lesson-text").textContent = "建議：" + recommendation.lesson.level + " · " + recommendation.lesson.title_zh + "（" + reasons[recommendation.reason] + "）。呢個係規則式推薦，唔係 AI 能力診斷。";
      $("open-recommended").disabled = false;
      $("open-recommended").onclick = () => {
        if(recommendation.reason === "review") {
          document.querySelector('nav button[data-tab="review"]').click();
          $("review-filter").value = "due";
          render();
        } else if(typeof window.dutchOpenLesson === "function") {
          window.dutchOpenLesson(recommendation.lesson.id);
        } else {
          document.querySelector('nav button[data-tab="curriculum"]').click();
        }
      };
    } else {
      $("next-lesson-text").textContent = "暫時冇可推薦課節。";
      $("open-recommended").disabled = true;
    }
  }
  function selectedQuestions() {
    const filter = $("review-filter").value;
    const progress = loadProgress();
    if(filter === "due") return engine.getDue(quizzes, progress);
    if(filter === "recommended") return quizzes.filter(q => q.level === prefs().level);
    if(filter === "all") return quizzes;
    return quizzes.filter(q => q.level === filter);
  }
  function render() {
    const parent = $("review-questions");
    parent.replaceChildren();
    const questions = selectedQuestions();
    if (!questions.length) parent.append(make("p", "呢個範圍暫時冇到期題目；你可以轉去目前程度或所有程度練習。", "muted"));
    const progress = loadProgress();
    for(const q of questions) {
      const card = make("article", undefined, "quiz-card");
      card.append(make("strong", levelLabel(q)), make("p", q.en + " / " + q.zh));
      const group = make("fieldset");
      group.append(make("legend", "選擇一個答案"));
      q.options.forEach((option,index) => {
        const label = make("label", undefined, "quiz-option");
        const radio = make("input");
        radio.type = "radio";
        radio.name = "quiz-" + q.id;
        radio.value = String(index);
        label.append(radio, document.createTextNode(" " + option));
        group.append(label);
      });
      card.append(group);
      const button = make("button", "提交答案");
      button.type = "button";
      const feedback = make("p");
      feedback.setAttribute("role","status");
      button.addEventListener("click", () => {
        const chosen = group.querySelector("input:checked");
        if(!chosen) {
          feedback.textContent = "請先選擇一個答案；未提交唔計入練習紀錄。";
          return;
        }
        const correct = Number(chosen.value) === q.correct;
        const next = loadProgress();
        next[q.id] = engine.update(next[q.id], correct);
        if(!saveProgress(next)) {
          feedback.textContent = "無法儲存答案紀錄；請檢查瀏覽器儲存權限。";
          return;
        }
        feedback.textContent = (correct ? "正確。" : "需要重溫。") + " 正確答案：" + q.options[q.correct] + " " + q.why_en + " / " + q.why_zh + "。下次重溫：" + next[q.id].next_review_at.slice(0,10) + "（UTC 日期）。";
        group.querySelectorAll("input").forEach(input => { input.disabled = true; });
        button.disabled = true;
        summary();
      });
      if(progress[q.id]?.next_review_at) {
        card.append(make("p", "上次練習：" + progress[q.id].last_attempt_at.slice(0,10) + "；下次：" + progress[q.id].next_review_at.slice(0,10), "muted"));
      }
      card.append(button, feedback);
      parent.append(card);
    }
    summary();
  }
  $("review-filter").addEventListener("change", render);
  document.addEventListener("dutch-auth-state", event => {
    accountId = event.detail.user?.id || null;
    render();
  });
  $("preferences").addEventListener("submit", () => { queueMicrotask(() => { render(); }); });
  document.addEventListener("dutch-lesson-studied", summary);
  render();
})();
