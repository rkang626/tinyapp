const { assert } = require("chai");
const { getUserByEmail } = require("../helpers.js");
const { getNextID } = require("../helpers.js");
const { urlsForUser } = require("../helpers.js");

const testUsers = {
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

const testURLs = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 1
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 1
  }
};

const emptyUsers = {};

describe('getUserByEmail', function() {

  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = {
      id: 1,
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(expectedOutput, user);
  });

  it('should return undefined for non-existent email', function() {
    const user = getUserByEmail("nouser@example.com", testUsers);
    const expectedOutput = undefined;
    assert.deepEqual(expectedOutput, user);
  });

});

describe('getNextID', function() {

  it('should return max ID plus 1', function() {
    const nextID = getNextID(testUsers);
    const expectedOutput = 3;
    assert.equal(expectedOutput, nextID);
  });

  it('should return 1', function() {
    const nextID = getNextID(emptyUsers);
    const expectedOutput = 1;
    assert.equal(expectedOutput, nextID);
  });

});

describe('urlsForUser', function() {

  it('should return urls created by user', function() {
    const urls = urlsForUser(1, testURLs);
    const expectedOutput = {
      "b2xVn2": {
        longURL: "http://www.lighthouselabs.ca",
        userID: 1
      },
      "9sm5xK": {
        longURL: "http://www.google.com",
        userID: 1
      }
    };
    assert.deepEqual(expectedOutput, urls);
  });

  it('should return empty array if user has created no urls', function() {
    const urls = urlsForUser(2, testURLs);
    const expectedOutput = {};
    assert.deepEqual(expectedOutput, urls);
  });

});