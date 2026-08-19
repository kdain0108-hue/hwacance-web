(function(){
  "use strict";

  var STORAGE_KEY = "hwacance_stopwatch_v1";

  function todayKey(d){
    d = d || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function loadState(){
    var fallback = { dateKey: todayKey(), records: [], asmrOn: false, running: false, startedAt: null, lastRecordedAt: null };
    try{
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if(!raw) return fallback;
      var parsed = JSON.parse(raw);
      if(!parsed || typeof parsed !== "object") return fallback;
      if(parsed.dateKey !== todayKey()){
        return { dateKey: todayKey(), records: [], asmrOn: !!parsed.asmrOn, running: false, startedAt: null, lastRecordedAt: parsed.lastRecordedAt || null };
      }
      return {
        dateKey: parsed.dateKey || todayKey(),
        records: Array.isArray(parsed.records) ? parsed.records : [],
        asmrOn: !!parsed.asmrOn,
        running: !!parsed.running,
        startedAt: parsed.startedAt || null,
        lastRecordedAt: parsed.lastRecordedAt || null
      };
    }catch(e){
      return fallback;
    }
  }

  function saveState(state){
    try{
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(e){ /* storage unavailable — keep running in-memory only */ }
  }

  function pad2(n){ return String(n).padStart(2, "0"); }

  function formatElapsed(ms){
    var totalSec = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    if(h > 0) return h + ":" + pad2(m) + ":" + pad2(s);
    return pad2(m) + ":" + pad2(s);
  }

  function formatDuration(min){
    min = Math.max(0, Math.round(min));
    var h = Math.floor(min / 60);
    var m = min % 60;
    if(h > 0) return h + "시간 " + m + "분";
    return m + "분";
  }

  function formatClock(ts){
    var d = new Date(ts);
    return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function guidance(state){
    if(state.running){
      return { text: "화장쉼 중 ...", tier: "away" };
    }
    if(!state.lastRecordedAt){
      return { text: "오늘의 첫 화장쉼을 기록해보세요", tier: "first" };
    }
    var elapsedMin = Math.max(0, (Date.now() - state.lastRecordedAt) / 60000);
    var tierInfo;
    if(elapsedMin < 30) tierInfo = { text: "아직은 눈치 봐야 해요", tier: "red" };
    else if(elapsedMin < 60) tierInfo = { text: "조금 더 버텨보는 걸 추천", tier: "yellow" };
    else tierInfo = { text: "이제는 마음껏 화장쉼하세요", tier: "green" };
    tierInfo.elapsedMin = elapsedMin;
    return tierInfo;
  }

  function todayTotalMin(state){
    return state.records.reduce(function(sum, r){ return sum + (r.durationMin || 0); }, 0);
  }

  window.Hwacance = {
    STORAGE_KEY: STORAGE_KEY,
    todayKey: todayKey,
    loadState: loadState,
    saveState: saveState,
    formatElapsed: formatElapsed,
    formatDuration: formatDuration,
    formatClock: formatClock,
    guidance: guidance,
    todayTotalMin: todayTotalMin
  };
})();
