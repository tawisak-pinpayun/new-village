export type NpcAnimationState = 'IDLE' | 'BLINK' | 'WORKING' | 'WALKING' | 'PLAYER_NEARBY' | 'GREETING' | 'INTERACT' | 'TALKING' | 'HAPPY' | 'RETURN_TO_IDLE'

export type NpcAnimationClips = Record<Exclude<NpcAnimationState, 'BLINK' | 'INTERACT' | 'HAPPY'>, number[]> & Partial<Record<'BLINK' | 'INTERACT' | 'HAPPY', number[]>>

export class NPCAnimationController {
  state: NpcAnimationState = 'IDLE'
  readonly clips: NpcAnimationClips
  private stateStartedAt = 0
  private stateUntil = 0
  private wasNear = false
  private nextBlinkAt = 3600
  private nextWorkAt = 8000

  constructor(clips: NpcAnimationClips) { this.clips = clips }

  transition(next: NpcAnimationState, now: number, duration = 0) {
    if (this.state === next) return
    this.state = next
    this.stateStartedAt = now
    this.stateUntil = duration ? now + duration : 0
  }
  react(now: number, happy = false) {
    this.state = happy ? 'HAPPY' : 'INTERACT'
    this.stateStartedAt = now
    this.stateUntil = now + (happy ? 1050 : 650)
  }

  update(now: number, near: boolean, talking: boolean, walking = false) {
    if ((this.state === 'HAPPY' || this.state === 'INTERACT') && now < this.stateUntil) { this.wasNear = near; return }
    if (talking) this.transition('TALKING', now)
    else if (walking) this.transition('WALKING', now)
    else if (this.state === 'HAPPY' || this.state === 'INTERACT') this.transition(near ? 'PLAYER_NEARBY' : 'RETURN_TO_IDLE', now, near ? 0 : 450)
    else if (near && !this.wasNear) this.transition('GREETING', now, 1300)
    else if (this.state === 'GREETING' && now >= this.stateUntil) this.transition('PLAYER_NEARBY', now)
    else if (!near && this.wasNear) this.transition('RETURN_TO_IDLE', now, 450)
    else if (this.state === 'RETURN_TO_IDLE' && now >= this.stateUntil) this.transition('IDLE', now)
    else if (this.state === 'BLINK' && now >= this.stateUntil) this.transition(near ? 'PLAYER_NEARBY' : 'IDLE', now)
    else if (!near && this.state === 'IDLE' && now >= this.nextBlinkAt) { this.transition('BLINK', now, 160); this.nextBlinkAt = now + 4200 + Math.floor(now % 1900) }
    else if (!near && this.state === 'IDLE' && now >= this.nextWorkAt) {
      this.transition('WORKING', now, 1800)
      this.nextWorkAt = now + 11000 + Math.floor(now % 3000)
    }
    else if (this.state === 'WORKING' && now >= this.stateUntil) this.transition('IDLE', now)
    else if (!talking && this.state === 'TALKING') this.transition(near ? 'PLAYER_NEARBY' : 'RETURN_TO_IDLE', now, near ? 0 : 450)
    this.wasNear = near
  }

  frame(now: number) {
    const frames = this.clips[this.state] ?? this.clips[this.state === 'BLINK' ? 'IDLE' : 'GREETING']
    const frameMs = this.state === 'WALKING' ? 165 : this.state === 'TALKING' ? 210 : 320
    return frames[Math.floor((now - this.stateStartedAt) / frameMs) % frames.length]
  }
}
