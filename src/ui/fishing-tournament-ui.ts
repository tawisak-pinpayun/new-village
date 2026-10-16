import { FISHING_DURATION_MS, FISHING_ROUND_MS, FISHING_ROUNDS, tournamentFish, tournamentPoints, tournamentPosition } from '../mini-games/fishing-tournament.mjs'
import './fishing-ui.css'

export function fishingTournamentMarkup() {
  return `<div id="fishing-contest-overlay" class="overlay hidden" tabindex="-1"><section class="dialog game-window fishing-window" role="dialog" aria-modal="true" aria-labelledby="fishing-contest-title"><header class="mini-game-header"><div><small>SUMMER · DAY 7</small><h2 id="fishing-contest-title">แข่งขันตกปลา</h2></div><button id="fishing-contest-close" aria-label="ปิด">✕</button></header><div id="fishing-contest-content" class="fishing-content"></div></section></div>`
}

type ContestResult = { score: number; rank: string; tokens: number; balance: number; totalExp: number; totalFriendshipExp: number }

export class FishingTournamentUI {
  private overlay = document.querySelector<HTMLElement>('#fishing-contest-overlay')!
  private content = document.querySelector<HTMLElement>('#fishing-contest-content')!
  private mode: 'practice' | 'festival' = 'practice'
  private sessionId?: string
  private seed = 0
  private startAt = 0
  private serverOffset = 0
  private timer?: number
  private round = -1
  private hits = new Map<number, number>()
  private pending: Promise<unknown>[] = []
  private result?: ContestResult
  private message = ''
  private generation = 0
  private submitting = false

