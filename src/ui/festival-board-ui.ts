import type { Calendar } from '../calendar'
import { FESTIVALS, festivalStatus, MINI_GAME_NAMES, type FestivalDefinition } from '../festivals'
import './festival-board-ui.css'

const playable = new Set(['flower', 'friendship', 'spring_dance'])
const seasonNames: Record<string, string> = { spring: 'ใบไม้ผลิ', summer: 'ร้อน', autumn: 'ใบไม้ร่วง', winter: 'หนาว' }

export function festivalBoardMarkup(): string {
  return `<div id="festival-board-overlay" class="overlay hidden"><section class="dialog festival-board" role="dialog" aria-modal="true" aria-labelledby="festival-board-title">
    <header class="game-calendar-header"><div><small>NEW VILLAGE · NOTICE BOARD</small><h2 id="festival-board-title">กระดานประกาศการแข่งขัน</h2></div><button id="festival-board-close" aria-label="ปิดกระดาน">✕</button></header>
    <p id="festival-board-now" class="game-calendar-now"></p>
    <div class="festival-board-layout"><div id="festival-board-list" class="festival-board-list"></div><section id="festival-board-detail" class="festival-board-detail" aria-live="polite"></section></div>
  </section></div>`
}

export class FestivalBoardUI {
  private overlay = document.querySelector<HTMLElement>('#festival-board-overlay')!
  private list = document.querySelector<HTMLElement>('#festival-board-list')!
  private detail = document.querySelector<HTMLElement>('#festival-board-detail')!
  private current?: Calendar
  private selected = FESTIVALS[0]
  private request = 0

  constructor(private onPlay: (gameId: string, mode: 'practice' | 'festival') => void) {
    document.querySelector('#festival-board-close')!.addEventListener('click', () => this.close())
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close() })
  }

  get isOpen() { return !this.overlay.classList.contains('hidden') }
  update(current: Calendar) {
    const changed = !this.current || current.absoluteDay !== this.current.absoluteDay || current.hour !== this.current.hour
    this.current = current
    if (this.isOpen && changed) this.render()
  }
  open() { this.overlay.classList.remove('hidden'); this.render() }
  close() { this.request++; this.overlay.classList.add('hidden') }

  private render() {
    if (!this.current) return
    const today = this.current
    document.querySelector('#festival-board-now')!.textContent = `ปีที่ ${today.year} · ฤดู${today.season.name} วันที่ ${today.dayInSeason} · เลือกงานเพื่อดูสถานที่ เกม และอันดับ`
    this.list.replaceChildren(...FESTIVALS.map(event => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `festival-board-event${event.id === this.selected.id ? ' selected' : ''}`
      const name = document.createElement('strong')
      name.textContent = event.name
      const detail = document.createElement('small')
      detail.textContent = `ฤดู${seasonNames[event.season]} ${event.day} · ${event.location}`
      button.append(name, detail)
      button.addEventListener('click', () => { this.selected = event; this.render() })
      return button
    }))
    this.renderDetail(this.selected, today)
  }

  private renderDetail(event: FestivalDefinition, today: Calendar) {
    this.request++
    const status = festivalStatus(event, today.year, { year: today.year, season: today.season.id, day: today.dayInSeason, hour: today.hour })
    const title = document.createElement('h3')
    title.textContent = event.name
    const description = document.createElement('p')
    description.textContent = event.description
    const facts = document.createElement('dl')
    for (const [label, value] of [
      ['วัน', `ฤดู${seasonNames[event.season]} วันที่ ${event.day} · ปีที่ ${today.year}`],
      ['เวลา', `${String(event.startHour).padStart(2, '0')}:00–${String(event.endHour).padStart(2, '0')}:00`],
      ['สถานที่', event.location],
      ['เกม', MINI_GAME_NAMES[event.miniGameId]],
      ['สถานะ', playable.has(event.id) ? status : 'เกมกำลังพัฒนา']
    ]) {
      const term = document.createElement('dt'); term.textContent = label
      const definition = document.createElement('dd'); definition.textContent = value
      facts.append(term, definition)
    }
    this.detail.replaceChildren(title, description, facts)
    if (!playable.has(event.id)) {
      const pending = document.createElement('p')
      pending.className = 'festival-board-note'
      pending.textContent = 'กิจกรรมนี้มีประกาศกำหนดการแล้ว เกมและสนามแข่งขันยังไม่เปิด'
      this.detail.append(pending)
      return
    }
    const practice = document.createElement('button')
    practice.type = 'button'; practice.className = 'game-calendar-practice'
    practice.textContent = 'ซ้อมเล่น'
    practice.addEventListener('click', () => { this.close(); this.onPlay(event.miniGameId, 'practice') })
    this.detail.append(practice)
    if (status === 'กำลังจัดงาน') {
      const compete = document.createElement('button')
      compete.type = 'button'; compete.className = 'game-calendar-practice'
      compete.textContent = 'ลงแข่งรับคะแนน'
      compete.addEventListener('click', () => { this.close(); this.onPlay(event.miniGameId, 'festival') })
      this.detail.append(compete)
    }
    const heading = document.createElement('h4'); heading.textContent = `อันดับปีที่ ${today.year} · Top 10`
    const results = document.createElement('div'); results.className = 'festival-board-results'; results.textContent = 'กำลังโหลดอันดับ...'
    this.detail.append(heading, results)
    const request = this.request
    void fetch(`/api/festival/leaderboard?event=${encodeURIComponent(event.id)}&year=${today.year}`)
      .then(async response => { if (!response.ok) throw new Error('unavailable'); return response.json() as Promise<{ entries: { place: number; player: string; score: number; grade: string }[] }> })
      .then(data => {
        if (request !== this.request || !this.isOpen) return
        if (!data.entries.length) { results.textContent = 'ยังไม่มีผู้เข้าแข่งขันในปีนี้'; return }
        const list = document.createElement('ol')
        for (const entry of data.entries) {
          const row = document.createElement('li')
          row.textContent = `${entry.player} · ${entry.score} คะแนน · ระดับ ${entry.grade}`
          list.append(row)
        }
        results.replaceChildren(list)
      })
      .catch(() => { if (request === this.request && this.isOpen) results.textContent = 'ยังโหลดอันดับออนไลน์ไม่ได้' })
  }
}
