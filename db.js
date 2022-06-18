const {Sequelize} = require('sequelize')

module.exports = new Sequelize (
  'telgram_bot',
  'root',
  'root',
  {
    host: '81.163.24.252',
    port: '6432',
    dialect: 'postgres'
  }
)