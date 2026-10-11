export type ChatMessage = { name: string; text: string; time: number }

export class WorldChat {
  private socket?: WebSocket
  private retry?: number
  private closed = false
  messages: ChatMessage[] = []
  onMessages: (messages: ChatMessage[]) => void = () => {}
  onStatus: (text: string) => void = () => {}

  connect() {
    this.closed = false
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.DEV ? `${location.hostname}:3000` : location.host
    const socket = new WebSocket(`${protocol}//${host}/multiplayer`)
    this.socket = socket
    this.onStatus('กำลังเชื่อมต่อแชทโลก')
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'chat-join', name: localStorage.getItem('new-village.player-name') || 'ชาวบ้าน' }))
      this.onStatus('แชทโลกออนไลน์')
    }
    socket.onmessage = event => {
      let data: any
      try { data = JSON.parse(event.data) } catch { return }
      if (data.type === 'chat-history' && Array.isArray(data.messages)) this.messages = data.messages.slice(-40)
      else if (data.type === 'chat') this.messages.push({ name: String(data.name), text: String(data.text), time: Number(data.time) })
      else return
      this.messages = this.messages.slice(-40)
      this.onMessages(this.messages)
    }
    socket.onclose = () => {
      if (this.socket !== socket || this.closed) return
      this.onStatus('แชทหลุด กำลังเชื่อมต่อใหม่')
      this.retry = window.setTimeout(() => this.connect(), 3000)
    }
  }

  send(text: string): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) return false
    this.socket.send(JSON.stringify({ type: 'chat', text: text.trim().slice(0, 200) }))
    return true
  }

  setName(name: string) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: 'chat-name', name }))
  }

  disconnect() {
    this.closed = true
    if (this.retry) window.clearTimeout(this.retry)
    this.socket?.close()
  }
}
