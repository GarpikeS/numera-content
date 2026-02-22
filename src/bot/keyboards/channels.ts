import { InlineKeyboard } from 'grammy';
import type { Channel } from '../../types';

export function getChannelListKeyboard(channels: Channel[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const ch of channels) {
    const status = ch.is_active ? 'on' : 'off';
    kb.text(`${ch.is_active ? '🟢' : '🔴'} ${ch.title || ch.username}`, `ch:toggle:${ch.id}`)
      .text('✕', `ch:del:${ch.id}`)
      .row();
  }
  return kb;
}
