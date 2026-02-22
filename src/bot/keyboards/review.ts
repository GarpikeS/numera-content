import { InlineKeyboard } from 'grammy';

export function getReviewKeyboard(postId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('09:00 МСК', `schedule:09:${postId}`)
    .text('13:00 МСК', `schedule:13:${postId}`)
    .text('18:00 МСК', `schedule:18:${postId}`)
    .row()
    .text('Сейчас', `review:publish:${postId}`)
    .text('Редактировать', `review:edit:${postId}`)
    .row()
    .text('Перегенерировать', `review:regen:${postId}`)
    .text('Отклонить', `review:reject:${postId}`);
}

export function getScheduleKeyboard(postId: number): InlineKeyboard {
  return getReviewKeyboard(postId);
}