  constructor(private onReward?: (result: ContestResult) => void) {
    document.querySelector('#fishing-contest-close')!.addEventListener('click', () => this.close())
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close() })
    this.content.addEventListener('click', event => {
      const action = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-contest-action]')?.dataset.contestAction
      if (action === 'start') void this.start()
      if (action === 'hit') this.hit()
      if (action === 'retry') this.open(this.mode)
      if (action === 'exit') this.close()
    })
    window.addEventListener('keydown', event => {
      if (!this.isOpen) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); this.close(); return }
      if (event.code === 'Space' && !event.repeat && this.timer) { event.preventDefault(); event.stopImmediatePropagation(); this.hit() }
    }, { capture: true })
  }

  get isOpen() { return !this.overlay.classList.contains('hidden') }
  open(mode: 'practice' | 'festival' = 'practice') {
    this.close()
    this.mode = mode; this.message = ''; this.result = undefined; this.sessionId = undefined; this.hits.clear(); this.pending = []; this.submitting = false
    this.overlay.classList.remove('hidden')
    this.renderIntro(); this.overlay.focus()
  }
  close() { this.generation++; if (this.timer) clearInterval(this.timer); this.timer = undefined; this.overlay.classList.add('hidden') }

  private renderIntro() {
    this.content.innerHTML = `<p>ดึงเบ็ดให้ตรงแถบสีทองในปลา 5 รอบ รอบละ 4 วินาที กด Space หรือแตะปุ่มดึงเบ็ด</p><p class="mini-game-practice">${this.mode === 'practice' ? 'โหมดซ้อม · ไม่รับรางวัลออนไลน์' : 'รอบแข่งขัน · เข้าสู่ระบบและแข่งได้ในวันเทศกาลชายหาด ฤดูร้อนวันที่ 7 เวลา 08:00–18:00'}</p><p class="fishing-feedback" role="status"></p><button class="mini-game-primary" data-contest-action="start">${this.mode === 'practice' ? 'เริ่มซ้อม' : 'เริ่มแข่งขัน'}</button>`
  }

  private async start() {
    if (this.timer || this.submitting) return
    this.submitting = true
    const generation = this.generation
    if (this.mode === 'festival') {
      try {
        const response = await fetch('/api/festival/fishing/start', { method: 'POST', credentials: 'same-origin' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'เริ่มแข่งขันไม่ได้')
        if (generation !== this.generation) return
        this.sessionId = data.sessionId
        this.seed = data.seed
        this.serverOffset = data.serverNow - Date.now()
        this.startAt = data.startAt
      } catch (error) {
        if (generation !== this.generation) return
        this.submitting = false
        this.content.querySelector<HTMLElement>('.fishing-feedback')!.textContent = (error as Error).message
        return
      }
    } else {
      this.seed = crypto.getRandomValues(new Uint32Array(1))[0]
      this.serverOffset = 0; this.startAt = Date.now() + 2_000
    }
    this.submitting = false; this.round = -1; this.hits.clear(); this.pending = []
    this.content.innerHTML = '<p class="fishing-location" id="contest-round">เตรียมตัว...</p><p id="contest-time"></p><div class="fishing-meter"><span class="fishing-target"></span><i class="fishing-pointer"></i></div><button class="mini-game-primary" data-contest-action="hit">ดึงเบ็ด · Space</button><p class="fishing-feedback" id="contest-feedback" role="status"></p><p id="contest-score">คะแนน 0</p>'
    this.timer = window.setInterval(() => this.tick(), 30)
    this.tick()
  }

  private tick() {
    const elapsed = Date.now() + this.serverOffset - this.startAt
    if (elapsed < 0) { this.content.querySelector('#contest-time')!.textContent = `เริ่มใน ${Math.ceil(-elapsed / 1000)} วินาที`; return }
    if (elapsed >= FISHING_DURATION_MS) { if (this.timer) clearInterval(this.timer); this.timer = undefined; void this.finish(); return }
    const round = Math.floor(elapsed / FISHING_ROUND_MS)
    if (round !== this.round) {
      this.round = round
      this.content.querySelector('#contest-round')!.textContent = `รอบ ${round + 1}/${FISHING_ROUNDS} · ${tournamentFish(this.seed, round)}`
      this.content.querySelector<HTMLButtonElement>('[data-contest-action="hit"]')!.disabled = false
      this.content.querySelector('#contest-feedback')!.textContent = 'รอจังหวะที่ตัวชี้อยู่กลางแถบสีทอง'
    }
    this.content.querySelector<HTMLElement>('.fishing-pointer')!.style.left = `${tournamentPosition(elapsed, round)}%`
    this.content.querySelector('#contest-time')!.textContent = `เหลือ ${Math.ceil((FISHING_DURATION_MS - elapsed) / 1000)} วินาที`
  }

  private hit() {
    const elapsed = Date.now() + this.serverOffset - this.startAt
    const round = Math.floor(elapsed / FISHING_ROUND_MS)
    if (round < 0 || round >= FISHING_ROUNDS || this.hits.has(round)) return
    this.hits.set(round, 0)
    this.content.querySelector<HTMLButtonElement>('[data-contest-action="hit"]')!.disabled = true
    if (this.mode === 'practice') {
      const points = tournamentPoints(elapsed, round)
      this.hits.set(round, points)
      this.showHit(points)
      return
    }
    const request = fetch('/api/festival/fishing/hit', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: this.sessionId, round }) })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'ส่งผลไม่ได้'); this.hits.set(round, data.points); this.showHit(data.points) })
      .catch(error => { this.message = (error as Error).message; this.showHit(0) })
    this.pending.push(request)
  }

  private showHit(points: number) {
    if (!this.isOpen || !this.timer) return
    this.content.querySelector('#contest-feedback')!.textContent = points ? `จับปลาได้! +${points} คะแนน` : this.message || 'พลาดจังหวะ ปลาแหวกหนีไป'
    this.content.querySelector('#contest-score')!.textContent = `คะแนน ${[...this.hits.values()].reduce((sum, n) => sum + n, 0)}`
  }

  private async finish() {
    const generation = this.generation
    this.content.innerHTML = '<p class="fishing-feedback" role="status">กำลังตรวจคะแนน...</p>'
    await Promise.allSettled(this.pending)
    if (generation !== this.generation) return
    const localScore = [...this.hits.values()].reduce((sum, n) => sum + n, 0)
    if (this.mode === 'festival' && this.sessionId) {
      try {
        const response = await fetch('/api/festival/fishing/submit', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: this.sessionId }) })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'ตรวจคะแนนไม่ได้')
        if (generation !== this.generation) return
        this.result = data; this.onReward?.(data)
      } catch (error) { this.message = (error as Error).message }
    }
    if (generation !== this.generation) return
    const score = this.result?.score ?? localScore
    this.content.innerHTML = `<h3>ผลการแข่งขัน</h3><strong class="fishing-final-score">${score} / 1000 คะแนน</strong><p>${this.result ? `ระดับ ${this.result.rank} · ได้เหรียญเทศกาล ${this.result.tokens}` : this.mode === 'practice' ? 'โหมดซ้อม · ไม่มีรางวัลออนไลน์' : this.message}</p><div class="fishing-actions">${this.mode === 'practice' ? '<button data-contest-action="retry">ซ้อมอีกครั้ง</button>' : ''}<button data-contest-action="exit">ปิด</button></div>`
  }
}
