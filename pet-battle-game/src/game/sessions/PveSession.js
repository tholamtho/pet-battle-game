import { battlesApi } from '@/api/battlesApi.js';

/** Wild battle on the server (REST). Each turn is one request; the server picks the wild pet's move. */
export class PveSession {
  static async start(body = {}) {
    return new PveSession(await battlesApi.startPve(body));
  }

  static fromView(view) {
    return new PveSession(view);
  }

  /** `view` is the server's battle view, e.g. from GET /battles/active (resume after reload). */
  constructor(view) {
    this.id = view.battleId;
    this.you = view.you;
    this.state = view.state;
  }

  async submitSkill(skillId) {
    const result = await battlesApi.turn(this.id, skillId);
    this.state = result.state;
    return result;
  }

  forfeit() {
    return battlesApi.forfeit(this.id);
  }

  close() {}
}
