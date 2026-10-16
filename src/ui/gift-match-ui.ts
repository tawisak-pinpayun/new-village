import { GIFT_TYPES } from '../mini-games/gift-match.mjs'
import { GiftMatchSession } from '../mini-games/gift-session.mjs'
import { rankFor } from '../mini-games/session.mjs'
import './gift-match-ui.css'

export function giftMatchWindowMarkup(): string {
  return `<div id="gift-game-overlay" class="overlay hidden" tabindex="-1"><section class="dialog game-window mini-game-window" role="dialog" aria-modal="true" aria-labelledby="gift-game-title">
    <header class="mini-game-header"><div><small>FRIENDSHIP DAY</small><h2 id="gift-game-title">จับคู่ของขวัญ</h2></div><button id="gift-game-close" aria-label="ออกจากเกมจับคู่">✕</button></header>
    <div id="gift-game-content" class="mini-game-content"></div>
  </section></div>`
}

type Reward = { score: number; rank: string; friendshipExp: number; balance: number; totalExp: number; totalFriendshipExp: number }

export class GiftMatchUI {
  private overlay = document.querySelector<HTMLElement>('#gift-game-overlay')!
  private content = document.querySelector<HTMLElement>('#gift-game-content')!
  private session?: GiftMatchSession
  private animation?: number
  private mode: 'practice' | 'festival' = 'practice'
  private remoteSessionId?: string
  private result?: Reward
  private resultError = ''
  private starting = false
  private submitting = false
  private generation = 0

