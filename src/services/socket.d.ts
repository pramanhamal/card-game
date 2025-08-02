// src/services/socket.d.ts
import type { Socket } from "socket.io-client";

export declare function setPlayerName(name: string): void;
declare const socket: Socket;
export default socket;
