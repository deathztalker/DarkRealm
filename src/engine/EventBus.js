/**
 * EventBus — Central pub/sub system (multiplayer-ready)
 * All game actions flow through events. Future: serialize → WebSocket.
 */
export class EventBus {
  constructor() {
    this._listeners = {};
  }

  on(event, fn, context = null) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push({ fn, context });
    return () => this.off(event, fn);
  }

  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(l => l.fn !== fn);
  }

  emit(event, data = {}) {
    if (!this._listeners[event]) return;
    for (const { fn, context } of this._listeners[event]) {
      fn.call(context, data);
    }
  }

  once(event, fn) {
    const unsub = this.on(event, (data) => { fn(data); unsub(); });
  }

  clear() { this._listeners = {}; }
}

export const bus = new EventBus();
