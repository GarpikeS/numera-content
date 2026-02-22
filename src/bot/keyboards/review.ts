import { InlineKeyboard } from 'grammy';

export function getReviewKeyboard(postId: number, slotLabel?: string): InlineKeyboard {
  const approveText = slotLabel ? `Одобрить (${slotLabel})` : 'Одобрить';
  return new InlineKeyboard()
    .text(approveText, `review:approve:${postId}`)
    .text('Сейчас', `review:publish:${postId}`)
    .row()
    .text('Редактировать', `review:edit:${postId}`)
    .text('Перегенерировать', `review:regen:${postId}`)
    .row()
    .text('Отклонить', `review:reject:${postId}`);
}

export function getScheduleKeyboard(postId: number): InlineKeyboard {
  return getReviewKeyboard(postId);
}

/**
 * Format next free slot as a human-readable label.
 */
export function formatSlotLabel(slotDate: Date): string {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowDate = new Date(now);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);
  const slotStr = slotDate.toISOString().slice(0, 10);

  const mskHour = slotDate.getUTCHours() + 3;
  const timeStr = `${String(mskHour).padStart(2, '0')}:00`;

  if (slotStr === todayStr) return `сегодня ${timeStr}`;
  if (slotStr === tomorrowStr) return `завтра ${timeStr}`;

  const day = slotDate.getUTCDate();
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const month = months[slotDate.getUTCMonth()];
  return `${day} ${month} ${timeStr}`;
}
