import { fetchTopScores, isGlobalLeaderboardConfigured } from "./leaderboard.js";

var lbMode = document.getElementById('lbMode');
var leaderboardList = document.getElementById('leaderboardList');
var refreshLbBtn = document.getElementById('refreshLbBtn');

function escapeHtml(str){
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderLeaderboardInto(listEl, scores){
  if(!scores.length){
    listEl.innerHTML = '<li class="lb-empty">No races finished yet — be the first! 🏰</li>';
    return;
  }
  listEl.innerHTML = '';
  scores.forEach(function(s, i){
    var li = document.createElement('li');
    li.innerHTML =
      '<span class="lb-rank">#' + (i+1) + '</span>' +
      '<span class="lb-name">' + escapeHtml(s.name || 'Player') + '</span>' +
      '<span class="lb-turns">' + (Number(s.score) || 0) + ' pts</span>';
    listEl.appendChild(li);
  });
}

async function loadLeaderboard(){
  leaderboardList.innerHTML = '<li class="lb-empty">Loading…</li>';
  try{
    var result = await fetchTopScores(50);
    lbMode.textContent = result.mode === 'global' ? '🌐 Global' : '💻 This device';
    renderLeaderboardInto(leaderboardList, result.scores);
  }catch(err){
    console.error('[leaderboard-page] failed to load leaderboard', err);
    leaderboardList.innerHTML = '<li class="lb-empty">Couldn\'t load leaderboard.</li>';
  }
}

lbMode.textContent = isGlobalLeaderboardConfigured() ? '🌐 Global' : '💻 This device';
refreshLbBtn.addEventListener('click', function(){ loadLeaderboard(); });
loadLeaderboard();
