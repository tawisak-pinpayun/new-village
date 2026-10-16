import { calendarAt, DAYS_PER_SEASON, DAYS_PER_YEAR, SEASONS, WEEKDAYS, type Calendar } from '../calendar'
import { festivalOn, festivalStatus, MINI_GAME_NAMES } from '../festivals'
import './calendar-ui.css'

export function calendarWindowMarkup(): string {
  return `<div id="calendar-overlay" class="overlay hidden"><section class="dialog game-calendar" role="dialog" aria-modal="true" aria-labelledby="calendar-title">
    <header class="game-calendar-header"><div><small>NEW VILLAGE · WORLD CALENDAR</small><h2 id="calendar-title">ปฏิทินหมู่บ้าน</h2></div><button id="calendar-close" aria-label="ปิดปฏิทิน">✕</button></header>
    <div class="game-calendar-navigation"><button id="calendar-prev" aria-label="ฤดูก่อนหน้า">‹</button><strong id="calendar-month"></strong><button id="calendar-next" aria-label="ฤดูถัดไป">›</button></div>
    <p id="calendar-now" class="game-calendar-now"></p><button id="calendar-board" class="game-calendar-practice" type="button">กระดานประกาศและอันดับ</button><div id="calendar-grid" class="game-calendar-grid" role="grid" aria-label="วันในฤดูกาล"></div>
    <section id="calendar-detail" class="game-calendar-detail" aria-live="polite"></section>
  </section></div>`
}

export class CalendarUI {
  private overlay: HTMLElement
  private viewedMonth = 0
  private selectedDay = 1
  private today = 1
  private current?: Calendar

