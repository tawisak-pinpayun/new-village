export type NpcAnimationState = 'IDLE' | 'WORKING' | 'WALKING' | 'PLAYER_NEARBY' | 'GREETING' | 'TALKING' | 'RETURN_TO_IDLE'

export type NpcAnimationClips = Record<NpcAnimationState, number[]>

export class NPCAnimationController {
  state: NpcAnimationState = 'IDLE'
  readonly clips: NpcAnimationClips
  private stateStartedAt = 0
  private stateUntil = 0
  private wasNear = false

  constructor(clips: NpcAnimationClips) { this.clips = clips }

  transition(next: NpcAnimationState, now: number, duration = 0) {
    if (this.state === next) return
    this.state = next
    this.stateStartedAt = now
    this.stateUntil = duration ? now + duration : 0
  }

  update(now: number, near: boolean, talking: boolean, walking = false) {
    if (talking) this.transition('TALKING', now)
    else if (walking) this.transition('WALKING', now)
    else if (near && !this.wasNear) this.transition('GREETING', now, 1300)
    else if (this.state === 'GREETING' && now >= this.stateUntil) this.transition('PLAYER_NEARBY', now)
    else if (!near && this.wasNear) this.transition('RETURN_TO_IDLE', now, 450)
    else if (this.state === 'RETURN_TO_IDLE' && now >= this.stateUntil) this.transition('IDLE', now)
    else if (!near && this.state === 'IDLE' && Math.floor(now / 6000) % 4 === 2) this.transition('WORKING', now, 1500)
    else if (this.state === 'WORKING' && now >= this.stateUntil) this.transition('IDLE', now)
    else if (!talking && this.state === 'TALKING') this.transition(near ? 'PLAYER_NEARBY' : 'RETURN_TO_IDLE', now, near ? 0 : 450)
    this.wasNear = near
  }

  frame(now: number) {
    const frames = this.clips[this.state]
    return frames[Math.floor((now - this.stateStartedAt) / 220) % frames.length]
  }
}
