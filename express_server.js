const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080;

// set middleware

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// create database

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 1
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 2
  }
};

const userDatabase = { 
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

// create helper functions

const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};

const getNextID = function(object) {
  const ids = Object.keys(object);
  const lastID = ids.reduce((a, b) => {
    return Math.max(a, b);
  });
  return lastID + 1;
};

const getUserByEmail = function(email) {
  const ids = Object.keys(userDatabase);
  for (id of ids) {
    if (userDatabase[id]["email"] === email) {
      return userDatabase[id];
    }
  };
  return false;
};

const urlsForUser = function(id) {
  const userURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url]["userID"] === parseInt(id)) {
      userURLs[url] = urlDatabase[url];
    }
  };
  return userURLs;
};

// general GET endpoints

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// user GET endpoints

app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { 
    user: userDatabase[userID]
  };
  res.render("user_registration", templateVars);
});

app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { 
    user: userDatabase[userID]
  };
  res.render("user_login", templateVars);
});

// URL GET endpoints

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { 
    user: userDatabase[userID],
    urls: urlsForUser(userID)
  };

  if (userID) {
    res.render("urls_index", templateVars);
  } else {
    res.render("access_denied", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { 
    user: userDatabase[userID]
  };

  if (userID) {
    res.render("urls_new", templateVars);
  } else {
    res.render("access_denied", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  const shortURL = req.params.shortURL;
  const templateVars = {
    user: userDatabase[userID],
    shortURL,
    longURL
  };

  if (userID && urlDatabase[shortURL]["userID"] === parseInt(userID)) {
    if (longURL) {
      res.render("urls_show", templateVars);
    } else {
      res.render("urls_new", templateVars); // if URL doesn't exist
    }
  } else {
    res.render("access_denied", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});

// user POST endpoints

app.post("/register", (req, res) => {
  const id = getNextID(userDatabase);
  const email = req.body.email;
  const password = req.body.password;
  const newUser = {
    id,
    email,
    password
  };

  if (!email || !password || getUserByEmail(email)) {
    res.status(400).end();
  } else {
    userDatabase[id] = newUser;
    res.cookie('user_id', id);
    res.redirect(`/urls`);
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (getUserByEmail(email) && password === getUserByEmail(email)["password"]) {
    res.cookie('user_id', getUserByEmail(email)["id"]);
    res.redirect("/urls");
  } else {
    res.status(403).end();
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

// URL POST endpoints

// endpoint for creating a new URL
app.post("/urls", (req, res) => {
  const userID = req.cookies["user_id"]
  const longURL = req.body.longURL;
  const newURL = {
    longURL,
    userID
  };
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = newURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

// endpoint for deleting an existing URL
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect("/urls");
});

// endpoint for updating an existing URL
app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL]["longURL"] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect("/urls");
});

// listening

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});