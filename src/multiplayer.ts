import type { MapId } from './domain'

export type RemotePlayer = { id: string; name: string; x: number; y: number; mapId: MapId; character: 'a' | 'b'; facing: number; moving: boolean }
export class Multiplayer {
  socket?: WebSocket
  id = ''
  room = ''
  players = new Map<string, RemotePlayer>()
  onChange: () => void = () => {}
  onStatus: (text: string) => void = () => {}
  private lastSent = 0
  private lastPosition = ''

  connect(room: string, name: string, character: 'a' | 'b') {
    this.disconnect()
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.DEV ? `${location.hostname}:3000` : location.host
    const socket = new WebSocket(`${protocol}//${host}/multiplayer`)
    this.socket = socket
    this.onStatus('กำลังเชื่อมต่อห้อง...')
    socket.onopen = () => socket.send(JSON.stringify({ type: 'join', room, name, character }))
    socket.onmessage = event => {
      let data: any
      try { data = JSON.parse(event.data) } catch { return }
      if (data.type === 'joined') {
        this.id = data.id; this.room = data.room
        this.players = new Map(data.players.map((p: RemotePlayer) => [p.id, p]))
        this.onStatus(`อยู่ในห้อง ${this.room} · ${this.players.size + 1} คน`)
        this.onChange()
      } else if (data.type === 'player' && data.player?.id !== this.id) {
        this.players.set(data.player.id, data.player)
        this.onStatus(`อยู่ในห้อง ${this.room} · ${this.players.size + 1} คน`)
        this.onChange()
      } else if (data.type === 'left') {
        this.players.delete(data.id)
        this.onStatus(`อยู่ในห้อง ${this.room} · ${this.players.size + 1} คน`)
        this.onChange()
      } else if (data.type === 'error') {
        this.onStatus(data.message)
        socket.close()
      }
    }
    socket.onclose = () => {
      if (this.socket !== socket) return
      this.id = ''; this.room = ''; this.players.clear(); this.onChange()
      this.onStatus('หลุดจากห้อง กดเข้าห้องอีกครั้ง')
    }
    socket.onerror = () => this.onStatus('เชื่อมต่อไม่ได้ ตรวจว่าเซิร์ฟเวอร์ออนไลน์อยู่')
  }
  send(x: number, y: number, mapId: MapId, character: 'a' | 'b', facing: number, moving: boolean, force = false) {
    if (!this.room || this.socket?.readyState !== WebSocket.OPEN) return
    const now = Date.now()
    const position = `${Math.round(x)},${Math.round(y)},${mapId},${character},${facing},${moving}`
    if (!force && (now - this.lastSent < 100 || (position === this.lastPosition && now - this.lastSent < 15000))) return
    this.lastSent = now
    this.lastPosition = position
    this.socket.send(JSON.stringify({ type: 'move', x, y, mapId, character, facing, moving }))
  }
  disconnect() {
    this.socket?.close()
    this.socket = undefined; this.id = ''; this.room = ''; this.players.clear(); this.onChange()
  }
}
