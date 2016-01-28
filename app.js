

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var sessionStore = new session.MemoryStore({reapInterval: 1000 * 60 * 30});
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var ajaxAction = require('./routes/ajaxAction');
var users = require('./routes/users');
var socketHandler = require('./Model/socketHandler');


const COOKIE_SECRET = 'secret',
      COOKIE_KEY  = 'express.sid';

var app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  store:sessionStore,
  secret:COOKIE_SECRET,
  key:COOKIE_KEY,
  resave:false,
  saveUninitialized:false
}));
io.use(function(socket, next) {
  var data = socket.handshake || socket.request;
  if (data.headers.cookie) {
    try{
      data.cookie = cookie.parse(data.headers.cookie);
      data.sessionID = cookieParser.signedCookie(data.cookie[COOKIE_KEY], COOKIE_SECRET);
      data.sessionStore = sessionStore;
      sessionStore.get(data.sessionID, function (err, session) {
        if (err || !session) {
          return next(new Error('session not found'))
        } else {
          data.session = session;
          data.session.id = data.sessionID;
          next();
        }
      });
    }catch(err){
      console.log("sio-session-err:",err);
    }
  } else {
    return next(new Error('Missing cookie headers'));
  }
});


io.on("connection",socketHandler);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/ajax',ajaxAction);
app.use('/users', users);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



var debug = require('debug')('UnderCover:server');


/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);




/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

module.exports = app;

