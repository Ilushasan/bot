const TelegramApi = require('node-telegram-bot-api')
const {gameOptions, againOptions} = require('./options')
const sequelize = require('./db')
const UserModel = require('./models')

const token = '5307675123:AAFmNmacaK_uE0sO2V_SOQT88zC7AJD1XFY'

const bot = new TelegramApi(token, {polling: true})

const chats = {}



const startGame = async (chatId) => {
  await bot.sendMessage(chatId, `Сейчас я загадаю число от 0 до 9, а ты должен отгадать`)
  const randomNumber = Math.floor(Math.random()*10)
  chats[chatId] = randomNumber
  await bot.sendMessage(chatId, 'Отгадай', gameOptions)
}

const start = async () => {

  try {
    await sequelize.authenticate()
    await sequelize.sync()
  }catch(e) {
    console.log('Подключение к бд сломалось', e)
  }

  bot.setMyCommands([
    {command: '/start', description: 'Начальное приветствие'},
    {command: '/info', description: 'Получить информацию о пользователе'},
    {command: '/game', description: 'Игра угадай цифру'}
  ])
  
  bot.on('message', async msg => {
    const text = msg.text;
    const chatId = msg.chat.id;
  
    try {
      if (text === '/start') {
        await UserModel.create({chatId})
        await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/7.webp')
        return bot.sendMessage(chatId, `Добро пожаловать к чат боту. Напиши /info и я угадаю твое имя`)
      }
      if(text === '/info') {
        const user = await UserModel.findOne({chatId})
        return bot.sendMessage(chatId, `Тебя зовут ${msg.from.first_name}, в игре у тебя правильных ответов ${user.right}, неправильных ${user.wrong}`)
      }
      if(text === '/game') {
        return startGame(chatId)
      }
      return bot.sendMessage(chatId, `Я тебя не понимаю`)
    } catch(e) {
      return bot.sendMessage(chatId, 'Произошла какая то ошибка')
    }
  })

  bot.on('callback_query', async msg => {
    const data = msg.data
    const chatId = msg.message.chat.id
    if(data === '/again') {
      return startGame(chatId)
    }
    const user = await UserModel.findOne({chatId})
    if(data == chats[chatId]) {
      user.right +=1
      await bot.sendMessage(chatId, `Поздравляю, ты отгадал цифру ${chats[chatId]}`, againOptions)
    } else {
      user.wrong +=1
      await bot.sendMessage(chatId, `К сожалению ты не отгадал, бот загадал цифру ${chats[chatId]}`, againOptions) 
    }
    await user.save()
  })
}

start()