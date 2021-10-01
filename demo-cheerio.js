const cheerio = require('cheerio')
const PAGE = cheerio.load('<h2 class="title">Hello world</h2>')

console.log("Extract :: "+ PAGE('h2').eq(0).text() );

PAGE('h2.title').text('Hello there!')
PAGE('h2').addClass('welcome')

PAGE.html()
