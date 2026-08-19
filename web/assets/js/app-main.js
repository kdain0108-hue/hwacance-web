(function(){
  "use strict";
  var H = window.Hwacance;
  var state = H.loadState();

  var guidanceEl = document.getElementById("guidanceText");
  var guidanceLabelEl = document.getElementById("guidanceLabel");
  var sinceLastEl = document.getElementById("sinceLast");
  var elapsedEl = document.getElementById("elapsedDisplay");
  var btnEl = document.getElementById("stopwatchBtn");
  var totalEl = document.getElementById("todayTotal");
  var sideTotalEl = document.getElementById("sideTotal");
  var listEl = document.getElementById("recordList");
  var asmrBtn = document.getElementById("asmrToggle");
  var asmrAudioEl = document.getElementById("asmrAudio");

  var ASMR_SRC = "../assets/audio/growl-piano.mp4";
  var tickHandle = null;

  function renderGuidance(){
    var g = H.guidance(state);
    guidanceEl.setAttribute("data-tier", g.tier);
    if(g.tier === "away"){
      if(guidanceLabelEl.getAttribute("data-wave-text") !== g.text){
        guidanceLabelEl.innerHTML = "";
        guidanceLabelEl.setAttribute("data-wave-text", g.text);
        g.text.split("").forEach(function(ch, i){
          var span = document.createElement("span");
          span.className = "char-wave";
          span.style.animationDelay = (i * 0.12) + "s";
          span.textContent = ch;
          guidanceLabelEl.appendChild(span);
        });
      }
    } else {
      guidanceLabelEl.removeAttribute("data-wave-text");
      guidanceLabelEl.textContent = g.text;
    }
    if(sinceLastEl){
      if(typeof g.elapsedMin === "number"){
        sinceLastEl.textContent = "마지막 화장쉼으로부터 " + H.formatDuration(g.elapsedMin);
        sinceLastEl.style.display = "";
      } else {
        sinceLastEl.textContent = "";
        sinceLastEl.style.display = "none";
      }
    }
  }

  function renderElapsed(){
    if(state.running && state.startedAt){
      elapsedEl.textContent = H.formatElapsed(Date.now() - state.startedAt);
    } else {
      elapsedEl.textContent = "00:00";
    }
  }

  function renderButton(){
    btnEl.setAttribute("data-running", state.running ? "true" : "false");
    btnEl.textContent = state.running ? "돌아왔어요" : "자리 비우기";
  }

  function renderTotals(){
    var totalMin = H.todayTotalMin(state);
    var text = "오늘 총 화장쉼 시간 " + H.formatDuration(totalMin) + " · " + state.records.length + "회";
    totalEl.textContent = text;
    if(sideTotalEl) sideTotalEl.textContent = H.formatDuration(totalMin);
  }

  function renderList(){
    if(!listEl) return;
    listEl.innerHTML = "";
    if(state.records.length === 0){
      var empty = document.createElement("li");
      empty.className = "record-empty";
      empty.textContent = "오늘 기록된 화장쉼이 없어요";
      listEl.appendChild(empty);
      return;
    }
    var sorted = state.records.slice().sort(function(a, b){ return b.startedAt - a.startedAt; });
    sorted.forEach(function(r){
      var li = document.createElement("li");
      var time = document.createElement("span");
      time.className = "rec-time";
      time.textContent = H.formatClock(r.startedAt);
      var dur = document.createElement("span");
      dur.className = "rec-dur";
      dur.textContent = H.formatDuration(r.durationMin) + " 소요";
      li.appendChild(time);
      li.appendChild(dur);
      listEl.appendChild(li);
    });
  }

  function renderAll(){
    renderGuidance();
    renderElapsed();
    renderButton();
    renderTotals();
    renderList();
  }

  function persist(){ H.saveState(state); }

  function startTicking(){
    stopTicking();
    var intervalMs = state.running ? 1000 : 30000;
    tickHandle = setInterval(function(){
      renderGuidance();
      renderElapsed();
    }, intervalMs);
  }
  function stopTicking(){
    if(tickHandle){ clearInterval(tickHandle); tickHandle = null; }
  }

  function toggleStopwatch(){
    if(state.running){
      var endedAt = Date.now();
      var durationMin = Math.max(0, (endedAt - state.startedAt) / 60000);
      state.records.push({ id: String(endedAt), startedAt: state.startedAt, endedAt: endedAt, durationMin: durationMin });
      state.lastRecordedAt = endedAt;
      state.running = false;
      state.startedAt = null;
    } else {
      state.startedAt = Date.now();
      state.running = true;
    }
    persist();
    renderAll();
    startTicking();
  }
  btnEl.addEventListener("click", toggleStopwatch);

  function ensureAsmrSrc(){
    if(!asmrAudioEl.src){ asmrAudioEl.src = ASMR_SRC; }
  }
  function renderAsmrButton(){
    var on = state.asmrOn;
    asmrBtn.setAttribute("data-state", on ? "on" : "off");
    asmrBtn.setAttribute("aria-label", on ? "ASMR 끄기" : "ASMR 켜기");
    asmrBtn.textContent = on ? "MUSIC ON" : "MUSIC OFF";
  }
  function toggleAsmr(){
    state.asmrOn = !state.asmrOn;
    if(state.asmrOn){
      ensureAsmrSrc();
      asmrAudioEl.volume = 0.6;
      var p = asmrAudioEl.play();
      if(p && p.catch){ p.catch(function(){ state.asmrOn = false; renderAsmrButton(); }); }
    } else {
      asmrAudioEl.pause();
    }
    persist();
    renderAsmrButton();
  }
  asmrBtn.addEventListener("click", toggleAsmr);

  document.addEventListener("visibilitychange", function(){
    if(!document.hidden){ renderGuidance(); renderElapsed(); }
  });

  renderAll();
  renderAsmrButton();
  startTicking();
})();
