import { InlineKeyboard } from 'grammy';

export function getReviewKeyboard(postId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('Опубликовать', `review:publish:${postId}`)
    .text('Запланировать', `review:schedule:${postId}`)
    .row()
    .text('Редактировать', `review:edit:${postId}`)
    .text('Перегенерировать', `review:regen:${postId}`)
    .row()
    .text('Отклонить', `review:reject:${postId}`);
}

export function getScheduleKeyboard(postId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('09:00', `schedule:09:${postId}`)
    .text('13:00', `schedule:13:${postId}`)
    .text('18:00', `schedule:18:${postId}`)
    .row()
    .text('Назад', `review:back:${postId}`);
}
