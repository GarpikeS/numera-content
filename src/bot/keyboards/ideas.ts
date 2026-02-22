import { InlineKeyboard } from 'grammy';
import type { Idea } from '../../types';

export function getIdeasKeyboard(ideas: Idea[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const idea of ideas) {
    const short = idea.text.length > 30 ? idea.text.slice(0, 30) + '…' : idea.text;
    kb.text(short, `idea:view:${idea.id}`)
      .text('✕', `idea:del:${idea.id}`)
      .row();
  }
  kb.text('Добавить идею', 'idea:add');
  return kb;
}
