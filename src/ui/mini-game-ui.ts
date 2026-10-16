import { FLOWER_COLORS, FLOWER_SHAPES, scoreFlowers, type FlowerPick } from '../mini-games/flower.mjs'
import { MiniGameSession, rankFor } from '../mini-games/session.mjs'
import './mini-game-ui.css'

export function miniGameWindowMarkup(): string {
  return `<div id="mini-game-overlay" class="overlay hidden" tabindex="-1"><section class="dialog game-window mini-game-window" role="dialog" aria-modal="true" aria-labelledby="mini-game-title">
    <header class="mini-game-header"><div><small>FLOWER FESTIVAL</small><h2 id="mini-game-title">จัดดอกไม้</h2></div><button id="mini-game-close" aria-label="ออกจากมินิเกม">✕</button></header>
    <div id="mini-game-content" class="mini-game-content"></div>
  </section></div>`
}

export class MiniGameUI {
  private overlay = document.querySelector<HTMLElement>('#mini-game-overlay')!
  private content = document.querySelector<HTMLElement>('#mini-game-content')!
  private session?: MiniGameSession
  private animation?: number
  private selectedColor = FLOWER_COLORS[0].id
  private selectedShape = FLOWER_SHAPES[0].id
  private selectedSlot = 0
  private mode: 'practice' | 'festival' = 'practice'
  private remoteSessionId?: string
  private result?: { score: number; rank: string; tokens: number; festivalExp: number; balance: number }
  private resultError = ''
  private starting = false
  private submitting = false
  private generation = 0

