import { submitScore, fetchTopScores, isGlobalLeaderboardConfigured } from "./leaderboard.js";

(function(){
  "use strict";

  /* ============================== CONFIG ============================== */

  var CL_PALETTE = ['#ED1C24','#F7941E','#FFDE17','#39B54A','#27AAE1','#92278F'];
  var VB_W = 900, VB_H = 2150;

  var COLOR_META = {
    red:    { hex:'#ED1C24', icon:'🍓', label:'Cherry Red' },
    orange: { hex:'#F7941E', icon:'🍊', label:'Orange Twist' },
    yellow: { hex:'#FFDE17', icon:'🍋', label:'Lemon Drop' },
    green:  { hex:'#39B54A', icon:'🍏', label:'Green Apple' },
    blue:   { hex:'#27AAE1', icon:'🫐', label:'Blueberry' },
    purple: { hex:'#92278F', icon:'🍇', label:'Grape' }
  };
  var COLOR_KEYS = Object.keys(COLOR_META);

  // 34 colored spaces (index 0-33). Index 34 = Candy Castle (finish).
  var BOARD_COLORS = [
    'red','yellow','blue','green','orange','purple','green','red','purple','yellow',
    'blue','orange','yellow','green','red','blue','purple','orange','blue','purple',
    'green','orange','red','yellow','purple','blue','orange','red','yellow','green',
    'orange','red','yellow','green'
  ];
  var NUM_COLOR_SPACES = BOARD_COLORS.length; // 34
  var FINISH_INDEX = NUM_COLOR_SPACES;        // 34
  var TOTAL_POINTS = NUM_COLOR_SPACES + 1;     // 35 sampled points along the path

  var SPECIALS = {
    7:  { type:'skip', icon:'🍫', label:'🍫 Molasses Swamp — stuck! Skip your next turn.' },
    19: { type:'jump', target:24, icon:'🍭', label:'🍭 Gumdrop Pass — zoom ahead!' },
    27: { type:'skip', icon:'🍫', label:'🍫 Sticky Toffee Trap — skip your next turn.' }
  };

  var PLAYER_TEMPLATES = [
    { type:'human', emoji:'🙂', color:'#ff2f92' },
    { type:'ai', emoji:'🤖', color:'#27AAE1', name:'Robo Randy' },
    { type:'ai', emoji:'🦆', color:'#39B54A', name:'Ducky Dana' },
    { type:'ai', emoji:'🎩', color:'#F7941E', name:'Top Hat Theo' }
  ];

  var congratsPool = [
    "🎉 Sweet moves! 🎉", "🍬 Sugar rush! 🍬", "🦆 Rubber duck approves! 🦆",
    "🎩 Nicely played! 🎩", "✨ On to the next candy! ✨", "🍭 Delicious progress! 🍭"
  ];
  var floatEmojis = ['🎉','🦆','🎩','🍬','🍭','🥳','🍫','🍡'];

  /* ============================== STATE ============================== */

  var players = [];
  var turnCount = 0;
  var gameOver = false;
  var activePlayerId = null;
  var spacePoints = [];
  var startPoint = { x:50, y:2 };

  /* ============================== DOM ============================== */

  var titleText = document.getElementById('titleText');
  var decorLayer = document.getElementById('decorLayer');
  var toastStack = document.getElementById('toast-stack');
  var turnCountEl = document.getElementById('turnCount');
  var rulesBtn = document.getElementById('rulesBtn');
  var rulesClose = document.getElementById('rulesClose');
  var rulesOverlay = document.getElementById('rulesOverlay');
  var restartBtn = document.getElementById('restartBtn');

  var spacesLayer = document.getElementById('spacesLayer');
  var tokensLayer = document.getElementById('tokensLayer');

  var playersList = document.getElementById('playersList');
  var cardSlot = document.getElementById('cardSlot');
  var candyCard = document.getElementById('candyCard');
  var drawBtn = document.getElementById('drawBtn');

  var lbMode = document.getElementById('lbMode');
  var leaderboardList = document.getElementById('leaderboardList');
  var refreshLbBtn = document.getElementById('refreshLbBtn');

  var startOverlay = document.getElementById('startOverlay');
  var playerNameInput = document.getElementById('playerNameInput');
  var opponentCount = document.getElementById('opponentCount');
  var startGameBtn = document.getElementById('startGameBtn');

  var endOverlay = document.getElementById('endOverlay');
  var endModalContent = document.getElementById('endModalContent');

  /* ============================== HELPERS ============================== */

  function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function sleep(ms){ return new Promise(function(res){ setTimeout(res, ms); }); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function buildTitle(){
    var text = 'CANDY LAND RACE';
    titleText.innerHTML = '';
    var ci = 0;
    for(var i=0;i<text.length;i++){
      var ch = text[i];
      var span = document.createElement('span');
      span.textContent = ch === ' ' ? ' ' : ch;
      if(ch !== ' '){
        span.style.color = CL_PALETTE[ci % CL_PALETTE.length];
        span.style.textShadow = '2px 2px 0 rgba(0,0,0,0.15)';
        ci++;
      }
      titleText.appendChild(span);
    }
  }

  function seedDecor(){
    for(var i=0;i<12;i++){
      var el = document.createElement('div');
      el.className = 'float-item';
      el.textContent = rand(floatEmojis);
      el.style.left = (Math.random()*94 + 2) + 'vw';
      el.style.top = (Math.random()*90 + 4) + 'vh';
      el.style.animationDuration = (4.5 + Math.random()*3.5) + 's';
      el.style.animationDelay = (Math.random()*4) + 's';
      el.style.fontSize = (1.3 + Math.random()*1.4) + 'rem';
      el.style.opacity = 0.3 + Math.random()*0.35;
      decorLayer.appendChild(el);
    }
  }

  function showToast(msg){
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    toastStack.appendChild(t);
    setTimeout(function(){ t.remove(); }, 3100);
  }

  function burstConfetti(count, opts){
    opts = opts || {};
    var pieces = opts.pieces || ['🍬','🍭','🎉','🎩','🦆','🍫','✨','🍡'];
    for(var i=0;i<count;i++){
      (function(){
        var p = document.createElement('div');
        p.className = 'confetti-piece';
        p.textContent = rand(pieces);
        p.style.left = (Math.random()*100) + 'vw';
        var duration = 2.4 + Math.random()*1.8;
        p.style.animationDuration = duration + 's';
        p.style.fontSize = (1.1 + Math.random()*1.6) + 'rem';
        p.style.animationDelay = (Math.random()*0.4) + 's';
        document.body.appendChild(p);
        setTimeout(function(){ p.remove(); }, (duration+0.5)*1000);
      })();
    }
  }

  function grandConfetti(){
    burstConfetti(60);
    setTimeout(function(){ burstConfetti(50, {pieces:['🎩','🦆','🎉','🥳']}); }, 250);
    setTimeout(function(){ burstConfetti(50, {pieces:['🍬','🍭','🍫','🍡']}); }, 500);
  }

  /* ============================== BOARD ============================== */

  function buildBoard(){
    var pathEl = document.getElementById('boardPath');
    var totalLen = pathEl.getTotalLength();
    spacePoints = [];
    for(var i=0;i<TOTAL_POINTS;i++){
      var d = (totalLen / (TOTAL_POINTS - 1)) * i;
      var pt = pathEl.getPointAtLength(d);
      spacePoints.push({ x: pt.x / VB_W * 100, y: pt.y / VB_H * 100 });
    }
    startPoint = { x: spacePoints[0].x, y: clamp(spacePoints[0].y - 3, 0, 100) };

    spacesLayer.innerHTML = '';
    for(var s=0; s<NUM_COLOR_SPACES; s++){
      var pos = spacePoints[s];
      var color = BOARD_COLORS[s];
      var meta = COLOR_META[color];
      var special = SPECIALS[s];

      var dot = document.createElement('div');
      dot.className = 'space' + (special ? ' special' : '');
      dot.style.left = pos.x + '%';
      dot.style.top = pos.y + '%';
      dot.style.background = 'conic-gradient(' + meta.hex + ' 0deg 90deg, #fff 90deg 180deg, ' + meta.hex + ' 180deg 270deg, #fff 270deg 360deg)';
      dot.title = meta.label + (special ? ' — ' + special.label : '');

      if(special){
        var icon = document.createElement('span');
        icon.className = 'special-icon';
        icon.textContent = special.icon;
        dot.appendChild(icon);
      } else {
        var numEl = document.createElement('span');
        numEl.className = 'space-num';
        numEl.textContent = (s+1);
        dot.appendChild(numEl);
      }
      spacesLayer.appendChild(dot);
    }
  }

  function pointForPos(pos){
    if(pos < 0) return startPoint;
    if(pos >= FINISH_INDEX) return spacePoints[FINISH_INDEX];
    return spacePoints[pos];
  }

  function renderTokens(){
    tokensLayer.innerHTML = '';
    players.forEach(function(p, idx){
      var base = pointForPos(p.pos);
      var offsetIdx = idx - (players.length - 1) / 2;
      var x = clamp(base.x + offsetIdx * 3.4, 2, 98);
      var y = clamp(base.y + (idx % 2 === 0 ? -1.6 : 1.6), 1, 99);

      var tok = document.createElement('div');
      tok.className = 'token' + (p.type === 'human' ? ' you' : '');
      tok.style.left = x + '%';
      tok.style.top = y + '%';
      tok.style.background = p.color;
      tok.textContent = p.emoji;
      tok.title = p.name;
      tokensLayer.appendChild(tok);
    });
  }

  /* ============================== PLAYERS PANEL ============================== */

  function renderPlayers(){
    playersList.innerHTML = '';
    players.forEach(function(p){
      var row = document.createElement('div');
      row.className = 'player-row' + (p.id === activePlayerId ? ' active-turn' : '') + (p.finished ? ' finished' : '');

      var avatar = document.createElement('div');
      avatar.className = 'player-avatar';
      avatar.style.background = p.color;
      avatar.textContent = p.emoji;

      var info = document.createElement('div');
      info.className = 'player-info';
      var nameEl = document.createElement('div');
      nameEl.className = 'player-name';
      nameEl.textContent = p.name + (p.type === 'human' ? ' (You)' : '');
      var statusEl = document.createElement('div');
      statusEl.className = 'player-status';
      if(p.finished){
        statusEl.textContent = '🏰 Reached the castle!';
      } else if(p.skipNext){
        statusEl.textContent = '🍫 Skipping next turn';
      } else {
        var posLabel = p.pos < 0 ? 'Start' : ('Space ' + (p.pos+1) + ' / ' + NUM_COLOR_SPACES);
        statusEl.textContent = posLabel;
      }
      info.appendChild(nameEl);
      info.appendChild(statusEl);

      row.appendChild(avatar);
      row.appendChild(info);

      if(p.type === 'human'){
        var rank = document.createElement('div');
        rank.className = 'player-rank';
        rank.textContent = 'T' + turnCount;
        row.appendChild(rank);
      }

      playersList.appendChild(row);
    });
  }

  /* ============================== CARD DRAW ============================== */

  function drawColor(){ return rand(COLOR_KEYS); }

  function showCard(color){
    var meta = COLOR_META[color];
    candyCard.style.background = 'linear-gradient(160deg, ' + meta.hex + ', ' + meta.hex + 'cc)';
    candyCard.innerHTML = '<span>' + meta.icon + '</span>';
    candyCard.classList.remove('flip');
    void candyCard.offsetWidth; // restart animation
    candyCard.classList.add('flip');
  }

  /* ============================== GAME ENGINE ============================== */

  function findNextIndex(pos, color){
    for(var i=pos+1; i<NUM_COLOR_SPACES; i++){
      if(BOARD_COLORS[i] === color) return i;
    }
    return FINISH_INDEX;
  }

  async function doTurn(player){
    activePlayerId = player.id;
    renderPlayers();

    var color = drawColor();
    showCard(color);
    showToast((player.type === 'human' ? 'You' : player.name) + ' drew ' + COLOR_META[color].icon + ' ' + COLOR_META[color].label + '!');
    await sleep(550);

    var target = findNextIndex(player.pos, color);
    player.pos = target;
    renderPlayers();
    renderTokens();
    await sleep(600);

    if(player.pos >= FINISH_INDEX){
      player.finished = true;
      await sleep(200);
      endGame(player);
      return;
    }

    var special = SPECIALS[player.pos];
    if(special){
      showToast((player.type === 'human' ? 'You' : player.name) + ': ' + special.label);
      if(special.type === 'skip'){
        player.skipNext = true;
        renderPlayers();
      } else if(special.type === 'jump'){
        await sleep(500);
        player.pos = special.target;
        renderTokens();
        renderPlayers();
        await sleep(550);
        if(player.pos >= FINISH_INDEX){
          player.finished = true;
          await sleep(200);
          endGame(player);
          return;
        }
      }
    }

    activePlayerId = null;
  }

  async function onHumanDraw(){
    if(gameOver) return;
    drawBtn.disabled = true;
    var human = players[0];

    if(human.skipNext){
      human.skipNext = false;
      activePlayerId = human.id;
      renderPlayers();
      showToast('🍫 You are stuck in Molasses Swamp — turn skipped!');
      await sleep(700);
      activePlayerId = null;
      renderPlayers();
      await runAiTurns();
      return;
    }

    turnCount++;
    turnCountEl.textContent = turnCount;
    await doTurn(human);
    if(gameOver) return;
    await runAiTurns();
  }

  async function runAiTurns(){
    for(var i=1;i<players.length;i++){
      if(gameOver) break;
      var ai = players[i];
      await sleep(500);
      if(ai.skipNext){
        ai.skipNext = false;
        activePlayerId = ai.id;
        renderPlayers();
        showToast('🍫 ' + ai.name + ' is stuck in Molasses Swamp — turn skipped!');
        await sleep(700);
        activePlayerId = null;
        renderPlayers();
        continue;
      }
      await doTurn(ai);
    }
    if(!gameOver){
      activePlayerId = null;
      renderPlayers();
      drawBtn.disabled = false;
    }
  }

  drawBtn.addEventListener('click', onHumanDraw);

  /* ============================== GAME LIFECYCLE ============================== */

  function newGame(){
    var name = (playerNameInput.value || 'Player').trim().slice(0,18) || 'Player';
    var numOpponents = parseInt(opponentCount.value, 10) || 2;

    players = [];
    for(var i=0; i<=numOpponents; i++){
      var tmpl = PLAYER_TEMPLATES[i];
      players.push({
        id: 'p' + i,
        type: tmpl.type,
        name: tmpl.type === 'human' ? name : tmpl.name,
        emoji: tmpl.emoji,
        color: tmpl.color,
        pos: -1,
        skipNext: false,
        finished: false
      });
    }

    turnCount = 0;
    gameOver = false;
    activePlayerId = null;
    turnCountEl.textContent = turnCount;
    drawBtn.disabled = false;
    candyCard.innerHTML = '<span class="card-face-back">🍬</span>';
    candyCard.style.background = 'linear-gradient(160deg, var(--pink), var(--hot-pink))';

    renderPlayers();
    renderTokens();
    closeOverlay(startOverlay);
    closeOverlay(endOverlay);
    showToast('🎉 Race started! Tap Draw Card to go! 🎉');
  }

  async function endGame(winner){
    gameOver = true;
    drawBtn.disabled = true;
    activePlayerId = null;
    renderPlayers();
    grandConfetti();

    if(winner.type === 'human'){
      endModalContent.innerHTML =
        '<div class="finale-emoji">🏰🎉🍬</div>' +
        '<h2>You reached Candy Castle!</h2>' +
        '<p class="modal-copy">You made it in <b>' + turnCount + ' turn' + (turnCount === 1 ? '' : 's') + '</b>. Fewer turns is better — want to add your score to the leaderboard?</p>' +
        '<div id="lbChoiceWrap">' +
          '<label class="field-label" for="lbNameInput">Leaderboard name</label>' +
          '<input type="text" id="lbNameInput" class="text-input" maxlength="18" value="' + escapeHtml(winner.name) + '">' +
          '<button class="btn btn-submit" id="submitScoreBtn">💾 Yes, Save My Score</button>' +
          '<button class="btn btn-skip" id="skipScoreBtn">🙅 No Thanks</button>' +
        '</div>' +
        '<div class="modal-section" id="lbResultMsg"></div>' +
        '<button class="btn btn-next" id="playAgainBtn" style="display:none;">🔄 Play Again</button>';

      var choiceWrap = document.getElementById('lbChoiceWrap');
      var resultMsg = document.getElementById('lbResultMsg');
      var playAgainBtn = document.getElementById('playAgainBtn');

      document.getElementById('submitScoreBtn').addEventListener('click', async function(){
        var btn = this;
        var skipBtn = document.getElementById('skipScoreBtn');
        btn.disabled = true;
        skipBtn.disabled = true;
        btn.textContent = 'Saving…';
        var nameToSave = document.getElementById('lbNameInput').value || winner.name;
        var result = await submitScore(nameToSave, turnCount, players.length - 1);
        choiceWrap.style.display = 'none';
        resultMsg.innerHTML = result.mode === 'global'
          ? '✅ Saved to the global leaderboard!'
          : '✅ Saved on this device!';
        resultMsg.classList.add('show');
        playAgainBtn.style.display = 'block';
        await loadLeaderboard();
      });

      document.getElementById('skipScoreBtn').addEventListener('click', function(){
        choiceWrap.style.display = 'none';
        resultMsg.innerHTML = 'No problem — your score wasn\'t saved.';
        resultMsg.classList.add('show');
        playAgainBtn.style.display = 'block';
      });

      playAgainBtn.addEventListener('click', function(){
        openOverlay(startOverlay);
      });
    } else {
      endModalContent.innerHTML =
        '<div class="finale-emoji">😢🍬</div>' +
        '<h2>' + escapeHtml(winner.name) + ' won the race!</h2>' +
        '<p class="modal-copy">They reached Candy Castle first. You were on turn ' + turnCount + '. Only the human racer\'s wins count on the leaderboard — give it another go!</p>' +
        '<button class="btn btn-next" id="playAgainBtn">🔄 Try Again</button>';
      document.getElementById('playAgainBtn').addEventListener('click', function(){
        openOverlay(startOverlay);
      });
    }

    openOverlay(endOverlay);
  }

  function escapeHtml(str){
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ============================== OVERLAYS ============================== */

  function openOverlay(el){ el.classList.add('open'); }
  function closeOverlay(el){ el.classList.remove('open'); }

  startGameBtn.addEventListener('click', newGame);
  restartBtn.addEventListener('click', function(){
    gameOver = true;
    openOverlay(startOverlay);
  });
  rulesBtn.addEventListener('click', function(){ openOverlay(rulesOverlay); });
  rulesClose.addEventListener('click', function(){ closeOverlay(rulesOverlay); });
  rulesOverlay.addEventListener('click', function(e){ if(e.target === rulesOverlay) closeOverlay(rulesOverlay); });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){ closeOverlay(rulesOverlay); }
  });

  /* ============================== LEADERBOARD ============================== */

  async function loadLeaderboard(){
    leaderboardList.innerHTML = '<li class="lb-empty">Loading…</li>';
    try{
      var result = await fetchTopScores(10);
      lbMode.textContent = result.mode === 'global' ? '🌐 Global' : '💻 This device';
      if(!result.scores.length){
        leaderboardList.innerHTML = '<li class="lb-empty">No races finished yet — be the first! 🏰</li>';
        return;
      }
      leaderboardList.innerHTML = '';
      result.scores.forEach(function(s, i){
        var li = document.createElement('li');
        li.innerHTML =
          '<span class="lb-rank">#' + (i+1) + '</span>' +
          '<span class="lb-name">' + escapeHtml(s.name || 'Player') + '</span>' +
          '<span class="lb-turns">' + s.turns + ' turn' + (s.turns === 1 ? '' : 's') + '</span>';
        leaderboardList.appendChild(li);
      });
    }catch(err){
      console.error('[game] failed to load leaderboard', err);
      leaderboardList.innerHTML = '<li class="lb-empty">Couldn\'t load leaderboard.</li>';
    }
  }

  refreshLbBtn.addEventListener('click', loadLeaderboard);

  /* ============================== INIT ============================== */

  function init(){
    buildTitle();
    seedDecor();
    buildBoard();
    renderPlayers();
    renderTokens();
    lbMode.textContent = isGlobalLeaderboardConfigured() ? '🌐 Global' : '💻 This device';
    loadLeaderboard();
    openOverlay(startOverlay);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
