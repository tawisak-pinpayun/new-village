import type { CharacterId, GearId, GearSlot, MapId, OutfitId, Plot } from './domain'
import type { Monster } from './monsters'
import type { Weather } from './weather.mjs'

export type RemotePlayer = { id: string; name: string; x: number; y: number; mapId: MapId; character: CharacterId; facing: number; moving: boolean; outfit?: OutfitId; equipped?: Partial<Record<GearSlot, GearId>>; mounted?: boolean; partyCode?: string }
export type SharedWorld = { day: number; serverNow: number; clock: { epochMs: number; dayLengthMs: number; calendarVersion: number }; weather: Weather; nodeHp: Record<string, number>; plots: Plot[]; monsters: Partial<Record<MapId, (Monster & { remaining: number })[]>>; quest: { stage: number; harvested: number; mined: number; completed: boolean }; festival: { day: number; donated: number; goal: number; completed: boolean }; gardenGateOpen: boolean; campfires: { mapId: MapId; x: number; y: number }[] }
export type ActionResult = { ok: boolean; action?: string; message?: string; remaining?: number; defeated?: boolean; kind?: string; crop?: string; itemId?: string; monsterKind?: string; xp?: number; monsterHp?: number; maxMonsterHp?: number }
export class Multiplayer {
  socket?: WebSocket
  id = ''
  room = ''
  server = 1
  partyCode = ''
  players = new Map<string, RemotePlayer>()
  world?: SharedWorld
  serverOffsetMs: number | null = null
  onWorld: (full: boolean) => void = () => {}
  onReward: (kind: string, xp: number, coins: number, from?: string) => void = () => {}
  private sequence = 0
  private pending = new Map<number, (value: ActionResult) => void>()
  onChange: () => void = () => {}
  onJoined: () => void = () => {}
  onStatus: (text: string) => void = () => {}
  private lastSent = 0
  private lastPosition = ''
  private changeQueued = false
  private desiredConnection?: { name: string; character: CharacterId; server: number }
  private reconnectTimer?: ReturnType<typeof setTimeout>

  private notifyChange() {
    if (this.changeQueued) return
    this.changeQueued = true
    requestAnimationFrame(() => { this.changeQueued = false; this.onChange() })
  }

  connect(name: string, character: CharacterId, server = 1) {
    this.disconnect()
    this.desiredConnection = { name, character, server }
    this.openConnection()
  }

  private openConnection() {
    const { name, character, server } = this.desiredConnection!
    this.server = server
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.DEV ? `${location.hostname}:3000` : location.host
    const socket = new WebSocket(`${protocol}//${host}/multiplayer`)
    this.socket = socket
    this.onStatus(`กำลังเชื่อมต่อ Server ${server}...`)
    socket.onopen = () => { if (this.socket === socket) socket.send(JSON.stringify({ type: 'join', name, character, server })) }
    socket.onmessage = event => {
      if (this.socket !== socket) return
      let data: any
      try { data = JSON.parse(event.data) } catch { return }
      if (data.type === 'joined') {
        this.id = data.id; this.room = 'SERVER'; this.server = data.server
        this.players = new Map(data.players.map((p: RemotePlayer) => [p.id, p]))
        this.onStatus(`อยู่ใน Server ${this.server} · ${this.players.size + 1} คน`)
        this.onJoined()
        this.notifyChange()
      } else if (data.type === 'world-state') {
        this.world = data as SharedWorld
        if (Number.isFinite(data.serverNow)) this.serverOffsetMs = data.serverNow - Date.now()
        this.onWorld(true)
      } else if (data.type === 'monster-tick' && this.world) {
        const list = this.world.monsters[data.mapId as MapId]
        if (list) for (const remote of data.monsters as { id: string; x: number; y: number; remaining: number }[]) {
          const monster = list.find(item => item.id === remote.id)
          if (monster) { monster.x = remote.x; monster.y = remote.y; monster.remaining = remote.remaining }
        }
        this.onWorld(false)
      } else if (data.type === 'action-result') {
        const callback = this.pending.get(data.seq)
        if (callback) { this.pending.delete(data.seq); callback(data as ActionResult) }
      } else if (['party-reward', 'quest-reward', 'festival-reward'].includes(data.type)) {
        this.onReward(data.type, data.xp, data.coins, data.from)
      } else if (data.type === 'peers' && Array.isArray(data.players)) {
        this.players = new Map(data.players.map((p: RemotePlayer) => [p.id, p]))
        this.notifyChange()
      } else if (data.type === 'player' && data.player?.id !== this.id) {
        this.players.set(data.player.id, data.player)
        this.onStatus(`อยู่ใน Server ${this.server} · ${this.players.size + 1} คน`)
        this.notifyChange()
      } else if (data.type === 'party-state') {
        this.partyCode = data.code || ''
        this.notifyChange()
      } else if (data.type === 'party-error') {
        this.onStatus(data.message)
      } else if (data.type === 'left') {
        this.players.delete(data.id)
        this.onStatus(`อยู่ใน Server ${this.server} · ${this.players.size + 1} คน`)
        this.notifyChange()
      } else if (data.type === 'error') {
        this.onStatus(data.message)
        socket.close()
      }
    }
    socket.onclose = () => {
      if (this.socket !== socket) return
      this.socket = undefined
      this.id = ''; this.room = ''; this.partyCode = ''; this.players.clear(); this.notifyChange()
      this.world = undefined; this.serverOffsetMs = null; this.pending.clear(); this.onWorld(true)
      this.onStatus(`หลุดจาก Server ${server} · กำลังเชื่อมต่อใหม่...`)
      if (this.desiredConnection) this.reconnectTimer = setTimeout(() => { this.reconnectTimer = undefined; if (this.desiredConnection) this.openConnection() }, 3000)
    }
    socket.onerror = () => this.onStatus('เชื่อมต่อไม่ได้ ตรวจว่าเซิร์ฟเวอร์ออนไลน์อยู่')
  }
  send(x: number, y: number, mapId: MapId, character: CharacterId, facing: number, moving: boolean, force = false, outfit: OutfitId = 'default', mounted = false, equipped: Partial<Record<GearSlot, GearId>> = {}) {
    if (!this.room || this.socket?.readyState !== WebSocket.OPEN) return
    const now = Date.now()
    const position = `${Math.round(x)},${Math.round(y)},${mapId},${character},${facing},${moving},${outfit},${mounted},${JSON.stringify(equipped)}`
    if (!force && (now - this.lastSent < 250 || (position === this.lastPosition && now - this.lastSent < 15000))) return
    this.lastSent = now
    this.lastPosition = position
    this.socket.send(JSON.stringify({ type: 'move', x, y, mapId, character, facing, moving, outfit, mounted, equipped }))
  }
  action(action: string, payload: Record<string, unknown>, callback: (result: ActionResult) => void): boolean {
    if (!this.room || this.socket?.readyState !== WebSocket.OPEN || !this.world) return false
    const seq = ++this.sequence
    this.pending.set(seq, callback)
    this.socket.send(JSON.stringify({ type: 'world-action', seq, action, ...payload }))
    return true
  }
  setParty(code: string) { if (this.room && this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: 'party', code })) }
  disconnect() {
    this.desiredConnection = undefined
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = undefined
    this.socket?.close()
    this.socket = undefined; this.id = ''; this.room = ''; this.partyCode = ''; this.players.clear(); this.world = undefined; this.serverOffsetMs = null; this.pending.clear(); this.onWorld(true); this.notifyChange()
  }
}
