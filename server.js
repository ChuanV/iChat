var express = require('express')
var app = express()
var router = require('./router')
var path = require('path')
var session = require('express-session')
var bodyParser = require('body-parser')
var webSocket = require('./websocket')


app.use('/node_modules/',express.static(path.join(__dirname,'./node_modules/')))
app.use('/public/', express.static('./public/'))
app.use('/uploads/',express.static(path.join(__dirname,'./uploads/')))
app.use(session({secret:'mimi',resave:false,saveUninitialized: false}))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.engine('html', require('express-art-template'))

app.use(router)

app.listen(80,function(){
	console.log('webServer running at port 80 ...')
})
webSocket.listen(1234, function() {
	console.log('webSocketService running...')
})

