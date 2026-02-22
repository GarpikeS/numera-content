import { Context, SessionFlavor } from 'grammy';
import type { InputState } from '../types';

export interface SessionData {
  inputState: InputState;
}

export type BotContext = Context & SessionFlavor<SessionData>;

export function initialSession(): SessionData {
  return {
    inputState: { mode: null },
  };
}
