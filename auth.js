
/*
 * Module dependencies
 */

var passport = require('passport')
  , keys = require('./keys.json')
  , mongoose = require('mongoose')
  , gravatar = require('gravatar');

var User = mongoose.model('User');

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
    done(err, user);
  });
});

var initStrategies = function(app) {

  app.set('providers', Object.keys(keys));

  for(var provider in keys) {
    initStrategy(app, keys, provider);
  }
};

var initStrategy = function(app, keys, provider) {
  app.get('/auth/' + provider, passport.authenticate(provider));
  app.get('/auth/' + provider + '/callback',
    passport.authenticate(provider, { failureRedirect: '/' }), 
    function(req, res){ res.redirect('/'); });

  var Auth0Strategy = require('passport-auth0');
  passport.use(new Auth0Strategy(keys[provider], findOrCreateUser(provider)));
};

var findOrCreateUser = function (provider) {
  return function(token, tokenSecret, profile, done) {
    User.findOne({provider_id: profile.id, provider: provider}, 
      function(err, user){
        if(err) {
          console.log(err);
          return done(err);
        }
        if(!user) {
          createUser(provider, profile, done);
        } else {  
          done(null, user);
        }
      });
  };
};

var createUser = function(provider, profile, done) {
  var user = new User();
  user.provider = provider;
  user.provider_id = profile.id;

  if(profile.emails && profile.emails.length && profile.emails[0].value)
    user.email = profile.emails[0].value;
    
  user.picture = profile.picture;
  user.name = profile.displayName;
  user.username = profile.username || profile.displayName;
  user.save(done);
};



module.exports = initStrategies;
