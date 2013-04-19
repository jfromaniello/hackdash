
/**
 * Module dependencies.
 */

var express = require('express')
  , passport = require('passport')
  , mongoose = require('mongoose')
  , MongoStore = require('connect-mongo')(express)
  , http = require('http')
  , nconf = require('nconf');

nconf.env()
     .file({ file: __dirname + '/config.json', logicalSeparator: '||' })
     .defaults({
        PORT:           4000,
        SESSION_SECRET: 'a1b2c3d4567',
        AUTHENTICATION: 'FORM'
     });

/*
 * DB
 */

mongoose.connect(nconf.get('db').url || ('mongodb://' + nconf.get('db').host + '/'+ nconf.get('db').name));

var app = exports.app = express();

/*
 * Application config
 */

app.configure(function(){
  app.set('port', process.env.PORT || nconf.get('port'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.limit('3.5mb'));
  app.use(express.methodOverride());
  app.use(express.cookieParser(nconf.get('session')));
  app.use(express.session({
      secret: nconf.get('session')
    , store: new MongoStore({db: nconf.get('db').name, url:
nconf.get('db').url}) 
    , cookie: { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', domain: '.' + nconf.get('host') }
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.set('statuses',['brainstorming','wireframing','building','researching','prototyping','releasing']);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/*
 * Models
 */

require('./models')(app);

/*
 * Auth
 */

require('./auth')(app);

/*
 * Routes
 */

require('./routes')(app);

module.exports = http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});

process.on('uncaughtException', function(err){
  console.log(err);
});
