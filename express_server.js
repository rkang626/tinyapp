const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "1": {
    id: 1, 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "2": {
    id: 2, 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};

const getNextID = function(object) {
  const ids = Object.keys(object);
  const lastID = ids.reduce((a, b) => {
    return Math.max(a, b);
  });
  return lastID + 1;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { 
    user: users[userID]
  };
  res.render("user_registration", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { 
    user: users[userID],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { 
    user: users[userID]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const longURL = urlDatabase[req.params.shortURL];
  const templateVars = {
    user: users[userID],
    shortURL: req.params.shortURL,
    longURL
  };
  if (longURL) {
    res.render("urls_show", templateVars);
  } else {
    res.render("urls_new", templateVars); // if URL doesn't exist
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const id = getNextID(users);
  const email = req.body.email;
  const password = req.body.password;
  const newUser = {
    id,
    email,
    password
  };
  users[id] = newUser;
  res.cookie('user_id', id);
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});