let songs = []
let player
let idx = 0
let ready = false
let seekTimer

const titleEl = document.getElementById('title')
const artistEl = document.getElementById('artist')
const playBtn = document.getElementById('play')
const prevBtn = document.getElementById('prev')
const nextBtn = document.getElementById('next')
const shuffleBtn = document.getElementById('shuffle')
const muteBtn = document.getElementById('mute')
const seek = document.getElementById('seek')
const cur = document.getElementById('current')
const dur = document.getElementById('duration')
const vol = document.getElementById('volume')
const list = document.getElementById('playlist')
const card = document.querySelector('.player')

fetch('tracks.json').then(r=>r.json()).then(d=>{
  songs = d
  renderList()
})

window.onYouTubeIframeAPIReady = function() {
  player = new YT.Player('yt-holder',{
    height:'1', width:'1',
    playerVars:{autoplay:1, controls:0, disablekb:1, modestbranding:1, playsinline:1},
    events:{ onReady:onReady, onStateChange:onState }
  })
}

function onReady() {
  ready = true
  vol.value = 70
  if (songs.length) load(idx, true)
  bindUI()
}

function bindUI() {
  playBtn.addEventListener('click', () => {
    const s = player.getPlayerState()
    if (s===1) pause()
    else play()
  })
  prevBtn.addEventListener('click', prev)
  nextBtn.addEventListener('click', next)
  shuffleBtn.addEventListener('click', shuffle)
  muteBtn.addEventListener('click', toggleMute)

  vol.addEventListener('input', e => {
    const v = +e.target.value
    player.setVolume(v)
    if (player.isMuted() && v>0) player.unMute()
  })

  seek.addEventListener('input', e => {
    const d = player.getDuration()||0
    const t = (e.target.value/100)*d
    player.seekTo(t, true)
  })

  setInterval(updateProgress, 250)
}

function onState(e) {
  if (e.data===0) next()
  if (e.data===1) {
    playBtn.textContent = '⏸️'
    card.classList.add('playing')
  }
  if (e.data===2) {
    playBtn.textContent = '▶️'
    card.classList.remove('playing')
  }
}

function load(i, autoplay=false) {
  idx = ((i % songs.length)+songs.length)%songs.length
  const {title, artist, videoId} = songs[idx]
  titleEl.textContent = title
  artistEl.textContent = artist
  highlightActive()
  const opts = autoplay ? 'loadVideoById' : 'cueVideoById'
  player[opts]({videoId, startSeconds:0, suggestedQuality:'small'})
  player.mute()
  play()
}

function play() {
  player.playVideo()
  setTimeout(()=>{ player.unMute() }, 300)
}

function pause() {
  player.pauseVideo()
}

function next() {
  load(idx+1, true)
}

function prev() {
  load(idx-1, true)
}

function shuffle() {
  const current = songs[idx]
  for (let i=songs.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1))
    ;[songs[i],songs[j]]=[songs[j],songs[i]]
  }
  const newIndex = songs.findIndex(s=>s.videoId===current.videoId)
  load(newIndex, true)
  renderList()
}

function toggleMute() {
  if (player.isMuted()) { player.unMute(); muteBtn.textContent='🔈' }
  else { player.mute(); muteBtn.textContent='🔇' }
}

function updateProgress() {
  if (!ready) return
  const d = player.getDuration()||0
  const t = player.getCurrentTime()||0
  if (d>0) seek.value = (t/d)*100
  cur.textContent = fmt(t)
  dur.textContent = d ? fmt(d) : '0:00'
}

function fmt(s) {
  s=Math.floor(s)
  const m = Math.floor(s/60)
  const x = s%60
  return m+':' + (x<10?'0':'') + x
}

function renderList() {
  list.innerHTML = ''
  songs.forEach((s,i)=>{
    const li = document.createElement('li')
    const left = document.createElement('div')
    const right = document.createElement('div')
    left.textContent = s.title + ' — ' + s.artist
    right.textContent = '▶'
    li.appendChild(left); li.appendChild(right)
    li.addEventListener('click', ()=> load(i, true))
    list.appendChild(li)
  })
  highlightActive()
}

function highlightActive() {
  ;[...list.children].forEach((li,i)=> li.classList.toggle('active', i===idx))
}
