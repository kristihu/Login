'use strict';
require('dotenv').config();
const express    = require('express');
const fs         = require('fs');
const https      = require('https');
const http       = require('http');
const bodyParser = require('body-parser');
const passport   = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
const db = require('./modules/database');
const connection = db.connect();

passport.serializeUser((user, done) => {
  console.log('serialize: ' + user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(session({
  secret: 'keyboard LOL cat',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true }
}));

passport.use(new LocalStrategy(
  (username, password, done) => {
    console.log('Here we go: ' + username);
    db.login([username, password], connection, (result)=> {
      console.log('result', result);
    });

    if (username !== process.env.USR_NAME || password !== process.env.USR_PWD) { return done(null, false); }
    return done(null, { username: username } );
  }
));

app.use(passport.initialize());
app.use(passport.session());

app.post('/login',
  passport.authenticate('local', { successRedirect: '/node/', failureRedirect: '/node/login.html' }));

app.set('trust proxy');
const sslkey  = fs.readFileSync('/etc/pki/tls/private/ca.key');
const sslcert = fs.readFileSync('/etc/pki/tls/certs/ca.crt');
const options = {
  key: sslkey,
  cert: sslcert
};

app.get('/', (req,res) => {
  if (req.secure) {
    console.log(req.user);
    if(req.user !== undefined) res.send('Hello ' + req.user.username);
    else res.send('https :)');
  }
  else res.send('hello not secure?');
});

//app.listen(8000);
http.createServer((req, res) => {
  const redir = 'https://' + req.headers.host + '/node' + req.url;
  console.log(redir);
  res.writeHead(301, { 'Location': redir });
  res.end();
}).listen(8000);
https.createServer(options, app).listen(3000);