  constructor(private onFestivalReward?: (result: { balance: number; totalExp: number; totalFriendshipExp: number }) => void) {
    document.querySelector('#gift-game-close')!.addEventListener('click', () => this.close())
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close() })
    this.content.addEventListener('click', event => this.handleClick(event))
    this.overlay.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); this.close() } })
  }

  get isOpen() { return !this.overlay.classList.contains('hidden') }

  open(mode: 'practice' | 'festival' = 'practice') {
    this.generation++
    if (this.animation) cancelAnimationFrame(this.animation)
    this.session?.cancel()
    this.session = new GiftMatchSession(crypto.getRandomValues(new Uint32Array(1))[0])
    this.session.initialize()
    this.mode = mode
    this.remoteSessionId = undefined
    this.result = undefined
    this.resultError = ''
    this.starting = false
    this.submitting = false
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
    const session = this.session
    if (!session || !this.isOpen) return
    const previous = session.state
    const wasLocked = !!session.lockUntil
    session.update(performance.now())
    if (previous !== session.state) this.render()
    else if (wasLocked && !session.lockUntil) this.renderBoard()
    if (session.state === 'countdown') this.content.querySelector<HTMLElement>('[data-gift-countdown]')!.textContent = String(Math.max(1, Math.ceil((session.startAt - performance.now()) / 1000)))
    if (session.state === 'playing') this.content.querySelector<HTMLElement>('[data-gift-timer]')!.textContent = `${Math.ceil(session.remaining(performance.now()) / 1000)} วินาที`
    if (['countdown', 'playing'].includes(session.state)) this.animation = requestAnimationFrame(this.tick)
  }

  private render() {
    const session = this.session!
    if (session.state === 'ready') {
      this.content.innerHTML = `<p>เปิดไพ่ของขวัญให้ครบ 6 คู่ภายใน 45 วินาที ไพ่ที่จับผิดจะคว่ำกลับ</p><p>แตะไพ่หรือใช้ Tab แล้วกด Enter เพื่อเปิดไพ่</p><p class="mini-game-practice">${this.mode === 'practice' ? 'โหมดซ้อม · ไม่มีรางวัลออนไลน์' : 'ร่วมงาน · ต้องเข้าสู่ระบบและอยู่ในช่วงเทศกาล · รับรางวัลได้ปีละ 1 ครั้ง'}</p><p id="gift-game-feedback" role="status"></p><button data-gift-action="start" class="mini-game-primary">${this.mode === 'practice' ? 'เริ่มซ้อม' : 'เริ่มร่วมงาน'}</button>`
      return
    }
    if (session.state === 'countdown') {
      this.content.innerHTML = `<div class="mini-game-countdown"><strong data-gift-countdown>3</strong><span>เตรียมจับคู่ของขวัญ</span></div>`
      return
    }
    if (session.state === 'paused') {
      this.content.innerHTML = `<h3>พักเกม</h3><p>เวลาซ้อมหยุดอยู่</p><button data-gift-action="resume" class="mini-game-primary">เล่นต่อ</button><button data-gift-action="exit">ออก</button>`
      return
    }
    if (session.state === 'completed' || session.state === 'failed') {
      const score = this.result?.score ?? session.score ?? 0
      const message = session.state === 'failed' ? 'หมดเวลา ลองจับคู่ใหม่ได้' : this.mode === 'practice' ? 'โหมดซ้อม ไม่มีรางวัลออนไลน์' : this.result ? `รับค่ามิตรภาพ ${this.result.friendshipExp} EXP · รวม ${this.result.totalFriendshipExp} EXP` : this.resultError || 'กำลังตรวจผลกับเซิร์ฟเวอร์...'
      this.content.innerHTML = `<div class="mini-game-result"><small>ผลจับคู่ของขวัญ</small><strong>${score} / 1000</strong><b>ระดับ ${this.result?.rank ?? rankFor(score)?.rank ?? 'C'}</b><p id="gift-game-result-message"></p><div>${session.state === 'failed' || this.mode === 'practice' || this.resultError ? '<button data-gift-action="retry" class="mini-game-primary">ลองอีกครั้ง</button>' : ''}<button data-gift-action="exit">ปิด</button></div></div>`
      this.content.querySelector('#gift-game-result-message')!.textContent = message
      return
    }
    if (session.state !== 'playing') return
    this.content.innerHTML = `<div class="mini-game-hud"><strong data-gift-timer>45 วินาที</strong>${this.mode === 'practice' ? '<button data-gift-action="pause">พัก</button>' : '<span>รอบรับรางวัล</span>'}</div><p>จับคู่ให้ครบ 6 คู่ · เปิดผิด ${session.mistakes} ครั้ง</p><div id="gift-game-cards" class="gift-game-cards"></div><div class="mini-game-actions"><span id="gift-game-progress">จับคู่แล้ว 0 / 6</span></div>`
    this.renderBoard()
  }

  private renderBoard() {
    const session = this.session!
    const cards = this.content.querySelector<HTMLElement>('#gift-game-cards')
    if (!cards) return
    cards.innerHTML = session.deck.map((id, index) => {
      const gift = GIFT_TYPES.find(item => item.id === id)!
      const matched = session.matched.has(index)
      const revealed = matched || session.revealed.has(index)
      return `<button data-gift-card="${index}" class="gift-game-card${revealed ? ' revealed' : ''}${matched ? ' matched' : ''}" ${matched || session.lockUntil ? 'disabled' : ''} aria-label="ไพ่ใบที่ ${index + 1}${revealed ? ` ${gift.label}` : ' คว่ำอยู่'}"><span class="gift-game-face" style="--gift-color:${gift.color}">${revealed ? gift.label : '?'}</span></button>`
    }).join('')
    this.content.querySelector('#gift-game-progress')!.textContent = `จับคู่แล้ว ${session.matched.size / 2} / 6 · เปิดผิด ${session.mistakes} ครั้ง`
  }

  private async startGame() {
    if (this.starting || !this.session || this.session.state !== 'ready') return
    const generation = this.generation
    this.starting = true
    if (this.mode === 'festival') {
      const feedback = this.content.querySelector<HTMLElement>('#gift-game-feedback')!
      feedback.textContent = 'กำลังเปิดรอบเทศกาล...'
      try {
        const response = await fetch('/api/festival/gift/start', { method: 'POST', credentials: 'same-origin' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'เปิดรอบเทศกาลไม่ได้')
        if (!this.isOpen || this.generation !== generation || this.mode !== 'festival') return
        this.remoteSessionId = data.sessionId
        this.session = new GiftMatchSession(data.seed)
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
      const response = await fetch('/api/festival/gift/submit', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: this.remoteSessionId, moves: session.moves }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'ตรวจผลไม่ได้')
      if (this.session !== session) return
      this.result = data
      this.onFestivalReward?.(data)
    } catch (error) { if (this.session === session) this.resultError = (error as Error).message }
    if (this.session === session && this.isOpen) this.render()
  }

  private handleClick(event: Event) {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button')
    if (!button || !this.session) return
    const action = button.dataset.giftAction
    if (action === 'start') { void this.startGame(); return }
    if (action === 'exit') { this.close(); return }
    if (action === 'retry') { this.open(this.mode); return }
    if (action === 'pause') { if (this.mode === 'practice' && this.session.pause(performance.now())) { if (this.animation) cancelAnimationFrame(this.animation); this.render() } return }
    if (action === 'resume') { if (this.session.resume(performance.now())) { this.render(); this.animation = requestAnimationFrame(this.tick) } return }
    if (button.dataset.giftCard === undefined) return
    const previous = this.session.state
    if (!this.session.flip(Number(button.dataset.giftCard), performance.now())) return
    if (previous !== this.session.state) { if (this.animation) cancelAnimationFrame(this.animation); this.render(); void this.submitResult() }
    else this.renderBoard()
  }
}
