const express = require("express");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");

const { generateRandomString } = require("./helpers.js");
const { getNextID } = require("./helpers.js");
const { getUserByEmail } = require("./helpers.js");
const { urlsForUser } = require("./helpers.js");

const app = express();
const PORT = 8080;

// set middleware

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["secret-key"]
}));
app.use(methodOverride("_method"));

// create database

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 1,
    visits: 0,
    visitors: [],
    log: {}
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 2,
    visits: 0,
    visitors: [],
    log: {}
  }
};

const userDatabase = {
  "1": {
    id: 1,
    email: "user@example.com",
    hashedPassword: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "2": {
    id: 2,
    email: "user2@example.com",
    hashedPassword: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

// general GET endpoints for root pages

app.get("/", (req, res) => {
  const userID = req.session["user_id"];
  if (userID) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// user GET endpoints

// render the user registration page
app.get("/register", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: userDatabase[userID]
  };
  if (userID) {
    res.redirect("/urls");
  } else {
    res.render("user_registration", templateVars);
  }
});

// render the user login page
app.get("/login", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: userDatabase[userID]
  };
  if (userID) {
    res.redirect("/urls");
  } else {
    res.render("user_login", templateVars);
  }
  
});

// URL GET endpoints

// show URL data in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// render the "My URLs" page if user is logged in, otherwise render the "Access Denied" page
app.get("/urls", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: userDatabase[userID],
    urls: urlsForUser(userID, urlDatabase)
  };

  if (userID) {
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/access_denied");
  }
});

// render the "Create New URL" page if user is logged in, otherwise render the "Access Denied" page
app.get("/urls/new", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: userDatabase[userID]
  };

  if (userID) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// render the /:shortURL page if user is logged in and user created the URL, otherwise render the "Access Denied" page. if URL does not exist then render the "Create New URL" page.
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["user_id"];
  let longURL = undefined;
  if (urlDatabase[req.params.shortURL]) {
    longURL = urlDatabase[req.params.shortURL]["longURL"];
  }
  const shortURL = req.params.shortURL;
  const templateVars = {
    user: userDatabase[userID],
    urlVisits: urlDatabase[shortURL]["visits"],
    urlVisitors: urlDatabase[shortURL]["visitors"].length,
    urlLog: urlDatabase[shortURL]["log"],
    shortURL,
    longURL
  };

  if (!longURL) {
    res.redirect("/bad_url");
  } else {
    if (userID && urlDatabase[shortURL]["userID"] === parseInt(userID)) {
      res.render("urls_show", templateVars);
    } else {
      res.redirect("/access_denied");
    }
  }
});

// direct all users to the corresponding "longURL"
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let longURL = undefined;
  if (urlDatabase[shortURL]) {
    longURL = urlDatabase[shortURL]["longURL"];
  }
  if (!longURL) {
    res.redirect("/bad_url");
  } else {
    urlDatabase[shortURL]["visits"]++;

    const visitor_id = req.session["user_id"] || generateRandomString();
    const pastVisitors = urlDatabase[shortURL]["visitors"];
    if (!req.session["visitor_id"] && !pastVisitors.includes(visitor_id)) {
      req.session["visitor_id"] = visitor_id;
      urlDatabase[shortURL]["visitors"].push(visitor_id);
    }

    const currentdate = new Date(); 
    const datetime = (currentdate.getMonth()+1) + "/" + currentdate.getDate() + "/" + currentdate.getFullYear() + " @ "  + currentdate.getHours() + ":"  + currentdate.getMinutes()  + ":"  + currentdate.getSeconds();
    urlDatabase[shortURL]["log"][datetime] = visitor_id;

    res.redirect(longURL);
  }
});

// GET endpoints for error pages

app.get("/access_denied", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: userDatabase[userID]
  };
  res.render("access_denied", templateVars);
});

app.get("/register_error", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: userDatabase[userID]
  };
  res.render("register_error", templateVars);
});

app.get("/login_error", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: userDatabase[userID]
  };
  res.render("login_error", templateVars);
});

app.get("/bad_url", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = {
    user: userDatabase[userID]
  };
  res.render("bad_url", templateVars);
});

// user POST endpoints

// add new user to userDatabase after they register. if user exists or a field is blank then direct them to appropriate error page.
app.post("/register", (req, res) => {
  const id = getNextID(userDatabase);
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id,
    email,
    hashedPassword
  };

  if (!email || !password || getUserByEmail(email, userDatabase)) {
    res.status(400);
    res.redirect("/register_error");
  } else {
    userDatabase[id] = newUser;
    req.session["user_id"] = id;
    res.redirect("/urls");
  }
});

// create user session when user logs in. email must exist in userDatabase and password must match.
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (getUserByEmail(email, userDatabase) && bcrypt.compareSync(password, getUserByEmail(email, userDatabase)["hashedPassword"])) {
    req.session["user_id"] = getUserByEmail(email, userDatabase)["id"];
    res.redirect("/urls");
  } else {
    res.status(403);
    res.redirect("/login_error");
  }
});

// clear user session when user logs out. redirect to the login page.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// URL POST endpoints

// add new URL to the urlDatabase
app.post("/urls", (req, res) => {
  const userID = req.session["user_id"];
  const longURL = req.body.longURL;
  const newURL = {
    longURL,
    userID,
    visits: 0,
    visitors: [],
    log: {}
  };
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});

// delete the selected URL. user must be logged in and own the URL.
app.delete("/urls/:shortURL", (req, res) => {
  const userID = req.session["user_id"];

  if (userID && urlDatabase[req.params.shortURL]["userID"] === parseInt(userID)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).end();
  }
});

// updating the selected URL. user must be logged in and own the URL.
app.put("/urls/:shortURL", (req, res) => {
  const userID = req.session["user_id"];

  if (userID && urlDatabase[req.params.shortURL]["userID"] === parseInt(userID)) {
    urlDatabase[req.params.shortURL]["longURL"] = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(403).end();
  }
});

// listening

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});