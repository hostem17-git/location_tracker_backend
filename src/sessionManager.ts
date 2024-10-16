import { WebSocket } from "ws";
import {
  START_SESSION,
  UPDATE_LOCATION,
  STOP_SESSION,
  SUBSCRIBE,
  UNSUBSCRIBE,
  ERROR,
  LIST_SESSIONS,
} from "./message";
import { Session } from "./session";

export class SessionManager {
  private sessions: Map<string, Session>;

  private generateRandomId() {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  constructor() {
    this.sessions = new Map<string, Session>();
  }

  private noSession(socket: WebSocket) {
    console.log("Session not found");
    socket.send(
      JSON.stringify({
        type: ERROR,
        payload: { message: "Session not found" },
      })
    );
    return;
  }

  createSession(socket: WebSocket) {
    let sessionId;
    do {
      sessionId = this.generateRandomId();
    } while (this.sessions.has(sessionId));

    const newSession = new Session(socket);
    this.sessions.set(sessionId, newSession);

    socket.send(
      JSON.stringify({
        type: START_SESSION,
        payload: { message: `Session ${sessionId} created`, sessionId },
      })
    );
    console.log(`Session ${sessionId} created`);
  }

  stopSession(sessionId: string, socket: WebSocket) {
    const session = this.getSession(sessionId);

    if (!session) {
      this.noSession(socket);
      return;
    }
    session.endBroadCast(socket);

    socket.send(
      JSON.stringify({
        type: STOP_SESSION,
        message: `session ${sessionId} stopped`,
      })
    );
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(socket: WebSocket) {
    const sessions_list = Array.from(this.sessions.keys());
    socket.send(
      JSON.stringify({
        type: LIST_SESSIONS,
        payload: sessions_list,
      })
    );
    return;
  }

  subscribeToSession(sessionId: string, socket: WebSocket) {
    const session = this.getSession(sessionId);

    if (!session) {
      this.noSession(socket);
      return;
    }

    session.subscribe(socket);
    console.log(`Socket subsribed to session ${sessionId}`);

    socket.send(
      JSON.stringify({
        type: SUBSCRIBE,
        payload: {
          message: `Subscribed to session ${sessionId}`,
        },
      })
    );
  }

  unsubscribeFromSession(sessionId: string, socket: WebSocket) {
    const session = this.getSession(sessionId);
    if (!session) {
      this.noSession(socket);
      return;
    }

    session.unsubscribe(socket);
    console.log(`Socket unsubscribed from session ${sessionId}`);
    socket.send(
      JSON.stringify({
        type: UNSUBSCRIBE,
        payload: { message: `Unsubscribed from session ${sessionId}` },
      })
    );
  }

  updateLocation(
    sessionId: string,
    socket: WebSocket,
    location: { latitude: string; longitude: string }
  ) {
    const session = this.getSession(sessionId);

    if (!session) {
      this.noSession(socket);
      return;
    }
    session.updateLocation(socket, location);
  }
}