  constructor(private onPlay?: (gameId: string, mode: 'practice' | 'festival') => void, private onBoard?: () => void) {
    this.overlay = document.querySelector<HTMLElement>('#calendar-overlay')!
    document.querySelector('#day-display')!.addEventListener('click', () => this.open())
    document.querySelector('#calendar-close')!.addEventListener('click', () => this.close())
    document.querySelector('#calendar-board')!.addEventListener('click', () => { this.close(); this.onBoard?.() })
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close() })
    document.querySelector('#calendar-prev')!.addEventListener('click', () => this.navigate(-1))
    document.querySelector('#calendar-next')!.addEventListener('click', () => this.navigate(1))
    document.querySelector('#calendar-grid')!.addEventListener('click', event => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-calendar-day]')
      if (!target) return
      this.selectedDay = Number(target.dataset.calendarDay)
      this.render()
    })
  }

  get isOpen() { return !this.overlay.classList.contains('hidden') }

  update(current: Calendar) {
    const changedDay = this.today !== current.absoluteDay
    const changedMinute = !this.current || this.current.hour !== current.hour || this.current.minute !== current.minute
    this.current = current
    this.today = current.absoluteDay
    if (this.isOpen) {
      if (changedDay && this.selectedDay === this.today - 1) this.selectedDay = this.today
      if (changedDay) this.render()
      else if (changedMinute) { this.renderCurrentTime(); this.renderDetails() }
    }
  }

  open() {
    this.viewedMonth = Math.floor((this.today - 1) / DAYS_PER_SEASON)
    this.selectedDay = this.today
    this.overlay.classList.remove('hidden')
    this.render()
  }

  close() { this.overlay.classList.add('hidden') }

  private navigate(delta: number) {
    this.viewedMonth = Math.max(0, this.viewedMonth + delta)
    this.selectedDay = this.viewedMonth * DAYS_PER_SEASON + 1
    this.render()
  }

  private render() {
    const first = this.viewedMonth * DAYS_PER_SEASON + 1
    const year = Math.floor((first - 1) / DAYS_PER_YEAR) + 1
    const season = SEASONS[this.viewedMonth % SEASONS.length]
    document.querySelector('#calendar-month')!.textContent = `${season.icon} ฤดู${season.name} · ปีที่ ${year}`
    this.renderCurrentTime()
    const grid = document.querySelector<HTMLElement>('#calendar-grid')!
    grid.replaceChildren(...WEEKDAYS.map(name => { const label = document.createElement('span'); label.className = 'game-calendar-weekday'; label.textContent = name.slice(0, 2); return label }),
      ...Array.from({ length: DAYS_PER_SEASON }, (_, index) => {
        const absoluteDay = first + index
        const button = document.createElement('button')
        button.type = 'button'
        button.dataset.calendarDay = String(absoluteDay)
        button.className = `game-calendar-day${absoluteDay === this.today ? ' today' : ''}${absoluteDay === this.selectedDay ? ' selected' : ''}`
        button.textContent = String(index + 1)
        if (festivalOn(season.id, index + 1)) {
          const badge = document.createElement('small')
          badge.className = 'game-calendar-event-mark'
          badge.textContent = 'งาน'
          button.append(badge)
        }
        button.setAttribute('aria-label', `${season.name} วันที่ ${index + 1} ปีที่ ${year}`)
        return button
      }))
    this.renderDetails()
  }

  private renderDetails() {
    const selected = calendarAt(this.selectedDay, 0)
    const status = this.selectedDay < this.today ? 'ผ่านไปแล้ว' : this.selectedDay === this.today ? 'วันนี้' : 'กำลังจะมาถึง'
    const detail = document.querySelector<HTMLElement>('#calendar-detail')!
    detail.replaceChildren()
    const title = document.createElement('strong')
    title.textContent = `${selected.weekday}ที่ ${selected.dayInSeason} ฤดู${selected.season.name} ปีที่ ${selected.year} · ${status}`
    detail.append(title)
    const festival = festivalOn(selected.season.id, selected.dayInSeason)
    if (!festival || !this.current) return
    const event = document.createElement('p')
    event.textContent = `${festival.name} · ${festivalStatus(festival, selected.year, { year: this.current.year, season: this.current.season.id, day: this.current.dayInSeason, hour: this.current.hour })}`
    const information = document.createElement('small')
    const playable = ['flower_arrangement', 'gift_match', 'dance_rhythm', 'fishing_tournament'].includes(festival.miniGameId)
    information.textContent = `${festival.description} · ${festival.location} · ${String(festival.startHour).padStart(2, '0')}:00–${String(festival.endHour).padStart(2, '0')}:00 · มินิเกม: ${MINI_GAME_NAMES[festival.miniGameId]} · รางวัลตามกำหนดการ: ${festival.rewards.join(', ')} · ${playable ? 'มีโหมดซ้อมให้เล่น' : 'กิจกรรมกำลังอยู่ระหว่างจัดเตรียม'}`
    detail.append(event, information)
    if (playable) {
      const practice = document.createElement('button')
      practice.type = 'button'
      practice.className = 'game-calendar-practice'
      practice.textContent = festival.miniGameId === 'flower_arrangement' ? 'ซ้อมจัดดอกไม้' : festival.miniGameId === 'gift_match' ? 'ซ้อมจับคู่ของขวัญ' : festival.miniGameId === 'dance_rhythm' ? 'ซ้อมเต้นตามจังหวะ' : 'ซ้อมแข่งขันตกปลา'
      practice.addEventListener('click', () => { this.close(); this.onPlay?.(festival.miniGameId, 'practice') })
      detail.append(practice)
      if (festivalStatus(festival, selected.year, { year: this.current.year, season: this.current.season.id, day: this.current.dayInSeason, hour: this.current.hour }) === 'กำลังจัดงาน') {
        const live = document.createElement('button')
        live.type = 'button'
        live.className = 'game-calendar-practice'
        live.textContent = 'ร่วมงานรับเหรียญเทศกาล'
        live.addEventListener('click', () => { this.close(); this.onPlay?.(festival.miniGameId, 'festival') })
        detail.append(live)
      }
    }
  }

  private renderCurrentTime() {
    const now = this.current
    document.querySelector('#calendar-now')!.textContent = now ? `วันนี้ ${now.weekday}ที่ ${now.dayInSeason} · ${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}` : ''
  }
}
