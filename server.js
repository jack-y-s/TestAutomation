const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Hardcoded credentials
const USERNAME = 'automation';
const PASSWORD = 'testautomation123';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    req.session.authenticated = true;
    res.redirect('/welcome');
  } else {
    req.session.authenticated = false;
    res.redirect('/?error=1');
  }
});

app.get('/welcome', (req, res) => {
  if (req.session.authenticated) {
    res.sendFile(path.join(__dirname, 'views', 'welcome.html'));
  } else {
    res.redirect('/');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
