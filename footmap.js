/* ============================================================
 * 足迹地图 · 像素小书版（酒馆助手 / JS-Slash-Runner 全局脚本）
 * 入口：固定在右下角的「合上的像素小书」挂件，轻点打开
 * 打开：一本翻页书——第 1 页是八宫格地图总览（目录），
 *       之后每翻一页是一个地点纸页卡（按添加先后），可左右滑动翻页
 *       手动加点 / 撤销 / 复位 / 本地存档 / 6 套主题 / 像素背景平铺
 * 预留：window.FootMap.ingest()  供阶段② AI 自动识别调用
 *       地点纸页图片区           供阶段③ 接 Z-Image 生图
 * 数据：localStorage，地图按当前角色名隔离；装扮/书的位置全局通用
 * ============================================================ */
(function () {
  'use strict';
  if (window.__footmap_loaded__) return;
  window.__footmap_loaded__ = true;

  function __footmapMain__ () {
  // 酒馆助手脚本运行在多层嵌套 iframe 中，逐级向上爬到酒馆主窗口（参照芋圆机 getTop）
  function __fmGetTop () {
    var w = window;
    for (var i = 0; i < 8 && w.parent && w.parent !== w; i++) {
      try { void w.parent.document; w = w.parent; } catch (e) { break; }
    }
    return w;
  }
  var W = __fmGetTop();
  var D = W.document;
  if (W.__footmap_dom_done__) return;
  W.__footmap_dom_done__ = true;
  var MOUNT = D.documentElement || D.body;
  var LOG = '[足迹地图] ';

  /* ---------------- 基础配置 ---------------- */
  var CENTER = { name: '我的家', icon: '🏠' };
  var STORE_PREFIX = 'footmap_v1_';
  var THEME_STORE = 'footmap_v1_theme';
  // 八方向：屏幕坐标（y 向下，北在上）
  var DIRS = {
    N:  { x: 0, y: -1, label: '正北' },
    NE: { x: 1, y: -1, label: '东北' },
    E:  { x: 1, y: 0,  label: '正东' },
    SE: { x: 1, y: 1,  label: '东南' },
    S:  { x: 0, y: 1,  label: '正南' },
    SW: { x: -1, y: 1, label: '西南' },
    W:  { x: -1, y: 0,  label: '正西' },
    NW: { x: -1, y: -1,label: '西北' }
  };
  var DIR_KEYS = ['N','NE','E','SE','S','SW','W','NW'];
  var TYPES = {
    home:       { icon: '🏠', label: '住宅' },
    company:    { icon: '🏢', label: '公司' },
    bar:        { icon: '🍸', label: '酒吧' },
    nightmarket:{ icon: '🍡', label: '夜市' },
    park:       { icon: '🎡', label: '游乐' },
    hospital:   { icon: '🏥', label: '医院' },
    restaurant: { icon: '🍽️', label: '餐厅' },
    hotel:      { icon: '🏨', label: '酒店' },
    school:     { icon: '🎓', label: '学校' },
    bookstore:  { icon: '📖', label: '书店' },
    cafe:       { icon: '☕', label: '咖啡' },
    beach:      { icon: '🏝️', label: '海岛' },
    scenery:    { icon: '🌉', label: '景点' },
    other:      { icon: '📍', label: '其他' }
  };

  /* ---------------- 装扮主题 ---------------- */
  var THEMES = {
    taro:  { name: '香芋紫', sw: '#7C6FA5', v: { bg:'#F4F1FA', ink:'#4A4458', line:'#C9BDE0', empty:'#FBF9FF', place:'#DCE9F7', placeEdge:'#9DB8D8', center:'#FFD9E4', centerEdge:'#E89AB4', btn:'#7C6FA5', btnInk:'#FFFFFF', footer:'#EDE8F6', card:'#FFFFFF', ball1:'#9d8fd6', ball2:'#7c6fa5', ballSh:'#5a4f82', rgb:'74,68,88' } },
    peach: { name: '马卡龙粉', sw: '#E889A8', v: { bg:'#FFF3F6', ink:'#6B4A57', line:'#F0C6D4', empty:'#FFFAFB', place:'#FFE3EC', placeEdge:'#E8A5BC', center:'#FFF0D6', centerEdge:'#E5BD86', btn:'#E889A8', btnInk:'#FFFFFF', footer:'#FCE4EC', card:'#FFFFFF', ball1:'#f7a8c0', ball2:'#e889a8', ballSh:'#c06685', rgb:'107,74,87' } },
    mint:  { name: '薄荷奶绿', sw: '#6FB58C', v: { bg:'#EFFAF3', ink:'#3F5B4C', line:'#BBDDC9', empty:'#FAFFFB', place:'#DCF2E5', placeEdge:'#93C7A8', center:'#FFF0D6', centerEdge:'#E5BD86', btn:'#6FB58C', btnInk:'#FFFFFF', footer:'#E0F3E8', card:'#FFFFFF', ball1:'#8FD0AA', ball2:'#6FB58C', ballSh:'#4f8a68', rgb:'63,91,76' } },
    ocean: { name: '海盐蓝', sw: '#6E8FC0', v: { bg:'#EFF4FB', ink:'#3E4E66', line:'#BCCFDF', empty:'#FAFCFF', place:'#DCEBFA', placeEdge:'#93B4D8', center:'#FFE9F0', centerEdge:'#E5A8BD', btn:'#6E8FC0', btnInk:'#FFFFFF', footer:'#E1EBF7', card:'#FFFFFF', ball1:'#96b6dd', ball2:'#6e8fc0', ballSh:'#4d6c99', rgb:'62,78,102' } },
    cream: { name: '奶油杏', sw: '#C79A54', v: { bg:'#FBF5EA', ink:'#6B563E', line:'#E2CFAA', empty:'#FFFCF5', place:'#FBEBCC', placeEdge:'#D8B87E', center:'#FDE0E6', centerEdge:'#E2A5B4', btn:'#C79A54', btnInk:'#FFFFFF', footer:'#F3E8D2', card:'#FFFFFF', ball1:'#e3c084', ball2:'#c79a54', ballSh:'#9c7538', rgb:'107,86,62' } },
    night: { name: '像素暗夜', sw: '#8A78C8', v: { bg:'#221E2E', ink:'#E8E2F2', line:'#4A4360', empty:'#2B2638', place:'#35405C', placeEdge:'#5E7196', center:'#6B4A5B', centerEdge:'#9E7285', btn:'#8A78C8', btnInk:'#FFFFFF', footer:'#2C2738', card:'#2B2638', ball1:'#8a78c8', ball2:'#6e5fa5', ballSh:'#14111c', rgb:'0,0,0' } }
  };

  /* ---------------- 存档：地图 ---------------- */
  function chatKey () {
    var name = 'default';
    try {
      var ctx = null;
      if (typeof W.getContext === 'function') ctx = W.getContext();
      else if (W.SillyTavern && typeof W.SillyTavern.getContext === 'function') ctx = W.SillyTavern.getContext();
      if (ctx) name = String(ctx.name || ctx.characterId != null ? ('c' + ctx.characterId) : 'default');
    } catch (e) {}
    return STORE_PREFIX + name;
  }
  function loadData () {
    try {
      var raw = W.localStorage.getItem(chatKey());
      if (raw) {
        var d = JSON.parse(raw);
        if (d && Array.isArray(d.places)) {
          if (!d.meta || typeof d.meta !== 'object') d.meta = {};
          if (!d.meta.title) d.meta.title = '我的足迹';
          if (!d.meta.center) d.meta.center = '我的家';
          return d;
        }
      }
    } catch (e) { console.warn(LOG + '读档失败', e); }
    return { places: [], meta: { title: '我的足迹', center: '我的家' } };
  }
  function saveData () {
    try { W.localStorage.setItem(chatKey(), JSON.stringify(data)); }
    catch (e) { console.warn(LOG + '存档失败', e); }
  }
  function getMeta () {
    data.meta = data.meta || {};
    if (!data.meta.title) data.meta.title = '我的足迹';
    if (!data.meta.center) data.meta.center = '我的家';
    return data.meta;
  }
  var data = loadData();

  /* ---------------- 今日小签：数据层 + AI 链路（第一步：朴素验证） ---------------- */
  function todayStr () {
    var d = new Date(), m = ('0' + (d.getMonth() + 1)).slice(-2), day = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + m + '-' + day;
  }
  var FORTUNE_LEVELS = ['大吉', '中吉', '小吉', '平', '小凶'];
  var LOCAL_FORTUNES = [
    { level: '中吉', weather: '晴和', yi: '同行·散步', ji: '貪嘴·晚歸', mood: '笑意輕輕搖', stars: 4, verse: '風起東南／利同行', rumor: '河清水庫有人釣上一條大魚，那魚在半空打了個挺，化作鯤鵬往北去了。', suggestPlace: '河清水庫', suggestRing: '外圈', suggestDir: '北' },
    { level: '大吉', weather: '天朗氣清', yi: '告白·遠行', ji: '猶豫', mood: '心頭滾燙', stars: 5, verse: '花開當折／莫負春風', rumor: '街角的老槐樹夜裡落了滿地金葉，掃到天亮，葉子又一片片長回了枝上。', suggestPlace: '我的家', suggestRing: '中心', suggestDir: '' },
    { level: '小吉', weather: '微雲', yi: '小憩·寫字', ji: '逞強', mood: '睏意綿綿', stars: 3, verse: '雲淡風輕／緩步亦佳', rumor: '巷口糖水鋪老闆說，昨晚有位夜客端走一碗紅豆沙，臺上留下一錠銀子。', suggestPlace: '南門糖水鋪', suggestRing: '內圈', suggestDir: '南' },
    { level: '平', weather: '陰', yi: '守靜·讀書', ji: '涉水·登高', mood: '不悲不喜', stars: 3, verse: '行到水窮／坐看雲起', rumor: '公園的流浪貓今日都聚在長椅下，像在開什麼要緊的會。', suggestPlace: '中央公園', suggestRing: '內圈', suggestDir: '東' },
    { level: '小凶', weather: '欲雨', yi: '緩行·帶傘', ji: '賭氣·夜行', mood: '心緒微亂', stars: 2, verse: '雲垂四野／緩步則安', rumor: '舊街的路燈一閃一滅，守燈人說，是誰把心事絆在了那裡。', suggestPlace: '舊街', suggestRing: '外圈', suggestDir: '西' },
    { level: '彩蛋', weather: '', yi: '', ji: '', mood: '', stars: 3, verse: '', rumor: '聽說城北來了隻會學人話的八哥，逢人便問「今天去哪裡探索好呢」，問完自己先笑出了聲。', suggestPlace: '北城門', suggestRing: '', suggestDir: '' },
    { level: '彩蛋', weather: '', yi: '', ji: '', mood: '', stars: 3, verse: '', rumor: '海邊的郵筒每到月圓會自己吐出明信片，上頭只有一枚淺淺的爪印，沒有落款。', suggestPlace: '海邊', suggestRing: '', suggestDir: '' },
    { level: '中吉', weather: '細雨', yi: '聽雨·煮茶', ji: '爭鋒', mood: '安安靜靜', stars: 4, verse: '雨落平湖／知心者暖', rumor: '茶館老闆娘說，雨天來的客人裡有一對總共撐一把傘，那傘往一邊斜了一路。', suggestPlace: '臨湖茶館', suggestRing: '內圈', suggestDir: '東南' }
  ];
  function normalizeFortune (o) {
    o = (o && typeof o === 'object') ? o : {};
    var fo = {};
    fo.date = o.date || todayStr();
    fo.level = (FORTUNE_LEVELS.indexOf(o.level) >= 0 || o.level === '彩蛋') ? o.level : '平';
    fo.weather = String(o.weather || '');
    fo.yi = String(o.yi || ''); fo.ji = String(o.ji || ''); fo.mood = String(o.mood || '');
    var s = parseInt(o.stars, 10); if (isNaN(s)) s = 3; fo.stars = Math.max(1, Math.min(5, s));
    fo.verse = String(o.verse || ''); fo.rumor = String(o.rumor || '');
    fo.suggestPlace = String(o.suggestPlace || '');
    fo.suggestRing = String(o.suggestRing || ''); fo.suggestDir = String(o.suggestDir || '');
    return fo;
  }
  function parseFortune (txt) {
    try {
      var m = String(txt == null ? '' : txt).match(/\{[\s\S]*\}/);
      if (!m) return null;
      return normalizeFortune(JSON.parse(m[0]));
    } catch (e) { return null; }
  }
  function pickLocalFortune () {
    var raw = LOCAL_FORTUNES[Math.floor(Math.random() * LOCAL_FORTUNES.length)];
    return normalizeFortune(raw);
  }
  function fortunePrompt () {
    return '你正在為「足迹地图」手帳生成一張今日小簽。今天是' + todayStr() + '。\n' +
      '只輸出一個 JSON 物件，不要任何解釋、前後綴或 markdown 代碼塊。格式：\n' +
      '{"date":"' + todayStr() + '","level":"大吉|中吉|小吉|平|小凶|彩蛋","weather":"天氣","yi":"宜，一到兩件、古風簡短","ji":"忌，一到兩件","mood":"一句心情","stars":1到5的整數,"verse":"兩句古風簽語，用／分隔，如 風起東南／利同行","rumor":"一句RPG風、無厘頭日常又有餘味的本地傳聞","suggestPlace":"建議前往的地點，必須是手帳中已記錄的地點，不要編造","suggestRing":"中心|內圈|外圈或留空","suggestDir":"方位或留空"}\n' +
      '要求：level 完全隨機，約八分之一概率取「彩蛋」；彩蛋時只認真寫 rumor，其餘欄位可留空；所有內容貼合手帳已記錄的地點與季節，文風古風、俏皮、有靈氣。';
  }
  function drawFortune () {
    return new Promise(function (resolve) {
      var ctx = null;
      try { ctx = (typeof W.getContext === 'function') ? W.getContext() : (W.SillyTavern && typeof W.SillyTavern.getContext === 'function' ? W.SillyTavern.getContext() : null); } catch (e) { ctx = null; }
      var local = function () { resolve(pickLocalFortune()); };
      if (!ctx || typeof ctx.generateQuietPrompt !== 'function') { local(); return; }
      var settled = false;
      var timer = setTimeout(function () { if (!settled) { settled = true; local(); } }, 8000);
      try {
        Promise.resolve(ctx.generateQuietPrompt(fortunePrompt(), true)).then(function (txt) {
          if (settled) return; settled = true; clearTimeout(timer);
          var fo = parseFortune(txt); resolve(fo ? fo : pickLocalFortune());
        }).catch(function () { if (settled) return; settled = true; clearTimeout(timer); local(); });
      } catch (e) { if (!settled) { settled = true; clearTimeout(timer); local(); } }
    });
  }
  function fortuneStoreKey () { return chatKey() + '__fortune__' + todayStr(); }
  function saveTodayFortune (fo) { try { W.localStorage.setItem(fortuneStoreKey(), JSON.stringify(fo)); } catch (e) {} }
  function getTodayFortune () { try { var raw = W.localStorage.getItem(fortuneStoreKey()); return raw ? normalizeFortune(JSON.parse(raw)) : null; } catch (e) { return null; } }
  function rebuyStoreKey () { return chatKey() + '__rebuy__' + todayStr(); }
  function hasReboughtToday () { try { return W.localStorage.getItem(rebuyStoreKey()) === '1'; } catch (e) { return false; } }
  function markReboughtToday () { try { W.localStorage.setItem(rebuyStoreKey(), '1'); } catch (e) {} }

  /* ---------------- 集卡册：收藏数据层（五扇分类） ---------------- */
  var COLLECTION_CATS = { normal: '常类', special: '特类', rumor: '传闻', festival: '节日' };
  function collectionStoreKey () { return chatKey() + '__collection'; }
  function fortuneCategory (fo) {
    if (fo && fo.category === 'special') return 'special';
    if (fo && fo.category === 'festival') return 'festival';
    if (fo && fo.level === '彩蛋') return 'rumor';
    return 'normal';
  }
  function getCollection () {
    try {
      var raw = W.localStorage.getItem(collectionStoreKey());
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveCollection (arr) {
    try { W.localStorage.setItem(collectionStoreKey(), JSON.stringify(arr)); }
    catch (e) { console.warn(LOG + '收藏失败', e); }
  }
  function isCollected (fo) {
    if (!fo || !fo.date) return false;
    return getCollection().some(function (it) { return it.date === fo.date; });
  }
  function addFortuneToCollection (fo) {
    var arr = getCollection();
    if (arr.some(function (it) { return it.date === fo.date; })) return { added: false, item: null };
    var item = JSON.parse(JSON.stringify(fo));
    item.category = fortuneCategory(fo);
    item.collectedAt = todayStr();
    arr.push(item);
    arr.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    saveCollection(arr);
    return { added: true, item: item };
  }
  function collectionCounts () {
    var c = { normal: 0, special: 0, rumor: 0, festival: 0, total: 0 };
    getCollection().forEach(function (it) {
      if (c[it.category] == null) it.category = 'normal';
      c[it.category]++; c.total++;
    });
    return c;
  }

  /* ---------------- 书皮预设（工坊） ---------------- */
  var DEFAULT_COVER = {
    preset: 'purple', c1: '#9d8fd6', c2: '#6f61a0', coverImg: '',
    frame: 'double', frameColor: 'rgba(232,213,163,.9)',
    title: '足迹地图', titleFont: 'pixel', titleColor: 'custom', titleColorVal: '#F2E2B8',
    layout: 'vleft', lock: 'brass', bookSize: 'm',
    sub: '以「我的家」为中心 · 足迹珍藏'
  };
  var COVER_PRESETS = {
    purple: { name: '紫绒烫金', c1: '#9d8fd6', c2: '#6f61a0', frame: 'double', frameColor: 'rgba(232,213,163,.9)', titleFont: 'pixel', titleColor: 'custom', titleColorVal: '#F2E2B8', layout: 'vleft', lock: 'brass' },
    kraft:  { name: '牛皮手账', c1: '#dab273', c2: '#b78849', frame: 'single', frameColor: '#4a5340', titleFont: 'serif', titleColor: 'custom', titleColorVal: '#3d2f1e', layout: 'vleft', lock: 'brass' },
    pixel:  { name: '电玩像素', c1: '#232c52', c2: '#10142a', frame: 'single', frameColor: '#5ef0ff', titleFont: 'pixel', titleColor: 'custom', titleColorVal: '#7df5ff', layout: 'vleft', lock: 'pixel' },
    silver: { name: '素白烫银', c1: '#f3efe7', c2: '#d8d2c4', frame: 'single', frameColor: '#aeb3bd', titleFont: 'serif', titleColor: 'custom', titleColorVal: '#7d8089', layout: 'vleft', lock: 'silver' },
    weaveLinen: { name: '彩织亚麻', coverImg: 'https://aka.doubaocdn.com/s/cR8OGpWRfo', c1: '#8a7a6a', c2: '#5a4a3a', frame: 'none', titleFont: 'serif', titleColor: 'custom', titleColorVal: '#fff8e7', layout: 'vleft', lock: 'brass' },
    weaveFelt:  { name: '彩织毛呢', coverImg: 'https://aka.doubaocdn.com/s/2YstQg9d2A', c1: '#7a6a5a', c2: '#4a3a2a', frame: 'none', titleFont: 'serif', titleColor: 'custom', titleColorVal: '#fff8e7', layout: 'vleft', lock: 'brass' }
  };
  var TITLE_COLORS = { gold: '#E8D089', silver: '#d7dbe2', rose: '#e9b0a0', ink: '#3a3340' };
  var FONT_STACK = {
    pixel: 'FusionPixel12,"PingFang SC",sans-serif',
    serif: '"Songti SC","SimSun","Noto Serif SC",serif',
    round: '"Yuanti SC","PingFang SC","Hiragino Sans GB",sans-serif'
  };
  var BOOK_SIZES = { s: { w: 40, h: 48, fs: 12, spineFs: 6 }, m: { w: 48, h: 56, fs: 14, spineFs: 7 }, l: { w: 56, h: 64, fs: 16, spineFs: 9 } };
  var PAPERS = {
    plain: '纯色',
    line: '横线信纸',
    grid: '方格稿纸',
    kraft: '牛皮纸',
    dot: '像素点阵'
  };

  /* ---------------- 存档：装扮（全局） ---------------- */
  function loadUI () {
    var cfg = { theme: 'taro', bgUrl: '', paper: 'plain', cover: JSON.parse(JSON.stringify(DEFAULT_COVER)) };
    try {
      var raw = W.localStorage.getItem(THEME_STORE);
      if (raw) {
        var p = JSON.parse(raw);
        if (THEMES[p.theme]) cfg.theme = p.theme;
        if (typeof p.bgUrl === 'string') cfg.bgUrl = p.bgUrl;
        if (PAPERS[p.paper]) cfg.paper = p.paper;
        if (p.cover && typeof p.cover === 'object') {
          Object.keys(DEFAULT_COVER).forEach(function (k) {
            if (typeof p.cover[k] === typeof DEFAULT_COVER[k] || typeof DEFAULT_COVER[k] === 'string') {
              if (p.cover[k] != null) cfg.cover[k] = p.cover[k];
            }
          });
        }
      }
    } catch (e) {}
    return cfg;
  }
  function saveUI () {
    try { W.localStorage.setItem(THEME_STORE, JSON.stringify(ui)); } catch (e) {}
  }
  var ui = loadUI();

  /* ---------------- 坐标工具 ---------------- */
  function placeAt (x, y) {
    if (x === 0 && y === 0) return { center: true };
    for (var i = 0; i < data.places.length; i++) {
      if (data.places[i].x === x && data.places[i].y === y) return data.places[i];
    }
    return null;
  }
  function maxRing () {
    var r = 1;
    data.places.forEach(function (p) { r = Math.max(r, Math.max(Math.abs(p.x), Math.abs(p.y))); });
    return r;
  }
  function nearestEmpty (tx, ty) {
    if (!placeAt(tx, ty)) return { x: tx, y: ty };
    for (var ring = 1; ring <= 6; ring++) {
      for (var dy = -ring; dy <= ring; dy++) {
        for (var dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          var x = tx + dx, y = ty + dy;
          if (!placeAt(x, y)) return { x: x, y: y };
        }
      }
    }
    return null;
  }
  function uid () { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function dirOf (p) {
    if (p.x === 0 && p.y === 0) return { label: '中心', ring: 0 };
    var sx = p.x === 0 ? 0 : (p.x > 0 ? 1 : -1);
    var sy = p.y === 0 ? 0 : (p.y > 0 ? 1 : -1);
    var key = null;
    DIR_KEYS.forEach(function (k) { if (DIRS[k].x === sx && DIRS[k].y === sy) key = k; });
    return { label: key ? DIRS[key].label : ('坐标 ' + p.x + ',' + p.y), ring: Math.max(Math.abs(p.x), Math.abs(p.y)) };
  }

  /* ============================================================
   * 阶段②预留：AI 自动识别后调用
   * ingest({ name, type, dir:'SE', ring:1, desc, moment, imgPrompt })
   * ============================================================ */
  W.FootMap = {
    ingest: function (p) {
      p = p || {};
      if (!p.name) return false;
      var tx = 0, ty = 0;
      if (p.dir && DIRS[p.dir]) {
        var d = DIRS[p.dir], r = Math.max(1, parseInt(p.ring, 10) || 1);
        tx = d.x * r; ty = d.y * r;
      }
      var pos = nearestEmpty(tx, ty);
      if (!pos) return false;
      var place = {
        id: uid(), name: String(p.name).slice(0, 20),
        type: TYPES[p.type] ? p.type : 'other',
        x: pos.x, y: pos.y,
        desc: p.desc || '', moment: p.moment || '',
        imgPrompt: p.imgPrompt || '', img: null,
        ts: Date.now()
      };
      data.places.push(place); saveData();
      if (state.panelOpen) { if (paper.style.display === 'block') renderPaper(); else renderBook(); }
      console.log(LOG + '自动打卡', place.name, pos);
      return place;
    },
    data: function () { return data; }
  };

  /* ---------------- DOM 脚手架 ---------------- */
  var state = { panelOpen: false, cur: 0, scale: 1, mini: true, bookX: null, bookY: null, bookPage: 0 };
  function el (tag, style, html) {
    var e = D.createElement(tag);
    if (style) {
      if (typeof style === 'string') e.style.cssText = style;
      else Object.keys(style).forEach(function (k) { e.style[k] = style[k]; });
    }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  (function injectFont () {
    if (D.getElementById('footmap-font')) return;
    var st = el('style');
    st.id = 'footmap-font';
    st.textContent = "@font-face{font-family:'FusionPixel12';font-display:swap;" +
      "src:url('http://127.0.0.1:8000/fonts/fusion12.woff') format('woff')}";
    D.head.appendChild(st);
  })();
  var COMMON = 'font-family:FusionPixel12,"PingFang SC",sans-serif;';

  var themeStyle = el('style');
  themeStyle.id = 'footmap-theme';
  D.head.appendChild(themeStyle);
  function themeCss () {
    var v = THEMES[ui.theme].v;
    var s = ':root{';
    Object.keys(v).forEach(function (k) { s += '--fm-' + k + ':' + v[k] + ';'; });
    return s + '}';
  }

  /* ---------------- 入口：小书 + 收纳 dock（方案A：手动折叠，只露书脊） ---------------- */
  var dock = el('div');
  dock.id = 'footmap-dock';
  dock.style.cssText = COMMON + 'position:fixed;left:0;top:0;z-index:2147482990;width:64px;height:56px;box-sizing:border-box;display:none;' +
    'transition:transform .3s ease;touch-action:manipulation;-webkit-tap-highlight-color:transparent;';

  var foldBtn = el('div');
  foldBtn.id = 'footmap-foldbtn';
  foldBtn.style.cssText = 'position:absolute;left:0;top:11px;width:16px;height:34px;box-sizing:border-box;border-radius:8px 0 0 8px;' +
    'background:linear-gradient(135deg,var(--fm-ball1),var(--fm-ball2));border:2px solid rgba(0,0,0,.18);border-right:none;' +
    'color:#fff;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-user-select:none;' +
    'transition:opacity .18s ease;';
  foldBtn.textContent = '›';

  var book = el('div');
  book.id = 'footmap-book';
  book.style.cssText = 'position:absolute;right:0;top:0;box-sizing:border-box;' +
    'width:48px;height:56px;display:flex;overflow:hidden;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;' +
    'border-radius:3px 8px 8px 3px;border:2px solid rgba(0,0,0,.18);' +
    'background:linear-gradient(135deg,var(--fm-ball1),var(--fm-ball2));' +
    'box-shadow:0 3px 0 var(--fm-ballSh),0 8px 16px rgba(0,0,0,.28);';
  book.title = '足迹地图（轻点翻开）';
  dock.appendChild(foldBtn);
  dock.appendChild(book);

  // 折叠态的隐形大拉手：覆盖书脊并向屏内扩 22px、上下各扩 9px，手指粗也能点中拉出
  var pullTab = el('div');
  pullTab.id = 'footmap-pull';
  pullTab.style.cssText = 'position:absolute;left:-22px;top:-9px;width:47px;height:74px;z-index:6;display:none;background:transparent;';
  pullTab.title = '展开足迹地图';
  dock.appendChild(pullTab);
  pullTab.addEventListener('click', function (e) { e.stopPropagation(); setFolded(false); });
  MOUNT.appendChild(dock);

  // 折叠：dock 整体向右滑入屏幕右缘，只露小书左缘 9px 印字书脊；点书脊/拉手滑回
  function setFolded (folded) {
    if (folded) {
      dock.classList.add('fm-folded');
      var __tx = (dock.offsetWidth || 64) - 13; // 右滑后只露 9px 书脊
      dock.style.transform = 'translateX(' + __tx + 'px)';
      foldBtn.style.opacity = '0';
      foldBtn.style.pointerEvents = 'none';
      pullTab.style.display = 'block';
    } else {
      dock.classList.remove('fm-folded');
      dock.style.transform = 'none';
      foldBtn.style.opacity = '1';
      foldBtn.style.pointerEvents = 'auto';
      pullTab.style.display = 'none';
    }
  }
  foldBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    setFolded(!dock.classList.contains('fm-folded'));
  });
  dock.addEventListener('click', function () {
    if (dock.classList.contains('fm-folded')) setFolded(false);
  });
  // 小书固定位置、不可拖动；轻点翻开（折叠态不打开，让位给 dock 的展开逻辑）
  book.addEventListener('click', function () {
    if (dock.classList.contains('fm-folded')) return;
    openPanel();
  });

  // 该手机 webview 对 fixed 的 right/bottom 解析会飞（top 算出负值），
  // 统一用 JS 按视口算 left/top 像素，绝不依赖 right/bottom
  function clampDockXY (x, y) {
    var vw = W.innerWidth || D.documentElement.clientWidth || 360;
    var vh = W.innerHeight || D.documentElement.clientHeight || 640;
    var dw = dock.offsetWidth || 64, dh = dock.offsetHeight || 56;
    return {
      x: Math.max(2, Math.min(vw - dw - 2, x)),
      y: Math.max(4, Math.min(vh - dh - 4, y))
    };
  }
  function placeBook () {
    var vw = W.innerWidth || D.documentElement.clientWidth || 360;
    var vh = W.innerHeight || D.documentElement.clientHeight || 640;
    var dw = dock.offsetWidth || 64, dh = dock.offsetHeight || 56;
    // 固定默认位：右下角
    var c = clampDockXY(vw - dw - 12, vh - dh - 150);
    dock.style.right = 'auto'; dock.style.bottom = 'auto';
    dock.style.left = c.x + 'px'; dock.style.top = c.y + 'px';
  }
  placeBook();
  W.addEventListener('resize', placeBook);
  try { if (W.visualViewport) W.visualViewport.addEventListener('resize', placeBook); } catch (e) {}

  /* ---------------- 书本舞台（直接悬浮在页面上） / 书皮封面 ---------------- */
  var stage = el('div');
  stage.id = 'fm-stage';
  stage.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483000;box-sizing:border-box;transform-origin:0 0;' +
    'transition:width .3s ease,height .3s ease,left .25s ease,top .25s ease,transform .2s ease;touch-action:manipulation;-webkit-tap-highlight-color:transparent;';

  var panel = el('div');
  panel.id = 'fm-panel';
  panel.style.cssText = COMMON + 'box-sizing:border-box;display:flex;flex-direction:column;position:absolute;left:0;top:0;width:100%;height:100%;' +
    'background:#F4F1FA;background:var(--fm-bg);border:3px solid var(--fm-ink);border-radius:14px;' +
    'box-shadow:inset 16px 0 22px -16px rgba(0,0,0,.4),6px 6px 0 rgba(var(--fm-rgb),.35);overflow:hidden;';

  // 右侧 / 下侧纸页厚度（封面闭合时从书皮边缘露出，翻开后是一叠纸的侧边）
  var pagesR = el('div', 'position:absolute;right:0;top:6px;bottom:6px;width:9px;border-radius:0 4px 4px 0;z-index:2;' +
    'background:repeating-linear-gradient(to bottom,#f5efe0 0 2px,#e8dfc8 2px 3px);box-shadow:1px 0 3px rgba(0,0,0,.15),inset 1px 0 0 rgba(255,255,255,.5);');
  var pagesB = el('div', 'position:absolute;left:6px;right:0;bottom:0;height:7px;border-radius:0 0 4px 4px;z-index:2;' +
    'background:repeating-linear-gradient(to right,#f5efe0 0 2px,#e8dfc8 2px 3px);box-shadow:0 1px 3px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.5);');

  // 皮质书签带：夹在书页间，闭合时被书皮盖住上半、底部露出，翻开时完全垂出
  var bookmark = el('div');
  bookmark.id = 'fm-bookmark';
  bookmark.style.cssText = 'position:absolute;left:30%;bottom:-16px;width:5px;height:44px;z-index:2;pointer-events:none;' +
    'background:linear-gradient(180deg,#7a4f2a,#4a2f18);' +
    'box-shadow:1px 2px 4px rgba(0,0,0,.35);' +
    'clip-path:polygon(0 0,100% 0,100% 82%,50% 100%,0 82%);';

  // 书皮封面（front 书皮正面 / back 封二环衬，3D 向左翻开）
  var cover = el('div');
  cover.id = 'fm-cover';
  var coverBack = el('div');
  coverBack.className = 'fm-face';
  coverBack.id = 'fm-back';
  coverBack.style.cssText = 'background:#c9a87c;box-shadow:inset 0 0 30px rgba(0,0,0,.25);';
  coverBack.innerHTML = '';

  var coverFront = el('div');
  coverFront.className = 'fm-face';
  coverFront.id = 'fm-front';

  cover.appendChild(coverBack);
  cover.appendChild(coverFront);
  // 收纳按钮：book 态显示在书角，点击缩回 mini
  var miniBtn = el('div');
  miniBtn.style.cssText = 'position:absolute;right:6px;top:6px;width:24px;height:24px;border-radius:50%;' +
    'background:rgba(0,0,0,.5);color:#fff;font-size:16px;line-height:22px;text-align:center;cursor:pointer;' +
    'z-index:5;display:none;user-select:none;-webkit-user-select:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;';
  miniBtn.textContent = '—';
  miniBtn.title = '缩回小书';
  miniBtn.classList.add('fm-ctl');
  cover.appendChild(miniBtn);
  miniBtn.addEventListener('click', function (e) { e.stopPropagation(); toMini(); });
  stage.appendChild(pagesR);
  stage.appendChild(pagesB);
  stage.appendChild(bookmark);
  stage.appendChild(panel);
  stage.appendChild(cover);
  MOUNT.appendChild(stage);

  /* ---------------- 缩放（双指捏合 / ＋－按钮 / 双击标题栏还原） ---------------- */
  var SCALE_MIN = 1, SCALE_MAX = 2.6;
  // 视觉包围盒限位：放大后允许超出屏幕，但保证四个角都能拖回视野
  function clampLT (L, T, k) {
    var vw = W.innerWidth || D.documentElement.clientWidth || 360;
    var vh = W.innerHeight || D.documentElement.clientHeight || 640;
    var w = (stage.offsetWidth || 56) * k, h = (stage.offsetHeight || 64) * k, m = 4;
    var loX = Math.min(m, vw - w - m), hiX = Math.max(m, vw - w - m);
    var loY = Math.min(m, vh - h - m), hiY = Math.max(m, vh - h - m);
    return { x: Math.max(loX, Math.min(hiX, L)), y: Math.max(loY, Math.min(hiY, T)) };
  }
  // 应用缩放；L/T 给出则同时按限位更新左上角（transform-origin 为 0 0，left/top 即视觉左上）
  function renderScale (k, L, T) {
    state.scale = k;
    stage.style.transform = 'scale(' + k + ')';
    if (L != null && T != null) {
      var c = clampLT(L, T, k);
      stage.style.left = c.x + 'px';
      stage.style.top = c.y + 'px';
    }
  }
  // 以屏幕坐标 (ax,ay) 为不动锚点缩放到 k
  function zoomAt (k, ax, ay, animate) {
    k = Math.max(SCALE_MIN, Math.min(SCALE_MAX, k));
    if (Math.abs(k - state.scale) < 0.001) return;
    var L = parseInt(stage.style.left, 10) || 0, T = parseInt(stage.style.top, 10) || 0, k0 = state.scale || 1;
    stage.style.transition = animate === false ? 'none' : __stageTrans;
    renderScale(k, ax - (ax - L) * (k / k0), ay - (ay - T) * (k / k0));
  }
  // 按钮缩放：以当前视觉中心为锚
  function zoomBy (factor) {
    var r = stage.getBoundingClientRect();
    zoomAt((state.scale || 1) * factor, r.left + r.width / 2, r.top + r.height / 2, true);
  }
  // 按当前态基准尺寸居中（还原 / 切态用）
  function centerStage () {
    var vw = W.innerWidth || D.documentElement.clientWidth || 360;
    var vh = W.innerHeight || D.documentElement.clientHeight || 640;
    if (state.panelOpen) {
      var pS = Math.min(Math.round(vw * 0.97), Math.round(vh * 0.82));
      stage.style.left = Math.max(2, Math.round((vw - pS) / 2)) + 'px';
      stage.style.top = Math.max(4, Math.round((vh - pS) / 2)) + 'px';
    } else {
      var bw = Math.min(Math.round(vw * 0.64), 280);
      stage.style.left = Math.max(2, Math.round((vw - bw) / 2)) + 'px';
      stage.style.top = Math.max(4, Math.round((vh - bw) / 2 + 30)) + 'px';
    }
  }
  // 双击还原 1 倍并居中
  function resetZoom () {
    state.scale = 1;
    stage.style.transition = __stageTrans;
    stage.style.transform = 'scale(1)';
    centerStage();
  }
  // layoutStage 改完基准尺寸后：按现有 scale 重设 transform 并把位置限位
  function retainScale () {
    var k = state.scale || 1;
    stage.style.transform = 'scale(' + k + ')';
    var L = parseInt(stage.style.left, 10) || 0, T = parseInt(stage.style.top, 10) || 0;
    var c = clampLT(L, T, k);
    stage.style.left = c.x + 'px'; stage.style.top = c.y + 'px';
  }

  // 缩放工具条（＋/－）：book/open 态显示，mini 隐藏，随书一起缩放
  var zoomBar = el('div');
  zoomBar.id = 'fm-zoombar';
  zoomBar.style.cssText = 'position:absolute;z-index:20;display:none;flex-direction:column;gap:6px;';
  function fmZoomBtn (txt, cb) {
    var b = el('div');
    b.classList.add('fm-ctl');
    b.style.cssText = 'width:28px;height:28px;border-radius:50%;background:rgba(36,26,46,.55);color:#fff;font-size:18px;line-height:24px;text-align:center;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;border:2px solid rgba(255,255,255,.55);box-sizing:border-box;';
    b.textContent = txt;
    b.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); cb(); });
    return b;
  }
  zoomBar.appendChild(fmZoomBtn('＋', function () { zoomBy(1.2); }));
  zoomBar.appendChild(fmZoomBtn('－', function () { zoomBy(1 / 1.2); }));
  stage.appendChild(zoomBar);
  function placeZoom (mode) {
    if (mode === 'mini') { zoomBar.style.display = 'none'; return; }
    zoomBar.style.display = 'flex';
    zoomBar.style.left = 'auto';
    if (mode === 'book') { zoomBar.style.right = '6px'; zoomBar.style.top = 'auto'; zoomBar.style.bottom = '6px'; }
    else { zoomBar.style.right = '0px'; zoomBar.style.top = '44%'; zoomBar.style.bottom = 'auto'; }
  }

  // 封面：完整书图片，点击后 3D 翻开露出内页
  var coverStyle = el('style');
  coverStyle.id = 'fm-cover-style';
  coverStyle.textContent =
    '#fm-cover{position:absolute;left:0;top:0;right:0;bottom:0;z-index:3;cursor:pointer;' +
    '-webkit-tap-highlight-color:transparent;touch-action:manipulation;}' +
    '#fm-back{display:none !important;}' +
    '#fm-front{position:absolute;left:0;top:0;width:100%;height:100%;border:none;border-radius:0;overflow:visible;' +
    'background-position:center;background-repeat:no-repeat;background-size:contain;' +
    'transition:opacity .25s ease;-webkit-tap-highlight-color:transparent;}' +
    '#fm-lockbtn.fm-unlock #fm-shackle{transform:translateY(-3px) rotate(-22deg);}' +
    '#fm-lockbtn.fm-unlock #fm-lockbody{animation:fmShake .35s ease;}' +
    '@keyframes fmShake{0%{transform:translateX(0)}25%{transform:translateX(-2px) rotate(-4deg)}55%{transform:translateX(2px) rotate(4deg)}100%{transform:translateX(0)}}' +
    '@keyframes fmFadeIn{from{opacity:0}to{opacity:1}}' +
    '#fm-panel.fm-fadein{animation:fmFadeIn .32s ease;}';
  D.head.appendChild(coverStyle);

  /* ---------------- 封面工坊：按 ui.cover 动态生成书皮 ---------------- */
  function lockPack (cfg, tcol) {
    var pos = cfg.layout === 'hcenter' ? 'left:50%;top:52%;transform:translate(-50%,-50%);'
      : cfg.layout === 'vcenter' ? 'right:9%;top:64%;transform:translateY(-50%);'
      : 'right:12%;top:50%;transform:translateY(-50%);';
    if (cfg.lock === 'none') {
      return { html: '<div style="position:absolute;left:0;right:0;top:58%;text-align:center;font-size:12px;letter-spacing:4px;color:' + tcol + ';opacity:.85;pointer-events:none;font-family:' + FONT_STACK.round + ';">轻 点 翻 开</div>' };
    }
    var c;
    if (cfg.lock === 'silver') c = { sh: '#cfd4dc', b1: '#f2f4f7', b2: '#aab0bc', edge: '#6e7480', hole: '#454a54', hint: 'rgba(255,255,255,.92)', pixel: false };
    else if (cfg.lock === 'pixel') c = { sh: tcol, b1: tcol, b2: tcol, edge: 'rgba(0,0,0,.4)', hole: '#10142a', hint: tcol, pixel: true };
    else c = { sh: '#E3C074', b1: '#ECC978', b2: '#C99E4F', edge: '#8f6f31', hole: '#5a4a22', hint: 'rgba(242,226,184,.9)', pixel: false };
    var sr = c.pixel ? '0' : '11px 11px 0 0', br = c.pixel ? '0' : '5px', hr = c.pixel ? '0' : '50%';
    var glow = c.pixel ? ',0 0 8px ' + c.sh : '';
    return { html:
      '<div id="fm-lockbtn" style="position:absolute;' + pos + 'width:56px;height:74px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">' +
        '<div id="fm-shackle" style="width:20px;height:13px;border:3px solid ' + c.sh + ';border-bottom:none;border-radius:' + sr + ';margin-bottom:-2px;transition:transform .3s ease;transform-origin:right bottom;box-sizing:border-box;box-shadow:' + (c.pixel ? '0 0 6px ' + c.sh : '0 -1px 0 rgba(255,255,255,.35) inset') + ';"></div>' +
        '<div id="fm-lockbody" style="width:30px;height:23px;border-radius:' + br + ';background:linear-gradient(180deg,' + c.b1 + ',' + c.b2 + ');border:1px solid ' + c.edge + ';display:flex;align-items:center;justify-content:center;box-shadow:0 2px 0 rgba(0,0,0,.28)' + glow + ';">' +
          '<div style="position:relative;width:8px;height:12px;display:flex;flex-direction:column;align-items:center;">' +
            '<div style="width:7px;height:7px;border-radius:' + hr + ';background:' + c.hole + ';"></div>' +
            '<div style="width:3px;height:5px;background:' + c.hole + ';border-radius:0 0 2px 2px;margin-top:-1px;"></div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:10px;color:' + c.hint + ';margin-top:9px;letter-spacing:1px;opacity:.92;">点锁翻开</div>' +
      '</div>' };
  }
  function coverPack (cfg) {
    var tcol = cfg.titleColor === 'custom' ? (cfg.titleColorVal || '#F2E2B8') : (TITLE_COLORS[cfg.titleColor] || '#F2E2B8');
    var font = FONT_STACK[cfg.titleFont] || FONT_STACK.pixel;
    var bg, edge;
    if (cfg.coverImg && /^(https?:|data:)/i.test(cfg.coverImg)) {
      bg = "linear-gradient(rgba(20,14,30,.14),rgba(20,14,30,.26)),url('" + String(cfg.coverImg).replace(/'/g, '') + "') center/cover no-repeat";
      edge = '#2a2230';
    } else {
      bg = 'linear-gradient(135deg,' + (cfg.c1 || '#9d8fd6') + ',' + (cfg.c2 || '#6f61a0') + ')';
      edge = cfg.c2 || '#5a4f82';
    }
    var spineTitle = esc((cfg.title || '足迹地图').replace(/\s/g, '').slice(0, 4));
    var spine = '<div style="position:absolute;left:0;top:0;bottom:0;width:14px;z-index:2;' +
      'background:linear-gradient(90deg,rgba(0,0,0,.58) 0%,rgba(0,0,0,.32) 35%,rgba(255,255,255,.14) 50%,rgba(0,0,0,.36) 68%,rgba(0,0,0,.55) 100%);' +
      'box-shadow:inset 1px 0 0 rgba(255,255,255,.22),inset -1px 0 0 rgba(0,0,0,.4);">' +
      '<div style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;">' +
      '<div style="writing-mode:vertical-rl;-webkit-writing-mode:vertical-rl;text-orientation:upright;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,.7);font-family:\'PingFang SC\',sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.6);display:inline-block;">' + spineTitle + '</div>' +
      '</div></div>';
    var frameDiv = '';
    if (cfg.frame === 'double') {
      frameDiv = '<div style="position:absolute;left:17px;right:9px;top:9px;bottom:9px;border:2px solid ' + cfg.frameColor + ';border-radius:7px;pointer-events:none;box-shadow:inset 0 0 0 1px ' + cfg.frameColor + ';"></div>';
    } else if (cfg.frame === 'single') {
      frameDiv = '<div style="position:absolute;left:17px;right:9px;top:9px;bottom:9px;border:2px solid ' + cfg.frameColor + ';border-radius:7px;pointer-events:none;opacity:.92;"></div>';
    }
    var tShadow = cfg.coverImg ? '0 2px 0 rgba(0,0,0,.55),0 0 10px rgba(0,0,0,.45)' : '0 2px 0 rgba(0,0,0,.35)';
    var titleText = esc(cfg.title || '足迹地图');
    var titleDiv;
    if (cfg.layout === 'hcenter') {
      titleDiv = '<div style="position:absolute;left:0;right:0;top:19%;text-align:center;pointer-events:none;"><div style="display:inline-block;font-size:30px;letter-spacing:6px;color:' + tcol + ';font-family:' + font + ';text-shadow:' + tShadow + ';">' + titleText + '</div></div>';
    } else if (cfg.layout === 'vcenter') {
      titleDiv = '<div style="position:absolute;left:50%;top:0;bottom:0;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;pointer-events:none;"><div style="writing-mode:vertical-rl;-webkit-writing-mode:vertical-rl;text-orientation:upright;font-size:32px;letter-spacing:10px;color:' + tcol + ';font-family:' + font + ';text-shadow:' + tShadow + ';">' + titleText + '</div></div>';
    } else {
      titleDiv = '<div style="position:absolute;left:32px;top:0;bottom:0;display:flex;align-items:center;justify-content:center;pointer-events:none;"><div style="writing-mode:vertical-rl;-webkit-writing-mode:vertical-rl;text-orientation:upright;font-size:32px;letter-spacing:10px;color:' + tcol + ';font-family:' + font + ';text-shadow:' + tShadow + ';">' + titleText + '</div></div>';
    }
    var sub = cfg.sub ? '<div style="position:absolute;left:0;right:0;bottom:15px;text-align:center;font-size:10px;letter-spacing:1px;color:' + tcol + ';opacity:.72;pointer-events:none;font-family:' + FONT_STACK.round + ';">' + esc(cfg.sub) + '</div>' : '';
    return { bg: bg, edge: edge, html: spine + frameDiv + titleDiv + lockPack(cfg, tcol).html + sub };
  }
  // 掀开动画四帧（厚涂二次元手账本，去背景透明 PNG）：0闭合 1微掀 2半开 3全开
  var BOOK_FRAMES = [
    'footmap-assets/frame0.png',
    'footmap-assets/frame1.png',
    'footmap-assets/frame2.png',
    'footmap-assets/frame3.png'
  ];
  // 四帧叠放为 <img>，播放只切 opacity（GPU 合成，避免逐帧换 background-image 触发重绘/现场解码卡顿）
  var frameImgs = [];
  var frameReady = [false, false, false, false];
  var frameWaiters = [];
  function framesAllReady () { return frameReady[0] && frameReady[1] && frameReady[2] && frameReady[3]; }
  function whenFramesReady (cb) { if (framesAllReady()) cb(); else frameWaiters.push(cb); }
  function markFrameReady (i, img) {
    frameReady[i] = true;
    try { if (img && img.decode) img.decode().catch(function () {}); } catch (e) {} // 提前解码，避免首切那一下卡顿
    if (framesAllReady()) {
      var q = frameWaiters.splice(0);
      setTimeout(function () { q.forEach(function (cb) { try { cb(); } catch (e) {} }); }, 0);
    }
  }
  BOOK_FRAMES.forEach(function (u, i) {
    var im = D.createElement('img');
    im.src = u;
    im.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;pointer-events:none;-webkit-user-drag:none;user-select:none;opacity:' + (i === 0 ? '1' : '0') + ';';
    im.draggable = false;
    coverFront.appendChild(im);
    frameImgs.push(im);
    if (im.complete && im.naturalWidth) markFrameReady(i, im);
    else {
      im.addEventListener('load', function () { markFrameReady(i, im); });
      im.addEventListener('error', function () { markFrameReady(i, im); }); // 出错也放行，避免永久卡住
    }
  });
  // 主动解码预热（toBook 时调用，利用看闭合书的时间窗把帧准备好）
  function primeFrames () {
    frameImgs.forEach(function (im) { try { if (im.decode) im.decode().catch(function () {}); } catch (e) {} });
  }
  function setFrame (i) {
    for (var k = 0; k < frameImgs.length; k++) frameImgs[k].style.opacity = (k === i ? '1' : '0');
  }
  function renderCoverFront () {
    coverFront.style.background = 'transparent';
    coverFront.style.border = 'none';
    coverFront.style.boxShadow = 'none';
    coverFront.style.opacity = '1';
    coverFront.style.pointerEvents = '';
    setFrame(0);
  }
  // 点击书本身：翻开（拖动 / 捏合后不触发）
  var dragState = { moved: false, startX: 0, startY: 0, offX: 0, offY: 0, canDrag: false };
  // 捏合手势状态 + 双击还原计时；pinchLock 用于拦住 viewport 的抬手翻页
  var gesture = { mode: 'none', pinchLock: false, d0: 1, k0: 1, mx: 0, my: 0, L0: 0, T0: 0, lastTap: 0, lastX: 0, lastY: 0 };
  var __stageTrans = 'width .3s ease,height .3s ease,left .25s ease,top .25s ease,transform .2s ease';
  coverFront.addEventListener('click', function () {
    if (dragState.moved) { dragState.moved = false; return; }
    if (state.mini) { toBook(); }
    else if (!state.panelOpen) { openPanel(); }
    else {
      // open 态点封面/书边（右页纸层以外）：拍立得开着先收，否则合书
      if (polaroid.style.display === 'block') closePolaroid();
      else closePanel();
    }
  });
  function fmOnCtl (node) { return !!(node && node.closest && node.closest('.fm-ctl')); }
  function fmOnHeader (node) { return !!(node && node.closest && node.closest('#fm-header')); }
  // open 态：按住纸面空白 / 封面 / 书边可拖书；格子、拍立得、按钮、输入框不拖
  function fmDragOK (node) {
    if (!node) return false;
    if (node.closest && (node.closest('.fm-ctl') || node.closest('.fm-cell') || node.closest('.fm-nodrag') ||
        node.closest('#fm-polaroid') || node.closest('#fm-pdetail') || node.closest('.fm-titleedit'))) return false;
    if (node.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName)) return false;
    return true;
  }

  // 拖动：mini/book 态按住书面拖（6px 阈值区分点按）；open 态仅标题栏可拖，页内滚动/翻页/点格子不受影响
  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      // 双指：开始捏合缩放（以两指中点为不动锚）
      var a0 = e.touches[0], b0 = e.touches[1];
      gesture.mode = 'pinch'; gesture.pinchLock = true;
      gesture.d0 = Math.hypot(b0.clientX - a0.clientX, b0.clientY - a0.clientY) || 1;
      gesture.k0 = state.scale || 1;
      gesture.mx = (a0.clientX + b0.clientX) / 2; gesture.my = (a0.clientY + b0.clientY) / 2;
      gesture.L0 = parseInt(stage.style.left, 10) || 0; gesture.T0 = parseInt(stage.style.top, 10) || 0;
      dragState.moved = true; // 吞掉多指可能误触发的 click
      stage.style.transition = 'none';
      e.preventDefault();
      return;
    }
    if (e.touches.length !== 1) return;
    var t = e.touches[0];
    var canDrag = !fmOnCtl(t.target) && (state.mini || !state.panelOpen || fmDragOK(t.target));
    dragState.canDrag = canDrag;
    dragState.startX = t.clientX; dragState.startY = t.clientY; dragState.moved = false;
    if (canDrag) {
      stage.style.transition = 'none'; // 跟手，消除滞后
      var r = stage.getBoundingClientRect();
      dragState.offX = t.clientX - r.left; dragState.offY = t.clientY - r.top;
    }
  }, { passive: false });
  stage.addEventListener('touchmove', function (e) {
    if (gesture.mode === 'pinch' || e.touches.length === 2) {
      gesture.mode = 'pinch';
      var a = e.touches[0], b = e.touches[1];
      if (!b) return;
      var d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY) || 1;
      var k = Math.max(SCALE_MIN, Math.min(SCALE_MAX, gesture.k0 * (d / gesture.d0)));
      var nL = gesture.mx - (gesture.mx - gesture.L0) * (k / gesture.k0);
      var nT = gesture.my - (gesture.my - gesture.T0) * (k / gesture.k0);
      renderScale(k, nL, nT);
      e.preventDefault();
      return;
    }
    if (!dragState.canDrag || e.touches.length !== 1) return;
    var t = e.touches[0];
    var dx = t.clientX - dragState.startX, dy = t.clientY - dragState.startY;
    if (!dragState.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    dragState.moved = true;
    var c = clampLT(t.clientX - dragState.offX, t.clientY - dragState.offY, state.scale || 1);
    stage.style.left = c.x + 'px'; stage.style.top = c.y + 'px';
    e.preventDefault();
  }, { passive: false });
  stage.addEventListener('touchend', function (e) {
    if (gesture.mode === 'pinch') {
      if (e.touches.length === 0) {
        gesture.mode = 'none'; stage.style.transition = __stageTrans;
        setTimeout(function () { gesture.pinchLock = false; }, 300);
      }
      return;
    }
    if (!dragState.canDrag) return;
    stage.style.transition = __stageTrans;
    if (dragState.moved) {
      if (state.mini) {
        try { localStorage.setItem('footmap_mini_x', stage.style.left); localStorage.setItem('footmap_mini_y', stage.style.top); } catch (err) {}
      } else if (!state.panelOpen) {
        state.bookX = stage.style.left; state.bookY = stage.style.top;
      }
      return;
    }
    // open 态在标题栏上双击 → 还原 1 倍并居中（book/mini 单击即翻页，不做双击）
    if (state.panelOpen && e.changedTouches && e.changedTouches.length) {
      var ct = e.changedTouches[0], now = Date.now();
      if (gesture.lastTap && now - gesture.lastTap < 300 &&
          Math.abs(ct.clientX - gesture.lastX) < 28 && Math.abs(ct.clientY - gesture.lastY) < 28 && fmDragOK(ct.target)) {
        resetZoom(); gesture.lastTap = 0; return;
      }
      gesture.lastTap = now; gesture.lastX = ct.clientX; gesture.lastY = ct.clientY;
    }
  });
  stage.addEventListener('touchcancel', function () {
    gesture.mode = 'none'; stage.style.transition = __stageTrans;
    setTimeout(function () { gesture.pinchLock = false; }, 300);
  });

  // 入口小书：尺寸 + 正面/书脊文字跟随工坊配置（取书名前两字）
  function buildBookFace () {
    var s = BOOK_SIZES[ui.cover.bookSize] || BOOK_SIZES.m;
    var ch = (ui.cover.title || '足迹地图').replace(/\s/g, '');
    var c1 = ch.charAt(0) || '足', c2 = ch.charAt(1) || '迹';
    dock.style.width = (s.w + 16) + 'px';
    dock.style.height = s.h + 'px';
    book.style.width = s.w + 'px';
    book.style.height = s.h + 'px';
    book.title = (ui.cover.title || '足迹地图') + '（轻点翻开）';
    book.innerHTML =
      '<div style="width:9px;align-self:stretch;background:rgba(0,0,0,.16);box-shadow:inset 2px 0 0 rgba(255,255,255,.22);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-family:\'PingFang SC\',sans-serif;">' +
        '<div style="font-size:' + s.spineFs + 'px;line-height:1;color:rgba(255,255,255,.92);">' + esc(c1) + '</div>' +
        '<div style="font-size:' + s.spineFs + 'px;line-height:1;color:rgba(255,255,255,.92);">' + esc(c2) + '</div>' +
      '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;">' +
        '<div style="width:16px;height:2px;background:rgba(255,255,255,.78);"></div>' +
        '<div style="font-size:' + s.fs + 'px;line-height:1.05;color:#fff;letter-spacing:1px;">' + esc(c1) + '</div>' +
        '<div style="font-size:' + s.fs + 'px;line-height:1.05;color:#fff;letter-spacing:1px;">' + esc(c2) + '</div>' +
        '<div style="width:16px;height:2px;background:rgba(255,255,255,.78);"></div>' +
      '</div>' +
      '<div style="width:5px;align-self:stretch;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.6) 0 2px,rgba(0,0,0,.07) 2px 4px);"></div>';
    if (dock.classList.contains('fm-folded')) setFolded(true);
    placeBook();
  }

  function unlockCover () {
    if (cover.classList.contains('fm-open')) return;
    var lb = coverFront.querySelector('#fm-lockbtn');
    if (lb && lb.classList.contains('fm-unlock')) return;
    if (lb) lb.classList.add('fm-unlock');
    setTimeout(function () { cover.classList.add('fm-open'); }, lb ? 380 : 200);
  }

  // 键盘弹出 / 视口变化时，舞台重新按视口归位
  function __fmReposition () {
    if (state.panelOpen) {
      layoutStage('open');
      var vw0 = W.innerWidth || 360, vh0 = W.innerHeight || 640;
      var rS = Math.min(Math.round(vw0 * 0.97), Math.round(vh0 * 0.82));
      stage.style.left = Math.max(2, Math.round((vw0 - rS) / 2)) + 'px';
      stage.style.top = Math.max(4, Math.round((vh0 - rS) / 2)) + 'px';
      retainScale();
      if (paper.style.display === 'block') {
        paper.style.opacity = '0';
        clearTimeout(handPaperTimer);
        handPaperTimer = setTimeout(function () { renderPaper(); paper.style.opacity = '1'; }, 340);
      }
    } else if (state.mini) {
      layoutStage('mini'); placeStage();
    } else {
      layoutStage('book'); placeStageBook(); retainScale();
    }
  }
  W.addEventListener('resize', __fmReposition);
  try { if (W.visualViewport) W.visualViewport.addEventListener('resize', __fmReposition); } catch (e) {}
  // 该手机 webview 对 fixed 的 right/bottom/百分比参照系解析会飞（高度会按整个文档算），
  // 全屏遮罩一律用 JS 按视口算像素 left/top/width/height，与小书同策略
  function fmFixLayer (ly) {
    try {
      var vw = W.innerWidth || D.documentElement.clientWidth || 360;
      var vh = W.innerHeight || D.documentElement.clientHeight || 640;
      ly.style.position = 'fixed';
      ly.style.left = '0px'; ly.style.top = '0px';
      ly.style.right = 'auto'; ly.style.bottom = 'auto';
      ly.style.width = vw + 'px'; ly.style.height = vh + 'px';
      ly.style.margin = '0px';
    } catch (e) {}
  }

  // 书脊顶栏（open 态拖动把手：按标题/空白处拖书，按按钮不拖）
  var header = el('div', 'display:flex;align-items:center;gap:8px;padding:11px 12px;background:var(--fm-btn);color:var(--fm-btnInk);flex:0 0 auto;touch-action:none;');
  header.id = 'fm-header';
  var closeBtn = el('div', 'width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;', '✕');
  closeBtn.classList.add('fm-ctl');
  closeBtn.onclick = closePanel;
  var titleBox = el('div', 'flex:1;text-align:center;');
  titleBox.innerHTML = '<div style="font-size:17px;letter-spacing:2px;">足迹地图</div>' +
    '<div style="font-size:10px;opacity:.85;margin-top:2px;">以「' + esc(CENTER.name) + '」为中心</div>';
  var gearBtn = el('div', 'width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;', '⚙');
  gearBtn.classList.add('fm-ctl');
  gearBtn.onclick = function () { showSettings(); };
  header.appendChild(closeBtn); header.appendChild(titleBox); header.appendChild(gearBtn);
  panel.appendChild(header);

  // 书页视口 + 横向轨道
  var viewport = el('div', 'flex:1 1 auto;min-height:0;overflow:hidden;position:relative;background:var(--fm-bg);');
  var track = el('div', 'display:flex;height:100%;width:100%;transition:transform .26s ease;transform:translateX(0);');
  viewport.appendChild(track);
  panel.appendChild(viewport);

  // 第 1 页：总览（目录）
  var overviewPage = el('div', 'flex:0 0 100%;width:100%;height:100%;box-sizing:border-box;');
  var overviewScroll = el('div', 'height:100%;overflow:auto;padding:14px;box-sizing:border-box;display:flex;flex-direction:column;');
  overviewPage.appendChild(overviewScroll);
  track.appendChild(overviewPage);

  // 翻页栏
  function navBtn (txt) {
    return el('div', 'width:58px;text-align:center;padding:9px 4px;border-radius:9px;font-size:14px;cursor:pointer;' +
      'border:2px solid var(--fm-ink);box-shadow:0 2px 0 var(--fm-ink);background:var(--fm-card);color:var(--fm-ink);', txt);
  }
  var navBar = el('div', 'flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:2px dashed var(--fm-line);background:var(--fm-footer);');
  var prevBtn = navBtn('‹ 上页');
  var pageIndicator = el('div', 'flex:1;text-align:center;font-size:12px;color:var(--fm-ink);');
  var nextBtn = navBtn('下页 ›');
  prevBtn.onclick = function () { goPage(state.cur - 1); };
  nextBtn.onclick = function () { goPage(state.cur + 1); };
  navBar.appendChild(prevBtn); navBar.appendChild(pageIndicator); navBar.appendChild(nextBtn);
  panel.appendChild(navBar);

  function paperBg () {
    switch (ui.paper) {
      case 'line':
        return 'var(--fm-bg) repeating-linear-gradient(to bottom, transparent 0 25px, rgba(var(--fm-rgb),.09) 25px 26px)';
      case 'grid':
        return 'var(--fm-bg) repeating-linear-gradient(to right, rgba(var(--fm-rgb),.07) 0 1px, transparent 1px 24px), repeating-linear-gradient(to bottom, rgba(var(--fm-rgb),.07) 0 1px, transparent 1px 24px)';
      case 'dot':
        return 'var(--fm-bg) radial-gradient(rgba(var(--fm-rgb),.14) 1px, transparent 1.6px) 0 0/12px 12px';
      case 'kraft':
        return 'linear-gradient(rgba(214,182,128,.55),rgba(214,182,128,.55)), var(--fm-bg) repeating-linear-gradient(to bottom, transparent 0 22px, rgba(120,85,40,.10) 22px 23px)';
      default:
        return 'var(--fm-bg)';
    }
  }
  function applyUI () {
    themeStyle.textContent = themeCss();
    viewport.style.background = paperBg();
    if (ui.bgUrl && /^https?:\/\//i.test(ui.bgUrl)) {
      overviewScroll.style.backgroundImage = "url('" + ui.bgUrl.replace(/'/g, '') + "')";
      overviewScroll.style.backgroundRepeat = 'repeat';
      overviewScroll.style.backgroundPosition = 'center';
      overviewScroll.style.backgroundSize = 'auto';
      overviewScroll.style.backgroundColor = 'transparent';
    } else {
      overviewScroll.style.backgroundImage = 'none';
    }
  }

  function smallBtn (txt, cb, primary, disabled) {
    var b = el('div', 'flex:1;text-align:center;padding:9px 4px;border-radius:9px;font-size:12px;cursor:pointer;' +
      'border:2px solid var(--fm-ink);box-shadow:0 2px 0 var(--fm-ink);box-sizing:border-box;' +
      (disabled ? 'opacity:.45;pointer-events:none;' : '') +
      (primary ? 'background:var(--fm-btn);color:var(--fm-btnInk);' : 'background:var(--fm-card);color:var(--fm-ink);'), txt);
    if (!disabled) b.onclick = cb;
    return b;
  }

  /* ---------------- 总览页渲染（八宫格目录） ---------------- */
  function renderOverview () {
    overviewScroll.innerHTML = '';
    var ring = maxRing();
    var size = ring * 2 + 1;
    var grid = el('div', 'display:grid;gap:8px;grid-template-columns:repeat(' + size + ',minmax(80px,1fr));min-width:100%;');
    for (var y = -ring; y <= ring; y++) {
      for (var x = -ring; x <= ring; x++) {
        (function (x, y) {
          var hit = placeAt(x, y);
          var cell;
          if (hit && hit.center) {
            cell = el('div', 'aspect-ratio:1/1.05;border-radius:10px;border:2px solid var(--fm-centerEdge);background:var(--fm-center);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;box-shadow:0 3px 0 var(--fm-centerEdge);',
              '<div style="font-size:26px;">' + CENTER.icon + '</div><div style="font-size:12px;color:var(--fm-ink);">' + esc(CENTER.name) + '</div>');
          } else if (hit) {
            var t = TYPES[hit.type] || TYPES.other;
            var idx = data.places.indexOf(hit) + 1;
            cell = el('div', 'aspect-ratio:1/1.05;border-radius:10px;border:2px solid var(--fm-placeEdge);background:var(--fm-place);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;box-shadow:0 3px 0 var(--fm-placeEdge);',
              '<div style="font-size:24px;">' + t.icon + '</div>' +
              '<div style="font-size:11px;color:var(--fm-ink);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(hit.name) + '</div>' +
              '<div style="font-size:9px;opacity:.55;color:var(--fm-ink);">第 ' + idx + ' 页</div>');
            cell.onclick = (function (i) { return function () { goPage(i); }; })(idx);
          } else {
            cell = el('div', 'aspect-ratio:1/1.05;border-radius:10px;border:2px dashed var(--fm-line);background:var(--fm-empty);display:flex;align-items:center;justify-content:center;color:var(--fm-line);font-size:22px;cursor:pointer;', '？');
            cell.onclick = function () { showAddForm(x, y); };
          }
          grid.appendChild(cell);
        })(x, y);
      }
    }
    overviewScroll.appendChild(grid);
    var hint = el('div', 'text-align:center;font-size:11px;color:var(--fm-ink);opacity:.6;margin:10px 0 12px;',
      '点「？」格添加地点 · 点地点翻到那一页 · 共 ' + data.places.length + ' 处足迹');
    overviewScroll.appendChild(hint);

    var ops = el('div', 'display:flex;gap:8px;margin-top:auto;');
    ops.appendChild(smallBtn('＋ 新地点', function () { showAddForm(); }, true));
    ops.appendChild(smallBtn('↩ 撤一块', function () {
      if (!data.places.length) { toast('还没有地点'); return; }
      var p = data.places.pop(); saveData(); state.cur = 0; renderBook();
      toast('已撤销：' + p.name);
    }));
    ops.appendChild(smallBtn('复位', function () {
      if (!data.places.length) { toast('地图是空的'); return; }
      if (W.confirm('清空全部地点（保留' + CENTER.name + '）？')) { data.places = []; saveData(); state.cur = 0; renderBook(); toast('已复位'); }
    }));
    overviewScroll.appendChild(ops);
  }

  /* ---------------- 地点纸页 ---------------- */
  function buildPlacePage (p, oneIndex) {
    var t = TYPES[p.type] || TYPES.other;
    var dir = dirOf(p);
    var page = el('div', 'flex:0 0 100%;width:100%;height:100%;box-sizing:border-box;background:transparent;');
    var scroll = el('div', 'height:100%;overflow:auto;padding:18px 16px;box-sizing:border-box;');
    page.appendChild(scroll);

    var head = el('div', 'text-align:center;font-size:11px;letter-spacing:2px;color:var(--fm-ink);opacity:.6;margin-bottom:12px;',
      '· 第 ' + oneIndex + ' 处足迹 ·');
    scroll.appendChild(head);

    var titleRow = el('div', 'display:flex;align-items:center;gap:11px;margin-bottom:12px;');
    titleRow.innerHTML =
      '<div style="width:50px;height:50px;flex:0 0 50px;border-radius:10px;background:var(--fm-place);border:2px solid var(--fm-placeEdge);display:flex;align-items:center;justify-content:center;font-size:26px;">' + t.icon + '</div>' +
      '<div style="min-width:0;flex:1;"><div style="font-size:19px;color:var(--fm-ink);line-height:1.2;">' + esc(p.name) + '</div>' +
      '<div style="font-size:11px;color:var(--fm-ink);opacity:.6;margin-top:3px;">' + t.label +
      (dir.ring ? ' · ' + dir.label + ' · 第 ' + dir.ring + ' 圈' : '') + '</div></div>';
    scroll.appendChild(titleRow);

    // 场景图区（阶段③自动生成；p.img 有值则显示）
    var imgBox;
    if (p.img) {
      imgBox = el('div', 'width:100%;aspect-ratio:16/10;border-radius:10px;border:2px solid var(--fm-placeEdge);overflow:hidden;margin-bottom:12px;background:var(--fm-empty);',
        '<img src="' + esc(p.img) + '" style="width:100%;height:100%;object-fit:cover;display:block;">');
    } else {
      imgBox = el('div', 'width:100%;aspect-ratio:16/10;border-radius:10px;border:2px dashed var(--fm-line);background:var(--fm-empty);display:flex;align-items:center;justify-content:center;text-align:center;color:var(--fm-ink);opacity:.55;font-size:12px;line-height:1.7;margin-bottom:12px;box-sizing:border-box;',
        '场景图<br>（阶段③自动生成）');
    }
    scroll.appendChild(imgBox);

    function block (label, text, placeholder, accent) {
      var wrap = el('div', 'border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:13px;line-height:1.75;box-sizing:border-box;' +
        (accent ? 'background:var(--fm-bg);border:1px dashed var(--fm-line);' : 'background:var(--fm-empty);border:1px solid var(--fm-line);'));
      wrap.innerHTML = '<div style="font-size:11px;opacity:.6;margin-bottom:4px;">' + label + '</div>' +
        '<div style="color:var(--fm-ink);white-space:pre-wrap;">' + (text ? esc(text) : '<span style="opacity:.5;">' + placeholder + '</span>') + '</div>';
      return wrap;
    }
    scroll.appendChild(block('场景', p.desc, '还没有写下这里的样子…'));
    scroll.appendChild(block('纪念时刻', p.moment, '还没有记录发生过什么…', true));

    var del = el('div', 'text-align:center;padding:11px;border-radius:9px;background:#F6D9E0;color:#9a4b5e;border:2px solid #E0A5B3;font-size:13px;cursor:pointer;margin-top:6px;', '撕下这一页（删除）');
    del.onclick = function () {
      if (!W.confirm('撕下「' + p.name + '」这一页？')) return;
      data.places = data.places.filter(function (q) { return q.id !== p.id; });
      saveData();
      var n = data.places.length;
      state.cur = Math.max(0, Math.min(state.cur, n));
      renderBook();
      toast('已删除：' + p.name);
    };
    scroll.appendChild(del);
    return page;
  }

  /* ---------------- 翻页 ---------------- */
  function applyTrack () {
    track.style.transform = 'translateX(-' + (state.cur * 100) + '%)';
    var n = data.places.length;
    if (state.cur === 0) {
      pageIndicator.textContent = '目录 · 共 ' + n + ' 处足迹';
      prevBtn.style.opacity = '.4';
      nextBtn.style.opacity = n ? '1' : '.4';
    } else {
      pageIndicator.textContent = '第 ' + state.cur + ' / ' + n + ' 页';
      prevBtn.style.opacity = '1';
      nextBtn.style.opacity = state.cur >= n ? '.4' : '1';
    }
  }
  function goPage (i) {
    var n = data.places.length;
    i = Math.max(0, Math.min(i, n));
    if (i === state.cur) { applyTrack(); return; }
    state.cur = i;
    applyTrack();
  }
  function renderBook () {
    renderOverview();
    while (track.children.length > 1) track.removeChild(track.lastChild);
    data.places.forEach(function (p, idx) { track.appendChild(buildPlacePage(p, idx + 1)); });
    state.cur = Math.max(0, Math.min(state.cur, data.places.length));
    applyTrack();
  }

  // 书页左右滑动翻页（纵向滑动留给页内滚动）
  (function swipe () {
    var sx = 0, sy = 0;
    viewport.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; sx = t.clientX; sy = t.clientY;
    }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (gesture.pinchLock) return; // 刚做过双指缩放，不判翻页
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        goPage(state.cur + (dx > 0 ? -1 : 1));
      }
    }, { passive: true });
  })();

  /* ============================================================
   * 手账纸上层 v18：帧4右页白纸上的手绘多页手账
   * 透明层只精确盖在右页纸区；手绘九宫格 / 拍立得翻面 / 多页翻页
   * 不碰帧动画、拖动、缩放（那些在 stage/cover 层）
   * ============================================================ */
  var KAI = "'AR PL UKai CN','AR PL KaitiM GB','Kaiti SC','KaiTi','STKaiti',serif";
  var INK = '#43352a', INK2 = '#5a4a38', RED = '#b0603a', EMPTY = '#bdae97';
  var PNUM = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨'];
  var PAGE_NAMES = ['我的足迹', '家附近', '纪念地', '日记', '对话'];

  var handStyle = el('style');
  handStyle.id = 'fm-hand-style';
  handStyle.textContent = [
    '#fm-paper{position:absolute;z-index:6;box-sizing:border-box;font-family:' + KAI + ';color:' + INK + ';transition:opacity .25s ease;}',
    '#fm-paper *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}',
    '.fm-pg{position:absolute;top:0;right:0;bottom:0;left:0;display:none;}',
    '.fm-pg.on{display:block;}',
    '.fm-cell{position:absolute;cursor:pointer;}',
    '.fm-cell > svg{position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;}',
    '.fm-cell .c-in{position:absolute;top:0;right:0;bottom:0;left:0;pointer-events:none;}',
    '.fm-cell .c-in > svg{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);pointer-events:none;overflow:visible;}',
    '.fm-cell .c-in > div{position:absolute;left:0;right:0;top:76%;transform:translateY(-50%);text-align:center;pointer-events:none;}',
    '.fm-cell .c-in.c-center > svg{top:50%;}',
    '.fm-cell .c-in.c-center > div{top:65%;}',
    '.fm-stickbtn{display:inline-flex;align-items:center;gap:5px;cursor:pointer;}',
    '.fm-stickbtn img{width:auto;-webkit-user-drag:none;user-select:none;pointer-events:none;}',
    '.fm-lotus{position:relative;display:inline-block;}',
    '.fm-lotus img{pointer-events:none;}',
    '.fm-lotus svg{position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;}',
    '/* 今日小签 · 签卡 */',
    '.fm-fortune{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483001;display:none;pointer-events:none;writing-mode:horizontal-tb;-webkit-writing-mode:horizontal-tb;direction:ltr;}',
    '.fm-fortune.on{display:block;}',
    '.fm-fscale{position:fixed;left:0;top:0;width:210px;transform-origin:center center;pointer-events:auto;}',
    '.fm-lotusstage{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483001;display:none;pointer-events:none;}',
    '.fm-lotusstage.on{display:block;}',
    '.fm-bigwrap{position:fixed;left:0;top:0;width:200px;height:151.6px;transform-origin:center center;will-change:transform,opacity;}',
    '.fm-bigimg{position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;display:block;-webkit-user-drag:none;user-select:none;}',
    '.fm-biglit{opacity:0;}',
    '.fm-fcard{width:210px;opacity:0;}',
    '.fm-fcard .fm-tag{display:block;position:relative;background:linear-gradient(180deg,#fdf9ef,#f7efe0);border:1px solid rgba(120,95,60,.26);border-radius:10px;padding:18px 16px 13px;box-shadow:0 10px 26px rgba(150,120,80,.22),0 2px 7px rgba(150,120,80,.13),inset 0 0 24px rgba(190,160,110,.1);}',
    '.fm-fcard .finner{position:absolute;top:7px;left:7px;right:7px;bottom:7px;border:1px solid rgba(150,120,80,.16);border-radius:8px;pointer-events:none;opacity:0;}',
    '.fm-fcard .pinhole{position:absolute;top:7px;left:50%;transform:translateX(-50%);width:7px;height:7px;border-radius:50%;background:radial-gradient(circle at 38% 35%,#cdb98f,#8a7350);box-shadow:inset 0 1px 1px rgba(0,0,0,.4);opacity:0;}',
    '.fm-fcard .bird-deco{position:absolute;left:10px;top:30px;width:52px;opacity:0;-webkit-user-drag:none;user-select:none;pointer-events:none;}',
    '.fm-fcard .seal{position:absolute;top:16px;right:15px;width:25px;height:25px;opacity:0;}',
    '.fm-fcard .lv{text-align:center;opacity:0;}',
    '.fm-fcard .lv .big{font-size:30px;color:#b0603a;letter-spacing:3px;line-height:1;}',
    '.fm-fcard .lv .date{font-size:11px;color:#8a7a5c;margin-top:4px;letter-spacing:1px;}',
    '.fm-fcard .divider{display:block;width:78%;margin:10px auto;opacity:0;}',
    '.fm-fcard .weather{text-align:center;font-size:12px;color:#6b5a44;letter-spacing:1px;opacity:0;}',
    '.fm-fcard .yj{display:flex;justify-content:center;gap:14px;margin:9px 0 6px;font-size:12.5px;opacity:0;}',
    '.fm-fcard .yj .yi{color:#4f7a52;}.fm-fcard .yj .ji{color:#b0603a;}',
    '.fm-fcard .renqing{text-align:center;font-size:11.5px;color:#7a6a52;line-height:1.55;min-height:14px;padding:0 6px;opacity:0;}',
    '.fm-fcard .rumor{text-align:center;font-size:13px;color:#6b553f;line-height:1.75;padding:8px 10px;opacity:0;}',
    '.fm-fcard .rumor.egg{font-size:14px;color:#5a4636;line-height:1.85;}',
    '.fm-fcard .stars{text-align:center;margin:6px 0;}',
    '.fm-fcard .stars svg{width:15px;margin:0 2px;vertical-align:middle;opacity:0;}',
    '.fm-fcard .qianyu{text-align:center;font-size:15px;color:#43352a;letter-spacing:4px;line-height:1.6;opacity:0;}',
    '.fm-fcard .goto{position:relative;display:flex;align-items:center;justify-content:center;gap:7px;margin:11px 4px 0;background:rgba(221,117,60,.12);border:1px dashed rgba(176,96,58,.5);border-radius:8px;padding:5px 10px;font-size:11.5px;color:#8a5a32;opacity:0;}',
    '.fm-fcard .goto .seal2wrap{height:20px;display:inline-flex;align-items:center;flex:none;}',
    '.fm-fcard .goto .seal2{height:20px;width:auto;opacity:0;-webkit-user-drag:none;user-select:none;}',
    '.fm-fcard .minirow{display:flex;justify-content:center;gap:42px;margin-top:12px;font-size:11px;color:#9a8a6c;opacity:0;}',
    '.fm-fcard .minirow .act{display:inline-flex;align-items:center;gap:5px;}',
    '.fm-fcard .minirow img.paw{cursor:pointer;-webkit-user-drag:none;user-select:none;}',
    '.fm-fcard #fmPawDog{height:26px;width:auto;opacity:.28;transition:opacity 1.6s ease;}',
    '.fm-fcard #fmPawCat{height:22px;width:auto;opacity:.92;transition:transform .3s ease;}',
    '.fm-fcard #fmPawDog.filling{opacity:1;}',
    '.fm-fcard #fmPawDog.used{opacity:.16 !important;filter:grayscale(1);cursor:default;}',
    '.fm-fcard #fmPawCat.used{opacity:.22 !important;filter:grayscale(1);cursor:default;}',
    '@keyframes fmFlipN{0%{opacity:0;transform:translateX(14px);}100%{opacity:1;transform:translateX(0);}}',
    '@keyframes fmFlipP{0%{opacity:0;transform:translateX(-14px);}100%{opacity:1;transform:translateX(0);}}',
    '.fm-pg.fm-flip-n{animation:fmFlipN .26s ease-out;}',
    '.fm-pg.fm-flip-p{animation:fmFlipP .26s ease-out;}',
    '.fm-titleedit{position:absolute;left:0;right:0;outline:none;text-align:center;line-height:1;cursor:text;}',
    '.fm-titleedit:focus{background:rgba(255,250,235,.55);border-radius:4px;}',
    '.fm-arrow{position:absolute;cursor:pointer;}',
    '.fm-arrow svg{width:100%;height:100%;overflow:visible;}',
    '.fm-inkbtn{cursor:pointer;}',
    '#fm-polaroid{position:absolute;z-index:12;display:none;perspective:1400px;}',
    '.fm-pola{position:relative;width:100%;height:100%;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .55s cubic-bezier(.3,.7,.3,1);}',
    '.fm-pola.flip{transform:rotateY(180deg);}',
    '.fm-face{position:absolute;top:0;right:0;bottom:0;left:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#fbfaf4;border-radius:6px;box-shadow:0 10px 26px rgba(40,28,20,.42),0 2px 0 rgba(0,0,0,.08);border:1px solid rgba(120,100,70,.25);overflow:hidden;}',
    '.fm-face.back{transform:rotateY(180deg);}',
    '#fm-pdetail{position:absolute;z-index:13;display:none;background:#fbfaf4;border-radius:6px;box-shadow:0 12px 30px rgba(40,28,20,.5);border:1px solid rgba(120,100,70,.3);padding:13px;overflow:auto;font-family:' + KAI + ';color:' + INK + ';}',
    '.fm-roundctl{position:absolute;z-index:11;width:26px;height:26px;border-radius:50%;background:rgba(36,26,46,.5);color:#fff;font-size:15px;line-height:24px;text-align:center;cursor:pointer;user-select:none;border:2px solid rgba(255,255,255,.5);display:none;}'
  ].join('');
  D.head.appendChild(handStyle);

  // 纸上层：只盖帧4右页白纸（1440 坐标系：纸 x712~1172 / y250~1125）
  var paper = el('div');
  paper.id = 'fm-paper';
  paper.style.cssText = 'display:none;left:49.4%;top:17.2%;width:32.0%;height:61.0%;';
  var pagesWrap = el('div');
  pagesWrap.style.cssText = 'position:absolute;top:0;right:0;bottom:0;left:0;';
  paper.appendChild(pagesWrap);
  // v19 全局手绘/水彩滤镜（cell 内 SVG 跨元素引用 url(#fm-wob) 等）
  var fmDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  fmDefs.setAttribute('style', 'position:absolute;width:0;height:0;overflow:visible;pointer-events:none;');
  fmDefs.innerHTML = '<defs>' +
    '<filter id="fm-rough" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>' +
    '<filter id="fm-wob" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter>' +
    '<filter id="fm-wob2" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="11"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>' +
    '</defs>';
  paper.appendChild(fmDefs);
  var paperPages = [];
  for (var ppi = 0; ppi < 5; ppi++) {
    var ppg = el('div');
    ppg.className = 'fm-pg' + (ppi === 0 ? ' on' : '');
    pagesWrap.appendChild(ppg);
    paperPages.push(ppg);
  }
  // 翻页箭头 + 页码（跨页通用）
  var pageNav = el('div');
  pageNav.style.cssText = 'position:absolute;top:0;right:0;bottom:0;left:0;pointer-events:none;';
  function makeArrow (next) {
    var a = el('div');
    a.className = 'fm-arrow fm-ctl fm-nodrag';
    a.style.cssText = (next ? 'right:2%;' : 'left:2%;') + 'bottom:1.5%;width:13%;height:7%;pointer-events:auto;';
    a.innerHTML = '<svg viewBox="0 0 60 30" preserveAspectRatio="none" style="transform:' + (next ? 'none' : 'scaleX(-1)') + ';">' +
      '<path d="M2 17 L34 12 L56 17" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M56 17 L42 7 M56 17 L42 27" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return a;
  }
  var prevArrow = makeArrow(false), nextArrow = makeArrow(true);
  var pageNum = el('div');
  pageNum.style.cssText = 'position:absolute;left:50%;bottom:2.4%;transform:translateX(-50%);color:' + INK2 + ';';
  pageNav.appendChild(prevArrow); pageNav.appendChild(nextArrow); pageNav.appendChild(pageNum);
  paper.appendChild(pageNav);
  stage.appendChild(paper);

  function goBookPage (i, dir) {
    var n = paperPages.length;
    i = Math.max(0, Math.min(n - 1, i | 0));
    var prev = state.bookPage || 0;
    if (typeof dir !== 'number') dir = i > prev ? 1 : (i < prev ? -1 : 0);
    state.bookPage = i;
    paperPages.forEach(function (g, k) {
      g.classList.toggle('on', k === i);
      g.classList.remove('fm-flip-n', 'fm-flip-p');
    });
    var tg = paperPages[i];
    if (dir !== 0 && tg) { void tg.offsetWidth; tg.classList.add(dir > 0 ? 'fm-flip-n' : 'fm-flip-p'); }
    prevArrow.style.display = i <= 0 ? 'none' : 'block';
    nextArrow.style.display = i >= n - 1 ? 'none' : 'block';
    pageNum.textContent = PNUM[i] || ('' + (i + 1));
    closePolaroid();
  }
  prevArrow.addEventListener('click', function (e) { e.stopPropagation(); goBookPage(state.bookPage - 1); });
  nextArrow.addEventListener('click', function (e) { e.stopPropagation(); goBookPage(state.bookPage + 1); });

  /* ---- 手绘工具：确定性抖动的钢笔框 / 逐字手写 / 一笔画图标 ---- */
  function rnd1 (s) { var x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rbPath (w, h, r, s) {
    function jt (t) { return 1.4 * Math.sin(t * 6.5 + s) + 0.8 * Math.sin(t * 12.7 + s * 1.7); }
    var seg = 9, P = [], i, t;
    function add (x, y) { P.push(x.toFixed(1) + ' ' + y.toFixed(1)); }
    for (i = 0; i <= seg; i++) { t = i / seg; add(r + (w - 2 * r) * t + jt(t), jt(t + 1)); }
    for (i = 1; i <= seg; i++) { t = i / seg; add(w + jt(t + 2), r + (h - 2 * r) * t + jt(t + 3)); }
    for (i = 1; i <= seg; i++) { t = i / seg; add(w - r - (w - 2 * r) * t + jt(t + 4), h + jt(t + 5)); }
    for (i = 1; i <= seg; i++) { t = i / seg; add(jt(t + 6), h - r - (h - 2 * r) * t + jt(t + 7)); }
    var d = 'M' + P[0];
    for (i = 1; i < P.length; i++) d += ' L' + P[i];
    return d + ' Z';
  }
  function roughBoxSVG (w, h, o) {
    o = o || {};
    var r = o.r || Math.min(w, h) * 0.14, s = (o.seed || 1) * 3.7;
    var col = o.color || INK, sw = o.width || Math.max(1.4, w * 0.02), fill = o.fill || 'none', op = o.op == null ? 0.9 : o.op;
    var p = rbPath(w, h, r, s);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
      '<path d="' + p + '" fill="' + fill + '" stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" opacity="' + op + '"/>' +
      '<path d="' + p + '" fill="none" stroke="' + col + '" stroke-width="' + (sw * 0.5) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".3"/></svg>';
  }
  function handHTML (str, seed, size, color, weight) {
    var out = '';
    String(str).split('').forEach(function (c, i) {
      var rot = ((rnd1(seed + i * 3.3) - 0.5) * 11).toFixed(1);
      var dy = ((rnd1(seed + i * 5.1) - 0.5) * size * 0.2).toFixed(1);
      var ds = (1 + (rnd1(seed + i * 7.7) - 0.5) * 0.08).toFixed(3);
      out += '<span style="display:inline-block;transform:rotate(' + rot + 'deg) translateY(' + dy + 'px) scale(' + ds + ');transform-origin:center 70%;">' + (c === ' ' ? '&nbsp;' : esc(c)) + '</span>';
    });
    return '<span style="font-size:' + size + 'px;color:' + color + ';font-weight:' + (weight || 400) + ';display:inline-block;white-space:nowrap;">' + out + '</span>';
  }
  var ICON_PATHS = {
    house: ['M-22 4 V-15 L0 -30 L22 -15 V4 Z', 'M-10 4 V-9 H10 V4'],
    tree: ['M0 -27 C-15 -27 -19 -12 -9 -8 H9 C19 -12 15 -27 0 -27 Z', 'M0 -8 V18', 'M-11 18 H11'],
    cup: ['M-16 -12 H12 L9 13 H-13 Z', 'M12 -8 H17 C22 -8 22 4 16 6', 'M-11 -20 Q-7 -26 -3 -20', 'M1 -20 Q5 -26 9 -20'],
    lantern: ['M-14 -6 C-14 12 14 12 14 -6 Z', 'M-8 -14 H8', 'M-9 14 H9', 'M0 -20 V-14', 'M0 14 V20', 'M-6 -2 V6', 'M6 -2 V6'],
    pin: ['M0 24 C-8 8 -16 0 -16 -12 A16 16 0 1 1 16 -12 C16 0 8 8 0 24 Z', 'M-5 -12 A5 5 0 1 0 5 -12 A5 5 0 1 0 -5 -12 Z']
  };
  var TYPE_ICON = { home: 'house', company: 'house', hotel: 'house', school: 'house', park: 'tree', cafe: 'cup', bar: 'cup', restaurant: 'cup', nightmarket: 'lantern', beach: 'pin', scenery: 'pin', bookstore: 'pin', hospital: 'pin', other: 'pin' };
  function iconSVG (name, size, color, sw) {
    var ps = ICON_PATHS[name] || ICON_PATHS.pin;
    var d = ps.map(function (pth) { return '<path d="' + pth + '" fill="none" stroke="' + color + '" stroke-width="' + (sw || 3.2) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }).join('');
    return '<svg viewBox="-40 -40 80 80" style="width:' + size + 'px;height:' + size + 'px;overflow:visible;">' + d + '</svg>';
  }
  function inkSmall (txt, fs, cb) {
    var b = el('div');
    b.className = 'fm-inkbtn fm-ctl fm-nodrag';
    b.style.cssText = 'font-size:' + fs + 'px;color:' + INK2 + ';border:1px solid rgba(67,53,42,.3);background:rgba(255,250,238,.5);border-radius:14px;padding:' + (fs * 0.32) + 'px ' + (fs * 0.85) + 'px;';
    b.textContent = txt;
    b.addEventListener('click', function (e) { e.stopPropagation(); cb(); });
    return b;
  }

  /* ---- v19 水彩九宫格：油墨丙烯色块 + 角花 + 白描图标；待补褪色淡彩 + 小爪印 ---- */
  var TITLE_URL = 'footmap-assets/title-handwritten.png';
  var ARROW_URL = 'footmap-assets/note-arrow.png';
  var BTN_CAT_URL = 'footmap-assets/btn-cat.png';
  var BTN_DOG_URL = 'footmap-assets/btn-dog.png';
  var LOTUS_URL = 'footmap-assets/lotus.png';
  var LOTUS_BRIGHT_URL = 'footmap-assets/lotus-bright.png';
  var CLOUD_URL = 'footmap-assets/cloud-c1.png';
  var SEAL_URL = 'footmap-assets/seal-simple.png';
  var PAW_DOG_URL = 'footmap-assets/dog-paw.png';
  var PAW_CAT_URL = 'footmap-assets/cat-paw.png';
  var SCREEN_URL = 'footmap-assets/album-screen.png';
  var BLACK_LOTUS_URL = 'footmap-assets/black-lotus.png';
  // 集卡册五扇封面（DOM 左→右；展开中式从右往左：cover→normal→special→rumor→festival）
  var ALBUM_PANELS = [
    { key: 'festival', url: 'footmap-assets/album-festival.png', name: '节日' },
    { key: 'rumor',    url: 'footmap-assets/album-rumor.png',    name: '传闻' },
    { key: 'special',  url: 'footmap-assets/album-special.png',  name: '特签' },
    { key: 'normal',   url: 'footmap-assets/album-normal.png',   name: '常签' },
    { key: 'cover',    url: 'footmap-assets/album-cover.png',    name: '' }
  ];

  /* ============================================================
   * 集卡册本体（全局单例，只建一次；不随 renderPaper 重建）
   * 合拢封面 → 五扇屏风展开 → 点分类二级陈列已藏签
   * ============================================================ */
  var fmAlbumOpen = (function initAlbum () {
    if (D.getElementById('fm-album-overlay')) return null;
    var albumStyle = el('style');
    albumStyle.textContent = [
      '#fm-album-overlay{display:none;}',
      '#fm-album-overlay.on{display:flex;}',
      '.fm-ab-close{position:fixed;top:14px;right:14px;width:38px;height:38px;border-radius:50%;background:rgba(245,240,228,.92);color:#5a4a38;font-size:20px;line-height:38px;text-align:center;cursor:pointer;}',
      '.fm-ab-scene{perspective:1500px;perspective-origin:50% 40%;}',
      '.fm-ab-fold{position:relative;cursor:pointer;filter:drop-shadow(0 20px 32px rgba(0,0,0,.4));}',
      '.fm-ab-fold img{display:block;border-radius:2px;}',
      '.fm-ab-hint{position:absolute;left:0;right:0;bottom:-32px;text-align:center;color:#efe7d6;font-size:13px;letter-spacing:3px;}',
      '.fm-ab-panels{display:none;transform-style:preserve-3d;}',
      '#fm-album-overlay.expanded .fm-ab-fold{display:none;}',
      '#fm-album-overlay.expanded .fm-ab-panels{display:flex;}',
      '.fm-ab-panel{position:relative;cursor:pointer;transform-style:preserve-3d;box-shadow:0 12px 26px rgba(0,0,0,.32);backface-visibility:hidden;}',
      '.fm-ab-panel img{width:100%;height:100%;object-fit:cover;display:block;}',
      '.fm-ab-cap{position:absolute;left:0;right:0;bottom:0;padding:16px 6px 12px;text-align:center;background:linear-gradient(transparent,rgba(28,22,16,.6));color:#f3ead8;letter-spacing:3px;font-size:15px;}',
      '.fm-ab-cap .cnt{display:block;font-size:11px;letter-spacing:1px;opacity:.82;margin-top:4px;}',
      '.fm-ab-backhint{position:fixed;bottom:22px;left:0;right:0;text-align:center;color:#e7ddc9;font-size:12px;letter-spacing:2px;opacity:.85;}',
      '.fm-ab-cat{display:none;flex-direction:column;width:92%;max-width:430px;height:86%;}',
      '#fm-album-overlay.incat .fm-ab-scene{display:none;}',
      '#fm-album-overlay.incat .fm-ab-cat{display:flex;}',
      '#fm-album-overlay.incat .fm-ab-backhint{display:none;}',
      '.fm-ab-cat-head{display:flex;align-items:center;justify-content:space-between;color:#f3ead8;margin-bottom:14px;}',
      '.fm-ab-cat-head .back{cursor:pointer;font-size:14px;letter-spacing:1px;padding:6px 10px;border:1px solid rgba(240,230,210,.4);border-radius:16px;}',
      '.fm-ab-cat-head .tt{letter-spacing:5px;font-size:18px;}',
      '.fm-ab-cat-scroll{overflow-y:auto;display:flex;flex-direction:column;align-items:center;gap:20px;padding:6px 4px 26px;}',
      '.fm-ab-cat .fm-fcard{width:100%;max-width:300px;}',
      '.fm-ab-cat .fm-fcard,.fm-ab-cat .fm-fcard *{opacity:1;}',
      '.fm-ab-empty{color:#d8ccb4;text-align:center;margin-top:46px;line-height:2.1;font-size:14px;letter-spacing:1px;}',
      '.fm-collected-at{text-align:center;font-size:11px;color:#9a8a6c;margin-top:12px;letter-spacing:2px;}'
    ].join('\n');
    D.head.appendChild(albumStyle);

    var albumOverlay = el('div');
    albumOverlay.id = 'fm-album-overlay';
    albumOverlay.style.cssText =
      'position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483645;' +
      'align-items:center;justify-content:center;background:rgba(38,32,26,.6);';
    var albumClose = el('div'); albumClose.className = 'fm-ab-close'; albumClose.textContent = '×';
    var albumScene = el('div'); albumScene.className = 'fm-ab-scene';

    var albumFold = el('div'); albumFold.className = 'fm-ab-fold';
    var foldImg = el('img'); foldImg.src = 'footmap-assets/album-cover.png';
    foldImg.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    var foldHint = el('div'); foldHint.className = 'fm-ab-hint'; foldHint.textContent = '轻触展开';
    albumFold.appendChild(foldImg); albumFold.appendChild(foldHint);

    var albumPanels = el('div'); albumPanels.className = 'fm-ab-panels';
    var panelEls = [];
    ALBUM_PANELS.forEach(function (p) {
      var pn = el('div'); pn.className = 'fm-ab-panel'; pn.dataset.key = p.key;
      var im = el('img'); im.src = p.url; pn.appendChild(im);
      if (p.name) {
        var cap = el('div'); cap.className = 'fm-ab-cap';
        cap.innerHTML = esc(p.name) + '<span class="cnt"></span>';
        pn.appendChild(cap);
      }
      pn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!albumOverlay.classList.contains('expanded') || p.key === 'cover') return;
        openCategory(p.key);
      });
      panelEls.push(pn); albumPanels.appendChild(pn);
    });
    albumScene.appendChild(albumFold); albumScene.appendChild(albumPanels);
    var albumBackHint = el('div'); albumBackHint.className = 'fm-ab-backhint';
    albumBackHint.textContent = '点分类扇查看收集的签 · 点空白处合上册子';
    var albumCat = el('div'); albumCat.className = 'fm-ab-cat';
    var catHead = el('div'); catHead.className = 'fm-ab-cat-head';
    var catBack = el('span'); catBack.className = 'back'; catBack.textContent = '‹ 五扇';
    var catTitle = el('span'); catTitle.className = 'tt';
    catHead.appendChild(catBack); catHead.appendChild(catTitle);
    var catScroll = el('div'); catScroll.className = 'fm-ab-cat-scroll';
    albumCat.appendChild(catHead); albumCat.appendChild(catScroll);
    albumOverlay.appendChild(albumClose); albumOverlay.appendChild(albumScene);
    albumOverlay.appendChild(albumCat); albumOverlay.appendChild(albumBackHint);
    MOUNT.appendChild(albumOverlay);
    catBack.addEventListener('click', function (e) { e.stopPropagation(); closeCategory(); });

    function getViewport () {
      var w = 0, h = 0;
      try { w = W.innerWidth || 0; h = W.innerHeight || 0; } catch (e) {}
      try { if ((!w || !h) && D.documentElement) { w = w || D.documentElement.clientWidth; h = h || D.documentElement.clientHeight; } } catch (e) {}
      try { if ((!w || !h) && D.body) { w = w || D.body.clientWidth; h = h || D.body.clientHeight; } } catch (e) {}
      try { if ((!w || !h) && W.visualViewport) { w = w || Math.round(W.visualViewport.width); h = h || Math.round(W.visualViewport.height); } } catch (e) {}
      return { w: w || 400, h: h || 700 };
    }
    function sizeAlbum () {
      var vp = getViewport(), vw = vp.w, vh = vp.h;
      albumOverlay.style.position = 'fixed';
      albumOverlay.style.top = '0px';
      albumOverlay.style.left = '0px';
      albumOverlay.style.right = 'auto';
      albumOverlay.style.bottom = 'auto';
      albumOverlay.style.width = vw + 'px';
      albumOverlay.style.height = vh + 'px';
      var fh = Math.min(vh * 0.62, 560), fw = fh / 2.7;
      albumFold.style.height = fh + 'px'; albumFold.style.width = fw + 'px';
      var pw = (vw * 0.9) / 5, ph = pw * 2.7;
      if (ph > vh * 0.72) { ph = vh * 0.72; pw = ph / 2.7; }
      panelEls.forEach(function (pn) { pn.style.width = pw + 'px'; pn.style.height = ph + 'px'; });
    }
    function refreshAlbumCaps () {
      var c = collectionCounts();
      panelEls.forEach(function (pn) {
        var cap = pn.querySelector('.cnt'); if (!cap) return;
        var n = c[pn.dataset.key] || 0;
        cap.textContent = n > 0 ? ('已藏 ' + n) : '尚未收集';
      });
    }
    function fmDiag () {
      var e = albumOverlay, lines = [];
      function add (k, fn) {
        try { lines.push(k + '=' + fn()); }
        catch (err) { lines.push(k + '=ERR:' + err.message); }
      }
      add('parent', function () { var p = e.parentNode; return p ? (p.tagName + '#' + p.id + '.' + p.className) : 'NONE'; });
      add('rect', function () { var r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round).join(','); });
      add('computed', function () { var c = getComputedStyle(e); return 'pos=' + c.position + ',top=' + c.top + ',right=' + c.right + ',bottom=' + c.bottom + ',left=' + c.left + ',display=' + c.display; });
      add('viewport', function () { return innerWidth + 'x' + innerHeight + ' dpr=' + devicePixelRatio + ' scrollY=' + scrollY; });
      add('ancestors', function () {
        var n = e.parentNode, out = [];
        while (n) {
          var s = getComputedStyle(n), f = [];
          ['transform', 'filter', 'perspective', 'contain', 'willChange'].forEach(function (p) {
            var v = s[p];
            if (v && v !== 'none' && v !== 'auto') f.push(p + ':' + v);
          });
          if (f.length) out.push(n.tagName + '#' + n.id + '.' + n.className + '[' + f.join(';') + ']');
          n = n.parentNode;
        }
        return out.join(' || ') || 'NONE';
      });
      return lines.join('\n');
    }
    var fmDiagBox = null;
    function showDiag () {
      var w = window, out = [], i = 0;
      while (w && i < 10) {
        var info = 'f' + i + ': ';
        try {
          info += w.innerWidth + 'x' + w.innerHeight;
          var de = w.document.documentElement, b = w.document.body;
          info += ' de=' + (de ? de.clientWidth + 'x' + de.clientHeight : '?');
          info += ' body=' + (b ? b.clientWidth + 'x' + b.clientHeight : '?');
          if (de) { var sd = getComputedStyle(de); info += ' deT=' + sd.transform + ' deFilter=' + sd.filter; }
          if (b) { var sb = getComputedStyle(b); info += ' bodyT=' + sb.transform + ' bodyPos=' + sb.position + ' bodyOverflow=' + sb.overflow; }
        } catch (e) { info += 'CROSS:' + e.name; }
        out.push(info);
        if (!w.parent || w.parent === w) break;
        w = w.parent; i++;
      }
      try { window.alert(out.join('\n')); } catch (e) {}
    }
    function openAlbum () {
      albumOverlay.classList.remove('expanded', 'incat');
      albumOverlay.classList.add('on');
      panelEls.forEach(function (pn) { pn.style.transition = 'none'; pn.style.transform = ''; });
      refreshAlbumCaps();
      var tries = 0;
      (function lay () {
        sizeAlbum();
        var vp = getViewport();
        if ((!vp.w || !vp.h || vp.w < 10 || vp.h < 10) && tries < 20) {
          tries++;
          setTimeout(lay, 60);
        }
      })();
    }
    function expandAlbum () {
      if (albumOverlay.classList.contains('expanded')) return;
      sizeAlbum();
      albumOverlay.classList.add('expanded');
      panelEls.forEach(function (pn) {
        pn.style.transition = 'none'; pn.style.transformOrigin = 'left center';
        pn.style.transform = 'rotateY(-92deg)';
      });
      void albumScene.offsetWidth;
      panelEls.forEach(function (pn, i) {
        var order = 4 - i; // 最右 cover(i4) 最先、依次向左
        setTimeout(function () {
          pn.style.transition = 'transform .62s cubic-bezier(.22,1,.36,1)';
          pn.style.transform = 'rotateY(0deg)';
        }, order * 120);
      });
    }
    function closeAlbum () {
      albumOverlay.classList.remove('on', 'expanded', 'incat');
      panelEls.forEach(function (pn) { pn.style.transition = 'none'; pn.style.transform = ''; });
    }
    function buildReadOnlyCard (fo, at) {
      var bc = W.__fmBuildCard;
      if (typeof bc !== 'function') return '';
      var h = bc(fo);
      h = h.replace('id="fmPawDog"', '').replace('id="fmPawCat"', '');
      h = h.replace(/<div class="minirow">[\s\S]*?<\/div><\/div>$/,
        '<div class="fm-collected-at">藏于 ' + esc(at || fo.date) + '</div></div>');
      return h;
    }
    var CAT_TITLE = { normal: '常签', special: '特签', rumor: '传闻', festival: '节日' };
    function openCategory (key) {
      var items = getCollection().filter(function (it) { return it.category === key; });
      catTitle.textContent = CAT_TITLE[key] || '';
      catScroll.innerHTML = '';
      if (!items.length) {
        var em = el('div'); em.className = 'fm-ab-empty';
        em.innerHTML = '这一扇还空着<br>去抽到的签卡上点「收集」吧';
        catScroll.appendChild(em);
      } else {
        items.forEach(function (it) {
          var wrap = el('div'); wrap.className = 'fm-fcard';
          wrap.innerHTML = buildReadOnlyCard(it, it.collectedAt);
          catScroll.appendChild(wrap);
        });
      }
      albumOverlay.classList.add('incat');
      catScroll.scrollTop = 0;
    }
    function closeCategory () { albumOverlay.classList.remove('incat'); }
    albumFold.addEventListener('click', function (e) { e.stopPropagation(); expandAlbum(); });
    albumClose.addEventListener('click', function (e) { e.stopPropagation(); closeAlbum(); });
    albumOverlay.addEventListener('click', function (e) { if (e.target === albumOverlay) closeAlbum(); });
    W.addEventListener('resize', function () { if (albumOverlay.classList.contains('on')) sizeAlbum(); });

    return openAlbum;
  })();
  function fmOpenAlbum () { if (typeof fmAlbumOpen === 'function') fmAlbumOpen(); }

  /* ============================================================
   * 收集流光过场（全局单例；点签卡「收集」成功时播放）
   * 签卡散成花瓣 → 沿暖光弧线飞进黑莲 → 黑莲辉光＋金环＋轻呼吸
   * ============================================================ */
  var fmCollectFx = (function initCollectFx () {
    // 花瓣图以 dataURI 内嵌进 js（根治真机素材漏传/404）；黑莲体积大仍走外链
    var PETAL_URLS = ['data:image/png;base64,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','data:image/png;base64,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','data:image/png;base64,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'];
    var FM_VER = 'v219';
    var GLOW_URL = 'footmap-assets/fm-glow.png';
    var BLACK_BRIGHT_URL = 'footmap-assets/fm-black-lotus-bright.png?v=214';
    var assetStatus = { petals:'loading', glow:null, blackBright:null, petalRuntimeFail:0 };
    function preload(u, key){ try{ var i=new W.Image(); if(key){ i.onload=function(){ assetStatus[key]='ok'; }; i.onerror=function(){ assetStatus[key]='FAIL'; }; } i.src=u; }catch(e){ if(key)assetStatus[key]='err:'+e; } }
    // 花瓣虽内嵌，也要真实探测解码结果（旧版永远报 embedded，真机坏了也看不出来）
    PETAL_URLS.forEach(function(u){
      var i=new W.Image();
      i.onload=function(){ var ok=assetStatus.petalOk=(assetStatus.petalOk||0)+1; assetStatus.petals=ok===PETAL_URLS.length?('embedded:ok('+ok+'/'+PETAL_URLS.length+')'):('loading('+ok+'/'+PETAL_URLS.length+')'); };
      i.onerror=function(){ assetStatus.petalFail=(assetStatus.petalFail||0)+1; assetStatus.petals='FAIL('+assetStatus.petalFail+'/'+PETAL_URLS.length+')'; };
      try{ i.src=u; }catch(e){ assetStatus.petalFail=(assetStatus.petalFail||0)+1; assetStatus.petals='err:'+e; }
    });
    preload(GLOW_URL,'glow'); preload(BLACK_BRIGHT_URL,'blackBright');

    var HARD_LOW = (function(){
      try{ if(W.navigator.deviceMemory&&W.navigator.deviceMemory<=2)return true; }catch(e){}
      try{ if(W.navigator.hardwareConcurrency&&W.navigator.hardwareConcurrency<=2)return true; }catch(e){}
      return false;
    })();

    var layer=null;
    function ensureLayer(){
      if(layer&&D.getElementById('fm-fx-layer'))return layer;
      layer=el('div'); layer.id='fm-fx-layer';
      layer.style.cssText='position:fixed;top:0;left:0;right:auto;bottom:auto;z-index:2147483644;overflow:hidden;pointer-events:none;';
      MOUNT.appendChild(layer);
      return layer;
    }
    function viewport(){
      var w=0,h=0;
      try{ w=W.innerWidth||0; h=W.innerHeight||0; }catch(e){}
      try{ if((!w||!h)&&D.documentElement){w=w||D.documentElement.clientWidth;h=h||D.documentElement.clientHeight;} }catch(e){}
      try{ if((!w||!h)&&D.body){w=w||D.body.clientWidth;h=h||D.body.clientHeight;} }catch(e){}
      return {w:w||400,h:h||700};
    }
    function sizeLayer(){ var vp=viewport(); layer.style.width=vp.w+'px'; layer.style.height=vp.h+'px'; return vp; }

    function cub(p0,p1,p2,p3,t){
      var u=1-t;
      return [u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],
              u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]];
    }
    function cubTan(p0,p1,p2,p3,t){
      var u=1-t;
      var x=3*u*u*(p1[0]-p0[0])+6*u*t*(p2[0]-p1[0])+3*t*t*(p3[0]-p2[0]);
      var y=3*u*u*(p1[1]-p0[1])+6*u*t*(p2[1]-p1[1])+3*t*t*(p3[1]-p2[1]);
      return Math.atan2(y,x)*180/Math.PI;
    }
    function sprite(url,w,h){
      var im=el('img'); im.src=url; im.draggable=false;
      im.style.cssText='position:absolute;top:0;left:0;width:'+w+'px;height:'+h+'px;will-change:transform,opacity;backface-visibility:hidden;pointer-events:none;';
      layer.appendChild(im); return im;
    }
    // [v219 弃用] 旧版花瓣直接挂 document.body（绕过 fx-layer 这个 fixed 层叠上下文），为的是
    // 配合 mix-blend-mode:screen 穿透书页。现已改回 fx-layer（见 play() 内花瓣用 sprite()）；
    // 原因：挂 body 是全套 UI 中唯一的异类，body 被宿主 WebView 加 transform/filter 后会形成
    // 独立层叠上下文、改变 fixed 包含块，导致真机花瓣被压/错位而黑莲正常。以下函数保留仅为兜底，不再被调用。
    var freePetals=[];
    function spriteFixed(url,w,h,bucket){
      var im=el('img'); im.draggable=false;
      im.onerror=function(){ assetStatus.petalRuntimeFail++; };
      im.style.cssText='position:fixed;top:0;left:0;right:auto;bottom:auto;width:'+w+'px;height:'+h+'px;z-index:2147483645;will-change:transform,opacity;backface-visibility:hidden;pointer-events:none;';
      im.src=url;
      (D.body||MOUNT).appendChild(im); (bucket||freePetals).push(im); return im;
    }
    function removeEls(arr){
      if(!arr)return;
      for(var i=0;i<arr.length;i++){ var im=arr[i]; try{ if(im&&im.parentNode)im.parentNode.removeChild(im); }catch(e){} }
      arr.length=0;
    }
    function clearFreePetals(){ removeEls(freePetals); }
    function tf(X,Y,r,s){ return 'translate('+X+'px,'+Y+'px) translate(-50%,-50%) rotate('+(r||0)+'deg) scale('+(s==null?1:s)+')'; }
    function tf2(X,Y,r,sx,sy){ return 'translate('+X+'px,'+Y+'px) translate(-50%,-50%) rotate('+(r||0)+'deg) scale('+sx+','+sy+')'; }
    function run(im,frames,duration,delay,easing){
      var opt={duration:duration,delay:delay||0,fill:'both',iterations:1};
      if(easing)opt.easing=easing;
      try{ return im.animate(frames,opt); }catch(e){ return null; }
    }
    /* 花瓣统一 RAF 播放器：部分真机 WebView 的 elem.animate 对 fill:both+delay 处理异常，
       花瓣会永久停在首帧(opacity:0) → 一朵都看不见；黑莲用 RAF 真机已验证，花瓣同样改 RAF */
    var petalRAF=0, petalJobs=[];
    function petalTick(t){
      for(var k=0;k<petalJobs.length;k++){
        var job=petalJobs[k]; if(!job)continue;
        if(job.t0==null){ job.t0=t; }  // 基准统一用 rAF 时间戳：部分真机 WebView 里 performance.now() 与 rAF 的 t 不同源，混用会让花瓣永远停在 opacity:0
        var e=t-job.t0, fi;
        if(e<job.delay){ fi=0; }
        else {
          var p=(e-job.delay)/job.dur;
          if(p>=1){ var lf=job.frames[job.frames.length-1]; job.im.style.transform=lf.transform; job.im.style.opacity=lf.opacity; petalJobs[k]=null; continue; }
          fi=p*(job.frames.length-1);
        }
        var i0=Math.floor(fi), i1=Math.min(job.frames.length-1,i0+1), q=fi-i0;
        job.im.style.transform=job.frames[i0].transform;
        job.im.style.opacity=parseFloat(job.frames[i0].opacity)+(parseFloat(job.frames[i1].opacity)-parseFloat(job.frames[i0].opacity))*q;
      }
      petalJobs=petalJobs.filter(Boolean);
      if(petalJobs.length){ petalRAF=requestAnimationFrame(petalTick); } else { petalRAF=0; }
    }
    function playPetal(im,frames,dur,delay,runId){
      im.style.transform=frames[0].transform; im.style.opacity=frames[0].opacity;
      petalJobs.push({im:im,frames:frames,dur:dur,delay:delay||0,t0:null,runId:runId||0});
      if(!petalRAF)petalRAF=requestAnimationFrame(petalTick);
    }
    function stopPetalRAF(){ petalJobs=[]; if(petalRAF){ try{cancelAnimationFrame(petalRAF);}catch(e){} petalRAF=0; } }
    function getCard(root){
      if(!root)return null;
      if(root.classList&&root.classList.contains('fm-fcard'))return root;
      return (root.querySelector&&(root.querySelector('.fm-fcard')||root))||root;
    }

    var playSerial=0, activeRun=null;
    function play(opts){
      return new Promise(function(resolve){
        // 上一批还没播完又触发（连点/重放）：立刻让旧批次收尾，旧批次的清理只能清它自己的元素
        if(activeRun){ try{ activeRun.abort(); }catch(e){} activeRun=null; }
        var runId=++playSerial;
        var myPetals=[], myEls=[], myAborts=[], finished=false;
        ensureLayer();
        var vp=sizeLayer(), vw=vp.w, vh=vp.h;
        var low=HARD_LOW||(opts&&opts.low===true);
        var S=[vw*0.63,vh*0.451], E=[vw*0.14,vh*0.887];
        try{ if(opts&&opts.startEl){ var rs=opts.startEl.getBoundingClientRect(); if(rs.width)S=[rs.left+rs.width/2,rs.top+rs.height/2]; } }catch(e){}
        try{ if(opts&&opts.endEl){ var re=opts.endEl.getBoundingClientRect(); if(re.width)E=[re.left+re.width/2,re.top+re.height/2]; } }catch(e){}
        var P0=S,P3=E;
        var P1=[S[0]+(0.430-0.630)*vw,S[1]+(0.280-0.451)*vh];
        var P2=[E[0]+(0.300-0.140)*vw,E[1]+(0.800-0.887)*vh];
        // v218：低配不再砍光花瓣——只减量（8→6 朵、帧数减半），花瓣照样绽放→飘→螺旋入花心
        var TOTAL=low?1950:2300;
        function cleanup(){
          removeEls(myPetals); removeEls(myEls);
          for(var a=0;a<myAborts.length;a++){ try{ myAborts[a](); }catch(e){} }
          var keep=[];
          for(var k=0;k<petalJobs.length;k++){ var jb=petalJobs[k]; if(jb&&jb.runId===runId){ jb.im.style.opacity=0; } else if(jb){ keep.push(jb); } }
          petalJobs=keep;
          if(!petalJobs.length&&petalRAF){ try{cancelAnimationFrame(petalRAF);}catch(e){} petalRAF=0; }
        }
        function finish(){ if(finished)return; finished=true; if(activeRun===curRun)activeRun=null; cleanup(); resolve(); }
        var curRun={id:runId,abort:function(){ finish(); }};
        activeRun=curRun;
        function done(){ setTimeout(finish,60); }

        var narrow=vw<360;

        /* 签卡溶解 */
        var cardEl=getCard(opts&&opts.startEl);
        if(cardEl&&cardEl.animate){
          try{
            cardEl.animate([
              {transform:'scale(1) rotate(0deg)',opacity:1,offset:0},
              {transform:'scale(.96) rotate(-1.5deg)',opacity:1,offset:.12},
              {transform:'scale(.85) rotate(3deg)',opacity:0,offset:1}
            ],{duration:380,fill:'both',easing:'cubic-bezier(0.4,0,0.2,1)'});
          }catch(e){}
        }

        /* 花瓣：签卡绽放 → 飘向黑莲上方 → 黑莲亮起时螺旋向心、一朵朵被花心吸进去 */
        function RND(s){ var x=Math.sin(s*12.9898)*43758.5453; return x-Math.floor(x); }
        // 黑莲几何（花朵在图的 0.5,0.34，花瓣终点用花头中心而非整张图中心）
        var bwr=null;
        try{ if(opts&&opts.endEl){ var _br=opts.endEl.getBoundingClientRect(); if(_br.width)bwr=_br; } }catch(e){}
        var bw=bwr?bwr.width:vw*0.12, bh=bwr?bwr.height:vw*0.18;
        var FT=[E[0], E[1]-(bwr?(0.5-0.34)*bh:0)];
        var PN=low?(narrow?6:8):(narrow?10:14);
        var DUR=low?1500:1800, TURN=.62;
        var PETAL_NF=low?24:42;
        for(var pi=0; pi<PN; pi++){
          (function(i){
            var ra=RND(i+1), rb=RND(i+11), rc=RND(i+23), rd=RND(i+37), re5=RND(i+49);
            var url=PETAL_URLS[Math.floor(ra*3)%3];
            var ps=vw*(0.085+rb*0.05);
            // v219：花瓣与黑莲同挂 fx-layer（黑莲同款 sprite，absolute 定位、坐标仍为视口坐标）。
            // 旧版挂 document.body，是全套 UI 中唯一挂 body 的元素；酒馆/移动 WebView 给 body 加
            // transform/filter 形成层叠上下文或改变 fixed 包含块时，挂 body 的花瓣会被压/错位，
            // 而挂在 <html> 的 fx-layer 黑莲不受影响——真机“黑莲亮、花瓣全无”的根因。
            var im=sprite(url,ps,ps); myPetals.push(im);
            im.onerror=function(){ assetStatus.petalRuntimeFail++; };
            var bx=S[0], by=S[1];
            var bAng=ra*Math.PI*2, bR=vw*(0.05+rb*0.06);
            var P1=[bx+Math.cos(bAng)*bR, by+Math.sin(bAng)*bR*0.7];
            // 螺旋起点：黑莲上方半圆弧上散开（离花心有段距离，螺旋才看得清）
            var R0=vw*(0.24+rb*0.10);
            var upAng=1.1*Math.PI+rd*0.8*Math.PI;
            var driftX=FT[0]+R0*Math.cos(upAng)+(rc-.5)*vw*0.06;
            var driftY=FT[1]+R0*Math.sin(upAng)*0.72;
            var spin=(ra-.5)*Math.PI*2*1.8;
            var swayPh=rd*Math.PI*2, swayAmp=vw*(0.012+re5*0.02);
            var rotDrift=(rb-.5)*220, rotEnd=(rc-.5)*260;
            var dxA=driftX-FT[0], dyA=driftY-FT[1];
            var a0=Math.atan2(dyA,dxA), Rg=Math.sqrt(dxA*dxA+dyA*dyA);
            var NF=PETAL_NF, frames=[];
            for(var f=0;f<=NF;f++){
              var u=f/NF, X,Y,s,rot,op;
              if(u<TURN){
                var g=u/TURN;
                if(g<0.18){
                  var b=g/0.18;
                  X=bx+(P1[0]-bx)*b; Y=by+(P1[1]-by)*b; s=0.3+0.7*b; op=b;
                } else {
                  var h=(g-0.18)/0.82, e=1-Math.pow(1-h,2);
                  X=P1[0]+(driftX-P1[0])*e; Y=P1[1]+(driftY-P1[1])*e;
                  s=1.0+0.08*Math.sin(h*Math.PI);
                  X+=Math.sin(g*Math.PI*2*1.5+swayPh)*swayAmp; op=1;
                }
                rot=rotDrift*g;
              } else {
                var k=(u-TURN)/(1-TURN), e=1-Math.pow(1-k,1.8);
                var R=Rg*(1-e), ang=a0+spin*e;
                X=FT[0]+R*Math.cos(ang); Y=FT[1]+R*Math.sin(ang);
                s=k<0.55?1.0:1.0-0.95*((k-0.55)/0.45);
                rot=rotDrift+rotEnd*k;
                op=k<0.72?1:Math.max(0,(1-k)/0.28);
              }
              frames.push({transform:tf(X,Y,rot,s),opacity:op});
            }
            playPetal(im,frames,DUR,i*36,runId);
          })(pi);
        }

        /* 低配补一团辉光＋黑莲轻脉冲（高配靠黑莲亮态本身，不需要额外 glow） */
        if(low){
          var lg=sprite(GLOW_URL,vw*0.26,vw*0.26); myEls.push(lg);
          var lga=run(lg,[{transform:tf(E[0],E[1],0,.6),opacity:0},{transform:tf(E[0],E[1],0,1),opacity:.8,offset:.55},{transform:tf(E[0],E[1],0,.9),opacity:.2}],480,120,'ease-out');
          if(lga&&lga.cancel)myAborts.push(function(){ try{lga.cancel();}catch(e){} });
          if(opts&&opts.endEl&&opts.endEl.animate){ try{ opts.endEl.animate([{transform:'scale(1)'},{transform:'scale(1.05)'},{transform:'scale(1)'}],{duration:420,delay:150,fill:'both'}); }catch(e){} }
        }

        /* 黑莲接收：在原黑莲（同形）上由浅变深，外→内，墨枝不亮，停半秒淡回（几何复用花瓣段 bwr/bw/bh） */
        var bl=sprite(BLACK_BRIGHT_URL,bw,bh); myEls.push(bl);
        bl.onerror=function(){ assetStatus.blackBright='FAIL(runtime)'; };
        bl.onload=function(){ if(assetStatus.blackBright!=='FAIL(runtime)')assetStatus.blackBright='ok(runtime)'; };
        bl.style.opacity=0; bl.style.transform=tf(E[0],E[1],0,1);
        (function(){
          var stop=false, raf=0;
          myAborts.push(function(){ stop=true; try{cancelAnimationFrame(raf);}catch(e){} try{bl.style.opacity=0;}catch(e2){} });
          var cx=bw*0.5, cy=bh*0.34;
          var Rmax=Math.max(0.434*bw,0.289*bh);
          var edge=Rmax*0.22;
          function setMask(p){
            var R=(1-p)*Rmax, r1=Math.max(0,R-edge), rm=Math.max(r1,R-edge*0.5);
            var m='radial-gradient(circle at '+cx+'px '+cy+'px, transparent 0, transparent '+r1+
              'px, rgba(255,235,200,.6) '+rm+'px, #000 '+R+'px, #000 '+Rmax+'px)';
            bl.style.webkitMaskImage=m; bl.style.maskImage=m;
          }
          var t0=null, tStart=low?720:900, charge=low?420:520, hold=low?360:480, fade=low?320:400;
          function fr(t){
            if(stop)return;
            if(t0==null){ t0=t; }  // 与花瓣同款：rAF 时钟自基准，规避真机时间戳不同源
            var e=t-t0;
            if(e<tStart){ raf=requestAnimationFrame(fr); return; }
            if(e<tStart+charge){
              var p=(e-tStart)/charge;
              setMask(p); bl.style.opacity=0.3+0.7*p;
            } else if(e<tStart+charge+hold){
              setMask(1); bl.style.opacity=1;
            } else if(e<tStart+charge+hold+fade){
              var k=(e-tStart-charge-hold)/fade;
              bl.style.opacity=1-k;
            } else {
              bl.style.opacity=0; return;
            }
            raf=requestAnimationFrame(fr);
          }
          raf=requestAnimationFrame(fr);
        })();

        setTimeout(done,TOTAL);
      });
    }

    function diag(){
      return {
        ver:FM_VER,
        hardLow:HARD_LOW,
        mem:(function(){ try{ return W.navigator.deviceMemory||'n/a'; }catch(e){ return 'n/a'; } })(),
        cores:(function(){ try{ return W.navigator.hardwareConcurrency||'n/a'; }catch(e){ return 'n/a'; } })(),
        waapi: (function(){ try{ return typeof D.documentElement.animate==='function'; }catch(e){ return 'err'; } })(),
        raf: (typeof W.requestAnimationFrame==='function'),
        bodyOk:!!(D.body),
        assets:assetStatus,
        ua:(W.navigator&&W.navigator.userAgent||'').slice(0,120)
      };
    }
    return { play:play, hardLow:HARD_LOW, diag:diag };
  })();
  W.__fmPlayCollect = function (opts){ try{ return fmCollectFx.play(opts); }catch(e){ try{console.warn('fm fx err',e);}catch(_){} return Promise.resolve(); } };
  W.__fmFxDiag = function (){ try{ var d=fmCollectFx.diag(); try{console.log('[足迹地图流光诊断]',JSON.stringify(d,null,2));}catch(_){} return d; }catch(e){ return {err:String(e)}; } };

  var PAL = [
    { m: '#2f5d57', w: '#f6efe1' }, { m: '#ece2cd', w: '#4a3d2e' }, { m: '#356e7c', w: '#f3ecdd' },
    { m: '#dfa39e', w: '#7a3330' }, { m: '#d9a53e', w: '#5a4014' }, { m: '#7e9aa2', w: '#f4ecdd' },
    { m: '#c25f47', w: '#f7eedd' }, { m: '#779055', w: '#f6efdf' }, { m: '#c9ae83', w: '#57452f' }
  ];
  var FPET = ['#f6efe0', '#f2d9a1', '#efb7b0', '#f0a878', '#f4e7c9', '#d9e3c2', '#f6e7ef'];
  var FCORE = ['#e08a3c', '#c9703f', '#efe0a0', '#b65f46', '#e8b94a'];
  var CENTER_M = '#dd753c', CENTER_W = '#fbf3e2';
  function wr (s, k) { return rnd1(s * 0.731 + k * 1.913 + 0.17); }
  function wrr (s, k, a, b) { return a + wr(s, k) * (b - a); }
  function wobP (x, y, w, h, r, sd) {
    var j = function (k) { return (wr(sd, k) - 0.5) * 3.4; };
    return 'M' + (x + r + j(1)) + ',' + (y + j(2)) +
      ' L' + (x + w - r + j(3)) + ',' + (y + j(4)) + ' Q' + (x + w + j(5)) + ',' + (y + j(6)) + ' ' + (x + w + j(7)) + ',' + (y + r + j(8)) +
      ' L' + (x + w + j(9)) + ',' + (y + h - r + j(10)) + ' Q' + (x + w + j(11)) + ',' + (y + h + j(12)) + ' ' + (x + w - r + j(13)) + ',' + (y + h + j(14)) +
      ' L' + (x + r + j(15)) + ',' + (y + h + j(16)) + ' Q' + (x + j(17)) + ',' + (y + h + j(18)) + ' ' + (x + j(19)) + ',' + (y + h - r + j(20)) +
      ' L' + (x + j(21)) + ',' + (y + r + j(22)) + ' Q' + (x + j(23)) + ',' + (y + j(24)) + ' ' + (x + r + j(25)) + ',' + (y + j(26)) + ' Z';
  }
  function flowerStr (cx, cy, s, petal, core, rot, sd, op) {
    var tp = wr(sd, 33), out = '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + rot.toFixed(1) + ')" opacity="' + op + '" filter="url(#fm-rough)">';
    var i, a;
    if (tp < 0.55) {
      for (i = 0; i < 8; i++) { a = i / 8 * Math.PI * 2; out += '<ellipse cx="' + (Math.cos(a) * s * 0.6).toFixed(1) + '" cy="' + (Math.sin(a) * s * 0.6).toFixed(1) + '" rx="' + (s * 0.33) + '" ry="' + (s * 0.2) + '" transform="rotate(' + (a * 180 / Math.PI).toFixed(1) + ' ' + (Math.cos(a) * s * 0.6).toFixed(1) + ' ' + (Math.sin(a) * s * 0.6).toFixed(1) + ')" fill="' + petal + '" stroke="rgba(80,60,40,.18)" stroke-width=".8"/>'; }
      out += '<circle r="' + (s * 0.27) + '" fill="' + core + '"/>';
    } else if (tp < 0.85) {
      for (i = 0; i < 5; i++) { a = i / 5 * Math.PI * 2 - Math.PI / 2; out += '<circle cx="' + (Math.cos(a) * s * 0.5).toFixed(1) + '" cy="' + (Math.sin(a) * s * 0.5).toFixed(1) + '" r="' + (s * 0.34) + '" fill="' + petal + '" stroke="rgba(80,60,40,.16)" stroke-width=".8"/>'; }
      out += '<circle r="' + (s * 0.2) + '" fill="' + core + '"/>';
    } else {
      out += '<path d="M0,' + (s * 0.5) + ' Q0,0 0,' + (-s * 0.55) + '" stroke="' + core + '" stroke-width="1.6" fill="none"/><ellipse cx="0" cy="' + (-s * 0.55) + '" rx="' + (s * 0.34) + '" ry="' + (s * 0.48) + '" fill="' + petal + '"/>';
    }
    return out + '</g>';
  }
  var PAW_G = {
    dog: ['<ellipse cx="27" cy="35" rx="9" ry="12.5" transform="rotate(-13 27 35)"/>', '<ellipse cx="43" cy="25" rx="8.6" ry="11.5" transform="rotate(-4 43 25)"/>', '<ellipse cx="57" cy="25" rx="8.6" ry="11.5" transform="rotate(4 57 25)"/>', '<ellipse cx="73" cy="35" rx="9" ry="12.5" transform="rotate(13 73 35)"/>', '<path d="M50 47 C41 47 31 51 28 59 C25 66 29 71 35 72.5 C38 77.5 44 80.5 50 80.5 C56 80.5 62 77.5 65 72.5 C71 71 75 66 72 59 C69 51 59 47 50 47 Z"/>'],
    cat: ['<ellipse cx="29" cy="32" rx="7.6" ry="7" transform="rotate(-12 29 32)"/>', '<ellipse cx="43.5" cy="26" rx="7.4" ry="7" transform="rotate(-4 43.5 26)"/>', '<ellipse cx="56.5" cy="26" rx="7.4" ry="7" transform="rotate(4 56.5 26)"/>', '<ellipse cx="71" cy="32" rx="7.6" ry="7" transform="rotate(12 71 32)"/>', '<path d="M50 53 C46 46 36 46 32.5 52.5 C29 59 33 67 40.5 71 C45 74 48 77 50 80 C52 77 55 74 59.5 71 C67 67 71 59 67.5 52.5 C64 46 54 46 50 53 Z"/>']
  };
  function pawInline (kind, wPx, color, op) {
    return '<svg viewBox="0 0 100 96" style="width:' + wPx + 'px;height:' + (wPx * 0.96) + 'px;vertical-align:middle;overflow:visible;opacity:' + op + ';pointer-events:none;"><g fill="' + color + '" filter="url(#fm-rough)">' + PAW_G[kind].join('') + '</g></svg>';
  }
  function waterCellBG (idx, filled, sd) {
    var pal = PAL[idx % PAL.length];
    var s = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;">';
    s += '<path d="' + wobP(5, 5, 90, 90, 16, sd) + '" fill="' + pal.m + '" fill-opacity="' + (filled ? 1 : 0.2) + '" filter="url(#fm-wob)"/>';
    var bn = filled ? 3 : 2, i;
    for (i = 0; i < bn; i++) { s += '<ellipse cx="' + wrr(sd, 40 + i, 16, 84).toFixed(1) + '" cy="' + wrr(sd, 50 + i, 14, 84).toFixed(1) + '" rx="' + wrr(sd, 60 + i, 9, 22).toFixed(1) + '" ry="' + wrr(sd, 70 + i, 6, 14).toFixed(1) + '" fill="#ffffff" fill-opacity="' + (filled ? 0.1 : 0.16) + '" filter="url(#fm-wob)"/>'; }
    if (filled) {
      for (i = 0; i < 2; i++) { s += '<ellipse cx="' + wrr(sd, 90 + i, 16, 84).toFixed(1) + '" cy="' + wrr(sd, 100 + i, 16, 84).toFixed(1) + '" rx="' + wrr(sd, 110 + i, 7, 15).toFixed(1) + '" ry="' + wrr(sd, 120 + i, 5, 10).toFixed(1) + '" fill="#000000" fill-opacity=".07" filter="url(#fm-wob)"/>'; }
      var left = wr(sd, 30) < 0.5, mx = left ? 24 : 76, ox = left ? 76 : 24;
      s += flowerStr(mx, 24, wrr(sd, 31, 13, 16), FPET[Math.floor(wr(sd, 32) * FPET.length)], FCORE[Math.floor(wr(sd, 34) * FCORE.length)], wrr(sd, 35, -25, 25), sd, 1);
      s += flowerStr(ox, 17, wrr(sd, 36, 8, 10), FPET[Math.floor(wr(sd, 37) * FPET.length)], FCORE[Math.floor(wr(sd, 38) * FCORE.length)], wrr(sd, 39, -30, 30), sd, 0.9);
    }
    return s + '</svg>';
  }
  function centerCellBG (sd) {
    var s = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;">';
    s += '<path d="' + wobP(5, 5, 90, 90, 17, sd) + '" fill="' + CENTER_M + '" filter="url(#fm-wob2)"/>';
    for (var i = 0; i < 4; i++) { s += '<ellipse cx="' + wrr(sd, 40 + i, 18, 82).toFixed(1) + '" cy="' + wrr(sd, 50 + i, 14, 82).toFixed(1) + '" rx="' + wrr(sd, 60 + i, 10, 24).toFixed(1) + '" ry="' + wrr(sd, 70 + i, 7, 15).toFixed(1) + '" fill="' + (i % 2 ? '#ee9f63' : '#f3bd8d') + '" fill-opacity=".3" filter="url(#fm-wob)"/>'; }
    return s + '</svg>';
  }

  /* ---- 第一页：水彩九宫格 + 手写标题彩蛋；其余页占位 ---- */
  function renderPaper () {
    var mt = getMeta();
    var Wp = paper.clientWidth, Hp = paper.clientHeight;
    if (!Wp || !Hp) return;
    var pg = paperPages[0];
    pg.innerHTML = '';
    var ring = maxRing(), size = ring * 2 + 1;
    var gridW = Wp * 0.9, gap = Wp * 0.03, cell = (gridW - gap * (size - 1)) / size;
    var gridX = (Wp - gridW) / 2, gridY = Hp * 0.185;

    // 标题（自定义为「手写招牌」时用手写图＋爪印，点一下可改回文字；普通名用楷体可编辑，失焦保存重绘）
    var tfs = Hp * 0.046;
    var title = el('div');
    title.className = 'fm-titleedit fm-nodrag';
    title.style.top = (Hp * 0.082) + 'px';
    function bindEditableTitle () {
      title.contentEditable = 'true';
      title.setAttribute('plaintext-only', '');
      title.innerHTML = handHTML(mt.title, 3, tfs, INK, 700);
      title.onblur = function () {
        var v = (title.textContent || '').trim();
        if (v) { mt.title = v.slice(0, 8); saveData(); }
        renderPaper();
      };
    }
    if (mt.title === '手写招牌') {
      title.contentEditable = 'false';
      title.style.cursor = 'pointer';
      title.title = '点一下改名';
      title.innerHTML = '<img src="' + TITLE_URL + '" alt="手写招牌" style="width:' + (Wp * 0.4) + 'px;vertical-align:middle;-webkit-user-drag:none;user-select:none;">' + pawInline('dog', Wp * 0.052, INK, 1);
      var titleImg = title.querySelector('img');
      titleImg.addEventListener('error', function () { bindEditableTitle(); });
      title.addEventListener('click', function () {
        bindEditableTitle(); title.focus();
        try { D.execCommand('selectAll', false, null); } catch (e) {}
      });
    } else {
      bindEditableTitle();
    }
    pg.appendChild(title);

    // 彩蛋：手写图标题时叠加一张手写箭头装饰
    if (mt.title === '手写招牌') {
      var arrowImg = el('img');
      arrowImg.src = ARROW_URL;
      arrowImg.style.cssText = 'position:absolute;left:' + (Wp * 0.46) + 'px;top:' + (Hp * 0.036) + 'px;width:' + (Wp * 0.23) + 'px;height:auto;pointer-events:none;-webkit-user-drag:none;user-select:none;';
      pg.appendChild(arrowImg);
    }

    // 九宫格（v19 水彩：中心暖色家图标 / 已走过饱和开花 / 待补褪色淡彩＋小爪印）
    var ry, rx;
    for (ry = -ring; ry <= ring; ry++) {
      for (rx = -ring; rx <= ring; rx++) {
        var col = rx + ring, row = ry + ring, idx = row * size + col;
        var cd = el('div');
        cd.className = 'fm-cell';
        cd.style.cssText = 'left:' + (gridX + col * (cell + gap)) + 'px;top:' + (gridY + row * (cell + gap)) + 'px;width:' + cell + 'px;height:' + cell + 'px;';
        var cin = el('div'); cin.className = 'c-in';
        var sd = col * 13 + row * 29 + 7;
        if (rx === 0 && ry === 0) {
          cd.innerHTML = centerCellBG(sd);
          cin.innerHTML = iconSVG('house', cell * 0.4, CENTER_W, 3) + '<div style="margin-top:1px;">' + handHTML(mt.center, 5, cell * 0.15, CENTER_W, 700) + '</div>';
          cin.classList.add('c-center');
          cd.appendChild(cin);
        } else {
          var hit = placeAt(rx, ry);
          if (hit) {
            var ic = TYPE_ICON[hit.type] || 'pin', pal = PAL[idx % PAL.length];
            cd.innerHTML = waterCellBG(idx, true, sd);
            cin.innerHTML = iconSVG(ic, cell * 0.34, pal.w, 3) + '<div style="max-width:96%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;">' + handHTML(hit.name, col * 3 + row * 5 + 2, cell * 0.14, pal.w, 700) + '</div>';
            cd.appendChild(cin);
            (function (p) { cd.addEventListener('click', function (e) { e.stopPropagation(); openPolaroid(p); }); })(hit);
          } else {
            cd.innerHTML = waterCellBG(idx, false, sd);
            var isDog = ((col + row) % 2 === 0);
            cin.innerHTML = pawInline(isDog ? 'dog' : 'cat', cell * 0.26, isDog ? '#6b5a44' : '#d98a4f', 0.32);
            cd.appendChild(cin);
            (function (a, b) { cd.addEventListener('click', function (e) { e.stopPropagation(); showAddForm(a, b); }); })(rx, ry);
          }
        }
        pg.appendChild(cd);
      }
    }

    var gridBottom = gridY + size * cell + (size - 1) * gap;
    var hint = el('div');
    hint.style.cssText = 'position:absolute;left:6%;right:6%;top:' + (gridBottom + Hp * 0.028) + 'px;display:flex;justify-content:center;align-items:center;gap:5px;font-size:' + (Hp * 0.021) + 'px;color:' + INK2 + ';opacity:.85;';
    var hintTxt = el('span'); hintTxt.textContent = '今天去哪里探索好呢？';
    var lotusWrap = el('span');
    lotusWrap.className = 'fm-lotus fm-ctl fm-nodrag';
    lotusWrap.id = 'fm-lotus-btn';
    lotusWrap.style.cssText = 'height:' + (Hp * 0.046) + 'px;cursor:pointer;flex:none;';
    lotusWrap.style.position = 'relative';
    lotusWrap.innerHTML =
      '<img src="' + LOTUS_URL + '" style="height:100%;width:auto;display:block;-webkit-user-drag:none;user-select:none;">' +
      '<img src="' + LOTUS_BRIGHT_URL + '" style="position:absolute;left:0;top:0;height:100%;width:auto;display:block;opacity:0;-webkit-user-drag:none;user-select:none;">';
    var dimImg = lotusWrap.children[0], litImg = lotusWrap.children[1];
    var lotusBusy = false, lotusDone = false, lotusRaf = 0, currentFortune = null;
    var lotusP = 0, holdCtl = null;
    var breathAni = dimImg.animate(
      [{ opacity: .16 }, { opacity: .24 }],
      { duration: 2500, iterations: Infinity, easing: 'ease-in-out', direction: 'alternate' });
    /* mask 能力探测（CSS.supports 对前缀属性可能误判，加试写兜底） */
    var MASK_OK = (function () {
      try {
        if (W.CSS && W.CSS.supports) {
          if (W.CSS.supports('-webkit-mask-image', 'radial-gradient(#000,#000)')) return true;
          if (W.CSS.supports('mask-image', 'radial-gradient(#000,#000)')) return true;
        }
      } catch (e) {}
      try {
        var t = D.createElement('div');
        t.style.webkitMaskImage = 'radial-gradient(#000,#000)';
        if (t.style.webkitMaskImage) return true;
        t.style.maskImage = 'radial-gradient(#000,#000)';
        if (t.style.maskImage) return true;
      } catch (e) {}
      return false;
    })();
    var waitCtl = null;
    function chargeLotusMask (p) {
      // 从外圈花瓣向内推进：瓣尖先亮一圈，光沿花瓣向花心收，花心最后亮；暖白过渡不硬切
      var w = litImg.offsetWidth || 1, h = litImg.offsetHeight || 1;
      var cx = w * 0.5, cy = h * 0.867;
      var Rmax = Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy),
        Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy));
      var R = (1 - Math.max(0, Math.min(1, p))) * Rmax, edge = Rmax * 0.22;
      var r1 = Math.max(0, R - edge), rm = Math.max(r1, R - edge * 0.5);
      var m = 'radial-gradient(circle at ' + cx + 'px ' + cy + 'px, transparent 0, transparent ' +
        r1 + 'px, rgba(255,240,220,0.6) ' + rm + 'px, #000 ' + R + 'px, #000 ' + Rmax + 'px)';
      litImg.style.webkitMaskImage = m; litImg.style.maskImage = m;
    }
    function resetLotus () {
      if (waitCtl) { waitCtl.stop = true; cancelAnimationFrame(waitCtl.raf); waitCtl = null; }
      lotusBusy = false; lotusDone = false; cancelAnimationFrame(lotusRaf);
      litImg.style.opacity = 0;
      litImg.style.webkitMaskImage = 'none'; litImg.style.maskImage = 'none';
      litImg.style.filter = '';
      dimImg.style.opacity = '';
      if (breathAni) breathAni.play();
    }
    function easeOutCubic (k) { return 1 - Math.pow(1 - k, 3); }
    function easeInQuad (k) { return k * k; }
    function easeInOutQuad (k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
    function tween (dur, fn, ease) {
      return new Promise(function (res) {
        var t0 = performance.now();
        function f (t) {
          var k = Math.min(1, (t - t0) / dur);
          fn(ease(k), k);
          if (k < 1) lotusRaf = requestAnimationFrame(f); else res();
        }
        lotusRaf = requestAnimationFrame(f);
      });
    }
    function startWaitLoop (period) {
      // 半亮等待：亮版明暗 .6↔.8 波动，循环直到 AI 返回/超时
      var ctl = { stop: false, raf: 0 }, t0 = performance.now();
      (function f (t) {
        if (ctl.stop) return;
        var k = ((t - t0) % period) / period;
        litImg.style.opacity = 0.6 + 0.2 * easeInOutQuad(k);
        ctl.raf = requestAnimationFrame(f);
      })(t0);
      return ctl;
    }
    async function runFortune () {
      if (lotusBusy) return;          // 点击立刻锁定；充能/等待/落定期间，狂点只请求一次
      lotusBusy = true; lotusDone = false;
      var low = FORTUNE_LOWPERF || !MASK_OK;
      if (breathAni) breathAni.pause();
      dimImg.style.opacity = 0.14;    // 暗版：极淡粉底影，不是完整画面
      // 启动 AI（Promise 驱动）＋8s 超时兜底
      var aiP = (async function () { try { return await drawFortune(); } catch (e) { return null; } })();
      var timeoutP = new Promise(function (res) { setTimeout(function () { res(null); }, 8000); });
      var HOLD_P = 0.6;
      litImg.style.filter = 'brightness(1.05) saturate(1.1) hue-rotate(5deg)';
      // 阶段A：初始充能，慢蓄力到半亮（约1s）
      if (low) {
        litImg.style.webkitMaskImage = 'none'; litImg.style.maskImage = 'none';
        await tween(900, function (e) { litImg.style.opacity = 0.55 * e; }, easeInQuad);
      } else {
        await tween(1000, function (e) {
          chargeLotusMask(HOLD_P * e); litImg.style.opacity = 0.55 + 0.2 * e;
        }, easeInQuad);
      }
      // 阶段B：半亮呼吸等待，直到 AI 返回或超时
      waitCtl = startWaitLoop(1500);
      var fo = await Promise.race([aiP, timeoutP]);
      waitCtl.stop = true; cancelAnimationFrame(waitCtl.raf); waitCtl = null;
      // 阶段C：快速补完最后一段（200ms），花心最后亮
      if (low) {
        await tween(200, function (e) { litImg.style.opacity = 0.55 + 0.45 * e; }, easeOutCubic);
      } else {
        await tween(200, function (e) {
          chargeLotusMask(HOLD_P + (1 - HOLD_P) * e); litImg.style.opacity = 1;
        }, easeOutCubic);
      }
      // 能量满溢：亮度轻微脉冲（不用 scale、尺寸不变），约130ms
      await tween(130, function (e) {
        litImg.style.filter = 'brightness(' + (1.14 - 0.09 * e) + ') saturate(1.1) hue-rotate(5deg)';
      }, easeOutCubic);
      // 全亮停留 500ms
      litImg.style.opacity = 1;
      await new Promise(function (res) { setTimeout(res, 500); });
      // 阶段D：平滑淡出 700ms，回暗版待机，签卡紧接着显影
      await tween(700, function (e) {
        litImg.style.opacity = 1 - e;
        dimImg.style.opacity = 0.14 + 0.06 * e;
      }, easeInOutQuad);
      litImg.style.opacity = 0;
      fo = fo || pickLocalFortune();
      currentFortune = fo;
      saveTodayFortune(fo);
      showFortuneCard(fo);
    }
    lotusWrap.addEventListener('click', function (e) {
      e.stopPropagation();
      if (lotusBusy) return;
      var prior = getTodayFortune();
      if (prior) { showFortuneCard(prior); } else { runFortune(); }
    });
    hint.appendChild(hintTxt); hint.appendChild(lotusWrap);
    pg.appendChild(hint);

    /* ---------- 集卡册入口：水墨黑莲（右页左下角） ---------- */
    var screenBtn = el('span');
    screenBtn.className = 'fm-lotus fm-ctl fm-nodrag';
    screenBtn.id = 'fm-album-btn';
    screenBtn.style.cssText = 'position:absolute;left:-1.5%;bottom:1.5%;height:' + (Hp * 0.15) + 'px;cursor:pointer;z-index:2;';
    screenBtn.innerHTML =
      '<img src="' + BLACK_LOTUS_URL + '" style="height:100%;width:auto;display:block;-webkit-user-drag:none;user-select:none;">';
    screenBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      W.__fmBuildCard = buildCardHTML;
      fmOpenAlbum();
    });
    pg.appendChild(screenBtn);

    /* 集卡册本体已抽为全局单例（见 ALBUM_PANELS 之后），不随 renderPaper 重复创建 */

    /* ---------- 今日小签：签卡显影落定 ---------- */
    var FORTUNE_LOWPERF = (function(){try{return (W.navigator.hardwareConcurrency&&W.navigator.hardwareConcurrency<=4)||(W.navigator.deviceMemory&&W.navigator.deviceMemory<=2);}catch(e){return false;}})();
    var FIMG = { cloud:'data:image/png;base64,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', zhun:'data:image/png;base64,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', pawDog:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG4AAACCCAYAAACn3f0CAABomklEQVR4nOz9eZymV1nnj7+vs9zLs9TWe9LprARIAiQsIoh0ooCAKKJTUVFQ0AnCqKjjwgzjVJd8GTdQ0JFRHHDXsctdBGRNoyySIGsWQiBbJ71Wd1U9y72c7ffH/XQMCEgwAf/4nbzySl7pyvPcda77XOdaPp/PBf9xlwAoY3npc7/zGU/au/0fvuH8s//5xU979jmArID6Sj3IMuiv1Hd9qesr9svfzyXLoFJK9jkPu+AX7/jAtW966Lb8SfOmueKOI7d8F5Cu3f+gPbuIUjz/yY99xrc/4mHX/MC3fNeuNQj/0Yz3H9Jwy6DWRMIzL7nw1YxO/fTFexbTtmHZSgxRFEsAHHoQvncZDaTv3P9139CcPPrmfrv+W0c//u6PLj/qUd/8H814/+EMtwx6DcLVT3j0VWlr44d3zWUuK6zKbK59Mmpu+1nXA+xcXk4P1jOEumFSN/HsXQvN+Tt6u+LoyJ9/5+WPeMZ/JOP9hzPcGiTRmo3D9xzYXRrZtjRQuFqIXsRm+BBOPljffXCNCFDuPfeTdRObUDf5Wdv77iG7+3mzefzXrr8+2TWIzO7fr+b6D2W4lRUUEL/3qq97uInN121bmktaKV0UGb6tJIYEko0BLrnkkgf8xB1Y6QxSbxxftEIenCPFaLYvDcPOgbnol37wkfuBtLz81d+3r/oD3Hddey0KkCN33bN/WFi9fWEQRATvQ6onlTStTzGTGoDV1Qfr+9k6vn55mSk1HJTBOy8bm6O00DOprUbfBsLxtf//ifusNT6EIJKq6eSbS2sIIUgUw4mNCaenLT7Lp6ezxZPLy8sPzj1zCFZWVlT07tGFFqzVSVlLFCMpJlHEy1CKQ527/Kqu/zCG279/v/kQuDvvuKP0KV1SWhhNp3LHkeOcrj3joFOtjHvBN1yysLa2FlaBlNID+uaXF12kV1dXY4yRXAlN7ahqx1YdRLKSxvmdv/VBb4HEV/me+6obLqUky8vL+tChQ/45T3jCZc/7tme/16V4fkqkO09P1FYLTe1lkixjFxeufc8H3vuyH/y+HwKiiKQHynjLoN96663N/37FK86tY3zcZtWmqddy7NSEygfZqBy10tuueUz32MvLy1/VvfuqfnlKSUQkra2thec946k/YfrmH9Y3T19Ru5ZjEy+bdUBCJIpCFrbJpKrSdR+9YVsT4v955U/+xN/9ws/8zLyIsLKy8mX/HrP/V69B+NHv/c4feOvb3/KRzap+Uh3hdB30pIlsjGo5Mmnjlmf7Dz/vub+RUpK1tbVw8MFy2V/C+qod9+XlZb22thZe8n3Lu9tR83vj8ehp9xy+k6OH7w7DzOiz5/rsXChR0wlbTQBj2Tg95rQLicGCf+QTHm8ve8Sj3nEqyjNWV1f9mZfg/jzDysqKWl1djSC89AXf/ZqN9fWXfvCD1xN9iA/ZNlRzRtGOR0xDZFwMODKq46WXXqYeeclD//zuW2675g1ve9upg8vL+uq1tfBg7dMXWl8Vw53ZsF/8qZ8aplj//ZEjdz/hre98l989nerzFkoxPUOWa/pFTmks9aTCVTXBRWyZc2yr4qZx8o956lPNVU/5hjc/6RGP+U9v+Pu/bw4cOJC+VOOdMXRKaeHHvvfqV91y660/cPSuu/3edqqX5nuC1egYKI1mMq05ViVGPnE6Jv91V369uejih35qMhr/6OrrXv/WlZUVs7q66h/sfbvv+oq7yjNG+y/f+Z0Xi7TvPHbk8BPe/HdvcXudM19z1oLsXCjY0dNsLxQFnuAb8lxQEun3LK6qOHeQ8fV75szt177Dnzxy5JmfOPyZ1dXV1bi2tvYl/T4rKytKRNKH3/2Xl//sS174pg999KM/cPPNnwyXqsY8YtHKvhLOzRNn9y2LmWYuJS4wkcvyyE4TzPvf+e7w0Q9+4CHbdm7/m9et/uwzVldX/VfabX5FT1wCuXL/fv2Effvmy4X+ByZbJy9665ve6reBeczOPik58uEQSS1ag9aGajrFxIROmpgSjQ+AUPT7nDq1mY6YxfC0a15kzj/n7Kc/7bu+7+8PHjyor7766i/oulJCRJCUTs/9/E/8zLs/8P7rLr/5k5/yj9+5YM61NdpYSAEtBmU1rvU47yE4lMk4FQ1HRw0b00nYd/lj9CO/5vH15vrG16++/o3Xn3H/X4m9NF+JLzmzrty/Xx86dMg/4Zrv+7UT99x50XvedcjtMco+bNewO/o+ENoKJSBRQfRYm6NFMKKweUFRVbgYEZXoD3NZHJ+UGz/wPmx21ctW9u9/5w033PAFc6yZeySllH7pv730l2644ebLj9992F+aYc41DbnN0FrhfCQEx+L2HcSUcK7F+5a8N2QOTTp6lPP2btd3fPqm8HFtivMedukbX7J//xN3XHLJlO4wPGh11DPrK+YqV1ZW1KFDh/zKj/3Y07Y2Np5z4/veH85X0Vw4yFCuJkSHKSwqRCRCEgUYirxPVhQkDTG0aCXkolAiLAzm2T3X14c/9k/x07fccuWjnr/8taurq/Hgwc/vtq6++moFpP/zyp972q2f/PQLPvXJT4U9EvVF8xYjiawoUHmOiIAYnA9kWYY1BqMt9dYG1Ym7WRCHjo7HXnqRHn/6Rn/inrsfke0968Dq6mr8SqUJX5EvSQlhdZXfWVlZuPXWm37/0x/+5zLfmsiefiG9TKOTYI1FoVGiSAlSTPjQUjUVJCG3PRRgrEFnhrI3RIwlkaHrOn78ug+kj173oasB1tY+72PIJWtr6ZprrrGfuuXGVx05csT0gmOPCZJnlt7SDrJeHyL0+vOUgx5bp09y/O47OHrP3Zw4coR2OiGGQF8LCyYRtza4ZFuu7/noP8U6+Be98kd/dNfBtbX470lPvtT1FTHclVfu16sQ3/3R61984vbbdjV33uN3DApV9HKSBvKcJBqVIC8HKJPhPEjK8I1nOq0QUZisRNkMyQtqV9G4mqAi525b1O74Edk8fer7//o1r9y1trYWPjcxX15eVqsQw7G7vv2OO26/7I7bPhPOio1eyDXGCMSIKUryfh+RRFvVOOdxLuFcwGgDCEZniMroZTlWIktzc7JPh3T8M7cOYm5fJl8BNwlfAcPNXGT4/m9+ykN09C/Lxxtxe57pbYs9tAJlLT4EdJbhU2JzPKZqPcE7AomsKDFKE1PE+5bJZMx4MkJri9IKrRUmNTKXXGgaP7xnq9oPcODAgfu6S1lbW4sry8vZZDpZvfueY2m7r9k1UCCQUPjoqKZjRpunGI1HiLHorEDlJf1+D2MMoixZr4fSmrqqUEpAKR7+0ItUPl6P6+snXvjJ973v7NXV1fhAl+M+dz3ohrvxxhsFSC7pH984cXKuPnEq7t7RF1EJrS06CMkHfF3jQySEQEwRpTWIUPQHlIM5tGja1tE6hwJScJSZxWpDXuTsmbNsHj9GPhxenVLSsHpvkDJrw6R1mT58PJlc3J5e58J+pm1mkMyQjCKIMKmnjEZboBSSZdjhHBhDRKGMQYwipYSyhqapmY42cXWDSl6WYhPX775r7qZPfvQl8K9enAd8PahR5SyKC6/6iWu2f+jm2/7T0bvuirtBFyphkycpwfmINUJyDWINZVGgRHAxElxLtbWBToGYAqK6DQwIKURwAXxABJbmFzjZVGlj/eRTx5/+9LbVVY5/bjXl+KnRf/bey1zThPkdC1or8D6SMk3TtriqJrMZKstIAiE4PA1oIYaIiYk8L0ECyhmUUrRNw3Q8Yu9SX9106hinNzauTum2V4icX5MQ5MFxnQ/qibvyyis1wHs/fNMPi3c75qfTuHfXQKwBEyOKgNWgdYJM4aJDtCIQqHyD94G2avAuEWMihoDNcow1uOhpnaedVqQQiFVLdfIER+++u/zQTR+ZBzhw4IAAsrZGePE3f/NiG+P3bB05xnYtKrcWoy1JoG4apuOK4CIYi3OO8XiL8WSTSMLFFmIk+ECIAdBom+NcS3CeEAI7d+9Q5uThcOSOOy96799/5JsBDq4dfND298E0nBw6dMj/1jXXWJvZ79645+60M0cNByXKGLxSBCxKa5TRaGOZm18EAec9WgnKKFzwuOCJAfTsLyOCFUV0Hhcj3gVoprpsJzF5b+667baLAS699FKZhedyfLL56NHm1vxgPIq75nqiM4vRGt96Qu2RECmKAqU0IQQkgkTB+0iI3aExSmimY+rJqIt0TUlelCCKmALbe1k6dsuN3HbzJ58DfMHw9oFYD/odt75k51IIO5hOpMiUSNviWk+IitS2kEDpjLLsY60lz3OMsUgQrLVdJQOF0RqtFW01hSBk2pJCQERBSmANc4VJ6/cclpMnT14JcMMNvyHHjx8XIIXQfPP01CnJQxv7c30SQuMiSllUAqUMJCF6DZIDCisGiyJXmuBbRBQpRNqmJnpPEiFGh5bE6PQ6uUVVRw7zqRs/cSHA1WtrD1rD9UEz3JlE9NO33P746Jt507Zx0CskSHentd4TQ0IkkYJHIYTagWiKLCdXltz0EG1AGUyWE1LA+Ya2rmjqBi+BkITWaWLoXKkbjVBiLuye4koOHTrkX/3jP74UkO/RTctCP9fKgHeOqm27ykhIJNEghiCa1gsOQ0wJQsSgMEaDgJKEUZoUAr5tUcnQ1i1ZPiDTVjJrmdu24+H/e2VlN/CA9Qs/dz1ohpu96dRNc3mRFaqnJfYzRWY0IkKvyCh6BUpnWFsACdEG37YYYykHfbz32CwDJaQEBBARXPCElIhKk5QQAQ9MfZB6Mmb91OkC4Mib3iQAnzp86+WuaXeG8SguzfVEC/jGExKEJBhjST5QN57WB0LseoBBNG2CJEJ/bgFb5JASxlp0lqG1YTqdoEyObx1GIZONjbR+anPYuulZcO89+4CvB91VWmP3Nk2NqydolUBrJLOIBkTQOke0nW1i90BtW9F4hygheo9WmulkinMBrSwAMUEKCZtpUuruwRSFjcmUY/ccXhARPvmhDyWAIi+/wfmQjEox62XdPdp6jLF4Hwg+QBSCC4S6IYVIChGxlkwbUgx450iA0prgPNF3/+1MBOpTAGsxoWHj2BGVl3MF3JsOPeDr/hhOuB/dhEOHDoUEEnx7xcaJk5RGScr7NCGwNZ4y9ZHgPdE5lBJijIhSxJjwPpBlBh9q2uhIRMRq0LNHSJqmcVgSShLaQtu25GWpNJG2njzyNT//83sPgRcRTqyvX7F++pQMikwyk5FmLjq0LXnPoq1G0GixaG3wriHUDe2kArFom3dluJBIMRFiIImgsgznPJunTtG6lqAVZDr1ypK2rYYAy/fTIF/q+pIMdwaazf0FyaRENZ7kYTKmMFrGowkhgtaKzFjKskCbWaojCaOF6AMkQSuwSiAGvG/pDfuU83MEgdo1xBhICAqNtYZMK8oyl3papabx/a3RaN+Zxzh1+lTykyk9a3BVjWiFyi0igiJhrEaVBlvmRFEoa1CZJQBtjCidIQIiEaUUWWY7b2A0GE2MYExO9IGmqVOvN2BuaccSwA2XXPJVO3FqbY3w6le/unzet33bNr60WpwA6Ya1NTudVkPxDXluCDEQXIBkMXkPU/TJMtttnrGIAsERfEtCsNow7PfIMo2va/L+HNpYmqYhzl6jpIQk0pXFXE1vMCQpzdaJEy1AjNHkWXFeqTWqamRa1zgfQCmy0hAjeASbZZjCYo0miaXxEVBk1uDbLldUojB5hi4KUozgPdpadGYRm2GKPlob6Q16bN+9NAK49NJLv/IJ+AooROJLl5/1hLf/+i/908mPve+TP/SMp34DdJiRf+vD69OnTV72SiERYsRohWgBiYS2wWhBaQVE8A43Ok30gRAirq5wocEajZC6npzN6Q3nGQ4HWCVIFNq67iobWkOKDPslZWZ9s7XVAnzob/82m7ZNP5NEaVWXc3lPpjVKEioDo4DkMbaLHmOIFLZr54jrDJZE7k0JYhtIEdTss7QxIAqVZ12pLgS0Vl+2wb4UCtkX/IFl0KsQv+XRl33f7R/58PvOX9SPWMjSts2NE18HcPz42hd0AWee+Ib128oQU+69x0mURCIzBojozKAk4pqKajxhfOoUrvGkGFEkTm1NqJ1AFDQKlMIHR7GwjaUdu8gQonNIhLZqCCHQK/spVmNp2yZZrT3AGw/+wVmnT50+y9UVeWml6OVorcmyrtqfkqCNIi+Lzh0qhbZgjWAzjTbgk6PxDucCbV3TuhoxGqUtRVaS2YzkA4RIQqXT66c4edfhbQA33HDD/XaVqx3gVvFFrqXPa7gVUGsQX/TsZ5/XHD/yG3uHlu0LgwYkjarmHIBDh76wyzzzbc//bz8/dqE9obKcIrNdQqM1Os9RRJqmoW4qYhuo6w7JZbKM1jk0hhAik6YrPidRtHXNdOs009Emklmi0FXoRREBLQrlIz6m+qJHP3oT4KEXXzDslbk2IkhSOBcRZRCjwSqST92B9w0iCW0FrRRJEsl5hNgl6CiSsiibYbICrTWNbxhPt0hEiJHGeyaNx8fI5ubmDMJw7f0ymlKKa571lH2IRL5ITPF5DXcjCEg6fNNHf+bsvukvbVvweV7ouUFPos01wP4vHqQkQImoJsR4qy1zelmRtNY0waO1RmLnDlOULvlVCp3ndHmCZdjvYY1lWrU4hBahbRpO3XOYae0IQJSID4HGe0yR08aG6bQizwvZfdZZCuDwHfdc1DZO51qFmIIkEZTJSCi0ykArvEr4BE1VkaInM6YLYHUX8osYQhKcD8QAWVZgs4LoInVVdZWUFJlOW6KxKuuV9Mrezd1WXPmlVk8UIqy86Ht/8sjNN9z8HQ8///evWb5m/gsZ7/MZTtYg/M6731X4avLMuWGZCE4VZY+i6JNMlqeUZOe/EaTsBwUJpdQd07qlrUNyzqGNIUVH09Y47wgh4FyLkoifNkQEnYSmqkkYrC2JyiKiMTZnfuceil6fkCIxJpRS9IxBBFSeSTlXsm1psZxsbS0ATLY29wbvCa1LCjDKdKWrFEkJsqIgAiFAG1tCaLAqkVtNbB2td6AUxNg1WFOgbiqapia3GVmW0zYNITiqpk7ORWmr6rTqzd8JcODA6pcczKUYs+vf+74XDqQtd2T+ecc+/Hdvf8GTnrSDz5OK/SvDrcyoRu965csvy0jnzJc9NFFNtzao2pbptPYiknY//aIv3hLavx8Ak2WfaSKsn9pEmwKVFMkHYgiElHBtoPWBKNC6hiQJsULrAiFFkoCIwqdEIpH3+mRWM+j3yawlzzL6eU5qGhofYqszUOru8y699HaArNe7RQRKLWrQ7yEKGjdFlEJiJDYOgyJ6h4SEEtAaIGAzi5GM5DojJ1EoJRib4dqWGDxmFpg0dYPzIc1v28m2nTtv+8Ef+7ETdIWeLzVISUCoJ7Vsn++lndsH1ZJ2j9tcP/LfQeL+zyFU/ivDnaEaba5vXtTTSG5SJEY2T59WJ0+eIsKlKSX162+9tQHUF8JX7Ny5MwFsmxu8v1xYiltK6Wo8wTd1d5GnRPRdySmIIrMZMUSatkGMInb7QSKAgBYhEUmhJXmHAFmZQ4woY8iN6ZqavTmi8xv33HPPFKCu3ZY1Bp8gyAxYkBQxQRtaggYnibppSa1HlMbHhI+pYzBqhQsNLrbEEDDa4toW31Sk5LHGIqaLlptpHee2bWPb7p23ppS4v8Ch7/7u797uqmpnJojWKuuXJrpm/J0rK/9z7lBX1bv31P3rD55xqzdH4wVtNM67tDltWB97lVCpquvH/tR/fv6brvu7P36qiMTV1dW4srLyr07f2qwy/o1PftTHe3PzRyqVSeNCTEnhI/ikQDLEdLVIZXN0UeCcB4F+aZHkIAopBsrCYo2hnY7RNkcbQ1mUlGVBcG2XRjQu5kWJLfJblpeXY2e4ZkHFhBJJHTFSuvA+RKyx1L5mUrdEIEpASdfW0aIgJvysSmIQYlPTViNSbNFG4ZqWpq4QEUyW4WpPrz9gacfOGwAu+RKS75SSLF9yiQXUyZtuemxPp6XMZiEFdL9XoFLc88n3vOuxwGe9CF/A3SWRuUeq8emKSQNHNydMXEKKvrSN46/+5s3PSL59xqv/x0/+7j3H6v9vdXX104CkDm16xjUkQD//p35l8k2PvfSdTQrPT8bE8aRRJtfkCqKKBOnuXhc8McVZDTIQJBESoMG1NUWrKfN+9+exxbctGEPyHVakaQJVDb35ebTNbj7zHHvPveDmOz51c92EWLSuTQQnZVkg0dE0FZlSGKtAEipEJpNNyl4fVILgid5h8xwlgsRIAmLsSl8pBara0TMD2tpBnqkd51/IYDD8AHzx5HvWnRfposdWaU092nzuogGb6WSMwSgVNVFVk+ps+JfCPXzOiUsJOQRpMBimxaWlxxyrHPeMnTRkiLLgW8q2YthMwlve/Lbw1re87fvvvuuT7/+D1732hWeMdl/XuX//foHErqUd15qipGqcZKXt8BuiiarrpRmjiTLbkNBV49sQ8MnjQ3eaYgj4tibFgJDIi65vZ7QmNxaSSklnOit6btvSzj898wwLxpzuz823Js8xWpHnOSpF3GRMkeUUWUmuNcQAIhijCcETnMelCFoTiIQYsFlG0mZWmI5EBTa3pOjYOHEq5XNLanH70uZ4/fjHZifk80aUy8vLevZixZROnPU7v/yK5/3n71r+rc3N01cPiixVVWvG4ynTuhWlDK1r28/9jM8y3JVX7teIhP/8Hd/6ysP3HHnhqHVhc1LphcyyWyfO057L9Zgr9y3qK+Yzvf7Jm8I/v/+9Oz72zx96w5v/8Lff89Y/+ZNzOkDqQd19XhcKf81TnvwWPVwctcWcznr9FEPo7pDZHYe1xFkAonSXRylRSFJIiPSMITQNITRopZEI2lpMnqNEo4IwbXza7A1E94f3POOK77nlzO/3mG/5lo2yLD+ZrKVJMSHQVtPZ54Ok0FU6THe3iRja1uPqFu8dUaeujURXXgttQ4ieqCAmIUXQtmBz7OLiWXvJMvORq3/4p4+d4Sfcd39XVlbUysqKWltbC5M7bjrrTW/8tdf9yst//kNvffs7f/8fPvDBa4a5NV5ENirH+uaE0bSlRtBZ6eFf4obPMtwZcuEPPPuZLz56/Nh/P3bkaNyl0UupwY7WWcw1OjQslIYsM+zOha/d2dcXZZLe/md/5v/+zW99UlVt/PWf/8Fv7bn66qvDv1CYUD/6slcctWXvuqMhpjTYGS947NclF1IKIUBSHbrLR4yxaK0gBKxAqRSL/R7bFxfIUgIfyPMM51qaaoprG6rRmLoJbDgfi+27GCxue/tlV1/WLi8v6/2grrrqKp/gQ/2lbYxrH5u6BkkEo2i9Q2IipQ7/YjT4GWwCIr2iBKXpMuGA8y1CpChztOm4DDbPqV1gS4SFc84m+OpPgQTXfm78oFZXV+Pq6mr81Z956ff/9m+/4QN/9aa3vnjtz/9i9yeu/1DMNtbDQmmo6pY2KdabyCZGphicimM+XzqwAmptbS0+5TGX7Gt8+JVP335H7DVTzrOa7ZmiVxggURQ5SSmUd1gllFZx6UIhX7tr0fzTe97jP/i+911B7d/1poMHd994442ysrKilpeXJcbIcH74azI3L7efXJcdD7mU4b4LqOoanQS8dPkVCmszaucIPiAxkGcZJjOURU6vKAneEyTh2pa2aYh5zrhtGXtR87vOivvOvuB1Z365M1oow4Wlt3ml2RxX0lQOJQYVIjpFrNJkKWG9w0jCaIWJEUMkL3IGRUE/y1BKUZQ5RZGREgQSvnU0baByMfWWltRwacexhz3ykj8COHDg0H3JH0qUiv/7Z1/2+J954fe+9eM33PA7f7L2F+d88Nr3xMWTx9Lj53vq6xYKveQb+gJKur7fPZsNU7Gcv++CKZ+TNyuAa/fvV0Dad8HDXyZCcfqeu+Mj5gdKqa7VYjNDjC3WKKw1hNahvMdajS4y9swXPG5b3/ztn/+F++B11z2sOn3s52esFXXw4FoEJCv1P/b6wzvXW68+ft11abJ1WuIMGUyMKCVoSVidsFZhRVGUJTovaJ0H3XUUEgrvPFFpBIX3kVaZeN7XPEmdc/5DbjxWjz6eZgDYM5IaO/buvK6Oqd4Soz0kyQwqCUbbDnJeDij78xQ6Q8WAEsiLjDKzDLKMbQuLLAwGGK0IsQPmiggqy8FmnDi1Eef3nie9paXrvvaZz9vq7rBuo2fF+PiHr/2Fn9iajt/9mTvu/Kb3feC6ONxaT/u3FeqybUOZt45ct+zOFUsDy1KW2J5BrhNbdZXcdPQbr3vZyxbX1tZiOqNxdgZp/KPXPG9fntvn3XXzTensFPWuvmWulxGVwmpDltkZ1tFjbVeARQtjP+X0dMpirvmabX37rr/7O/+Jj338+/74NT//vaurq37t6oNqeRn1B3/1zvXFhaX/PtxzVrz+Ix9Ok5MnyZTBxy7RlQgZwtxgnvl+n16/ADQJRTOtGG+NmU4nVFWFDxBcoJ7UbG2MUhwusu2iC6df86Qnvnh1ddWvdWFzOuOqf/l/v+FwbzB8+/Css+PJqo0uaQKqgy/EgHMO0RqbF5RFgbGWNglJaWLyuGaKczVVW9G2TZcmTFpijIwnVRpLIYNzzm/L4c5XwL9osKzs32/W1tbC6o+8+Cc//JEbXv3Od727PHrDR8PjCq0uH1pZHOYoK2RWYWMiuZbCeYqYWCyEc4eZKidbYWNj/RHHp1v/E0hXz1ICxbXXKiA5x/O2jh0buCP3hH1lJsE1GAV5brvmZusJ0xpBQIELLSbRJc4JosnYu2ORhw2Mfs/b38pnbv3M6975h3947tVrV8dLLllJy6D/9G3v+KOy13+7Hy6o9UDAWtrUQQcyre9lxvTyPrmx6BSotzZpXUsTPZPplPF4RF21tE3g9MaIzaDC4KKHqr37znnHM7/92/9xZWVF3Zfau3//fpVSYnFu/neKpW1qmhWMxmOwljZGpuMJPkSU6lBkCsjz7koYjbbwITGaTqh9QNAYk2GyHJUpfIzcdmIz7n7kFQpt3v09L37xB8/cZfv37zerhw75F3/Hs3/y8F13/vI73/GOoI/dky4vtT57kKGNwXtwTU1sHUVRUPQLUuvIABM8e+YsT9q3oE/f9um4OZ0+7+0HD86vra3FlJKo1UOHwo8vL5cqpBeONk4zVEktzuUMM0NmLTp6bIzkylL0eiilOtAOCZMixnt6RpAQ8ClxdplJfvpE/OQNNw5vvOljr0nApTfeKCwvE2OUQZ798o6z9srY9lObQmp9gwiEGEESdTUB7xDvSBJxrsYFR4gJVzd451E2R+UDWl2kZnG7OuthD19/4v6r3gDIpZde+lmX+KFDhwKgvucZz3qntfrD+x76EH2qdrFNihC71GPatrSzNCQgNHWL0ZqQIuPRmLaNJLp+oC56qDynGM5xbBKSPft8bJk37aT58VnUyP79+82hQ4f89z/7m1dD9L/8wfe9NzzynN3qcWcvSaimRFFoMcTKUZgMOyu6G4ReL+/u3SCYENi7Z1EuGpo0OnF824c/ev3VQDpw4IBWQIq5+SbXTC7YuPtwPHtuTuWkjtKUG1SKXfPQZIixIJ2bVFrhBKwWrASa8SY5wrAsuXjnkr7zlpvDx2+84dte94oDV1+9thaWO3+vfu9Nb32nb5ufj3lhTifxSKIOLc47qvGI6WTE1miTSVUTQiKhMFmBKQqCzjDlEFMWVM6n7LyL20uvvEpd/vgnvOqyJzzpbw4ePKg+Dxs1rays8MyXvnRrz75zn7+4a2e74/yLwsmTp5JzAZ8UjQvUTU1TdXC9qGQWHIGfMXWstWAManYat9rA6XzB7z7/fF1m5YHX/umf3nTjjTcK116rDh065L/t67/2h5Wk//mR668PD92xoB65e0HqrU2GgwGFCL08QyVPCr4jbVqFouMlIJFEwiqNUZpzthWycetNjKf1i1/72h/JWV2NCsD2B487dvjuxPp6nB9kJCXYXo/YOkTngFDXE0IMKN25i9zkaDGkKHjnKDOFxBalAwu9jH2DTI58+lPprrvufNX/XlkZLP9LsKDe8k/X//e57dv+5qjp28MVjixn5BqCNjhRVCnRzKBzyuSEpBjVNUEUbeO5a2OaPn58KxZ7z8ove/QVf7M4XPw/swj28ya8M8Kh/rU3/uEnFueHr9pxwUPs1Ou6GlU4l2hbaOqWxgemk5bWRao6MKla8t6ArOwRfKJpPceOneD0qKZd2OXn9+2zYuyv/PpfvukXziACVg8d8td8x7O/Mc/tL3/knz/sy2qkHnnBWeImWyilsdZ2qUUzQaygM01SszKTEtKMbGCKHKOgmY6ZXxio+Vino7ffdgWb85esQme4UydOnu/rWnbPD8QFT97rdYXgKIgyaJMRSbTBdchhsWiTY41GayHRYfuli3tRBPb0c9WbrscTd9+xtwnttwqkG2+8UVJKKYSg/vYf/+m523fvfM9kuGDvGLWuqkOaRsXEg1M50WS4AFvjmqrxJJ0TRXPT+ijecGoiV3zjlfrJz3jWrz/nO7/vRY996lM3AT434b3vOniwIxy+/Df/6OeK+fxvH/aEx5b3VD6cHE2jNpo2JDanNeOqpW4DPoJLMGlbJnVDHRLT1lOHlD611bp7WmVMVvzmG/7mzf81eK+gq8++7Ae/7zGC/8vjR44Wduu0vvyCs6Xe3KDamqIjaB1x0RG0EDNDsBqV55D3weRobTtgLl391qgOZXb29mHYPHxHOn7s6HMAzPO/6apLq3rynPHJo+yaH2jvGrI8p5qOMTojkVAiWGOo2gYxkSipK/m4BmMzlMlQxqJSZDodd32Rasp82WN04mg6cuSun0wp/T9E4qwsJiIyecdf//XVf/DG3/rL22799BNuPnaUvVu135ZrNbBKNToQk6YOica5GKKkY03FnW3S3/bsZ7rn/eCLfvHR3/iMn/Xf+/330Sv5wqujfh9ARJqU0nN/9Wde8qe71zeeeeK2z3Dk1Jbv9TKdiZIUE21qyLWi8pHatyzM9UkxsOljuLs1un/2uTYv+2tr73j3i/enZA5B6N4bSVunT/63z9xy63Dznnv8VVc8Sg+ST83GutTTEUVu8dHTRo/KSvCBGIWgDbGp8W1DnpcEQ4ftJDEYzhFqT9aMxTikadondkXtcnB+NdooUtOkUDkZ7Fgk+AqbGUiJ6XSKStL1ySIEHxG6LrZPqcNCJsGHgEkBnSJjHxCgZ4w+NR2lrVMbl//Sy1/+6J+B65eXl/Xq6mpYWVlRT3n2s4+llJ76shf/4Ks+8clPvfDonXdmo3rC0LcpOZeMltT6iJ5f0pOUGOzZwbc+9OK7n/eC/3zNI5/8lDdDUisrK/xbRvsX43USUiIyTil966/+j59+7key/OdOHTl23m2H78ZG7wdK1EKvYEwQiJJbk45vTUPdG8qWyfQlT3j86bPO2vv/fuaVv/DSPxWRa0nhwMoBWV1dDa948YvP+cD17/vmY3feGb/xEZcJ6yc4fPRuGc6XGGsRbWcgYKFtfQe7yIuu1Bc7QFWLR9k+OkV8cFRVRd7rUWZalaNNttbXH/X6l71sl/zAs77pRZ++647/wz13piu2z6uFhSHt9DS57WDVrQ8EY7DKEHyD9x5JXec5s3ZWRVCYvED5CkJgmoSs6NP6yEnnvN57obnk8Ve+/r/+3CtedF8lnvvy197wy6+85OBfv+VZWxunv9vXk8td02ASnL13L+Xcwu0BbnjS4x/92z/6c7/wjyKyzr+UgO43muqM+gKQfuqFLzxrOj79ysnW5vLW6Y3+qePHcZubXdkrzymKnGxuDj23wL7zzn/7z/3Cq65Z3LPn9jPvAszaLTfcoNvF3l/fc/jup89tbYSL540mJcqih7UKgsfoDKWFVqRLL5SiHC5gUqDe3MQaEEMHwA2RzGZYgRhqBtvm+fTRrbQ+f47sPfe8p8r3PONpB+++7dPLxdG7wiPPP0v3Co2bjshtjxgcZDktQmFz2umI6WRMipGkhEHRI4ZIiJD3+qhQdVX8KASd4Y1m0jTpRMrl8mc+Z/1//NKrHyIip+9rsNm/Kzp3Q0pJnvusZz1OYE4ZMzj33L3zP/azP/wXO3Y8fHRm478U1/ilrHt1SUR446/+wkM+9N73v2g8mXz9HXffvWfQ6+0YLC4V23bsvHv7jh0Hc2Pe8d9+/pfeIiJpJj8c6cTY9NraWvjeZz79x0+fXv+VrZtuDA/Jo+73NFnZp8h7mNDgmhqxHQBK9fpsTqdoMfQHQ2gdyQVibEAFsqJAi5BnFmssydf05gYcI49H9aLatnv398vyNz7546fuuOOynZNT8Zztcwo6+LdBkw0HmN6goxT5gKvGTCcj2sohRiOmg85ZZZDgUUahrKZtOvBNMprgHZ85uREXrnhS+pbvft4zv/15z3vb5xORWVlZUddeu6oOHeILSSup5eVlOXjwYLy/ml1fbHWtVe59cRDh+uuu6/3Jb/7mrhjquW98yjPufNb3fM/p+z7nmZfmXlmp225beN6PvPjmO2/51I6zt46wvTAq7xVkOsMYgyFA7DruUWl8UnjXoLXuoIeuJeUFioCyHTdCkqMsCnSKiATKfh+3ba+/LZSmGMwdMLm1TZYb8BnKBSIeTyKZBHULusbYjGg6xLDM0LwxRoILKJ0IRFAgIVFojXcNnoRESxTNjjKLp4/caW678SPfBLz982ENZ5sRAblvp/eS48flwLXXBhGJa2trzFzcA7ZmYIawsrKibrxxVdbWUnzsYx87BW4D+NXf+UP2799vdu7cmdbW1uJ9T/pMNyX82u/+1tUnjh3bOT1yOA0XC6Vz1cEjoodEh51xXbARpcO5ZKaDkGgjeFGICmiToUQTo+94Ch6igIsOGwJlbqJuDEVRfqtJiSbWDbQtDEpMjLQ+klSkGW+hJ+NObaDfBwxZOWSytYloTaY1UXV9KlLsang+YG2GAZxrSSmQi0iqJiRXP46uhvjFZJPS58oqrX6JxloBdePy8r0/fPz4cbnyyivjl+JWP+dnZGVlRQBmwm5fwAt0jNN/fP8/PSE3SrarGESjjFGE4DDaEqPrrpMQQBQiXRnRh0CKCZ0sWnclsLZuUEqT5TmqyPBAIYKKgvcOK1G19ZStcTEvz3/aVR/fuv0zly2NN+NZ24dKh5ZR2yBWE2MitIGkpMNCiibLS3zTAGCLDE/ECCSJpNaRm67Nr4CUAq1vaALpmLNy+bd8y5btzT/6pa981acfiHvqjDbYzkOH0toZV/cF1n4wO5eX0yWXXJLuj8reF1oroFYhPvvrH3tO3aZbJofvKi5imhaHVmKKGDFkNkOnSJs8IUI2y9OSghi7Bm6XK4PJMpq6wRQ9VIpoEbI8h1ChVCLimNt7gVvffrG98+ixfzQxhpPSOjKr0KLIswIngRihDR5SIrMWHyMKNUNX9XB1A7HD3fu6wWSWmBLVdMRwMMTYkma6hTZCLxdJ94xDFuKcsemJwKdnjcYvy3CzgCAJRA4d8tDh4H7oOc+8ICV1nosqSmwHVvSO3uLcx177Rwc/dMh7f4aTvbq6yn0DjC/nGa7dv19x6FBMKXu6oi6YjIKdt7olYQUMCaLHAy50UXgbA2VeEJuKFBUmz0neA5EYu7ghJUha00wr4nSKzhTFXIFJCe9daqZTFheXkhnV1Z0+OIy0ycUGowRtDMF3aKuilxGixmiN0oakDCF4TGGJPmJEgYLoHVqEVsCnSHI1TTuhvzhHZi0hjlNW9tLOXbsf1v3qV3J/x3UkkAMgqzNXev3Bg/Ov/d3/+9Kt8eThdVVdcvuRY+fbGIYqeMRm3RFcP8pVj7j4uvms+JDRxXv/5O1//S5627dEZHyfl+D+G/BQ9+ymME/eXN9iMSMNCoWIolQKQSPG4IJHkiPQUccCCZMV4MO92ilnMKZo6U6iKNCCV9AfDtA6UVdTTDU2J07eDIu7c9OfW2jHxpApi0WYVhVRa6oYUAjOC23yRIRC5ajWo4zBtXVHSEwdKtiFSJEZbJZjbUZVTVGFJSsyrDb40DLa2pKLhv32jNlW78c+LS8va+kMln76+77naw/fffjFB179i0+R6M9qtzZwW2PwLTH6OMwVXhlciJGUTFWnx43K8nEmL37oBc9+zuFHPvqRn/7JF37XH/3y0//kjXK1nHGxcn+MdwiCNoYU0jluWjHURpTWlHnH8EnQneeQOmyLjyRlaOqWaA06QqhrYgqYrCAERwiJvCgREkElrLVEOjKJ1gaFEINHS2pVWeTjpKQ7JbGDxKWY8C7RhIQjEtCIsgTXwdM69RZBJQU+oOmw/1EgMx3UzeYZxpbU0wlNU5OUZWNrixTDv0IsfbE1Q42ptbW18Es/+ZLdP/Ttz/rjm2/55Pvv/Mxnnr9+y81nNZ+6OWyfbvqzqeN5fUl7FzO1aLXablA7JJm9Pct5pcQd7cTPbZ4Mt//TB/f+1W///v67PnHT61/0B0//8H/59m99eUpJMcvJvsTHEiD97qtfPjedjB/WTickotLWgI8oBPGetqmAhDVdp50YUDGSfIvzDSlGoo+d+I3NUNbgo0dZQ1HOYXR3Mo2y5P0B07pKZW/Iwq49J9R0NNlURjFtI6K6505KsCbD6gLRPUIyiC7wUWirFu89JuvRNo7U+k7WqfZdZVuElBTKlpgsJ0WFjzl1TBJEqJtwD3xpHJaVWVNSGxOf9/SnvfCD13/0ujs/85nvPnXLzXF4ej1cNLBp30Kh+xrTL63qlbkMen2yXoYyGtEd3K43sGqpZ8yOpb4+e8dcWihV3PjMraG+4zOPqE+f/P++5xnf+JcHDx4s19bWwpdivDMR57uuvf78tm136OhTrrWIj5iUugKFFjCakDrYodEanSJ6xuzROuGaehbExa4iJQqVWdCGpBXKZPiQUEpTjcZM6sB4PCbU1T3qisseenEUTR2jeOfQyhCS7mBvKqN1qWvhx4S2liSahBC1wiWPn9FrdW7xvlMycClQVzUmGxCiYv3UBmI6Tcg777irY2reeOMXdUsr+/ebVYibn/qnJ/zod3/H3xw7cvgNd37sY3ub224Lj1iaUxfuWdS7d++QHduXKDNFWebkpovkyjzHVTX93ICCQmsGVqEkkKkkw9KoQWG0Pnks+ltucCduvvFbf/8XX/mOl3zTVZeura2F/fv3f1FexBlCftv6OVFKQkyJGLu7SglZf4AZ9LFzQ4KK+OSJRLJeyXD7NgbDuc4NphkzNi+weQE+IlHQWQbRQ1ujkmI6mXaKSzqXYmGRFOP1atv2bbc4Y9lyARGZyUhoora42enTgMRAjAGtNLFtSW1DnhUYa2YsPEEncK3DNxGTFaSOJExIicHcvOzYfRY6t9N/642+5ppr7OqhQ/4Nr3j5d//2G/7o7f98/XXfMj18Z9xnddzTs1pLINNCvbXFZDwipO75sjyn6JVYY+iXFgR8CCitKHsFvZgYGsWcErblhpQpJZJsf7wZttaPPXFjOn3ff33W0x936NAhf81jHmP/recUHVsgGaNFrMIUOQi0vu266zHRH/QpinwWwDXEEMj6A/pLO5lfWMJq0xkLg1GWULU04w73qTJLluUABJE03tpUPql6Yc9571cf+/jH3zLygRotXhR5r6STb+y4YaGuyWJEgkcnj0otEhpCO0bwCB0JkCRd7qIylLIQE01T0/qA7fVTDF5VIW084mse988AN3yBoUbLy8v69a9/vfuJ7/rWF950yy3/993vfE9/fPhwuHj7QJU2qcV+TqYSrmkQItW0IQWP0EHIYzXB13XX3VCJXi9DW6FpazKlMdKRFLMsRzKD6hnO3jHUemPD337bZ+Y+dezoX7/seS98wus/9CH3b1F6w6RRGqRXlojtEM7uDHTPO3SMFNqQaQsJ2thhM0NwmLwkn1vEBcdkfIqmGtFORqS6QseINrYT5ckM2E45cBQ1Ys3GsHfWMfWaP/nr6y686MK/0+WA0aQKPia0QDYr4mmlUT6SaYXSoLLYIbykU3UVpTqWqVb4kEgiWNvRdL1rUSky3hon5hZxYo7fcs/WFiCrq/+aN3ZwVrD9qe/5Ty+JYt/w/g9e3xt/+pZ4yVypTfQs9C39Ya8LkJTgUsIAeWbJ8hzRQkoBHzppxMJY0gx6sLRtkfn5AdFFZngnCm0oM4uXwAU7B2ZnOwmnj9yz56M3Xv8X3/y4R3/PgZTS55sXdwbF1e/Nb5V5nhrnxDuPGEVAqOq6g7GHjgfYOkdAgUud9FSM+GpKDB60IYRAPa1wjevgC76BtsFkJTrLSRE8JmaLu9LS9h23/9iBH9tSIhJ7/cFvqsFAtuqW5D1KwBhNmecU/R5YhUinQxJixwQ1qivrwIwVGl2nmxzDv9CTqprxuKGqXLT9IUrr97zgBS+oZ7XIzzLc8qzd89v/639dtFnVr3rv+/8p6lMn4nmLfTW/MKCwlug903pM1rOYFMB7in6OGEOYXeIpJLK8oCxLYkqEFIje41qHCy1KArqtSdMxpm4pgtDTGXmm2blQ6t1uEuv1E7uN1X/4nVc9+Zo1+Fd33oEDBxLAwx796GO9Xm89OE+KkhDTBWZKIUrRhMBoVFG1DqUNojWkhPeeDn4Evm2IIc54eYKKAatUB3FIsYMwNhUVOg23bZM8y/9KRKIC1Ld+3zVvb7PsY+sBbXMTlDGddEVsSa7GSESIaEkdR00iygpGCS44xr6mJtIEx1Y9IZAQpYmiaZUwxog3WVSJW6ArHN93I2Z4+vjnv//7O9/zgUN//uGPfLTo11vpsh1DVRYZSRTBO3rDkl6Wo1NiMNen37OYXGNMRwOOroXYvTQJjTUZRlumdcNoMkVrTVEWZEXeRXAp0EwrUh3IW9DK0CutyqejMD69Edq2fcX3P+1p5xw6dCjNZtsB90Ik5Kdf8YqTxpqbTJYRA7HemhLqGqPMvSIEuTFkRmOix2rw0yluNKFta8bVFB8iJi/ReY5Yg7aaXBu0VuiU2Dh+HCcqebEmWbsxNb3fA1D79+9Xz3zmM5tzLzjv9/xwjrs3JvjWEZ0j+ZbUVmRGoVMk+JYs61RS4ww+JxLpZ5qeVuTWkBtLcp7R1iZj5wgi6VRSOp9blAsfcv6fAXDlv/CiU+c2SSnJde95xx+Nj594ZLl5Kj58sdRaAsG1hLbuUMRBOr2vEFDKkPf7ZHmBxI4sEmJAVCJ5R4yB1gUEhbE5VuVMJw1G2U5QzSh0Zij6JUlCJ9/hI5nV7Cy0npus07b1jpOnT/4mEG5c/Wzs/v79+3WMEWPk7Qs7t3NyWqcmBZTNOllH79A2Q5ed/ldXC+hEBpKCGALJO2zR62SyjCFpQRBi6uAirpqwceoko0kb0DoZY//yVa973dHl5WWtru1wh/Lyn/3pN5pt2zc+PWpV7TtJYVGK/rAPWhGJaN21b5TpJCZiCKiUyEToaUOvKCjyIUk0W03LRttyrHJRLe1k34UP+ZsLUn54Bl04YzhZW15WolT8Xz96zf+9647bn3Lk1lv8hfOFVikSBayiO+kJkk/U0xolGXXdUo8ntI3HZAW9skDpTpTN2gzv3YxzB23bEJLDlCXVDJtpTHfhdwXhTkfMRUfPanrWUKagT955e5i2zTP/09d9zY+tiXze+agLC9tuU1nGRkySbNbJ/2rdiceljgOQvMeIJogmiMELHWJOGYzu+pp+piCocg1lTtKW0eaIfKHPVLTKF7fJ/K49a4Asd1d8N1Lr/Cuu2hju2vVav7gom20bQ4qIFkRHdKYwmYbk0EQyScSmJrZth8EXyK0lkw6H2biWpvFIkHSiiXLuQy+JT3/6tx547Ite5O47IvPgwWV19dpa+KWXvujnjp86/YJPfORj/vxhZhZ6lhRDxwztCNl47/ChwRhF01ZUzoHOiJKY1hUxCCl6XONomoatcdURI2OgyAvKvECImNygk0JCILcWlQI+eNCBwhqsskQS/dyyz6DG6yeim45/9b99yzddsjbr23VOo/Mauc0+sefss4MZzqnTkyb5ENFGg1iaaae/YooMrRS+bSB1eBzX1ChjMcYQmxZBOpiINihRtFXFtB4zakNwWa52XvCQj3zba/7POxOdDua9sDJA/t+b3vH/xf78LR/fqNW4biMpUddTkgZtDUZnZEojCYwGnQm20J0ml9ZE50nO4dopg9wwDTHufsjD1SMf+Yi//fqnf8NH7nvaui74WnjXn/3O121W9c++/30fCPvypOfyjCRCWeToKDR1Q3ItRkEkUEeHLTJsYUFF2qrp2KFa0EWPcjhA684dBu87PUrvaeopzXiCpETeKzBGd2Be3UEN58o+C/0hxESRZWSZZtvAyJL4uDWecPjY0ZeklNSNq6sCMIuKpfjMhTcM5wZ37Ny3T06M69QkcC50AYhKhBCJSRNJ5CRi2yDKkJVzpNnpLMs+/SwHYzndRDbGYzY21jGDHtOoOP/SR7L7rAsPXCbSnuFFnLlw0/LyshIRf87es39JdpwlN25UofGxK1ulgLGGYjgg7/fpD+cphnOYopsboEWhpJPkbUTwCXwMcZ1MLv/aJ9z+HVd/y4tTSnLw4MEzLX919dVXh3T89j13H11/zbv/8X0pH52WvXM98d6REh3lSiuspI4VlGfIzLUoLejkiXVFblVXYVeR5B3eeaZNAyphJXWi297fa0zXNITQogwdR45OQsN7R9VMKTLD0Fr6YuiZjEFsTUrR1679Ly950hU/sQZnymJpeXlZrR5a9Tt27vnlfRddFNu8iKcmTaqqlrrpisY6JVRykDosiVIQk+twBm2Lm1aYsk/W65FbSyIycVNSJjTosOOCh+ptD7nso+XLXv6m+/Ii7o2U1tbWwsrKivqLt1/7ht17971J9uyzN69PXdQF2nS+Oyt7ZP0BtsxQuSUvCprWMxlvMd7YxIeEDwFC4tbNKnztU56mHnnppT953iWPPbKysqLvA4+LH/vYPywe2xw/9y1vedvDTn7qFs4vMnF1jVUJV9dE7+iVPfpFjiLh2qZzx1lO2R9SlH18DJg8p8xy8qzAB0/jW0zeGR2jEUkURtHr9SjKQddici2gcESmviWqhMqENvoZhaqTRSwyzUKp2R4n6tjmJnUMP/bulZXijIc6s2cve/X//s0LL3nELy6de4G56/hWGk9mNDCjSaZ7Dl1YkkTmt29DFLjxFt61GCVkWQZak3yNwdGfH4ItuGNzGucuengabtv5K1eLhEvvo335WZWB1dXVFEJU3/mCF36XGfTfUS9st7efrp1XRdLFkIDgIngRWu9oZ5MwNtrAlutIH67x3Hhq6h5x1VPsEx5/xZ8t/+CL/vzgwYN6Nl9NAF77Iz+S75nb/sxf+7XXPf9T131g8Ng921mYK6VjehoGgyEmtxA9MXhym1GKxpCYW1yizAvKLCdpTds22MyirUFnFq00hS0YDIb0+wX9XkFe5l2LS2tMUZANhsQI9aRBJRAt6FnnvvWz+T2ZJsWIRbHDKMV4I44kP/vW+vhT4bMVEFKM6gUv+M+vvfDSRx7Jzz5XTk6qqJQG0UwdtCF1fHdjENXxLvLC0ssVeaZIviW2FVECRdkjtZ4jVWgf9uSn2Cjmj7//R3/895c/Z8Dg5xZTUwLk+c+fvPa1r33Wx//xXX9w5yc+tvzhO49z3rb5MDReLS7tEFXkqACTjQ2ICS2WkEI6vDGNt05j+qarv8M+4Ylf+9Zzdi5dkxJyw4Ebum5Qh2BOJ277+BM/ct0/P/MvD/6/Sy+yKi1kSpq2pcwLrO5Ka1EE1zYYEYzuuNYpJvx0CkazubGOkU5kppqMyXp9vA9oY1AdFp4U/b3GSr5Tm/XJdcI4ISApYmOkLMuui280sU1U0zH9fg+VhFwpgo/syTWnxiNGuvjZlNJbEAnMvMfy8rIe7t597Fd/buVlbdv83iffe204PanUfD9HxUCeaaIPSJnj26bjX2QZWhliEpSByXhK0obToylHp60/6/Kvyea37/qoM/HHl5eX9efOPf9XVXDp2C3qpS99abOysvK9McnNJ0+ceOnH77l7bkDinOa0v+j8fdJfKIQkbDUn2Zq03LVVqXo4r6/+gefwqCsu/9PBRZe/4JFPfGKVUhJZlZjSihJZjTe9/y3nRcxVf/b7v3flvljpc7J+skroWUPwNSqz5FlOjJ6QZcTWU08dGIsnUJ8+3bnuBLnNCAlGowlFE3BKo1SNJpKSQErUbcR7RSB2VQlrCbN8rTBDfAi0kwqlQPtIphSi9Wz8iiMpRSRQxqhUW6e77jl2xfv/du3qJ8Ifrxw4oOjATXFlZUVdHvjj9WH58p0PedjFn/nnD7l9TWvnBgWZVRjp8t8QPFopsnLQ9e2ahsnmmMl4wpGJi8ex8bInPtk85NJHvaWqB9/98p9/2ebnGyP6edsXs8hPVldXW0T+5z+85z2/+5uv+qWfOnzHbS+8cbSV3fKhG7jorJ2sn9ogqYylix7KXPDpW7/+iW+5/FEX/9nXXf1DvwP3TkaMKSU5cOAAKSX5+Hvf+X2//euv+4Hbrvunsy5cGKZMopRGISIEIq3rxpEV/T4SElM/oknNbCiRxtUV03bKMM+wZQ5tg/fdXaVyTdRClhlc23HqTGZpQzenx9gMEdNJBaeZ9pPumsAkD0oQrSiznDY6SBGj4r0lPtZPpFtuvNF86Px9P5NSepOIjO6zqXLV6qr/s9e96kcFfmN+cenCwx/+Z69G6zrFKJnRNG3AaIWKiaqqyVTG5miSDp/ejKck04O956nLHvZwtXffedc9+du+47lXXHHF5kxa418Bof4t3JswA4uKCD/xQz/4uMW5wdWfuOHmvVvrJx5x/oUXDlzrTl9y+aPff9G+89ae/f0veHfwDj5HrOa3rrnGvuj1r3d//Ov/64e2RvX/+ePX/zbnhCrtmCuktBqaltAGsKobhJR1XDyV5YzHYyaTKXPzC1hlCcETJZHamuGgoGlappMJik62whYFRiJNVVHPVF2jVjTBd8hgVdJWVZdPZRlN4+hpyHVX1VAiJNd2RfVeybRpaZ1jUgWCzjjiCWdd8Th12SMue9F/feWrfntlZb9ZXe0AS2eQa6Ojn971Z39y8E+OHz951bVrf4YenfQLmZaiMJJlmnZSJR8SJzabtGEyY5aWKLft5OKHXfye3TvP+cUnPPOZb7vqqqv8F0PCfUmAxdkHCDMInDEW59o+YPqD/mZTd4kmoA4ePCj3RSmfGfz6upWf+Qaf5G0H//CPZF+WOH/HgrKhxjcTBMXk9BhtNKIVeVl2tVJTUE3GTJuGfjnAaosYg84z2tEmQqQscyajTVKC1jnyWRWl9Z6mrju6lO4k7gtbgGS0bYs1Ha9vPJ6y1Ou4aHXbSWUYhH6ZE3PD1ngCGuqJo01CnVLcWDxL7T73ok+88W/f/IgY42dxGM5wI1JK6g9f99ofef8HPvDfb7v5pp316VNoV5HprrJTuchIaYZzi1s7d+38mwsf+rDXrr72ddd3UcZn8yq+bMN9HgMmPhtaJweXl9XnjlU+g6v/8eVnP6KYG77lff/4vrPi0bvSo8/fqy57/GMZHb2DyYkT1KOKcV0xHM6hlWJrNKIcDLp+VDslJDAqgxiYjsaorKDXz/DNlOFgDh8C3rW0bYtzgUF/gAhMpzXTxlEMemibge86iFobjHiayZiqauiVGVYSk6qhLHr0yhxjFD5FpvUU57tgqfEJhXDYSexfeKnaPbfw03f+Rf4rl6xcIvedSnzfTf+D175274c/ct1zhfTYT9366UsWd+ya7jnr7I1jR4/YFOOHH3vFY1/7w//zf94xM5gsLy+rLwV19mXjuc9MsDjDevncPz/DD1h5yUt257l88J/f/95zjt10U3zUnnl14cMeyr7LH8upOz/D0Zs+TluNaUIgK4aUecbR48fQWY7RGVrP+NfaYkQxGo1oXUu/zCnyruMcvKfMC3SeMxlPSLP+Vt34TivZdPCAmISgBG0y5vKc8dYGTVNRljn9PGM8GWNswaBfAomqaaibhqQ72J2KkTZCdJG7s7mw56KHaluW3/SaP/2rt32ekdKf/TKLIsWQA31gwxgbQ7j3x+8XXQz+HYb7Yus+M7bNG37ll978j+9461Nvfv97/WO2L5qF0nDeYx5FNlzkro99lNGJuxkuDhlPWpQtmZuf5+iRe2ico18U2MzQOI8gaNHEGNFWo2KkrsbozOIaR24VS9t2MJm2jEcbKDFdi0cgKYWPnsm4xfZLEkKGIDphM8OgLChshgs103HVicGFTukotC1eEjpBnhfUVUPjPLW2sT37gnTuwx9xdM/eC5724pe//MbPN8y9I7Ncqw4dOpT4bLS1LIO6ZGUlfTmI7gfccCklufbAAZ098sKlk+PmN/7gjW/8T5+6/oPhUdvm9Pa8G240XOzhWs9oY4S1GmUMjfcMd+zAJOHk+jopJfKsE2trXZd7WdMl2DYryK0QXc1kOsaIdPddfw6XuqnCgkZiApWQmJAUObGx2Y11iZG6aVlaGLK0fQmrFLGpEAXTpqVuGzJR9IwlJqhcQ2HyjuKrAtOYaCYtR6ZtvPSpz1DDHbs/fPElj/qG57zgBRtfLKC475ydfy8E/n4JYX4p69oDB/RVq6veDhZ+9vr3vfc//fM/vD88bDjQi0ZQmcL2dKdzbA3zO3fSn1vEu0iRFxjpQvRtO3Ywv7iAawPjyZToO62vlIQsL+j3e10eV5b0eyVzi/P4KEwnU7xzuAiTaU3rPcbmGAxGdegvEQghMcwzVIgd4KgaU7kGn0I3HdloyrkBZtAjSegEtbXCu47/N8gs80XOdhXVJ//hXaEZbV5xav3oH13/9rfPf7ExmyKSzvz9793nB3Ri48rKirpqddV/7APv/eZbPnrdt33gzX8XH7N9qHZkQgoOSaB0QV726G/fTd6f4+Ttt1K1LbrfYzKpsEZjsxyF6XRxUyepSwqE2PXlNk6cwNUNCzsW6c8tobUAp9kcV+jMo7MePnTDKULj0QKiElpBLzN4EXq9AiSytTVCygxbGIKL3eAj0QSliEpQhcWEiG9rJHVA4RQCblqzUGbEttH/+Hd/4x/5DU97plb8eUrpmw8cOOBmW/KA8fg+dz1gJ27mItL17377s04euXv1T3/nd3duo5V9S4VkBfR7FhUCISnKbbsohouUwzmqqqX1ka3NLabjMfV0zPrR45w8dpw2+g7nEhIoS+sC1eaI0caEkBLeNTR1Q9u0s+Ajdb+Snw3Hjb4bppQCKUUa51BGEyVRBU+LYAuL1QlJgcm0xZPhRTGejhhtbuBcQBnppKusRlSkbutuHk/yLFjNWTqaa9/0N+1nbrzpG//4Nb/4X2aquQ/qjNQH5I474xruvPPjC6fvOPb/fv/1v/W496z92eKVF+xOvq0l15p+YQhKiCpnuOts5nbupB6POfzJGzm9uYXRmn6/pK5qnO8MFoEs6wY8uJg66agYadquIdrvdZOmbKaY7w84vn6aNikkdI1XYwwJ3bVUMsPUObRRJBJlL6eqWvqFZdDP8BG2Jh063hjdqegJtJMJWUpoNEU/x4vgYyI0bScgJxqHcPukjUeT4clPfvKJh5x94cXPW13d+rdysX/PekBO3NrVVysRSQf/7x///J/8/h887X1vecvCxUt9REURJYi2KCXYvCAS2DpxlJN33MWRT32Sppky7JcM+yUqJRSR3Gp6haHMTUeWDJHkAiRItkAZQ3ItIXSCOSTpGpZtp8jbpkgQIYkiEYgaJm2FMQrnPIlEUzWoM3uqLVPnaL3v8DQxobUgSijyHEEo+0U3Ji2lDr8wc6VmUJDP9dg7lytOHEvHjx7d1eThf7373e82M8bqg7L+3R98pt3wI8997lUnj5140bvf/vdxUUV2zXXo3YUd27EWRtOKremEuq7YPH2Kuz95M9V4BDGRm07y0Lc1IQSymT6kVl0NkxgIrcPqjP5wSH/QozfsUfZLyl7BoOzNNlvhfSCqbvQKKLTNCDESElRVQ/QJhcI1Dt8G1Oy/u7YT7C6KgjyzNN5RuYZy0GNh+yI+eFxd4xvXtYFyi3cVzXQLV48YlIZzB5m69RMfi8fvvuu/hJMnL1lbWwsHv3Qiyf1a/y7DJZBLLrkk/cjTnz63uDT4zbtuvzXJqVNs01qUMZR5hq+mBB/QWR+lik6fSxLZMMdYTb9X0DQN06pCjMXm2WzemUIrTZoJbGdlgcmyTp6wlzO/aw9Fbw5lC1CWra0JpIDWkILvlPiKbiJkZixFluFnQm/Re+YXBxS5ofEBpQ0L8wOKIqPolZT9kn6/j0qdjL1zXXvISjc4QtkMjOlQXEkQ50htxdnb+6KmW+nop29OH/+Ht/wICA/WeNt/l+HWlpfV6upqXDp/z3+P9fjiz3zsI2FvL1O7F/ozHaoKP5s2pQmQHFYrBoVFq675GQGlNKKEmb50p3BOwqfYKXyLEFU3V9XHSFM7oo/YLO/Gp8Tu1PgUZwIDGiUQUyTpToOl6PVZWlpgbr6PNRoVNTbPyHslPgUaF9HZAKUU8zt2c9a5D8GIYTwaUdUNRb/P/LYlyqJHXdWEEOm4pEI5kw1RMXBO3+qN48eTTc0P/uZPvuQJB9fW4oNx6r5sw6WEXL22Fn7/l19+vm+aa/7p/R+Ii77RSyohEsBHtFKdXKELiNJkOuuG1ZoCUkJnJflgnqw36GhdeYG2BWI7Q6I7HH6IsUMCG30vpjMS8d51lRG6U+xCpHUeY20n15E6hmdACGjml3bRHywwv7BEbFvauqWpa+ppjW9dV2lRGTbr0Z/fzq5zL+jcdIKgDKrskbShmlT4ENAmJ6REPZ2S24KEsKufMz56Mq6fPIWy6SqBdMMlxx/wQseXbbgDV+7XgGyenj77jjsPL47uuitetH1OimFOiBFBCK3HuxYJgdDNX8D5SN040KC0AaVJSpMP59BFD1EWrUskJnSUDj84oyZbEhK79kyYjthcP4JrJjOoQTcs14hBIkCXOHdYT9sBZ42dQdETGEvTONqmochzrO6Aq0opQl3RbG0wGC6wZ98FpOSZjMeMR2PqpiLLLTF42rruJoikhHed4bVS9JNTd99zIuV5+ZK/fs0rd62uHgoP9HTiLzsBv7GTUk/vfu91jzhxz11pu1USWo8UGiUK1zp0mjUvtVBPp8QYUJlFlCVGYX39BGV/DmsN1liysiRGmI7HhNihVDOdIclT1w2Z0uhMkRlBYkvWDVkglQOUsgiK3AqtazE6YSXQzzOSNWAszKZ2NNWkozfpbkKy84Gy180cH8zPg9Ycv/1WjNaMN9Zpa0eMFdVkgkrgYqLVnVZhSh0wqLCK4DxYzZzV6q4jRxJazt62ffslwLG1tTXNv6EMcX/Wl3Xizmjnv/n3fmN/NR59n5w+ya6Fvkq6G2niZ5OzdN7JvHsX8TGhtCL5SNt4YoxYo2mrCl+3BOeppxW6yFHGUNeOqBQpdV1pMQqX4mw4X2Ru2zYW5udJzlNNp/gU8HHW2aab6x1DJAWH0Z3uWJZ1cwqi8x1EolditcWqbqitzjRZUTDdOs1kPOL44cN471GzIUhNiB08Is9BurTF2oyoDW1T41pPFMPS9gX8ZBI3R5NExjcBLN9wwwOaz31ZJ251dTWllPRPvuj7nz/Z2NB7cwnD3OhIh6RSypDpSJHnNE2D0l0fSxtFmtGRtcooTNfU9K5ha7NGa4XN+zR1TaJDBAtQ1y1a6U6pVQzGJrLc0tu2g2o8YVo5alejbU5mMlxVkYkhaWiqCSm35GWfdjxFG01/bp580EdXikYqeoMBOssh0bV66ikueEzZo5wbUk2mxKQYliWBDoLfz+dQHhpXdecoJsi7QRLaWuYzkaNHjsvmyfWvObiykh3gC0pdfVnry77jtNbh+g9+6Dw/2mTQ7+MiXSLsodMotaQIJI0tBsxv20F/ON/Na9MCSiHaIMaQZUUngRQS7XhCaBryoqDfH2DyHKu7dk5HRmkhBZrpBNdMO9fnPFmvR0xdJDqcG2KsRmtNiI5mOmGytcl42hWhbVF0oXxRkJU9oghFWVD2B/imoRpPab0n6xW41lG1LQ5FMt3YM60VbVNR+RaSRs9gFjFC9BHRht0LA7V+/IjXWu9f3Lfja+47AeWrYriZ7n36uR/8wT1SV5cvmkgiqRTp3FTsyBnNtKZ1EWuyrlfuQWlLXg4weUnjPbX3RJURUGR5yaA/R78/IM862b+QOnVyY003GFclXGhmU4mFE3ffwz13n6RNHWFQawsI2ugOSaUNKURc62malkwbYoqIMfjgqSdTfNN2EaYLaGPpzS8wt30HmbU0dUVdVYzHFX6G0BKjaF2nyD7a2GA8HVG3FdNqgosJpPvz+X6JrmvVts4Ph3n1QBnsyzbclfv3a4BPHbn9O0url4YkX1olvbzrUGvouHRG46u6S1gFNk+us3Fqg8l0TJZbwqxx7kPDpKm6WTnWoHT39ue5wdcNW6fWqaqaIsvI84LGeappg/eOybRCZZ3sfYyhm5MTI67p5gholTqYn3NIiPeqG3jf4qopoZrimrpDgjUVJ44eIWnNwq6z2L73XLTu1JIG/T60riMfzqZDZtZirO7oXD6htCXrlbgUiaLoLy6Ru0omo1HYde6+fV90U7+M9WXccZ2iTu39Q9zWJn2rKLIM17TgPErbTooeiOKpmglFbsgLIRlNEqEoStq6oa6nzC/MY2zeiVXXdcdvSwHvGmJypAjGWlxMGGKXjCcYjaZUtScrcqIkJM4AaarL+7QX8rJEUzINgkoRJYngHePNDYzpyP2DwQClO7WkcTVlUFXkecH8jl3EtoUQ2Tx5Aj8J9PISlSL94ZC6qXFui9B6YnBYW2BtN6HL+xbvWhZyzT03f0KffNSjnpNS+jsRaR+owvP9NZwcOoT/rWuu6b3tU594WiFCz2rlmhoQdJl1JIsIqE5UMxKofKI3HHQKfEoz3hwRYyQruuGyRVkwGU2Y1F2YriRilKbxCT1Tp/UxEaWjC8eYmEyb7lTlOVoJbRtAK4yGwpRYrfExMJxfoq9znFKdGIF3mCzrdEd0SV70EWWIkrC9nHE1JcszrHQ4lbmlHcS2ZbqxgYSAzrNOk2RWjhNtUMl2rl0ivq4oeyVtM6U/mE+3f+pTmfvrv/r6u4/clQMtD5Bs4/1ylWeEWbZ2DHdl2mzPvE/WasmNwkgnauNCpHINKuvIfREQa8BmoAxZXoBvMDoxNzeH0YamqRFiN4stJcpejzzrxmd2xpWOV50UkoQUwr2BSNO2ONeNfI7eoURjbEYInmY6q38OB/QXlrph8bErVCkRECHO6pveOwiBupqQkupEZhDaaiZxUWR41+DaFtGaqp5iTEaZl5gZk9Q1DUHRiWUrg2srWd8cp2nd7OmNR7sBDsz28CtquGu7cS7ccuPNj3ej8YJuqxhTEu+6uyXG2M1ZE01MkSCQZxmDIqPQhmY64eSJYyzs2sOeved0+BGdkRCCCLm15GWGLgsky+kEChzKKpSKEDxpprVijEZCxE1rps2UJIkit53UYjVhOtrExZbJaIu2rlk/cienjx3ugh0FzrmOX+BbTp08xonDhzGtI03GVKMt+vPbmG5sctMHP8CJ48dZ3L0Lh6NxbdcfbBtC7Mj1eZ5D7BQmClOgVdfGEhckjLYwWanyHWcvAhx4IKzG/XSVV9LdcMNe76ypNakOMQndHSTRU08ntD6R5VmnLlBVDOYHaNOxPEWbThbJZFTTMV4C/bJHrDpNx3HTUhQliKYYDLvpH82EvlJYJZBJ1xMThShQMZBS18KJoUWVPVzVEnyAJLSNZ2s0wo22mIynGKUwvaITz4mRZlJjBiWZtSwszqO0wkTBV1PG68cZnzqGzSK6KKiqCW2I9ApD9J6+LomSyAs7e2E12mT4JJi87CYee5eMUlIHlbwq1x9Iw92/Ezf7Z9Ccl5pK+kXWiWVKQLRC626mXGE1mRZ6eSdvG1NEaU1v2GduboHJ6ZOcOnaE6WhMNR13FF9rMDbDxwQ2x/aHLO05h9279s4i0w5/4lLsOGeZQQE2RXpWzUQD4my8cyJEjwAhONq2xWQ5zPRXtLLYXomiyw3L/jy9+SX68wssbt+OqzY5esenKBbm2XbWHsQo1jc2iSkxrSY0kynzc/MsLczjmhqCQ5TQhIAYkFARQqBcXKKcn0MSm0dv/tgm/IvUxlfUcGdGPfqqXioGQxrfUmhNURSYPENbQzkoZ4m1pezlONdQTcad/kkIXcRXFMwtLjI/twAx0U4r6lGNSCLLLFmvB1oxdQ3zO3ezuHMnxaBHMSiYG/ZRRqNQDPsD5uZKtEmdC00JYxVZYTopeNWNoc6MwVjBZpakTDcwcNp0lCxrKIbzzG3fRVKKIDO5DSUEAkl3yoK2LBguLlIUPdq6YrR5ilh3zCAVIioEknTcgxg8KXqyskixmGPi4unnHnj1abgXQPzvXvcvqpwprG5ubA0HvRKfFyJEmtaRZRal6BgvBFxoKJRGq05RwM8GnldNQ2EtWdlH0NTTLdq6oXWefm+evD+kN7/QjeeajtnaOIXRisbV9AY9tGjSaERT12QLc/g2Mjm9CTM2j6Zzo8lqQqZAKUzk3sq/J3ay/DonK4tOP1oU9WSCb2vaegoo7Cy3CzEw6PUJriXXXfTZOk+oO4GCsihJCqpmilXSwS90N/o6xETUiradpGsPXPvV7w7YojjWTsfdPRISadoR7FMMRNcQUWirENFYa/CVxzc1TujYNaMxi4sanZU0DmxviAotZX/IYPtulM1YWtyG0Zp7bvtkJ+NuLSEmfKjvlaNQSqNEKMqyu1ODA5cY9kvGIXRw/JhoXaR1CZPbbmKJJBb6/ZkAeECiwzcj6q0NnPOdCHiIGGvRLqGynOHcHKlucOMRmYAuCnRQSITkW0LtSEahTScuU29tIXknwGYlNVetXnWmVvmVd5XH9+8XgLws/j4qzbhukSSYGMm1UGRdTTF4T3GGA41CFxaXIs4ntCkxecnJo8eZjieAQnTGjj3n05vfgSAUZR+b5Uw2NhhvjainU5S11E3D6a0tirJg91n76A0XsXlBZg0CXd/NGkQpitxgFTQhdY3UFPERghiSWGLtqMcjXD3BVWPa6Zh6OqWt6hnEQc3Uyz06y8hsyXQ8YjydEkw3abJuJ5w+eZy2qYjBd6xTOhFxRBidWk/FoI+Gk1/Ofj9ghjtzx00no7umdZ2iFqWKAjPoUViLoRNtK3OLzbKulalAjCFKJ7kBINpgywJJEHwHU2i9w9UV1hiyLGO8vk41mTLoD7uBtgm0zihsQds4Tm+cwrUe5yOj0bhTZZjdZz56srygKEsinexhVvZIEZqqwbsWr0AZi80KmtYxPr0FzhNDN9wht/peBLMWxXhzg8lkgu71UJnFeYcPnpTpDnupNWI6jqRWmiLPMUVJnhfYzCaAlQfKavfXcGd4yOt3H2sGcwvS27Gb9dNbHRhVLMpkXRFXOnmmmCIRhZgMpS0xKWLspG+zsiRIJwNYtw2nT51ga2sD17ScOnqU6XjE7vMv4KzzL2JxaTu4DuSaklCNKyajLeqmRpRluLBIUQ4gdegtkYwYu6F5RsA7h68aogsoNHlekEIgtR2eb7y5ia8bMmUolWYgggqRDKGfFagU2Tq92Q3+SwKNRzBk+YBMWdIsmVcobN7DWAtao7RKW8dOMKnaDYD7zkT49677dcedoRj32nRT4/1NTumHN00b27pVtsjwdU2vLIhRaCfd7IJWBBU6yd9p0xC8x86q/kpAlEIpwfkWRFi/+3aK/hy212dh+w4oSwieejLpXGYSsiwn75Vdvy51n+PaFpPn+KYitO0MEiEMB/PIaMKkakkCNi/Jso6FE1xLqDqJ/m3btqNU1+EQgelkAkrQSWhGk2644WDYDdsNAYOBGIguIJnGJxgM5jtMjHPowZDNjbGE4SLW5NdCN8Diq2I4gP2g1268sX329vlDm5Ppw84WHSfVRGlJ9MoS5ZquXZMCTeUISnWoATG0LuBDwpYZ1WRCXuTkRYHRpmuttA2p8WitiClx/LbbSK5l6/RJqskmaIXVHXFDEIL3tJMRWgnKZgTfkmIHeA3R0qZEMbfAQjFAzAY+KHSW4+oarQWTF7T1hDIrKctBB3dvG3zdYnVG1TrStKuI9IuSwXAB5z2TZgNUJ3EoZdapPWQZRX+IkYjzQgoJJ7lQFGDsTfAvV81XxXA7l5cTa2tkRr/TZ/kPrbskZ2cZ+XCAsQapBVMIbVNjA12D1RTUrafI+rSunikHaQhCRNFpPSRSSjQ+4DY2mcs9J06uU9UVNhPK0pIpg7Wd2roguGlFU3d3ZF4knKvRCKFpUVaIUfB12xHyyx5JuojPuW42aWgDkgy+cVS6wuQ51WRMcoFEpyuZUiQT6C8usn33bjZPnqAVQXSHXwkOkgg6RaqNU/Tm+p1MY9LpVNOqnjKTXcXgEwCzgU5fHcMdPLgWReDyyx76D0dPnd6QxcUF19Yp+lacb0kxYTJDVpTokJhsbpG8YLISNwOfdsrfqavKB+kGxtZTSJEQpIP1eUdInoXFPrlKnVuUbjiIQXXw8a463E0kCQHfdjJMhkRvoLHGoEJL8JHcWrSOeFdTT6ddFBE81uQIibqqkKYhKUPW63UlttEGEhN5loFK1OMtUvQMegXB1bQxElxCp4gyClJEOqUYppNpKIYLem5h+1+//A1vOPaF1BO+3HW/w9PZRHn1P37tDcd6vcE/ZkvbGcUU6qZmOpkwmU4IIZBaR7W5QQgOFxpcDFR10wF/lO4aklaR2Zx6UpECRJ9IAYzWNO2U0gq92Vjr4BNNAMF2nYC2xRQFuii6h9KKZAwmswQU46rpXoS2psgMYTb1uJqMSczki5VG0kzFXQuxaQhtQ91UKGvo93ud9IZ3VKMR1eYpYj0hyxVFmVMaRWFiJyRqNHluOpBvdIxaJ3vOv0h6/d4fAyw/UBb7cg0HsLy8LAnk7D27XzN2jrtrLRtVTQtEFNPRpFO9i4Eis9hc41xX0hKl0KK7yU5RiM4R2hajMhTdSGWdhG1z8ywtDCgzC6JBGaq6ZXNzTIqKGKCquxNS9IagTVd/7BVkCz2cUmxsTjsoQdOdsmnb0CbB2K56n2KHGlMzmWCMEF1DW03ZOHmCuqpR2kISdIDp6U2acadEW1dTkpol3AJWacR3Jb3NrXFMg0WV9fvv3Rt4G3Tg4a+64WaDFdTv/uXfvnPXWWe/ZsOU+jPjFCqX8EQalahiwKE7BTllKfKMwmq0D7i6QSWNEUX0jqIsyYt89jOGXKVZIt5DQcd7s7YDGFmNEyFq3eVSrkOEhRAIzpOkm+Zri27S5MZ4ymhSMW5bPGAyjQsN0bcYq7FWUzcNjXed+0561mMz+BA7JdpejyQa1zpiTNTjFtcmmmlD3Qbq1jHZ3GLu3IvQRcnpKsSzL7lMLrz04j9+0etf7x4MrtyXnclfcsklKcYoj9//pFf3FhdHJ7xSt282sUE6/KELNCnOaogQfRd2G4ngalTyKBKZElT06OiR0GAlgSSqyYjx5ojptCK4hI+gTAccQivcTArex8hoa0xVtbgQqKuWZlqD8wwGObrMaJMQvICyBB9IbUKSQpNIvp0lz5Y0k9LQeYHKMpIWQgrYvEs/hkuL9HvlTADVUhY9yt6AouyxeM4+hmft4djpzTj/sMvVzoc8/LbCzv9NAjlw4MADetrg32G42VB09dKXrR6++GEXf//jv+6J4ucW0kbto2ihjhGNJoZAdC3iKpiOUHFKrxR6RST6Ea7Zop1sUq2fIM2U8DCaoA1VG6g8tFpRNw0inXiMRBgM5khBcWyz5lRQbDWJ0ailnTiqUU1beyabNSZajOpmjcYAokt6gwEJ8D7imoDWGcO5BYqijylyRAkpJZTWlMN5tLUMti2xcNZeBnvOYmnfPsp+2XXEN0+RWcNgz062Nre4Z7MJ+x71aKXz/mu+45prDh+YyT0+gDYDHgBG6hkRml/+mR//r6GtXnX7de/DbB0PRiXtxo4yzzBa0DMl9Ri78FmS4IlUjUMlsNZ04qJ5MZtHAym01HVDFEVCyEXwbYvXOcnYdHI0ZiwxSYj0SBJqlzSSluZ6qMzQ+sDp0VT18pzdi0Px0hWMS+n0IpMP5EWOaEWmNQ6IqRur1pXPFL1+D6UTOi8YLO0m+hY3HeNGm4yPHcMaw9LFl9DfvYePfugjTs461+54+GP+eedDHvrk4m//tl7uovD/eIaD2RycQ4f8G3/l519aT6evfM9frvXV5smwqBHfOJVpYVjmKA3BBdqm0y0RqztifuyCloR0gjMpda4gJlrpeN1t3bA1dWmCjcfqRpqU1Nxcn6X5IQtzi0wmY4Zz8/gIC/MDmrZmNK246/g6jCcsSPQDAoO5nspTUjZ6InSaKVYxtJbxqEKVfaQwpNhS5HnXz+t3YFmFkGYKtn48QlSkWNhO3ptPt99xdyj27jP5ORfd3V88/0kv/m8/fvsDNT35860HrARz5uSt/tSPff2xuw6/IffVQzbu+Aybd98d5jT0tNJWCaiEyTN83eAiaASrDU3rMNZ2ZalM0TpYnzZJlWVq6hqPkb2Peqw4Y/jITTehsjxesO+c0bn7zjmysLTYTiejXYg+lufF/6+2c/lto4jj+HdmvOvdtZ11nLoQooZHoQ011CCFFBFVlhBwa5FAGw5EvZQTEogDvSAhq1SQRjxU9YIiFcEpEukNCYnHCUGLEI+iGFIXUQPNy7HXXr/2Ye96hoNTNQ2oB4i/f8Bo5vfT/DTPz9dq++1wEPglz24qlmU/3LSdZEIfQMcyUSr8Dr9udW9TKfSYSgkYESJAWFFB0fN4DUhvL8o2mZd6fBCapqHb8YAu37yuohCEiHrd5yvFChtJp/Ho089+lV/64+VXZmYWRTZLSZ+SBuwwoOZ68s7NzsaUmJa5ms+9dfGbCw8uXy1gRAshKZFAFoQyKogeUUmPmOADgiIAgcMhbA4BEBFIYWJTRiMRDQO6jj33H4BZb5hr68Ufo/HEudT+/bmJyUn3iGFsAKCfzs8rR6anLSFurkoXP1tIrJlOmnc6T7WclmKVq6nClfyTlZVrcNdXEVNC3C6XeJQSqmoqoZQRWQ31zGYRgAmBwfggJEZEy6qhy7mI6LoQLIyq3WY1pwMlkWhMZB4//cLJ2XcJIZ1+zrTr2vEPd1s7PTc3p+UvfXc0/+vl47zTeYI2a3BrNaDtIRmLCrcbiDbnotH0ENYiLLxrCOFIFLIkI6RpkBXVTacf+isSjTZlNXp++c/Ch2+cOWMKfsuYEAAwAHr+n7A4CCHIe6+/9rxZqx0tlzYO+457O/dsDEkMbmkdXr0OwX0RopQ7ngdOBZGUMG3ZLgQJQU8kMDr2AAj30fDsoqzpnx98JPPOsRMnftk+/n6qLywv3KDAdYEe8uLs6ZnxpdzPU+ury4cb1ep9LCQPeZtuHEySoGpadygeX207rh2i3Y3h3cNnj7/40pXUoUPXALhbjouoAZAD2awAbn5882+rNyEEmZqaogZ65s9braoXF78e/GL+k0mzVNw3vGfkmVhEmyCcS1ZpA0QAl3/4HnWzCFWPwwNxkrt3WZIktdR48hLpBD+9+ubbH8RHR6tAr9rstLn8rdSvxAG4EbStGD9JlvH+qVN35JZyE67naC3bSQ1EB8pjB1MXjj03/VvBspzx8XF/e1sLCwvMMIydCAzJZjLs5DYoGqUUX3780WMhyu4uVip3lkuVe3zPk1XGV+7dt/fbu8ZSa3tTaRthmITFTWzOegNg/xWk9n/0N2n8yhku01WyAAAAAElFTkSuQmCC', pawCat:'data:image/png;base64,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' };
    var FPAW_SVG = '<svg viewBox="0 0 100 100"><g fill="FILL"><ellipse cx="30" cy="34" rx="9" ry="10"/><ellipse cx="45" cy="26" rx="9" ry="10"/><ellipse cx="58" cy="26" rx="9" ry="10"/><ellipse cx="72" cy="34" rx="9" ry="10"/><path d="M51 55 C44 46 33 47 29 55 C25 63 31 73 40 77 C46 80 49 84 51 88 C53 84 56 80 62 77 C71 73 77 63 73 55 C69 47 58 46 51 55 Z"/></g></svg>';
    var fortuneLayer=null, fcardEl=null, fscaleEl=null, fsettleEl=null, cardBusy=false, fortuneAnims=[], currentFortune=null;
    function ensureFortuneLayer(){
      if(fortuneLayer){return fortuneLayer;}
      fortuneLayer=el('div');
      fortuneLayer.className='fm-fortune fm-nodrag';
      fscaleEl=el('div'); fscaleEl.className='fm-fscale';
      fcardEl=el('div'); fcardEl.className='fm-fcard';
      fsettleEl=el('div'); fsettleEl.className='fm-fsettle';
      fcardEl.appendChild(fsettleEl);
      fscaleEl.appendChild(fcardEl);
      fortuneLayer.appendChild(fscaleEl);
      MOUNT.appendChild(fortuneLayer);
      return fortuneLayer;
    }
    function falive(node,kf,dur,ease,delay){
      if(!node){return null;}
      var d=dur, dl=delay||0;
      if(FORTUNE_LOWPERF){d=Math.max(120,Math.round(dur*0.6));dl=Math.round(dl*0.5);}
      var a=node.animate(kf,{duration:d,easing:ease,delay:dl,fill:'both'});
      fortuneAnims.push(a);
      return a;
    }
    function hideFortune(){
      fortuneAnims.forEach(function(a){try{a.cancel();}catch(e){}});
      fortuneAnims=[];
      if(fortuneLayer){fortuneLayer.classList.remove('on');}
      cardBusy=false;
    }
    function closeCardThen(fn){
      if(!fcardEl){if(fn){fn();}return;}
      cardBusy=true;
      var a=fcardEl.animate([{opacity:1,transform:'scale(1) translateY(0)'},{opacity:0,transform:'scale(.97) translateY(6px)'}],{duration:300,easing:'ease-in',fill:'both'});
      a.onfinish=function(){hideFortune();if(fn){fn();}};
    }
    function collectFortune(){
      if(cardBusy){return;}
      var fo=currentFortune;
      var pc=fcardEl&&fcardEl.querySelector('#fmPawCat');
      if(!fo){closeCardThen(function(){resetLotus();});return;}
      if(isCollected(fo)){
        if(pc){pc.classList.add('used');}
        toast('这支已经收进册中了');
        setTimeout(function(){closeCardThen(function(){resetLotus();});},500);
        return;
      }
      var r=addFortuneToCollection(fo);
      if(pc){pc.classList.add('used');}
      var c=collectionCounts();
      var albumBtn=D.getElementById('fm-album-btn');
      var finishFx=function(){
        toast(r.added?('已藏 '+c.total+' 支'):'已在册中');
        hideFortune();
        resetLotus();
      };
      if(r.added&&W.__fmPlayCollect){
        W.__fmPlayCollect({startEl:fcardEl,endEl:albumBtn}).then(finishFx);
      }else{
        toast(r.added?('已收进集卡册 · 共'+c.total+'支'):'已在册中');
        setTimeout(function(){closeCardThen(function(){resetLotus();});},650);
      }
    }
    function rebuyFortune(){
      if(cardBusy){return;}
      if(hasReboughtToday()){toast('今日已再卜一次，明日再来');return;}
      markReboughtToday();
      var pd=fcardEl&&fcardEl.querySelector('#fmPawDog');
      if(pd){pd.classList.remove('filling');void pd.offsetWidth;pd.classList.add('filling');}
      closeCardThen(function(){resetLotus();runFortune();});
    }
    function buildCardHTML(fo){
      var egg=fo.level==='彩蛋', h='';
      h+='<div class="fm-tag">';
      h+='<div class="finner"></div><div class="pinhole"></div>';
      h+='<img class="bird-deco" src="'+FIMG.cloud+'">';
      h+='<svg class="seal" viewBox="0 0 26 26"><rect x="1.5" y="1.5" width="23" height="23" rx="3" fill="#b0603a"/><text x="13" y="19" text-anchor="middle" font-size="15" fill="#fbf3e2">昭</text></svg>';
      h+='<div class="lv"><div class="big">'+(egg?'神秘传闻':esc(fo.level))+'</div><div class="date">'+esc(fo.date)+'</div></div>';
      h+='<svg class="divider" viewBox="0 0 180 8"><path d="M4 5 C40 2 70 7 100 4 C130 1 160 6 176 4" fill="none" stroke="#b09a72" stroke-width="1" opacity=".7"/></svg>';
      if(!egg&&fo.weather){h+='<div class="weather">'+esc(fo.weather)+'</div>';}
      if(!egg&&(fo.yi||fo.ji)){h+='<div class="yj"><span class="yi">宜·'+esc(fo.yi)+'</span><span class="ji">忌·'+esc(fo.ji)+'</span></div>';}
      if(egg&&fo.rumor){h+='<div class="rumor egg">'+esc(fo.rumor)+'</div>';}
      if(!egg&&fo.mood){h+='<div class="renqing">'+esc(fo.mood)+'</div>';}
      if(!egg){
        h+='<div class="stars">';
        for(var i=0;i<5;i++){h+=FPAW_SVG.replace('FILL',i<fo.stars?'#6b5a44':'#c9b89a');}
        h+='</div>';
      }
      if(!egg&&fo.verse){
        var v=esc(fo.verse).replace(/[／/]/g,'<br>');
        h+='<div class="qianyu">'+v+'</div>';
      }
      if(fo.suggestPlace){
        h+='<div class="goto"><span>建议前往 · '+esc(fo.suggestPlace)+'</span><span class="seal2wrap"><img class="seal2" src="'+FIMG.zhun+'"></span></div>';
      }
      h+='<div class="minirow"><span class="act"><span>再卜</span><img id="fmPawDog" class="paw" src="'+FIMG.pawDog+'"></span><span class="act"><span>收集</span><img id="fmPawCat" class="paw" src="'+FIMG.pawCat+'"></span></div>';
      h+='</div>';
      return h;
    }
    function playReveal(fo){
      fortuneAnims=[];
      var egg=fo.level==='彩蛋';
      var q=function(s){return fcardEl.querySelector(s);};
      var qa=function(s){return fcardEl.querySelectorAll(s);};
      var EO='cubic-bezier(.22,1,.36,1)', ES='cubic-bezier(.16,1,.3,1)';
      // 第1拍 · 轮廓水墨洇开、轻轻飘落（0-600）
      falive(fcardEl,FORTUNE_LOWPERF
        ?[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}]
        :[{opacity:0,transform:'translateY(20px)',filter:'blur(6px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],600,EO,0);
      falive(q('.finner'),[{opacity:0},{opacity:1}],360,EO,180);
      falive(q('.pinhole'),[{opacity:0},{opacity:1}],360,EO,180);
      falive(q('.bird-deco'),[{opacity:0,transform:'translateX(-6px)'},{opacity:1,transform:'translateX(0)'}],480,EO,220);
      // 第2拍 · 墨迹一滴滴渗进纸（600-1200，错峰）
      falive(q('.lv'),FORTUNE_LOWPERF
        ?[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}]
        :[{opacity:0,transform:'translateY(6px)',filter:'blur(1.5px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],380,EO,620);
      if(!egg){
        falive(q('.divider'),[{opacity:0},{opacity:1}],320,EO,740);
        if(q('.weather')){falive(q('.weather'),[{opacity:0},{opacity:1}],320,EO,740);}
        if(q('.yj')){falive(q('.yj'),FORTUNE_LOWPERF
          ?[{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}]
          :[{opacity:0,transform:'translateY(5px)',filter:'blur(1.5px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],380,EO,800);}
        if(q('.renqing')){falive(q('.renqing'),[{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],360,EO,920);}
        var svgs=qa('.stars svg');
        svgs.forEach(function(s,i){
          var on=i<fo.stars;
          if(FORTUNE_LOWPERF){falive(s,[{opacity:0},{opacity:on?1:.12}],260,EO,940);}
          else{falive(s,[{opacity:0,transform:'scale(.75)'},{opacity:on?1:.12,transform:'scale(1)'}],220,EO,940+i*80);}
        });
        if(q('.qianyu')){falive(q('.qianyu'),FORTUNE_LOWPERF
          ?[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}]
          :[{opacity:0,transform:'translateY(4px)',filter:'blur(1px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],420,EO,1180);}
      } else {
        if(q('.rumor')){falive(q('.rumor'),[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],440,EO,700);}
      }
      if(q('.goto')){
        falive(q('.goto'),[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],360,EO,egg?1000:1260);
        falive(q('.seal2'),FORTUNE_LOWPERF?[{opacity:0},{opacity:1}]:[{opacity:0,transform:'translateY(-12px) scale(1.12)'},{opacity:1,transform:'translateY(0) scale(1)'}],340,ES,egg?1180:1400);
      }
      // 第3拍 · 昭章落款（啪地轻盖）
      falive(q('.seal'),FORTUNE_LOWPERF?[{opacity:0},{opacity:1}]:[{opacity:0,transform:'translateY(-12px) scale(1.14)'},{opacity:1,transform:'translateY(0) scale(1)'}],340,ES,egg?1040:1320);
      // 第3拍 · 爪印"按下去"（scale1.18→1，极小幅，文字不挂交互）
      falive(q('.minirow'),[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],260,EO,egg?1320:1460);
      if(!FORTUNE_LOWPERF){
        [[ '#fmPawDog',1480],['#fmPawCat',1540]].forEach(function(pr){
          var p=q(pr[0]); if(p){falive(p,[{transform:'scale(1.18)'},{transform:'scale(1)'}],240,ES,pr[1]);}
        });
      }
      // 第4拍 · 落定微顿：整张卡轻浮一下再落（0→3→0）
      if(!FORTUNE_LOWPERF){falive(fsettleEl,[{transform:'translateY(0)'},{transform:'translateY(3px)'},{transform:'translateY(0)'}],420,'ease-in-out',1680);}
      setTimeout(function(){cardBusy=false;},FORTUNE_LOWPERF?1400:2250);
    }
    function showFortuneCard(fo){
      currentFortune=fo;
      ensureFortuneLayer();
      hideFortune();
      fortuneLayer.classList.add('on');
      cardBusy=true;
      fsettleEl.innerHTML=buildCardHTML(fo);
      var pd=fsettleEl.querySelector('#fmPawDog'), pc=fsettleEl.querySelector('#fmPawCat');
      var actD=pd?pd.closest('.act'):null, actC=pc?pc.closest('.act'):null;
      if(actD){
        actD.style.cursor='pointer';
        if(hasReboughtToday()){
          if(pd){pd.classList.add('used');}
          actD.addEventListener('click',function(e){e.stopPropagation();toast('今日已再卜一次，明日再来');});
        } else {
          actD.addEventListener('click',function(e){e.stopPropagation();rebuyFortune();});
        }
      }
      if(actC){
        actC.style.cursor='pointer';
        if(isCollected(fo)){if(pc){pc.classList.add('used');}}
        actC.addEventListener('click',function(e){e.stopPropagation();collectFortune();});
      }
      requestAnimationFrame(function(){
        var dh=fscaleEl.offsetHeight||380;
        var pr=pg.getBoundingClientRect();
        // 始终锚定书页、浮在书页中央（盖住九宫格），宽不超过书页62%，跟随书页缩放
        var k=Math.min(pr.width*0.62/210, pr.height*0.94/dh);
        k=Math.max(k,0.12);
        var cw=210*k, ch=dh*k, m=6;
        var cx=pr.x+pr.width/2, cy=pr.y+pr.height*0.48;
        cx=Math.max(cw/2+m, Math.min(W.innerWidth-cw/2-m, cx));
        cy=Math.max(ch/2+m, Math.min(W.innerHeight-ch/2-m, cy));
        fscaleEl.style.left=cx+'px';
        fscaleEl.style.top=cy+'px';
        fscaleEl.style.transform='translate(-50%,-50%) scale('+k+')';
        playReveal(fo);
      });
    }
    /* 诊断已移除 */
    function stickerBtn (imgUrl, txt, cb) {
      var b = el('div');
      b.className = 'fm-stickbtn fm-ctl fm-nodrag';
      b.innerHTML = '<img src="' + imgUrl + '" style="height:' + (Hp * 0.034) + 'px;"><span style="font-family:' + KAI + ';font-size:' + (Hp * 0.02) + 'px;color:' + INK2 + ';">' + txt + '</span>';
      b.addEventListener('click', function (e) { e.stopPropagation(); cb(); });
      return b;
    }
    var ops = el('div');
    ops.style.cssText = 'position:absolute;left:11%;right:11%;top:' + (gridBottom + Hp * 0.125) + 'px;display:flex;justify-content:space-between;align-items:center;';
    ops.appendChild(stickerBtn(BTN_CAT_URL, '撤一块', function () {
      if (!data.places.length) { toast('还没有地点'); return; }
      var p = data.places.pop(); saveData(); renderPaper(); toast('已撤销：' + p.name);
    }));
    ops.appendChild(stickerBtn(BTN_DOG_URL, '复位', function () {
      if (!data.places.length) { toast('地图是空的'); return; }
      if (W.confirm('清空全部地点（保留' + getMeta().center + '）？')) { data.places = []; saveData(); renderPaper(); toast('已复位'); }
    }));
    pg.appendChild(ops);

    // 占位页 1..4
    for (var k = 1; k < paperPages.length; k++) {
      var q = paperPages[k]; q.innerHTML = '';
      var nm = el('div');
      nm.style.cssText = 'position:absolute;left:0;right:0;top:' + (Hp * 0.24) + 'px;text-align:center;';
      nm.innerHTML = handHTML(PAGE_NAMES[k], k + 9, Hp * 0.05, INK, 700);
      var em = el('div');
      em.style.cssText = 'position:absolute;left:8%;right:8%;top:' + (Hp * 0.44) + 'px;text-align:center;font-size:' + (Hp * 0.024) + 'px;color:' + EMPTY + ';line-height:1.8;';
      em.textContent = '这一页还空着，下一步做';
      q.appendChild(nm); q.appendChild(em);
    }
    pageNum.style.fontSize = (Hp * 0.03) + 'px';
    goBookPage(state.bookPage || 0);
  }

  /* ---- 拍立得：正面照片/翻面手写字/详情纸条 ---- */
  var polaroid = el('div'); polaroid.id = 'fm-polaroid'; stage.appendChild(polaroid);
  var pdetail = el('div'); pdetail.id = 'fm-pdetail'; stage.appendChild(pdetail);
  function closePolaroid () { polaroid.style.display = 'none'; pdetail.style.display = 'none'; polaroid.innerHTML = ''; pdetail.innerHTML = ''; }
  function openPolaroid (p) {
    var S = stage.offsetWidth || 300;
    var pw = S * 0.5, ph = S * 0.66;
    polaroid.style.cssText = 'display:block;left:' + ((S - pw) / 2) + 'px;top:' + ((S - ph) / 2) + 'px;width:' + pw + 'px;height:' + ph + 'px;';
    pdetail.style.display = 'none';
    var t = TYPES[p.type] || TYPES.other, ic = TYPE_ICON[p.type] || 'pin', dir = dirOf(p);
    var photo = p.img
      ? '<img src="' + esc(p.img) + '" style="width:100%;height:100%;object-fit:cover;display:block;">'
      : '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#c3b494;width:100%;height:100%;">' + iconSVG(ic, ph * 0.24, '#c3b494', 3) + '<div style="font-size:' + (ph * 0.022) + 'px;">还没贴照片</div></div>';
    polaroid.innerHTML =
      '<div class="fm-pola" id="fm-pola-inner">' +
        '<div class="fm-face" style="padding:' + (ph * 0.035) + 'px;">' +
          '<div style="position:relative;width:100%;height:' + (ph * 0.6) + 'px;background:#efe9da;border:1px solid rgba(120,100,70,.25);overflow:hidden;">' + photo +
            '<div id="fm-detail-btn" class="fm-ctl fm-nodrag" style="position:absolute;left:6px;bottom:6px;font-size:' + (ph * 0.02) + 'px;color:' + RED + ';border:1.5px solid ' + RED + ';border-radius:4px;padding:2px 7px;background:rgba(255,252,243,.88);">详情</div>' +
          '</div>' +
          '<div style="text-align:center;margin-top:' + (ph * 0.03) + 'px;">' + handHTML(p.name, p.name.length, ph * 0.042, INK, 700) + '</div>' +
          '<div style="text-align:center;font-size:' + (ph * 0.02) + 'px;color:' + INK2 + ';opacity:.72;margin-top:2px;">' + t.label + (dir.ring ? ' · ' + dir.label + ' · 第' + dir.ring + '圈' : '') + '</div>' +
          '<div style="text-align:center;font-size:' + (ph * 0.018) + 'px;color:#b7a98f;margin-top:2px;">轻点翻面</div>' +
        '</div>' +
        '<div class="fm-face back" style="padding:' + (ph * 0.06) + 'px ' + (ph * 0.055) + 'px;">' +
          '<div style="font-size:' + (ph * 0.024) + 'px;color:' + RED + ';text-align:center;margin-bottom:' + (ph * 0.03) + 'px;">背面 · 记的事</div>' +
          '<div style="font-size:' + (ph * 0.027) + 'px;line-height:1.7;color:' + INK + ';white-space:pre-wrap;">' + (p.moment ? esc(p.moment) : '<span style="color:#b7a98f;">这里发生了什么，还没写…</span>') + '</div>' +
          '<div style="position:absolute;left:0;right:0;bottom:' + (ph * 0.04) + 'px;text-align:center;font-size:' + (ph * 0.018) + 'px;color:#b7a98f;">轻点翻回</div>' +
        '</div>' +
      '</div>' +
      '<div id="fm-pola-x" class="fm-ctl fm-nodrag" style="position:absolute;right:-8px;top:-8px;width:24px;height:24px;border-radius:50%;background:rgba(36,26,46,.6);color:#fff;font-size:14px;line-height:24px;text-align:center;border:2px solid rgba(255,255,255,.5);">✕</div>';
    var inner = polaroid.querySelector('#fm-pola-inner');
    polaroid.querySelector('#fm-pola-x').addEventListener('click', function (e) { e.stopPropagation(); closePolaroid(); });
    polaroid.querySelector('#fm-detail-btn').addEventListener('click', function (e) { e.stopPropagation(); showDetail(p); });
    inner.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.fm-nodrag')) return;
      inner.classList.toggle('flip');
    });
  }
  function detailBlock (label, text, ph) {
    return '<div style="margin-bottom:' + (ph * 0.02) + 'px;"><div style="font-size:' + (ph * 0.022) + 'px;color:' + RED + ';margin-bottom:3px;">' + label + '</div>' +
      '<div style="font-size:' + (ph * 0.025) + 'px;line-height:1.7;white-space:pre-wrap;">' + (text ? esc(text) : '<span style="color:#b7a98f;">还没写…</span>') + '</div></div>';
  }
  function showDetail (p) {
    var S = stage.offsetWidth || 300;
    var pw = S * 0.56, ph = S * 0.72;
    pdetail.style.cssText = 'display:block;left:' + ((S - pw) / 2) + 'px;top:' + ((S - ph) / 2) + 'px;width:' + pw + 'px;height:' + ph + 'px;';
    var t = TYPES[p.type] || TYPES.other, dir = dirOf(p);
    pdetail.innerHTML =
      '<div style="text-align:center;margin-bottom:8px;">' + handHTML(p.name, p.name.length + 2, ph * 0.05, INK, 700) + '</div>' +
      '<div style="text-align:center;font-size:' + (ph * 0.02) + 'px;color:' + INK2 + ';opacity:.7;margin-bottom:8px;">' + t.label + (dir.ring ? ' · ' + dir.label + ' · 第' + dir.ring + '圈' : ' · 中心') + '</div>' +
      detailBlock('场景', p.desc, ph) +
      detailBlock('纪念时刻', p.moment, ph) +
      '<div style="display:flex;gap:8px;margin-top:10px;">' +
        '<div id="fm-d-back" class="fm-ctl fm-nodrag" style="flex:1;text-align:center;padding:9px 0;border-radius:8px;border:1.5px solid ' + INK2 + ';font-size:' + (ph * 0.024) + 'px;color:' + INK2 + ';background:#fff;">返回</div>' +
        '<div id="fm-d-del" class="fm-ctl fm-nodrag" style="flex:1;text-align:center;padding:9px 0;border-radius:8px;border:1.5px solid #b5606a;font-size:' + (ph * 0.024) + 'px;color:#9a4b5e;background:#f8e6e8;">撕下这一页</div>' +
      '</div>';
    pdetail.querySelector('#fm-d-back').addEventListener('click', function (e) {
      e.stopPropagation();
      pdetail.style.display = 'none';
      var inr = polaroid.querySelector('#fm-pola-inner'); if (inr) inr.classList.remove('flip');
    });
    pdetail.querySelector('#fm-d-del').addEventListener('click', function (e) {
      e.stopPropagation();
      if (!W.confirm('撕下「' + p.name + '」这一页？')) return;
      data.places = data.places.filter(function (q) { return q.id !== p.id; });
      saveData(); closePolaroid(); renderPaper(); toast('已删除：' + p.name);
    });
  }

  // open 态悬浮控件：合书 ✕ / 设置 ⚙（样式攒美化批）
  function roundCtl (txt, cb) {
    var b = el('div');
    b.className = 'fm-roundctl fm-ctl fm-nodrag';
    b.textContent = txt;
    b.addEventListener('click', function (e) { e.stopPropagation(); cb(); });
    return b;
  }
  var closeCtl = roundCtl('✕', function () { closePanel(); });
  closeCtl.style.left = '1.5%'; closeCtl.style.top = '2%';
  var gearCtl = roundCtl('⚙', function () { showSettings(); });
  gearCtl.style.left = '1.5%'; gearCtl.style.top = '7%';
  stage.appendChild(closeCtl); stage.appendChild(gearCtl);
  function setOpenCtl (on) {
    closeCtl.style.display = on ? 'block' : 'none';
    gearCtl.style.display = on ? 'block' : 'none';
  }

  /* ---------------- 弹层（表单 / 设置） ---------------- */
  function overlay (innerNode) {
    var m = el('div', 'position:fixed;left:0;top:0;margin:0;z-index:2147483001;background:rgba(36,26,46,.66);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;');
    var __bw = Math.min(Math.round((W.innerWidth || D.documentElement.clientWidth || 360) * 0.94), 400);
    var __bh = Math.round((W.innerHeight || D.documentElement.clientHeight || 640) * 0.86);
    var box = el('div', COMMON + 'box-sizing:border-box;width:' + __bw + 'px;max-height:' + __bh + 'px;overflow:auto;background:#FFFFFF;background:var(--fm-card);border:3px solid var(--fm-ink);border-radius:14px;box-shadow:6px 6px 0 rgba(var(--fm-rgb),.35);');
    box.appendChild(innerNode);
    m.appendChild(box);
    m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
    MOUNT.appendChild(m);
    fmFixLayer(m);
    return m;
  }

  var inp = 'width:100%;box-sizing:border-box;padding:9px;border-radius:8px;border:2px solid var(--fm-line);background:var(--fm-empty);color:var(--fm-ink);font-size:13px;outline:none;';
  function field (label, inner) {
    return '<div style="margin-bottom:10px;"><div style="font-size:12px;color:var(--fm-ink);margin-bottom:5px;">' + label + '</div>' + inner + '</div>';
  }

  function showAddForm (px, py) {
    var dirOptions = DIR_KEYS.map(function (k) { return '<option value="' + k + '">' + DIRS[k].label + '</option>'; }).join('');
    var typeOptions = Object.keys(TYPES).map(function (k) {
      return '<option value="' + k + '">' + TYPES[k].icon + ' ' + TYPES[k].label + '</option>';
    }).join('');
    var body = el('div', 'padding:16px;');
    body.innerHTML =
      '<div style="font-size:17px;color:var(--fm-ink);margin-bottom:12px;text-align:center;">' + (px != null ? '在此格添加地点' : '添加新地点') + '</div>' +
      field('地点名称', '<input id="fm-name" maxlength="20" placeholder="如：江边老巷清吧" style="' + inp + '">') +
      field('类型', '<select id="fm-type" style="' + inp + '">' + typeOptions + '</select>') +
      (px == null ? field('相对家的方位', '<select id="fm-dir" style="' + inp + '">' + dirOptions + '</select>' +
        '<select id="fm-ring" style="' + inp + 'margin-top:6px;"><option value="1">第1圈（最近）</option><option value="2">第2圈</option><option value="3">第3圈（最远）</option></select>') :
        '<div style="font-size:12px;color:var(--fm-ink);opacity:.6;margin-bottom:10px;">位置：已选格子（' + px + ',' + py + '）</div>') +
      field('场景描写（选填）', '<textarea id="fm-desc" rows="2" placeholder="环境、光线、氛围…" style="' + inp + 'resize:vertical;"></textarea>') +
      field('纪念时刻（选填）', '<textarea id="fm-moment" rows="2" placeholder="两人在这里发生了什么…" style="' + inp + 'resize:vertical;"></textarea>');
    var row = el('div', 'display:flex;gap:8px;margin-top:14px;');
    var ok = el('div', 'flex:1;text-align:center;padding:11px;border-radius:9px;background:var(--fm-btn);color:var(--fm-btnInk);font-size:14px;cursor:pointer;border:2px solid var(--fm-ink);', '添加并翻页');
    var cancel = el('div', 'flex:1;text-align:center;padding:11px;border-radius:9px;background:var(--fm-card);color:var(--fm-ink);font-size:14px;cursor:pointer;border:2px solid var(--fm-ink);', '取消');
    row.appendChild(ok); row.appendChild(cancel); body.appendChild(row);
    var m = overlay(body);
    cancel.onclick = function () { m.remove(); };
    ok.onclick = function () {
      var name = D.getElementById('fm-name').value.trim();
      if (!name) { toast('要填地点名'); return; }
      var type = D.getElementById('fm-type').value;
      var desc = D.getElementById('fm-desc').value.trim();
      var moment = D.getElementById('fm-moment').value.trim();
      var x, y;
      if (px != null) { x = px; y = py; }
      else {
        var d = DIRS[D.getElementById('fm-dir').value];
        var r = parseInt(D.getElementById('fm-ring').value, 10);
        var pos = nearestEmpty(d.x * r, d.y * r);
        if (!pos) { toast('地图太满了'); return; }
        x = pos.x; y = pos.y;
      }
      data.places.push({
        id: uid(), name: name, type: type, x: x, y: y,
        desc: desc, moment: moment, imgPrompt: '', img: null, ts: Date.now()
      });
      saveData(); m.remove();
      state.bookPage = 0;
      if (paper.style.display === 'block') renderPaper(); else renderBook();
      toast('已添加：' + name);
    };
  }

  /* ---------------- 书皮工坊（设置） ---------------- */
  function showSettings (tab) {
    tab = tab || 'cover';
    var body = el('div', 'padding:14px;');
    body.appendChild(el('div', 'font-size:17px;color:var(--fm-ink);margin-bottom:12px;text-align:center;', '🎨 书皮工坊'));

    // —— 页签条 ——
    var tabBar = el('div', 'display:flex;gap:6px;margin-bottom:12px;');
    var tabs = [['cover', '书皮'], ['inner', '内页'], ['code', '风格码']];
    var pages = {};
    tabs.forEach(function (t) {
      var b = el('div', 'flex:1;text-align:center;padding:9px 0;border-radius:9px;font-size:13px;cursor:pointer;border:2px solid var(--fm-ink);box-sizing:border-box;' +
        (t[0] === tab ? 'background:var(--fm-btn);color:var(--fm-btnInk);' : 'background:var(--fm-card);color:var(--fm-ink);'), t[1]);
      b.onclick = function () { m.remove(); showSettings(t[0]); };
      tabBar.appendChild(b);
    });
    body.appendChild(tabBar);

    var m = overlay(body);

    // 段选（点选后重开本页保留选中态）
    function seg (container, label, options, val, onpick) {
      var wrap = el('div', 'margin-bottom:10px;');
      wrap.appendChild(el('div', 'font-size:12px;color:var(--fm-ink);margin-bottom:5px;', label));
      var row = el('div', 'display:flex;gap:6px;flex-wrap:wrap;');
      options.forEach(function (o) {
        var b = el('div', 'flex:1;min-width:54px;text-align:center;padding:8px 4px;border-radius:8px;font-size:12px;cursor:pointer;border:2px solid var(--fm-ink);box-sizing:border-box;' +
          (o[0] === val ? 'background:var(--fm-btn);color:var(--fm-btnInk);' : 'background:var(--fm-card);color:var(--fm-ink);'), o[1]);
        b.onclick = function () { onpick(o[0]); m.remove(); showSettings(tab); };
        row.appendChild(b);
      });
      wrap.appendChild(row);
      container.appendChild(wrap);
    }
    function liveInput (container, label, id, val, placeholder) {
      container.insertAdjacentHTML('beforeend', field(label,
        '<input id="' + id + '" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(placeholder || '') + '" style="' + inp + '">'));
      var input = container.querySelector('#' + id);
      input.addEventListener('input', liveSync);
      return input;
    }
    function liveColor (container, label, id, val) {
      container.insertAdjacentHTML('beforeend',
        '<div style="margin-bottom:10px;"><div style="font-size:12px;color:var(--fm-ink);margin-bottom:5px;">' + label + '</div>' +
        '<input type="color" id="' + id + '" value="' + esc(val) + '" style="width:100%;height:36px;padding:2px;box-sizing:border-box;border-radius:8px;border:2px solid var(--fm-line);background:var(--fm-empty);"></div>');
      var input = container.querySelector('#' + id);
      input.addEventListener('input', liveSync);
      return input;
    }
    function liveSync () {
      readCoverForm();
      ui.cover.preset = 'custom';
      saveUI();
      renderCoverFront();
      buildBookFace();
      refreshPrev();
    }
    function readCoverForm () {
      var c = ui.cover;
      var g = function (id) { var e = D.getElementById(id); return e ? e.value : null; };
      if (g('cv-title') != null) c.title = g('cv-title').trim() || '足迹地图';
      if (g('cv-sub') != null) c.sub = g('cv-sub').trim();
      if (g('cv-c1') != null) c.c1 = g('cv-c1');
      if (g('cv-c2') != null) c.c2 = g('cv-c2');
      if (g('cv-framecol') != null) c.frameColor = g('cv-framecol');
      if (g('cv-titlecol') != null) c.titleColorVal = g('cv-titlecol');
      if (g('cv-img') != null) c.coverImg = g('cv-img').trim();
    }

    // ========== 书皮页 ==========
    var pc = el('div');
    pages.cover = pc;
    // 实时预览（340×476 设计稿缩到 96×134）
    var prevWrap = el('div', 'width:96px;height:134px;margin:2px auto 14px;position:relative;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.25);');
    var prev = el('div');
    prev.id = 'fm-prev';
    prev.style.cssText = 'position:absolute;left:0;top:0;width:340px;height:476px;transform:scale(.282);transform-origin:top left;';
    prevWrap.appendChild(prev);
    pc.appendChild(prevWrap);
    function refreshPrev () {
      var p = coverPack(ui.cover);
      prev.style.background = p.bg;
      prev.style.border = '3px solid ' + p.edge;
      prev.style.boxSizing = 'border-box';
      prev.innerHTML = p.html;
    }
    refreshPrev();

    pc.appendChild(el('div', 'font-size:12px;color:var(--fm-ink);margin:4px 0 8px;', '预设书皮（点按套用）'));
    var presetGrid = el('div', 'display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:16px;');
    Object.keys(COVER_PRESETS).forEach(function (key) {
      var p = COVER_PRESETS[key];
      var active = ui.cover.preset === key;
      var c = el('div', 'text-align:center;padding:8px 2px;border-radius:9px;font-size:11px;cursor:pointer;border:2px solid ' +
        (active ? 'var(--fm-ink)' : 'transparent') + ';background:var(--fm-card);color:var(--fm-ink);box-sizing:border-box;',
        '<div style="width:26px;height:34px;border-radius:4px;margin:0 auto 4px;border:2px solid ' + p.frameColor + ';background:linear-gradient(135deg,' + p.c1 + ',' + p.c2 + ');"></div>' + p.name);
      c.onclick = function () {
        Object.keys(p).forEach(function (k) { if (k !== 'name') ui.cover[k] = p[k]; });
        ui.cover.preset = key;
        if (!p.coverImg) ui.cover.coverImg = ''; // 非贴图预设才清掉用户自定义贴图
        saveUI(); renderCoverFront(); buildBookFace();
        m.remove(); showSettings('cover'); toast('已套用书皮：' + p.name);
      };
      presetGrid.appendChild(c);
    });
    pc.appendChild(presetGrid);

    pc.appendChild(el('div', 'font-size:12px;color:var(--fm-ink);margin:4px 0 8px;opacity:.8;', '自定义（改动即时生效）'));
    liveInput(pc, '封面标题文字', 'cv-title', ui.cover.title, '足迹地图');
    liveInput(pc, '底部副标题（留空不显示）', 'cv-sub', ui.cover.sub, '以「我的家」为中心 · 足迹珍藏');
    seg(pc, '标题字体', [['pixel', '像素体'], ['serif', '宋体衬线'], ['round', '圆体']], ui.cover.titleFont, function (v) { ui.cover.titleFont = v; saveUI(); renderCoverFront(); buildBookFace(); });
    seg(pc, '标题排版', [['vleft', '竖排偏左'], ['vcenter', '竖排居中'], ['hcenter', '横排居中']], ui.cover.layout, function (v) { ui.cover.layout = v; saveUI(); renderCoverFront(); });
    seg(pc, '标题字色', [['gold', '烫金'], ['silver', '银'], ['rose', '玫瑰金'], ['ink', '墨黑'], ['custom', '自选']], ui.cover.titleColor, function (v) { ui.cover.titleColor = v; saveUI(); renderCoverFront(); });
    if (ui.cover.titleColor === 'custom') liveColor(pc, '自选标题颜色', 'cv-titlecol', ui.cover.titleColorVal);
    seg(pc, '锁样式', [['brass', '铜挂锁'], ['silver', '银锁'], ['pixel', '像素锁'], ['none', '无锁']], ui.cover.lock, function (v) { ui.cover.lock = v; saveUI(); renderCoverFront(); });
    seg(pc, '入口小书大小', [['s', '小巧'], ['m', '标准'], ['l', '大号']], ui.cover.bookSize, function (v) { ui.cover.bookSize = v; saveUI(); buildBookFace(); });
    seg(pc, '封面框线', [['double', '双线'], ['single', '单线'], ['none', '无框']], ui.cover.frame, function (v) { ui.cover.frame = v; saveUI(); renderCoverFront(); });
    liveColor(pc, '框线颜色', 'cv-framecol', ui.cover.frameColor);
    liveColor(pc, '书皮主色（渐变上）', 'cv-c1', ui.cover.c1);
    liveColor(pc, '书皮辅色（渐变下）', 'cv-c2', ui.cover.c2);
    liveInput(pc, '封面贴图 URL（选填，铺满整张书皮）', 'cv-img', ui.cover.coverImg, 'http://127.0.0.1:8000/cover.png');
    body.appendChild(pc);

    // ========== 内页页 ==========
    var pi = el('div');
    pages.inner = pi;
    pi.appendChild(el('div', 'font-size:12px;color:var(--fm-ink);margin-bottom:8px;', '内页主题色（点按即换）'));
    var themeGrid = el('div', 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;');
    Object.keys(THEMES).forEach(function (key) {
      var t = THEMES[key];
      var active = key === ui.theme;
      var c = el('div', 'text-align:center;padding:10px 4px;border-radius:10px;font-size:12px;cursor:pointer;border:2px solid ' +
        (active ? 'var(--fm-ink)' : 'transparent') + ';background:' + t.v.bg + ';color:' + t.v.ink + ';box-sizing:border-box;',
        '<div style="width:22px;height:22px;border-radius:50%;background:' + t.sw + ';margin:0 auto 5px;"></div>' + t.name);
      c.onclick = function () { ui.theme = key; saveUI(); applyUI(); m.remove(); showSettings('inner'); toast('已切换：' + t.name); };
      themeGrid.appendChild(c);
    });
    pi.appendChild(themeGrid);
    seg(pi, '纸张纹理', Object.keys(PAPERS).map(function (k) { return [k, PAPERS[k]]; }), ui.paper, function (v) { ui.paper = v; saveUI(); applyUI(); });
    liveInput(pi, '书页背景图 URL（选填，像素图自动平铺）', 'cv-bg', ui.bgUrl, 'http://127.0.0.1:8000/xxx.png');
    var bgInput = pi.querySelector('#cv-bg');
    bgInput.addEventListener('change', function () { ui.bgUrl = bgInput.value.trim(); saveUI(); applyUI(); });
    body.appendChild(pi);

    // ========== 风格码页 ==========
    var pk = el('div');
    pages.code = pk;
    pk.appendChild(el('div', 'font-size:12px;color:var(--fm-ink);line-height:1.7;margin-bottom:10px;opacity:.85;',
      '风格码包含书皮、内页主题、纸张与背景图配置（不含地点内容）。复制保存，换设备/重装后粘贴导入即可一键还原。'));
    var codeOut = el('textarea', 'width:100%;box-sizing:border-box;height:84px;border-radius:8px;border:2px solid var(--fm-line);background:var(--fm-empty);color:var(--fm-ink);font-size:10px;padding:8px;resize:none;');
    codeOut.value = makeStyleCode();
    codeOut.readOnly = true;
    pk.appendChild(codeOut);
    var copyBtn = el('div', 'text-align:center;padding:10px;border-radius:9px;background:var(--fm-btn);color:var(--fm-btnInk);font-size:13px;cursor:pointer;border:2px solid var(--fm-ink);margin:8px 0 16px;', '复制风格码');
    copyBtn.onclick = function () {
      codeOut.select();
      var ok = false;
      try { ok = D.execCommand('copy'); } catch (e) {}
      toast(ok ? '风格码已复制' : '长按文本框手动复制');
    };
    pk.appendChild(copyBtn);
    var codeIn = el('textarea', 'width:100%;box-sizing:border-box;height:84px;border-radius:8px;border:2px solid var(--fm-line);background:var(--fm-empty);color:var(--fm-ink);font-size:10px;padding:8px;resize:none;placeholder:' + '');
    codeIn.placeholder = '把风格码粘贴到这里…';
    pk.appendChild(codeIn);
    var importBtn = el('div', 'text-align:center;padding:10px;border-radius:9px;background:var(--fm-card);color:var(--fm-ink);font-size:13px;cursor:pointer;border:2px solid var(--fm-ink);margin-top:8px;', '导入风格码');
    importBtn.onclick = function () {
      if (parseStyleCode(codeIn.value.trim())) {
        m.remove(); showSettings('cover'); toast('风格码已导入');
      } else { toast('风格码无效'); }
    };
    pk.appendChild(importBtn);
    body.appendChild(pk);

    // 页签显隐
    pc.style.display = tab === 'cover' ? 'block' : 'none';
    pi.style.display = tab === 'inner' ? 'block' : 'none';
    pk.style.display = tab === 'code' ? 'block' : 'none';

    var done = el('div', 'text-align:center;padding:11px;border-radius:9px;background:var(--fm-btn);color:var(--fm-btnInk);font-size:14px;cursor:pointer;border:2px solid var(--fm-ink);margin-top:14px;', '完成');
    done.onclick = function () {
      readCoverForm();
      var bg = D.getElementById('cv-bg');
      if (bg) ui.bgUrl = bg.value.trim();
      saveUI(); applyUI(); renderCoverFront(); buildBookFace();
      m.remove(); toast('装扮已保存');
    };
    body.appendChild(done);
  }

  /* ---------------- 风格码 ---------------- */
  function makeStyleCode () {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify({
        fm: 1, theme: ui.theme, bgUrl: ui.bgUrl, paper: ui.paper, cover: ui.cover
      }))));
    } catch (e) { return ''; }
  }
  function parseStyleCode (code) {
    try {
      var o = JSON.parse(decodeURIComponent(escape(atob(String(code).trim()))));
      if (!o || typeof o !== 'object') return false;
      if (THEMES[o.theme]) ui.theme = o.theme;
      if (typeof o.bgUrl === 'string') ui.bgUrl = o.bgUrl;
      if (PAPERS[o.paper]) ui.paper = o.paper;
      if (o.cover && typeof o.cover === 'object') {
        Object.keys(DEFAULT_COVER).forEach(function (k) { if (o.cover[k] != null) ui.cover[k] = o.cover[k]; });
      }
      saveUI(); applyUI(); renderCoverFront(); buildBookFace();
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- 轻提示 / 开关 ---------------- */
  var toastTimer = null;
  function toast (txt) {
    var old = D.getElementById('fm-toast');
    if (old) old.remove();
    var t = el('div', COMMON + 'position:fixed;left:50%;bottom:16%;transform:translateX(-50%);' +
      'background:rgba(var(--fm-rgb),.94);color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;white-space:nowrap;z-index:2147483002;pointer-events:none;');
    t.id = 'fm-toast';
    t.textContent = txt;
    MOUNT.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { if (t.parentNode) t.remove(); }, 1800);
  }
  function layoutStage (mode) {
    // mode: 'mini' 小悬浮书 | 'book' 完整闭合书 | 'open' 翻开内页
    if (mode === 'mini') {
      stage.style.width = '56px'; stage.style.maxWidth = '56px';
      stage.style.height = '64px'; stage.style.maxHeight = '64px';
    } else if (mode === 'book') {
      var bw = Math.min(Math.round((W.innerWidth || 360) * 0.64), 280);
      stage.style.width = bw + 'px'; stage.style.maxWidth = bw + 'px';
      stage.style.height = bw + 'px'; stage.style.maxHeight = bw + 'px';
    } else {
      var vw0 = W.innerWidth || D.documentElement.clientWidth || 360;
      var vh0 = W.innerHeight || D.documentElement.clientHeight || 640;
      // open 态严格方形：帧4是 1:1 摊开书，方形舞台才能让帧图铺满、右页纸几何对齐
      var S = Math.min(Math.round(vw0 * 0.97), Math.round(vh0 * 0.82));
      stage.style.width = S + 'px'; stage.style.maxWidth = S + 'px';
      stage.style.height = S + 'px'; stage.style.maxHeight = S + 'px';
    }
  }
  // mini 态定位：优先读上次拖动位置，否则默认右下角
  function placeStage () {
    var vw = W.innerWidth || D.documentElement.clientWidth || 360;
    var vh = W.innerHeight || D.documentElement.clientHeight || 640;
    var sw = 56, sh = 64;
    var x, y;
      try {
      var sx = localStorage.getItem('footmap_mini_x');
      var sy = localStorage.getItem('footmap_mini_y');
      if (sx && sy) { x = parseInt(sx); y = parseInt(sy); }
    } catch (e) {}
    if (x === undefined || isNaN(x)) {
      x = Math.max(2, vw - sw - 12);
      y = Math.max(4, vh - sh - 160);
    }
    x = Math.max(2, Math.min(vw - sw - 2, x));
    y = Math.max(4, Math.min(vh - sh - 4, y));
    stage.style.left = x + 'px';
    stage.style.top = y + 'px';
  }
  // book 态定位：以 mini 态的书中心为基准放大，保证不溢出
  function placeStageBook () {
    var vw = W.innerWidth || D.documentElement.clientWidth || 360;
    var vh = W.innerHeight || D.documentElement.clientHeight || 640;
    var cx = parseInt(stage.style.left) || 0;
    var cy = parseInt(stage.style.top) || 0;
    var centerX = cx + 28, centerY = cy + 32; // mini 书中心
    var nx = Math.max(2, Math.min(vw - 152, centerX - 75));
    var ny = Math.max(4, Math.min(vh - 154, centerY - 75));
    stage.style.left = nx + 'px';
    stage.style.top = ny + 'px';
  }
  // mini → book：小书放大成完整闭合书，居中偏下
  function toBook () {
    state.mini = false;
    state.panelOpen = false;
    clearFrameTimer();
    renderCoverFront();
    primeFrames(); // 趁看闭合大书时把四帧加载解码完，点开不跳帧
    cover.style.pointerEvents = '';
    panel.style.display = 'none';
    paper.style.display = 'none';
    paper.style.opacity = '1';
    clearTimeout(handPaperTimer);
    setOpenCtl(false);
    closePolaroid();
    pagesR.style.display = 'none';
    pagesB.style.display = 'none';
    bookmark.style.display = 'none';
    if (miniBtn) miniBtn.style.display = 'block';
    var bw = Math.min(Math.round((W.innerWidth || 360) * 0.64), 280);
    layoutStage('book');
    var vw = W.innerWidth || 360, vh = W.innerHeight || 640;
    stage.style.left = Math.max(2, Math.round((vw - bw) / 2)) + 'px';
    stage.style.top = Math.max(4, Math.round((vh - bw) / 2 + 30)) + 'px';
    placeZoom('book');
    retainScale();
  }
  // book → mini：缩回小悬浮书
  function toMini () {
    state.mini = true;
    state.panelOpen = false;
    clearFrameTimer();
    renderCoverFront();
    cover.style.pointerEvents = '';
    panel.style.display = 'none';
    paper.style.display = 'none';
    paper.style.opacity = '1';
    clearTimeout(handPaperTimer);
    setOpenCtl(false);
    closePolaroid();
    pagesR.style.display = 'none';
    pagesB.style.display = 'none';
    bookmark.style.display = 'none';
    if (miniBtn) miniBtn.style.display = 'none';
    layoutStage('mini');
    state.scale = 1;
    stage.style.transform = 'scale(1)';
    placeZoom('mini');
    placeStage();
  }
  // 逐帧掀开/合上动画（真实手绘书图片序列）
  var frameTimer = null;
  var handPaperTimer = null;
  var FRAME_STEP = 170; // 每帧停留 ms
  function clearFrameTimer () { if (frameTimer) { clearTimeout(frameTimer); frameTimer = null; } }
  function playFrames (seq, done) {
    clearFrameTimer();
    var i = 0;
    (function step () {
      if (i >= seq.length) { frameTimer = null; if (done) done(); return; }
      setFrame(seq[i]); i++;
      frameTimer = setTimeout(step, FRAME_STEP);
    })();
  }
  function openPanel () {
    if (state.panelOpen) return;
    // 记录 book 态位置，合上时恢复
    state.bookX = stage.style.left;
    state.bookY = stage.style.top;
    state.panelOpen = true;
    state.mini = false;
    state.cur = 0;
    if (miniBtn) miniBtn.style.display = 'none';
    titleBox.innerHTML = '<div style="font-size:17px;letter-spacing:2px;">' + esc(ui.cover.title || '足迹地图') + '</div>' +
      '<div style="font-size:10px;opacity:.85;margin-top:2px;">以「' + esc(CENTER.name) + '」为中心</div>';
    renderBook();
    // 内页与书页装饰先藏起，stage 保持 book 方正尺寸播放逐帧掀开
    panel.style.display = 'none';
    pagesR.style.display = 'none';
    pagesB.style.display = 'none';
    bookmark.style.display = 'none';
    cover.style.pointerEvents = '';
    coverFront.style.pointerEvents = '';
    coverFront.style.opacity = '1';
    setFrame(0);
    // 首次冷启动帧可能还没下载/解码完：先停在闭合书面，就绪后再流畅掀开，避免现场下载解码造成跳帧
    whenFramesReady(function () {
    playFrames([1, 2, 3], function () {
      // 帧3定格：stage 展开为方形 open 尺寸；帧3全开书保持显示，右页纸上层浮现手绘手账
      frameTimer = setTimeout(function () {
        layoutStage('open');
        var vw0 = W.innerWidth || D.documentElement.clientWidth || 360;
        var vh0 = W.innerHeight || D.documentElement.clientHeight || 640;
        var S = Math.min(Math.round(vw0 * 0.97), Math.round(vh0 * 0.82));
        stage.style.left = Math.max(2, Math.round((vw0 - S) / 2)) + 'px';
        stage.style.top = Math.max(4, Math.round((vh0 - S) / 2)) + 'px';
        placeZoom('open');
        retainScale();
        panel.style.display = 'none';
        panel.classList.remove('fm-fadein');
        cover.style.pointerEvents = '';
        coverFront.style.pointerEvents = '';
        coverFront.style.opacity = '1';
        setFrame(3);
        state.bookPage = 0;
        paper.style.opacity = '0';
        paper.style.display = 'block';
        setOpenCtl(true);
        // stage 宽高过渡(.3s)结束、纸层到最终尺寸后再绘制，避免在过渡起点（book 小尺寸）绘制把格子缩成一团
        clearTimeout(handPaperTimer);
        handPaperTimer = setTimeout(function () {
          void paper.offsetWidth;
          renderPaper();
          paper.style.opacity = '1';
        }, 340);
      }, 150);
    });
    });
  }
  function closePanel () {
    if (!state.panelOpen) return;
    state.panelOpen = false;
    if (miniBtn) miniBtn.style.display = 'block';
    // 内页立即藏起，stage 缩回 book 方正尺寸，封面从帧3反向合回帧0
    panel.style.display = 'none';
    panel.classList.remove('fm-fadein');
    paper.style.display = 'none';
    paper.style.opacity = '1';
    clearTimeout(handPaperTimer);
    setOpenCtl(false);
    closePolaroid();
    pagesR.style.display = 'none';
    pagesB.style.display = 'none';
    bookmark.style.display = 'none';
    layoutStage('book');
    if (state.bookX) stage.style.left = state.bookX;
    if (state.bookY) stage.style.top = state.bookY;
    placeZoom('book');
    retainScale();
    cover.style.pointerEvents = '';
    coverFront.style.pointerEvents = '';
    coverFront.style.opacity = '1';
    setFrame(3);
    clearFrameTimer();
    // 先等 stage 缩回 book 方正尺寸并稳定，再反向逐帧合上，与翻开时序对称
    frameTimer = setTimeout(function () { playFrames([2, 1, 0], null); }, 300);
  }

  // 藏掉酒馆助手按钮栏里重复的「足迹地图」胶囊（小书已是唯一入口）
  function hideDupButton () {
    try {
      var nodes = D.getElementsByTagName('div');
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.__fmHidden) continue;
        if (n.closest && (n.closest('#footmap-dock') || n.closest('#fm-stage'))) continue;
        if (n.children.length > 3) continue;
        var t = (n.textContent || '').trim();
        if (t === '足迹地图') {
          n.style.setProperty('display', 'none', 'important');
          n.__fmHidden = 1;
        }
      }
    } catch (e) {}
  }
  function hideOne (n) {
    if (!n || n.nodeType !== 1 || n.__fmHidden) return;
    if (n.closest && (n.closest('#footmap-dock') || n.closest('#fm-stage'))) return;
    if (n.children && n.children.length <= 3 && (n.textContent || '').trim() === '足迹地图') {
      n.style.setProperty('display', 'none', 'important');
      n.__fmHidden = 1;
    }
  }
  hideDupButton();
  // 按钮一插入 DOM 立刻藏（MutationObserver，避免启动/切页时闪一下）
  try {
    var __fmMO = new MutationObserver(function (recs) {
      recs.forEach(function (r) {
        for (var i = 0; i < r.addedNodes.length; i++) {
          var node = r.addedNodes[i];
          if (node.nodeType !== 1) continue;
          hideOne(node);
          if (node.querySelectorAll) {
            var subs = node.querySelectorAll('div');
            for (var j = 0; j < subs.length; j++) hideOne(subs[j]);
          }
        }
      });
    });
    __fmMO.observe(D.body || D.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  // 兜底：先插空 div 后填文本的情况，3 秒扫一次、扫 1 分钟
  var __fmHideTimes = 0;
  var __fmHideTimer = setInterval(function () {
    hideDupButton();
    if (++__fmHideTimes >= 20) clearInterval(__fmHideTimer);
  }, 3000);

  // 酒馆助手按钮事件（名为「足迹地图」的按钮也能翻开小书）
  try {
    if (typeof eventOn === 'function' && typeof getButtonEvent === 'function') {
      ['足迹地图', '地图按钮', '足迹'].forEach(function (nm) {
        try { eventOn(getButtonEvent(nm), openPanel); } catch (e) {}
      });
    }
  } catch (e) {}

  // 清掉上次脚本卸载时残留的 toast（关插件后 DOM 不会自动清）
  try { var __oldToast = D.getElementById('fm-toast'); if (__oldToast) __oldToast.remove(); } catch (e) {}

  buildBookFace();
  renderCoverFront();
  applyUI();
  renderBook();
  // mini 态启动：小书直接悬浮在页面右下角，内页藏起，收纳钮隐藏
  state.mini = true;
  layoutStage('mini');
  placeStage();
  placeZoom('mini');
  panel.style.display = 'none';
  paper.style.display = 'none';
  setOpenCtl(false);
  closePolaroid();
  pagesR.style.display = 'none';
  pagesB.style.display = 'none';
  bookmark.style.display = 'none';
  if (miniBtn) miniBtn.style.display = 'none';
  console.log(LOG + 'v219 已加载：花瓣改挂 fx-layer 与黑莲同层（修复酒馆/移动 WebView 下 body 被 transform 形成层叠上下文导致花瓣被压/错位、黑莲正常却一朵花瓣都看不到）；沿用 v218 低配减量、RAF 自基准、内嵌素材与真实解码诊断；集卡册入口为写意水墨黑莲');
  } // end __footmapMain__

  // 爬到酒馆主窗口（iframe 外），等主页面 DOM 就绪再启动；失败用主窗口弹窗暴露原因
  function __fmTopWin () {
    var w = window;
    for (var i = 0; i < 8 && w.parent && w.parent !== w; i++) {
      try { void w.parent.document; w = w.parent; } catch (e) { break; }
    }
    return w;
  }
  var __fmStarted = false;
  function __fmRun () {
    if (__fmStarted) return;
    __fmStarted = true;
    var TW = __fmTopWin();
    try {
      __footmapMain__();
    } catch (e) {
      __fmStarted = false;
      console.error('[足迹地图] 启动失败：', e);
      try { TW.alert('[足迹地图启动失败] ' + (e && e.message) + '\n' + (e && e.stack)); } catch (_) {}
    }
  }
  (function __fmWait () {
    var TW = __fmTopWin(), TD = TW.document;
    if (TD.readyState === 'loading') {
      TD.addEventListener('DOMContentLoaded', __fmRun);
      TW.addEventListener('load', __fmRun);
      setTimeout(__fmRun, 2500);
    } else {
      __fmRun();
    }
  })();
})();
