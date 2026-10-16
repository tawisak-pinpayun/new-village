import { DANCE_DURATION_MS, DANCE_HIT_WINDOW_MS, DANCE_LANES, DanceSession } from '../mini-games/dance.mjs'
import { rankFor } from '../mini-games/session.mjs'
import './dance-rhythm-ui.css'

export function danceRhythmMarkup(): string {
  return `<div id="dance-game-overlay" class="overlay hidden" tabindex="-1"><section class="dialog game-window mini-game-window" role="dialog" aria-modal="true" aria-labelledby="dance-game-title">
    <header class="mini-game-header"><div><small>SPRING DANCE</small><h2 id="dance-game-title">เต้นตามจังหวะ</h2></div><button id="dance-game-close" aria-label="ออกจากเกมเต้นรำ">✕</button></header>
    <div id="dance-game-content" class="mini-game-content"></div>
  </section></div>`
}

type Reward = { score: number; rank: string; tokens: number; balance: number; totalExp: number; totalFriendshipExp: number; counts: Record<string, number>; maxCombo: number }

export class DanceRhythmUI {
  private overlay = document.querySelector<HTMLElement>('#dance-game-overlay')!
  private content = document.querySelector<HTMLElement>('#dance-game-content')!
  private session?: DanceSession
  private mode: 'practice' | 'festival' = 'practice'
  private animation?: number
  private remoteSessionId?: string
  private pendingHits: Promise<unknown>[] = []
  private result?: Reward
  private resultError = ''
  private starting = false
  private submitting = false
  private generation = 0
  private calibration = 0
  private finishAt = 0

