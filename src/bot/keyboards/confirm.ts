import { InlineKeyboard } from 'grammy';

export function getConfirmKeyboard(action: string, id: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('Да', `confirm:${action}:${id}`)
    .text('Нет', `confirm:cancel:${id}`);
}
