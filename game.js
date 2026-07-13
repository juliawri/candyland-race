import { submitScore, fetchTopScores, isGlobalLeaderboardConfigured } from "./leaderboard.js";

(function(){
  "use strict";

  /* ============================== CONFIG ============================== */

  var CL_PALETTE = ['#ED1C24','#F7941E','#FFDE17','#39B54A','#27AAE1','#92278F'];
  var VB_W = 900, VB_H = 2150;

  var COLOR_META = {
    red:    { hex:'#ED1C24' },
    orange: { hex:'#F7941E' },
    yellow: { hex:'#FFDE17' },
    green:  { hex:'#39B54A' },
    blue:   { hex:'#27AAE1' },
    purple: { hex:'#92278F' }
  };

  // 20 colored spaces (index 0-19, purely decorative). Index 20 = Candy Castle (finish).
  var BOARD_COLORS = [
    'red','yellow','blue','green','orange','purple','green','red','purple','yellow',
    'blue','orange','yellow','green','red','blue','purple','orange','blue','purple'
  ];
  var NUM_COLOR_SPACES = BOARD_COLORS.length; // 20
  var FINISH_INDEX = NUM_COLOR_SPACES;        // 20
  var TOTAL_POINTS = NUM_COLOR_SPACES + 1;     // 21 sampled points along the path

  var EMOJI_CHOICES = ['🤗','🦄','🐯','🦊','🐸','🐼','🐵','🚀','🥳','🤖','👑','🧙','🥷','👽','🍭','⭐'];

  var floatEmojis = ['🎉','🦆','🎩','🍬','🍭','🥳','🍫','🍡'];

  /* ============================== TRIVIA QUESTIONS ============================== */

  var QUESTIONS = [
    { q:'Which candy\'s slogan is "Taste the Rainbow"?', options:['Starburst','Skittles','Nerds','Airheads'], answer:'Skittles' },
    { q:'Which candy comes in flavors like Watermelon, Blue Raspberry, and Green Apple?', options:['Nerds Rope','Jolly Ranchers','Twizzlers','Tootsie Rolls'], answer:'Jolly Ranchers' },
    { q:'Which candy bar contains nougat, caramel, and peanuts?', options:['Snickers','Crunch','Kit Kat',"York Peppermint Patty"], answer:'Snickers' },
    { q:'What gives Pop Rocks their popping effect?', options:['Baking soda','Tiny bubbles of carbon dioxide trapped inside','Electricity','Air'], answer:'Tiny bubbles of carbon dioxide trapped inside' },
    { q:'Which candy was originally invented as cough drops?', options:['Life Savers','Jelly Beans',"Hershey's",'PEZ'], answer:'PEZ' },
    { q:'What color M&M was added in 1995 after a public vote?', options:['Purple','Blue','Pink','Orange'], answer:'Blue' },
    { q:'What is the main ingredient that makes cotton candy fluffy?', options:['Flour','Melted sugar spun into thin threads','Marshmallow','Cornstarch'], answer:'Melted sugar spun into thin threads' },
    { q:'What does "LOL" stand for?', options:['Lots of Love','Laugh Out Loud','Love of Life','Long Online Laugh'], answer:'Laugh Out Loud' },
    { q:'Which game features Creepers?', options:['Roblox','Minecraft','Terraria','Fortnite'], answer:'Minecraft' },
    { q:"Mario's brother is:", options:['Wario','Luigi','Yoshi','Toad'], answer:'Luigi' },
    { q:'Which planet is called the Red Planet?', options:['Venus','Mars','Jupiter','Mercury'], answer:'Mars' },
    { q:'Which animal is the largest on Earth?', options:['Elephant','Blue whale','Giraffe','Shark'], answer:'Blue whale' },
    { q:'How many bones does an adult human have?', options:['106','206','306','406'], answer:'206' },
    { q:'What is the fastest land animal?', options:['Lion','Cheetah','Horse','Greyhound'], answer:'Cheetah' },
    { q:'Which planet is the largest?', options:['Saturn','Jupiter','Neptune','Earth'], answer:'Jupiter' },
    { q:'What is H₂O?', options:['Salt','Water','Oxygen','Hydrogen'], answer:'Water' },
    { q:'Bees mainly collect:', options:['Honey','Nectar','Sugar','Water'], answer:'Nectar' },
    { q:'Which organ pumps blood?', options:['Brain','Heart','Liver','Lungs'], answer:'Heart' },
    { q:'What is the capital of Japan?', options:['Osaka','Kyoto','Tokyo','Seoul'], answer:'Tokyo' },
    { q:'Which ocean is the largest?', options:['Atlantic','Indian','Pacific','Arctic'], answer:'Pacific' },
    { q:'Which country is famous for kangaroos?', options:['New Zealand','Australia','South Africa','Brazil'], answer:'Australia' },
    { q:'Which country has the shape of a boot?', options:['Spain','Italy','Greece','Portugal'], answer:'Italy' },
    { q:'Which U.S. state is known as the Sunshine State?', options:['California','Florida','Hawaii','Texas'], answer:'Florida' },
    { q:'CPU stands for:', options:['Central Processing Unit','Computer Power Utility','Core Program Unit','Central Program Utility'], answer:'Central Processing Unit' },
    { q:'What does USB stand for?', options:['Universal Serial Bus','United System Board','Universal Service Battery','User Storage Box'], answer:'Universal Serial Bus' },
    { q:'Which mammal lays eggs?', options:['Kangaroo','Platypus','Koala','Panda'], answer:'Platypus' },
    { q:'Dolphins are:', options:['Fish','Mammals','Reptiles','Amphibians'], answer:'Mammals' },
    { q:'What gives chili peppers their heat?', options:['Pepper oil','Capsaicin','Chlorophyll','Vitamin C'], answer:'Capsaicin' },
    { q:'Which fruit is known for having potassium?', options:['Banana','Apple','Cherry','Grape'], answer:'Banana' },
    { q:'Tofu is made from:', options:['Wheat','Soybeans','Rice','Potatoes'], answer:'Soybeans' },
    { q:'Which sport uses a shuttlecock?', options:['Tennis','Badminton','Volleyball','Squash'], answer:'Badminton' },
    { q:'In basketball, how many points is a free throw worth?', options:['1','2','3','4'], answer:'1' },
    { q:'Which sport has a Wimbledon championship?', options:['Golf','Tennis','Cricket','Baseball'], answer:'Tennis' },
    { q:'Which country invented basketball?', options:['Canada','United States','England','France'], answer:'United States' },
    { q:'Which sport uses a pommel horse?', options:['Gymnastics','Figure skating','Diving','Wrestling'], answer:'Gymnastics' },
    { q:'How many colors are in a rainbow?', options:['5','6','7','8'], answer:'7' },
    { q:'Which side of a boat is starboard?', options:['Left','Right','Front','Back'], answer:'Right' },
    { q:'Which planet has the shortest day?', options:['Mercury','Jupiter','Earth','Mars'], answer:'Jupiter' },
    { q:'Which fruit floats in water?', options:['Apple','Peach','Mango','Banana'], answer:'Apple' },
    { q:"Which color is NOT on a standard Rubik's Cube?", options:['Purple','Blue','White','Green'], answer:'Purple' },
    { q:'Which planet has the most moons (currently known)?', options:['Jupiter','Saturn','Earth','Neptune'], answer:'Saturn' },
    { q:'Which common pet can rotate its ears about 180 degrees?', options:['Dog','Cat','Hamster','Rabbit'], answer:'Cat' },
    { q:'Which natural phenomenon causes the Northern Lights?', options:['Volcanoes',"Charged particles from the Sun interacting with Earth's atmosphere",'Moonlight','Lightning'], answer:"Charged particles from the Sun interacting with Earth's atmosphere" },
    { q:'Which language has the most native speakers?', options:['English','Mandarin Chinese','Spanish','Hindi'], answer:'Mandarin Chinese' },
    { q:'Which country is home to Machu Picchu?', options:['Chile','Peru','Argentina','Bolivia'], answer:'Peru' },
    { q:'Which famous ship hit an iceberg in 1912?', options:['Lusitania','Titanic','Britannic','Queen Mary'], answer:'Titanic' },
    { q:'Which blood type is known as the universal donor?', options:['A+','O-','AB+','B-'], answer:'O-' },
    { q:'Which instrument measures earthquakes?', options:['Thermometer','Seismograph','Barometer','Hygrometer'], answer:'Seismograph' },
    { q:'Which country has the most time zones?', options:['Russia','United States','France','Canada'], answer:'France' },
    { q:'Which of these is the only mammal capable of sustained true flight?', options:['Flying squirrel','Bat','Penguin','Ostrich'], answer:'Bat' },
    { q:"What is the name of Earth's natural satellite?", options:['Titan','Europa','The Moon','Luna II'], answer:'The Moon' },
    { q:'Which planet is famous for its Great Red Spot?', options:['Saturn','Jupiter','Mercury','Venus'], answer:'Jupiter' },
    { q:'Which family does the trumpet belong to?', options:['Strings','Brass','Woodwind','Percussion'], answer:'Brass' },
    { q:'Which is a palindrome?', options:['Banana','Level','Orange','Window'], answer:'Level' },
    { q:'Falafel is primarily made from:', options:['Potatoes','Chickpeas','Rice','Cheese'], answer:'Chickpeas' },
    { q:'Kimchi is a traditional food from:', options:['Japan','South Korea','China','Thailand'], answer:'South Korea' },
    { q:'Which spice makes turmeric yellow?', options:['Saffron','Curcumin','Paprika','Cinnamon'], answer:'Curcumin' },
    { q:'Which tree is famous for producing acorns?', options:['Pine','Oak','Maple','Birch'], answer:'Oak' },
    { q:'Which cloud type is most associated with thunderstorms?', options:['Cirrus','Cumulonimbus','Stratus','Altocumulus'], answer:'Cumulonimbus' },
    { q:'Which is the tallest type of grass?', options:['Wheat','Bamboo','Corn','Rice'], answer:'Bamboo' },
    { q:'Which animal has fingerprints almost identical to humans?', options:['Gorilla','Koala','Panda','Lemur'], answer:'Koala' },
    { q:'Which animal can regenerate a lost arm?', options:['Starfish','Shark','Whale','Eagle'], answer:'Starfish' },
    { q:'Which mammal is capable of echolocation?', options:['Bat','Horse','Elephant','Bear'], answer:'Bat' },
    { q:'Which sea creature has three hearts?', options:['Jellyfish','Octopus','Lobster','Dolphin'], answer:'Octopus' },
    { q:'In Minecraft, which material is needed to make an enchanting table?', options:['Gold','Obsidian','Iron','Copper'], answer:'Obsidian' },
    { q:'How many degrees are in a right angle?', options:['45','90','180','360'], answer:'90' },
    { q:'What is π closest to?', options:['2.14','3.14','4.14','5.14'], answer:'3.14' },
    { q:'Which number is prime?', options:['39','41','42','45'], answer:'41' },
    { q:'Who owns Buzz Lightyear in Toy Story?', options:['Sid','Andy','Woody','Bonnie'], answer:'Andy' },
    { q:'Which Disney princess has a pet tiger?', options:['Ariel','Jasmine','Belle','Rapunzel'], answer:'Jasmine' },
    { q:'Which weighs more?', options:['1 kg of feathers','1 kg of bricks','They weigh the same','Depends'], answer:'They weigh the same' },
    { q:'Which country hosted the 2024 Summer Olympics?', options:['Japan','France','Brazil','Australia'], answer:'France' },
    { q:'Which Olympic sport takes place on ice with sweeping?', options:['Curling','Figure skating','Hockey','Speed skating'], answer:'Curling' },
    { q:'Which metal is liquid at room temperature?', options:['Iron','Mercury','Copper','Aluminum'], answer:'Mercury' },
    { q:'Which vitamin is produced when your skin is exposed to sunlight?', options:['Vitamin C','Vitamin D','Vitamin A','Vitamin K'], answer:'Vitamin D' },
    { q:'Which blood cells help fight infection?', options:['Red blood cells','White blood cells','Platelets','Plasma'], answer:'White blood cells' },
    { q:'Lightning is:', options:['Frozen rain','Electricity','Fire','Wind'], answer:'Electricity' },
    { q:'Which country has the most people?', options:['India','China','USA','Indonesia'], answer:'India' },
    { q:'Which river flows through London, United Kingdom?', options:['Seine','Thames','Rhine','Danube'], answer:'Thames' },
    { q:'Which continent has the fewest people?', options:['Antarctica','Australia','Europe','Africa'], answer:'Antarctica' },
    { q:'Who wrote Charlie and the Chocolate Factory?', options:['J.K. Rowling','Roald Dahl','Rick Riordan','Suzanne Collins'], answer:'Roald Dahl' },
    { q:'Percy Jackson is the son of:', options:['Zeus','Poseidon','Ares','Hermes'], answer:'Poseidon' },
    { q:'Sherlock Holmes is famous for being a:', options:['Doctor','Detective','Pirate','Teacher'], answer:'Detective' },
    { q:'Which bird can fly backwards?', options:['Hummingbird','Eagle','Crow','Robin'], answer:'Hummingbird' },
    { q:'Which continent has the most countries?', options:['Europe','Africa','Asia','South America'], answer:'Africa' },
    { q:"Which is the world's largest island (excluding continents)?", options:['Greenland','Madagascar','Borneo','Iceland'], answer:'Greenland' },
    { q:'Which card suit is black?', options:['Hearts','Diamonds','Clubs','Hearts and Diamonds'], answer:'Clubs' },
    { q:'How many sides does a cube have?', options:['4','6','8','12'], answer:'6' },
    { q:'Which famous tower is in Paris?', options:['Leaning Tower','Eiffel Tower','CN Tower','Big Ben'], answer:'Eiffel Tower' },
    { q:'Which country is famous for tulips?', options:['Netherlands','Brazil','Peru','India'], answer:'Netherlands' },
    { q:'Which color is opposite red on a standard color wheel?', options:['Green','Blue','Yellow','Purple'], answer:'Green' },
    { q:'What does URL stand for?', options:['Universal Resource Locator','Uniform Resource Locator','Universal Routing Link','Uniform Redirect Link'], answer:'Uniform Resource Locator' },
    { q:'What is Git used for?', options:['Video editing','Tracking changes in code','Playing games','Creating slideshow'], answer:'Tracking changes in code' },
    { q:'What is an algorithm?', options:['A computer part','A step-by-step process for solving a problem','A programming language','A website'], answer:'A step-by-step process for solving a problem' },
    { q:'Which company created the search engine Google?', options:['Apple','Google','Meta','Amazon'], answer:'Google' }
  ];

  /* ============================== STATE ============================== */

  var player = null;
  var turnCount = 0;
  var gameOver = false;
  var spacePoints = [];
  var startPoint = { x:50, y:2 };
  var chosenEmoji = EMOJI_CHOICES[0];

  var questionPool = [];
  var questionPtr = 0;
  var currentQuestion = null;
  var answered = false;

  var startTime = 0;
  var timerHandle = null;

  /* ============================== DOM ============================== */

  var titleText = document.getElementById('titleText');
  var decorLayer = document.getElementById('decorLayer');
  var toastStack = document.getElementById('toast-stack');
  var turnCountEl = document.getElementById('turnCount');
  var timerCountEl = document.getElementById('timerCount');
  var rulesBtn = document.getElementById('rulesBtn');
  var rulesClose = document.getElementById('rulesClose');
  var rulesOverlay = document.getElementById('rulesOverlay');
  var restartBtn = document.getElementById('restartBtn');

  var spacesLayer = document.getElementById('spacesLayer');
  var tokensLayer = document.getElementById('tokensLayer');

  var playersList = document.getElementById('playersList');
  var questionText = document.getElementById('questionText');
  var optionsGrid = document.getElementById('optionsGrid');
  var feedbackMsg = document.getElementById('feedbackMsg');
  var triviaOverlay = document.getElementById('triviaOverlay');
  var triviaModal = document.getElementById('triviaModal');

  var lbMode = document.getElementById('lbMode');
  var leaderboardList = document.getElementById('leaderboardList');
  var refreshLbBtn = document.getElementById('refreshLbBtn');

  var startOverlay = document.getElementById('startOverlay');
  var playerNameInput = document.getElementById('playerNameInput');
  var emojiGrid = document.getElementById('emojiGrid');
  var startGameBtn = document.getElementById('startGameBtn');

  var endOverlay = document.getElementById('endOverlay');
  var endModalContent = document.getElementById('endModalContent');

  /* ============================== HELPERS ============================== */

  function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function sleep(ms){ return new Promise(function(res){ setTimeout(res, ms); }); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function shuffle(arr){
    var a = arr.slice();
    for(var i=a.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function formatTime(seconds){
    var s = Math.max(0, Math.round(seconds));
    var m = Math.floor(s/60);
    var r = s%60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function buildTitle(){
    var text = 'CANDY LAND RACE';
    titleText.innerHTML = '';
    var ci = 0;
    for(var i=0;i<text.length;i++){
      var ch = text[i];
      var span = document.createElement('span');
      span.textContent = ch === ' ' ? ' ' : ch;
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

      var dot = document.createElement('div');
      dot.className = 'space';
      dot.style.left = pos.x + '%';
      dot.style.top = pos.y + '%';
      dot.style.background = 'conic-gradient(' + meta.hex + ' 0deg 90deg, #fff 90deg 180deg, ' + meta.hex + ' 180deg 270deg, #fff 270deg 360deg)';

      var numEl = document.createElement('span');
      numEl.className = 'space-num';
      numEl.textContent = (s+1);
      dot.appendChild(numEl);
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
    if(!player) return;
    var pos = pointForPos(player.pos);

    var tok = document.createElement('div');
    tok.className = 'token you';
    tok.style.left = pos.x + '%';
    tok.style.top = pos.y + '%';
    tok.style.background = player.color;
    tok.textContent = player.emoji;
    tok.title = player.name;
    tokensLayer.appendChild(tok);
  }

  /* ============================== PLAYERS PANEL ============================== */

  function renderPlayers(){
    playersList.innerHTML = '';
    if(!player) return;

    var row = document.createElement('div');
    row.className = 'player-row active-turn' + (player.finished ? ' finished' : '');

    var avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    avatar.style.background = player.color;
    avatar.textContent = player.emoji;

    var info = document.createElement('div');
    info.className = 'player-info';
    var nameEl = document.createElement('div');
    nameEl.className = 'player-name';
    nameEl.textContent = player.name;
    var statusEl = document.createElement('div');
    statusEl.className = 'player-status';
    if(player.finished){
      statusEl.textContent = '🏰 Reached the castle!';
    } else {
      var posLabel = player.pos < 0 ? 'Start' : ('Space ' + (player.pos+1) + ' / ' + NUM_COLOR_SPACES);
      statusEl.textContent = posLabel;
    }
    info.appendChild(nameEl);
    info.appendChild(statusEl);

    row.appendChild(avatar);
    row.appendChild(info);

    var rank = document.createElement('div');
    rank.className = 'player-rank';
    rank.textContent = 'Q' + turnCount;
    row.appendChild(rank);

    playersList.appendChild(row);
  }

  /* ============================== TIMER ============================== */

  function startTimer(){
    stopTimer();
    startTime = Date.now();
    timerCountEl.textContent = '0:00';
    timerHandle = setInterval(function(){
      timerCountEl.textContent = formatTime((Date.now() - startTime) / 1000);
    }, 500);
  }

  function stopTimer(){
    if(timerHandle){ clearInterval(timerHandle); timerHandle = null; }
  }

  function elapsedSeconds(){
    return (Date.now() - startTime) / 1000;
  }

  /* ============================== TRIVIA ENGINE ============================== */

  var OPTION_LETTERS = ['A','B','C','D'];

  function buildQuestionPool(){
    questionPool = shuffle(QUESTIONS);
    questionPtr = 0;
  }

  function loadNextQuestion(){
    if(questionPtr >= questionPool.length){
      endGame(false, 'outOfQuestions');
      return;
    }
    currentQuestion = questionPool[questionPtr++];
    answered = false;
    renderQuestion(currentQuestion);
  }

  function renderQuestion(q){
    questionText.textContent = q.q;
    feedbackMsg.textContent = '';
    feedbackMsg.className = 'feedback-msg';

    var displayOptions = shuffle(q.options);
    optionsGrid.innerHTML = '';
    displayOptions.forEach(function(optionText, idx){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.innerHTML = '<span class="option-letter">' + OPTION_LETTERS[idx] + '</span><span class="option-text">' + escapeHtml(optionText) + '</span>';
      btn.addEventListener('click', function(){ onAnswer(optionText, q.answer); });
      optionsGrid.appendChild(btn);
    });
  }

  function lockOptions(selectedText, correctText){
    var buttons = optionsGrid.querySelectorAll('.option-btn');
    buttons.forEach(function(btn){
      btn.disabled = true;
      var text = btn.querySelector('.option-text').textContent;
      if(text === correctText){
        btn.classList.add('correct');
      } else if(text === selectedText){
        btn.classList.add('wrong');
      }
    });
  }

  function celebrateCorrect(){
    triviaModal.classList.remove('flash-wrong');
    triviaModal.classList.add('flash-correct');
    setTimeout(function(){ triviaModal.classList.remove('flash-correct'); }, 700);
    burstConfetti(22, {pieces:['🎉','✨','🍬','⭐','🍭']});
  }

  function shakeWrong(){
    triviaModal.classList.remove('flash-correct');
    triviaModal.classList.add('flash-wrong');
    setTimeout(function(){ triviaModal.classList.remove('flash-wrong'); }, 500);
  }

  async function onAnswer(selectedText, correctText){
    if(answered || gameOver) return;
    answered = true;

    var correct = selectedText === correctText;
    lockOptions(selectedText, correctText);

    turnCount++;
    turnCountEl.textContent = turnCount;

    if(correct){
      player.pos = clamp(player.pos + 1, -1, FINISH_INDEX);
      feedbackMsg.textContent = '✅ Correct! Moving forward a spot.';
      feedbackMsg.classList.add('good');
      showToast('✅ Correct!');
      celebrateCorrect();
    } else {
      player.pos = clamp(player.pos - 1, -1, FINISH_INDEX);
      feedbackMsg.textContent = '❌ Not quite — the answer was "' + correctText + '". Sliding back a spot.';
      feedbackMsg.classList.add('bad');
      showToast('❌ Wrong — back a spot!');
      shakeWrong();
    }

    await sleep(900);

    closeOverlay(triviaOverlay);
    renderTokens();
    renderPlayers();

    await sleep(750);

    if(player.pos >= FINISH_INDEX){
      player.finished = true;
      await sleep(200);
      endGame(true, 'won');
      return;
    }

    if(questionPtr >= questionPool.length){
      await sleep(200);
      endGame(false, 'outOfQuestions');
      return;
    }

    loadNextQuestion();
    openOverlay(triviaOverlay);
  }

  function escapeHtml(str){
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ============================== SCORING ============================== */

  function computeScore(turns, seconds){
    return Math.max(0, Math.round(10000 - turns*80 - seconds*15));
  }

  /* ============================== EMOJI PICKER ============================== */

  function buildEmojiPicker(){
    emojiGrid.innerHTML = '';
    EMOJI_CHOICES.forEach(function(emoji, idx){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-btn' + (idx === 0 ? ' selected' : '');
      btn.textContent = emoji;
      btn.addEventListener('click', function(){
        chosenEmoji = emoji;
        emojiGrid.querySelectorAll('.emoji-btn').forEach(function(b){ b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
      emojiGrid.appendChild(btn);
    });
  }

  /* ============================== GAME LIFECYCLE ============================== */

  function newGame(){
    var name = (playerNameInput.value || 'Player').trim().slice(0,18) || 'Player';

    player = {
      name: name,
      emoji: chosenEmoji,
      color: '#ff2f92',
      pos: -1,
      finished: false
    };

    turnCount = 0;
    gameOver = false;
    turnCountEl.textContent = turnCount;

    buildQuestionPool();

    renderPlayers();
    renderTokens();
    closeOverlay(startOverlay);
    closeOverlay(endOverlay);
    showToast('🎉 Race started! Answer questions to move! 🎉');

    startTimer();
    loadNextQuestion();
    openOverlay(triviaOverlay);
  }

  async function endGame(won, reason){
    gameOver = true;
    stopTimer();
    closeOverlay(triviaOverlay);
    optionsGrid.querySelectorAll('.option-btn').forEach(function(btn){ btn.disabled = true; });
    renderPlayers();

    var seconds = elapsedSeconds();
    var score = reason === 'outOfQuestions' ? 0 : computeScore(turnCount, seconds);

    if(won){
      grandConfetti();
      endModalContent.innerHTML =
        '<div class="finale-emoji">🏰🎉🍬</div>' +
        '<h2>You reached Candy Castle!</h2>' +
        '<p class="modal-copy">You answered <b>' + turnCount + ' question' + (turnCount === 1 ? '' : 's') + '</b> in <b>' + formatTime(seconds) + '</b>.</p>' +
        '<p class="modal-copy"><b>Score: ' + score + '</b></p>' +
        '<div id="lbChoiceWrap">' +
          '<label class="field-label" for="lbNameInput">Leaderboard name</label>' +
          '<input type="text" id="lbNameInput" class="text-input" maxlength="18" value="' + escapeHtml(player.name) + '">' +
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
        var nameToSave = document.getElementById('lbNameInput').value || player.name;
        var result = await submitScore(nameToSave, score, turnCount, seconds);
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
        closeOverlay(endOverlay);
        openOverlay(startOverlay);
      });
    } else {
      endModalContent.innerHTML =
        '<div class="finale-emoji">😢🍬</div>' +
        '<h2>Out of trivia questions!</h2>' +
        '<p class="modal-copy">You ran out of questions before reaching Candy Castle (made it to space ' + (player.pos+1<=0?'Start':(player.pos+1)) + ' / ' + NUM_COLOR_SPACES + '). Your score is <b>0</b> — give it another go!</p>' +
        '<button class="btn btn-next" id="playAgainBtn">🔄 Try Again</button>';
      document.getElementById('playAgainBtn').addEventListener('click', function(){
        closeOverlay(endOverlay);
        openOverlay(startOverlay);
      });
    }

    openOverlay(endOverlay);
  }

  /* ============================== OVERLAYS ============================== */

  function openOverlay(el){ el.classList.add('open'); }
  function closeOverlay(el){ el.classList.remove('open'); }

  startGameBtn.addEventListener('click', newGame);
  restartBtn.addEventListener('click', function(){
    gameOver = true;
    stopTimer();
    closeOverlay(endOverlay);
    closeOverlay(triviaOverlay);
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
          '<span class="lb-turns">' + s.score + ' pts</span>';
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
    buildEmojiPicker();
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
