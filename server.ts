import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';

const app = express();
const PORT = 3000;

// Hardcoded credentials
const USERNAME = 'automation';
const PASSWORD = 'testautomation123';

const ROOT_DIR = process.cwd();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(ROOT_DIR, 'public')));
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
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
    res.sendFile(path.join(ROOT_DIR, 'views', 'welcome.html'));
  } else {
    res.redirect('/');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
