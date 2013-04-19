
/*
 * Module dependencies
 */

var passport = require('passport')
  , mongoose = require('mongoose')
  , nconf = require('nconf');

var User = mongoose.model('User');

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
    done(err, user);
  });
});

var initauth0 = function(app) {
  app.get('/e/:connection', function (req, res) {
    passport.authenticate('auth0', {connection: req.params.connection})(req, res);
  });
  app.get('/auth', passport.authenticate('auth0'));
  app.get('/auth/callback',
    function (req, res, next) {
      if (!req.query.granted) return next();
      return res.redirect('/?granted=' + req.query.domain);
    },
    passport.authenticate('auth0', { failureRedirect: '/' }), 
    function(req, res){ res.redirect('/'); });

  var Auth0Strategy = require('passport-auth0');
  passport.use(new Auth0Strategy(nconf.get('auth0'), findOrCreateUser));
};

var findOrCreateUser = function(token, tokenSecret, profile, done) {
  User.findOne({provider_id: profile.id}, 
    function(err, user){
      if(err) {
        console.log(err);
        return done(err);
      }
      if(!user) {
        createUser(profile, done);
      } else {  
        done(null, user);
      }
    });
};

var createUser = function(profile, done) {
  var user = new User();
  user.provider_id = profile.id;
  if(profile.emails && profile.emails.length && profile.emails[0].value)
    user.email = profile.emails[0].value;
  
  user.company = profile.identities[0].connection;
  user.is_social = profile.identities[0].isSocial;
  user.picture = profile.picture;
  user.name = profile.displayName;
  user.username = profile.username || profile.displayName;
  user.save(done);
};



module.exports = initauth0;
