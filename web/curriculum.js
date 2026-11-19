"use strict";
(() => {
  const lessons = Array.isArray(window.LESSON_CATALOG) ? window.LESSON_CATALOG : [];
  const $ = id => document.getElementById(id);
  const prefix = "dutch-learning-curriculum-v1-";
  let accountId = null;
  let active = null;
  const key = suffix => prefix + (accountId ? "account-" + accountId : "guest") + "-" + suffix;
  const read = (suffix, fallback) => {
    try { return JSON.parse(localStorage.getItem(key(suffix))) ?? fallback; }
    catch { return fallback; }
  };
  const write = (suffix, value) => {
    try { localStorage.setItem(key(suffix), JSON.stringify(value)); return true; }
    catch { return false; }
  };
  function node(tag, text, cls) {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function counts() {
    const reviewed = read("studied", {});
    return lessons.filter(x => reviewed[x.id]).length;
  }
  function drawList() {
    const parent = $("lesson-cards");
    parent.replaceChildren();
    const level = $("catalog-level").value;
    const studied = read("studied", {});
    for (const lesson of lessons.filter(x => level === "all" || x.level === level)) {
      const card = node("article", undefined, "lesson-card");
      card.append(node("strong", lesson.level + " · " + lesson.title_zh));
      card.append(node("p", lesson.title + " · " + lesson.minutes + " 分鐘 · " + lesson.words.length + " 個詞語"));
      if (studied[lesson.id]) card.append(node("p", "已自行確認完成閱讀及練習（非能力認證）", "muted"));
      const button = node("button", "開啟課節");
      button.type = "button";
      button.addEventListener("click", () => showLesson(lesson.id));
      card.append(button);
      parent.append(card);
    }
  }
  function showLesson(id) {
    const lesson = lessons.find(x => x.id === id);
    if (!lesson) return;
    active = lesson;
    $("active-lesson").hidden = false;
    $("lesson-title").textContent = lesson.level + " · " + lesson.title_zh + " / " + lesson.title;
    $("lesson-grammar").textContent = lesson.grammar.nl + " — " + lesson.grammar.en + " — " + lesson.grammar.zh;
    const wordBox = $("lesson-words");
    wordBox.replaceChildren(node("h4", "常用詞彙 / Vocabulary"));
    lesson.words.forEach(([nl,en,zh]) => wordBox.append(node("p", nl + " — " + en + " — " + zh)));
    const examples = $("lesson-examples");
    examples.replaceChildren(node("h4", "例句 / Examples"));
    lesson.examples.forEach(([nl,en,zh]) => examples.append(node("p", nl + " / " + en + " / " + zh)));
    const exercises = $("lesson-exercises");
    exercises.replaceChildren(node("h4", "造句 / Sentence practice"));
    const drafts = read("drafts", {});
    lesson.exercises.forEach((q, i) => {
      const wrapper = node("article", undefined, "question");
      wrapper.append(node("p", (i + 1) + ". " + q.en + " / " + q.zh));
      const textarea = node("textarea");
      textarea.setAttribute("aria-label", lesson.level + " exercise " + (i + 1));
      textarea.placeholder = "Schrijf je antwoord in het Nederlands...";
      const draftKey = lesson.id + "-" + i;
      textarea.value = drafts[draftKey] || "";
      textarea.addEventListener("input", () => {
        const current = read("drafts", {});
        current[draftKey] = textarea.value;
        $("lesson-status").textContent = write("drafts", current) ? "答案草稿已儲存於本機。" : "無法儲存本機草稿。";
      });
      wrapper.append(textarea);
      const hint = node("p", "提示詞：" + q.bank, "muted");
      wrapper.append(hint);
      const button = node("button", "顯示／隱藏參考答案");
      button.type = "button";
      const sample = node("div", "參考答案：" + q.sample + "。其他正確表達方法亦可能存在；此處冇 AI 批改。", "comparison");
      sample.hidden = true;
      button.addEventListener("click", () => { sample.hidden = !sample.hidden; });
      wrapper.append(button, sample);
      exercises.append(wrapper);
    });
    $("lesson-status").textContent = read("studied", {})[id] ? "你之前已自行標記呢課完成。" : "未標記為已讀；唔會自動計作完成。";
  }
  $("catalog-level").addEventListener("change", drawList);
  $("mark-studied").addEventListener("click", () => {
    if (!active) return;
    const studied = read("studied", {});
    studied[active.id] = new Date().toISOString();
    if (write("studied", studied)) {
      $("lesson-status").textContent = "已自行確認完成；此標記只儲存於本機，不代表通過測驗。";
      drawList();
    } else $("lesson-status").textContent = "無法儲存本機進度。";
  });
  document.addEventListener("dutch-auth-state", event => {
    accountId = event.detail.user?.id || null;
    const selected = lessons.find(x => x.id === active?.id);
    if (selected) showLesson(selected.id);
    drawList();
  });
  drawList();
})();
