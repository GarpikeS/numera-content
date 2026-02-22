import { Keyboard } from 'grammy';

export function getMainMenu(): Keyboard {
  return new Keyboard()
    .text('Сводка рынка').text('Новый пост').row()
    .text('Мои идеи').text('На проверке').row()
    .text('Статистика').text('Источники')
    .resized()
    .persistent();
}