  constructor(private onFestivalReward?: (result: { balance: number; totalExp: number }) => void) {
    document.querySelector('#mini-game-close')!.addEventListener('click', () => this.close())
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close() })
    this.content.addEventListener('click', event => this.handleClick(event))
    this.overlay.addEventListener('keydown', event => this.handleKey(event))
  }

  get isOpen() { return !this.overlay.classList.contains('hidden') }

  open(mode: 'practice' | 'festival' = 'practice') {
    this.generation++
    this.session?.cancel()
    this.session = new MiniGameSession(crypto.getRandomValues(new Uint32Array(1))[0])
    this.session.initialize()
    this.mode = mode
    this.remoteSessionId = undefined
    this.result = undefined
    this.resultError = ''
    this.starting = false
    this.submitting = false
    this.selectedColor = FLOWER_COLORS[0].id
    this.selectedShape = FLOWER_SHAPES[0].id
    this.selectedSlot = 0
    this.overlay.classList.remove('hidden')
    this.render()
    this.overlay.focus()
  }

  close() {
    this.generation++
    this.session?.cancel()
    if (this.animation) cancelAnimationFrame(this.animation)
    this.animation = undefined
    this.overlay.classList.add('hidden')
  }

  private tick = () => {
    if (!this.session || !this.isOpen) return
    const previous = this.session.state
    this.session.update(performance.now())
    if (previous !== this.session.state) { this.render(); if (this.session.state === 'completed') void this.submitResult() }
    if (this.session.state === 'countdown') this.content.querySelector<HTMLElement>('[data-countdown]')!.textContent = String(Math.max(1, Math.ceil((this.session.startAt - performance.now()) / 1000)))
    if (this.session.state === 'playing') {
      const remaining = Math.ceil(this.session.remaining(performance.now()) / 1000)
      this.content.querySelector<HTMLElement>('[data-timer]')!.textContent = `${remaining} วินาที`
    }
    if (['countdown', 'playing'].includes(this.session.state)) this.animation = requestAnimationFrame(this.tick)
  }

  private render() {
    const session = this.session!
    if (session.state === 'ready') {
      this.content.innerHTML = `<p>ดูแบบช่อดอกไม้ แล้วเลือกสีและทรงของดอกให้ตรงกับทั้ง 4 ช่อง ภายใน 30 วินาที</p><p>ใช้เมาส์หรือสัมผัสได้ หรือกด 1–4 เลือกช่อง, Q/W/E/R เลือกสี, A/S/D เลือกทรง แล้วกด Enter ส่งงาน</p><p class="mini-game-practice">${this.mode === 'practice' ? 'โหมดซ้อม · ยังไม่มีการรับรางวัลออนไลน์' : 'ร่วมเทศกาล · ต้องเข้าสู่ระบบและอยู่ในช่วงจัดงาน · รับรางวัลได้ปีละ 1 ครั้ง'}</p><p id="mini-game-feedback" role="status"></p><button data-mini-action="start" class="mini-game-primary">${this.mode === 'practice' ? 'เริ่มซ้อม' : 'เริ่มร่วมงาน'}</button>`
      return
    }
    if (session.state === 'countdown') {
      this.content.innerHTML = `<div class="mini-game-countdown"><strong data-countdown>3</strong><span>เตรียมจัดดอกไม้</span></div>`
      return
    }
    if (session.state === 'paused') {
      this.content.innerHTML = `<h3>พักเกม</h3><p>เวลาในเกมซ้อมหยุดอยู่</p><button data-mini-action="resume" class="mini-game-primary">เล่นต่อ</button><button data-mini-action="exit">ออก</button>`
      return
    }
    if (session.state === 'completed') {
      const score = this.result?.score ?? session.score ?? 0
      const message = this.mode === 'practice' ? 'โหมดซ้อม ไม่มีเหรียญหรือ EXP เพิ่ม' : this.result ? `รับ ${this.result.tokens} เหรียญเทศกาล · ${this.result.festivalExp} EXP เทศกาล · คงเหลือ ${this.result.balance}` : this.resultError || 'กำลังตรวจผลกับเซิร์ฟเวอร์...'
      this.content.innerHTML = `<div class="mini-game-result"><small>ผลการจัดดอกไม้</small><strong>${score} / 1000</strong><b>ระดับ ${this.result?.rank ?? rankFor(score)?.rank ?? 'C'}</b><p id="mini-game-result-message"></p><div>${this.mode === 'practice' || this.resultError ? '<button data-mini-action="retry" class="mini-game-primary">ลองอีกครั้ง</button>' : ''}<button data-mini-action="exit">ปิด</button></div></div>`
      this.content.querySelector('#mini-game-result-message')!.textContent = message
      return
    }
    if (session.state !== 'playing') return
    this.content.innerHTML = `<div class="mini-game-hud"><strong data-timer>30 วินาที</strong>${this.mode === 'practice' ? '<button data-mini-action="pause">พัก</button>' : '<span>รอบรับรางวัล</span>'}</div>
      <p>แบบช่อดอกไม้</p><div id="mini-game-target" class="mini-game-slots"></div>
      <p>ช่อของคุณ · แตะช่องเพื่อวางดอก</p><div id="mini-game-picks" class="mini-game-slots"></div>
      <div class="mini-game-palette"><strong>สีดอก</strong><div id="mini-game-colors"></div><strong>ทรงดอก</strong><div id="mini-game-shapes"></div></div>
      <div class="mini-game-actions"><span id="mini-game-score">คะแนนปัจจุบัน 0</span><button data-mini-action="submit" class="mini-game-primary">ส่งช่อดอกไม้</button></div>`
    this.renderBoard()
  }

  private renderBoard() {
    const session = this.session!
    const flower = (pick: FlowerPick | null) => {
      if (!pick) return '<span class="mini-flower-empty">＋</span>'
      const color = FLOWER_COLORS.find(item => item.id === pick.color)!
      const shape = FLOWER_SHAPES.find(item => item.id === pick.shape)!
      return `<span class="mini-flower mini-flower-${shape.id}" style="--flower-color:${color.color}" aria-hidden="true"></span><small>${color.label} · ${shape.label}</small>`
    }
    this.content.querySelector('#mini-game-target')!.innerHTML = session.target.map(pick => `<div class="mini-game-flower-slot">${flower(pick)}</div>`).join('')
    this.content.querySelector('#mini-game-picks')!.innerHTML = session.picks.map((pick, index) => `<button data-mini-slot="${index}" class="mini-game-flower-slot${index === this.selectedSlot ? ' selected' : ''}" aria-label="ช่องดอกไม้ ${index + 1}">${flower(pick)}</button>`).join('')
    this.content.querySelector('#mini-game-colors')!.innerHTML = FLOWER_COLORS.map(item => `<button data-mini-color="${item.id}" class="${item.id === this.selectedColor ? 'selected' : ''}" style="--flower-color:${item.color}">${item.label}</button>`).join('')
    this.content.querySelector('#mini-game-shapes')!.innerHTML = FLOWER_SHAPES.map(item => `<button data-mini-shape="${item.id}" class="${item.id === this.selectedShape ? 'selected' : ''}">${item.label}</button>`).join('')
    const current = scoreFlowers(session.target, session.picks, session.remaining(performance.now()), session.durationMs)
    this.content.querySelector('#mini-game-score')!.textContent = `คะแนนปัจจุบัน ${current}`
    this.content.querySelector<HTMLButtonElement>('[data-mini-action="submit"]')!.disabled = session.picks.some(pick => !pick)
  }

  private async startGame() {
    if (this.starting || !this.session || this.session.state !== 'ready') return
    const generation = this.generation
    this.starting = true
    if (this.mode === 'festival') {
      const feedback = this.content.querySelector<HTMLElement>('#mini-game-feedback')!
      feedback.textContent = 'กำลังเปิดรอบเทศกาล...'
      try {
        const response = await fetch('/api/festival/flower/start', { method: 'POST', credentials: 'same-origin' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'เปิดรอบเทศกาลไม่ได้')
        if (!this.isOpen || this.mode !== 'festival' || this.generation !== generation) return
        this.remoteSessionId = data.sessionId
        this.session = new MiniGameSession(data.seed)
        this.session.initialize()
      } catch (error) { if (this.generation === generation) { feedback.textContent = (error as Error).message; this.starting = false } return }
    }
    this.session.start(performance.now())
    this.render()
    this.animation = requestAnimationFrame(this.tick)
    this.starting = false
  }

  private async submitResult() {
    if (this.mode !== 'festival' || !this.remoteSessionId || !this.session || this.submitting) return
    this.submitting = true
    const session = this.session
    try {
      const response = await fetch('/api/festival/flower/submit', {
        method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: this.remoteSessionId, moves: session.moves })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'ตรวจผลไม่ได้')
      if (this.session !== session) return
      this.result = data
      this.onFestivalReward?.(data)
    } catch (error) { if (this.session === session) this.resultError = (error as Error).message }
    if (this.session === session && this.isOpen) this.render()
  }

  private handleClick(event: Event) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button')
    if (!target || !this.session) return
    const action = target.dataset.miniAction
    if (action === 'start') { void this.startGame(); return }
    if (action === 'pause') { if (this.mode === 'practice' && this.session.pause(performance.now())) { if (this.animation) cancelAnimationFrame(this.animation); this.render() } return }
    if (action === 'resume') { if (this.session.resume(performance.now())) { this.render(); this.animation = requestAnimationFrame(this.tick) } return }
    if (action === 'submit') { if (this.session.finish(performance.now())) { if (this.animation) cancelAnimationFrame(this.animation); this.render(); void this.submitResult() } return }
    if (action === 'retry') { this.open(this.mode); return }
    if (action === 'exit') { this.close(); return }
    if (this.session.state !== 'playing') return
    if (target.dataset.miniColor) this.selectedColor = target.dataset.miniColor
    else if (target.dataset.miniShape) this.selectedShape = target.dataset.miniShape
    else if (target.dataset.miniSlot) this.selectedSlot = Number(target.dataset.miniSlot)
    this.session.select(this.selectedSlot, { color: this.selectedColor, shape: this.selectedShape }, performance.now())
    this.renderBoard()
  }

  private handleKey(event: KeyboardEvent) {
    if (!this.session || !this.isOpen) return
    if (event.key === 'Escape') { event.stopPropagation(); this.close(); return }
    if (this.session.state !== 'playing') return
    const colorIndex = 'qwer'.indexOf(event.key.toLowerCase())
    const shapeIndex = 'asd'.indexOf(event.key.toLowerCase())
    if (/^[1-4]$/.test(event.key)) this.selectedSlot = Number(event.key) - 1
    else if (colorIndex >= 0) this.selectedColor = FLOWER_COLORS[colorIndex].id
    else if (shapeIndex >= 0) this.selectedShape = FLOWER_SHAPES[shapeIndex].id
    else if (event.key === 'Enter') { if (this.session.picks.every(Boolean) && this.session.finish(performance.now())) { this.render(); void this.submitResult() } return }
    else return
    event.preventDefault(); event.stopPropagation()
    this.session.select(this.selectedSlot, { color: this.selectedColor, shape: this.selectedShape }, performance.now())
    this.renderBoard()
  }
}
