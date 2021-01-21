const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};

const getNextID = function(object) {
  const ids = Object.keys(object);
  if (ids.length > 0) {
    const lastID = ids.reduce((a, b) => {
      return Math.max(a, b);
    });
    return lastID + 1;
  } else {
    return 1;
  }
};

const getUserByEmail = function(email, database) {
  const ids = Object.keys(database);
  for (const id of ids) {
    if (database[id]["email"] === email) {
      return database[id];
    }
  }
  return undefined;
};

const urlsForUser = function(id, database) {
  const userURLs = {};
  for (const url in database) {
    if (database[url]["userID"] === parseInt(id)) {
      userURLs[url] = database[url];
    }
  }
  return userURLs;
};

module.exports = {
  generateRandomString,
  getNextID,
  getUserByEmail,
  urlsForUser
};