  constructor(private onFestivalReward?: (result: { balance: number; totalExp: number; totalFriendshipExp: number }) => void) {
    document.querySelector('#dance-game-close')!.addEventListener('click', () => this.close())
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close() })
    this.content.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button')
      if (!button) return
      if (button.dataset.danceLane !== undefined) { this.hit(Number(button.dataset.danceLane)); return }
      if (button.dataset.danceAction === 'start') void this.startGame()
      if (button.dataset.danceAction === 'pause' && this.mode === 'practice' && this.session?.pause(performance.now())) { this.stopAnimation(); this.render() }
      if (button.dataset.danceAction === 'resume' && this.session?.resume(performance.now())) { this.render(); this.animate() }
      if (button.dataset.danceAction === 'retry') this.open(this.mode)
      if (button.dataset.danceAction === 'exit') this.close()
    })
    this.content.addEventListener('input', event => {
      const input = event.target as HTMLInputElement
      if (input.id !== 'dance-calibration') return
      this.calibration = Number(input.value)
      document.querySelector('#dance-calibration-value')!.textContent = `${this.calibration >= 0 ? '+' : ''}${this.calibration} ms`
    })
    this.overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.stopPropagation(); this.close(); return }
      if (event.repeat || (event.target as HTMLElement).tagName === 'INPUT') return
      const lane = DANCE_LANES.findIndex(key => key.toLowerCase() === event.key.toLowerCase())
      if (lane >= 0) { event.preventDefault(); event.stopPropagation(); this.hit(lane) }
    })
  }

  get isOpen() { return !this.overlay.classList.contains('hidden') }
  open(mode: 'practice' | 'festival' = 'practice') {
    this.generation++
    this.stopAnimation()
    this.session?.cancel()
    this.session = new DanceSession(crypto.getRandomValues(new Uint32Array(1))[0])
    this.mode = mode
    this.remoteSessionId = undefined
    this.pendingHits = []
    this.result = undefined
    this.resultError = ''
    this.starting = false
    this.submitting = false
    this.calibration = 0
    this.overlay.classList.remove('hidden')
    this.render()
    this.overlay.focus()
  }

  close() {
    this.generation++
    this.stopAnimation()
    this.session?.cancel()
    this.overlay.classList.add('hidden')
  }

  private stopAnimation() { if (this.animation) cancelAnimationFrame(this.animation); this.animation = undefined }
  private animate = () => {
    if (!this.session || !this.isOpen) return
    const previous = this.session.state
    this.session.update(performance.now())
    if (this.session.state !== previous) {
      this.render()
      if (this.session.state === 'completed') { void this.submitResult(); return }
    }
    if (this.session.state === 'countdown') {
      const countdown = this.content.querySelector<HTMLElement>('[data-dance-countdown]')
      if (countdown) countdown.textContent = String(Math.max(1, Math.ceil((this.session.startAt - performance.now()) / 1000)))
    }
    if (this.session.state === 'playing') this.renderStage()
    if (['countdown', 'playing'].includes(this.session.state)) this.animation = requestAnimationFrame(this.animate)
  }

  private render() {
    const session = this.session!
    if (session.state === 'ready') {
      this.content.innerHTML = `<p>โน้ตวิ่งเข้าหาเส้นด้านล่าง กด A S D F ให้ตรงจังหวะ หรือแตะปุ่มใต้แต่ละช่อง</p><p>Perfect · Great · Good · Miss สะสมคอมโบและคะแนนจากโน้ต 24 ตัว</p><p class="mini-game-practice">${this.mode === 'practice' ? 'โหมดซ้อม · ไม่มีรางวัลออนไลน์' : 'รอบแข่งขัน · ต้องเข้าสู่ระบบและอยู่ในช่วงงาน · รับรางวัลได้ปีละ 1 ครั้ง'}</p><label class="dance-calibration">ปรับจังหวะภาพ (ค่าลบให้โน้ตมาถึงเร็วขึ้น) <input id="dance-calibration" type="range" min="-150" max="150" step="10" value="0"><output id="dance-calibration-value">+0 ms</output></label><p id="dance-game-feedback" role="status"></p><button data-dance-action="start" class="mini-game-primary">${this.mode === 'practice' ? 'เริ่มซ้อม' : 'เริ่มแข่งขัน'}</button>`
      return
    }
    if (session.state === 'countdown') { this.content.innerHTML = '<div class="mini-game-countdown"><strong data-dance-countdown>3</strong><span>เตรียมกด A S D F</span></div>'; return }
    if (session.state === 'paused') { this.content.innerHTML = '<h3>พักเกม</h3><p>เวลาซ้อมหยุดอยู่</p><button data-dance-action="resume" class="mini-game-primary">เล่นต่อ</button><button data-dance-action="exit">ออก</button>'; return }
    if (session.state === 'completed') {
      const result = this.result ?? session.result!
      const score = result.score
      const message = this.mode === 'practice' ? 'โหมดซ้อม ไม่มีรางวัลออนไลน์' : this.result ? `รับเหรียญเทศกาล ${this.result.tokens} · รวม ${this.result.balance}` : this.resultError || 'กำลังตรวจผลจากจังหวะที่เซิร์ฟเวอร์รับได้...'
      this.content.innerHTML = `<div class="mini-game-result"><small>ผลเต้นรำ</small><strong>${score} / 1000</strong><b>${score >= 200 ? `ระดับ ${this.result?.rank ?? rankFor(score)?.rank ?? 'C'}` : 'ยังไม่ผ่านเกณฑ์'}</b><p>${result.counts.Perfect} Perfect · ${result.counts.Great} Great · ${result.counts.Good} Good · ${result.counts.Miss} Miss</p><p>คอมโบสูงสุด ${result.maxCombo}</p><p id="dance-game-result-message"></p><div>${this.mode === 'practice' || this.resultError ? '<button data-dance-action="retry" class="mini-game-primary">ลองอีกครั้ง</button>' : ''}<button data-dance-action="exit">ปิด</button></div></div>`
      this.content.querySelector('#dance-game-result-message')!.textContent = message
      return
    }
    if (session.state !== 'playing') return
    this.content.innerHTML = `<div class="mini-game-hud"><strong id="dance-timer">${Math.ceil(DANCE_DURATION_MS / 1000)} วินาที</strong><span id="dance-judgment" role="status">รอจังหวะ</span>${this.mode === 'practice' ? '<button data-dance-action="pause">พัก</button>' : '<span>รอบแข่งขัน</span>'}</div><div class="dance-tracks">${DANCE_LANES.map((key, lane) => `<div class="dance-track" data-dance-track="${lane}"><span class="dance-target"></span></div>`).join('')}</div><div class="dance-controls">${DANCE_LANES.map((key, lane) => `<button data-dance-lane="${lane}" aria-label="จังหวะช่อง ${key}">${key}</button>`).join('')}</div><p id="dance-combo">คอมโบ 0</p>`
  }

  private renderStage() {
    const session = this.session!
    const elapsed = performance.now() - session.startAt
    this.content.querySelector('#dance-timer')!.textContent = `${Math.max(0, Math.ceil((DANCE_DURATION_MS - elapsed) / 1000))} วินาที`
    this.content.querySelector('#dance-combo')!.textContent = `คอมโบ ${session.combo}`
    this.content.querySelector('#dance-judgment')!.textContent = session.lastJudgment || 'รอจังหวะ'
    for (let lane = 0; lane < DANCE_LANES.length; lane++) {
      const track = this.content.querySelector<HTMLElement>(`[data-dance-track="${lane}"]`)!
      const notes = session.chart.filter(note => note.lane === lane && session.hits[note.index] === undefined && note.at - elapsed + this.calibration < 1_900 && note.at - elapsed + this.calibration > -DANCE_HIT_WINDOW_MS)
      track.replaceChildren(...notes.map(note => {
        const marker = document.createElement('span')
        marker.className = 'dance-note'
        marker.style.top = `${Math.max(2, Math.min(82, 82 - (note.at - elapsed + this.calibration) / 1_900 * 80))}%`
        marker.textContent = DANCE_LANES[lane]
        return marker
      }))
      const target = document.createElement('span'); target.className = 'dance-target'; track.append(target)
    }
  }

  private async startGame() {
    if (this.starting || !this.session || this.session.state !== 'ready') return
    this.starting = true
    const generation = this.generation
    let scheduledAt = performance.now() + 3_000
    if (this.mode === 'festival') {
      const feedback = this.content.querySelector<HTMLElement>('#dance-game-feedback')!
      feedback.textContent = 'กำลังเปิดรอบแข่งขัน...'
      const sentAt = performance.now()
      try {
        const response = await fetch('/api/festival/dance/start', { method: 'POST', credentials: 'same-origin' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'เปิดรอบแข่งขันไม่ได้')
        if (generation !== this.generation || !this.isOpen) return
        const receivedAt = performance.now()
        const halfTrip = (receivedAt - sentAt) / 2
        scheduledAt = receivedAt + Math.max(0, data.startAt - data.serverNow - halfTrip)
        this.finishAt = receivedAt + Math.max(0, data.deadline - data.serverNow - halfTrip)
        this.remoteSessionId = data.sessionId
        this.session = new DanceSession(data.seed)
      } catch (error) { if (generation === this.generation) { feedback.textContent = (error as Error).message; this.starting = false } return }
    }
    this.session.start(performance.now(), scheduledAt)
    this.render()
    this.animation = requestAnimationFrame(this.animate)
    this.starting = false
  }

  private hit(lane: number) {
    if (!this.session || this.session.state !== 'playing') return
    // Match the visual calibration locally; the server always scores its own receipt time.
    const hit = this.session.hit(lane, performance.now() - this.calibration)
    if (!hit) return
    this.renderStage()
    if (this.mode === 'festival' && this.remoteSessionId) {
      const request = fetch('/api/festival/dance/hit', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: this.remoteSessionId, noteIndex: hit.noteIndex, lane }) }).catch(() => undefined)
      this.pendingHits.push(request)
    }
  }

  private async submitResult() {
    if (this.mode !== 'festival' || !this.remoteSessionId || this.submitting) return
    this.submitting = true
    const generation = this.generation
    await Promise.allSettled(this.pendingHits)
    const delay = Math.max(0, this.finishAt + 150 - performance.now())
    if (delay) await new Promise(resolve => setTimeout(resolve, delay))
    if (generation !== this.generation || !this.isOpen) return
    try {
      const response = await fetch('/api/festival/dance/submit', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: this.remoteSessionId }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'ตรวจผลไม่ได้')
      if (generation !== this.generation || !this.isOpen) return
      this.result = data
      this.onFestivalReward?.(data)
    } catch (error) { if (generation === this.generation) this.resultError = (error as Error).message }
    if (generation === this.generation && this.isOpen) this.render()
  }
}
