import { Keyboard } from 'grammy';

export function getMainMenu(): Keyboard {
  return new Keyboard()
    .text('Дайджест').text('Генерация').row()
    .text('Идеи').text('Модерация').row()
    .text('Стат').text('Каналы')
    .resized()
    .persistent();
}
