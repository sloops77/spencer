#Spencejs: Factories

Test Factories is engineering applied to managing your data. Factories make it easy to create, manage, reuse & extend data sets needed for making great integration & e2e tests

## Getting started
Lets say you have a user object like this
```js
{
    firstName: "Fred",
    lastName: "Astair",
    dob: "1911-07-12"
}
```

Your first factory can be defined in a file like this

```js 
// user-factory.js
const { register } = require("@spencejs/spence-factories");
const userRepo = require("./user-repo");
module.exports = register("user", userRepo, (overrides) => ({
    firstName: "Fred",
    lastName: "Astair",
    dob: "1911-07-12",
    ...overrides()
}));
```

In your test classes you can then use

```js
const { newUser, createdUser, persistUser } = require("./user-factory.js");
```

Create a new user to send in a payload
```js
  const user = newUser()
  //{
  //  firstName: "Fred",
  //  lastName: "Astair",
  //  dob: "1911-07-12"
  //}
```

You can use overrides to change the data for a specific test
```js
   const user = newUser({lastName: "Rodgers"});
   //{
   //  firstName: "Fred",
   //  lastName: "Rodgers",
   //  dob: "1911-07-12"
   //}   
```

You can use mock persisted data for the database you are using
```js
   const user = await createdUser({lastName: "Rodgers"});
   //{
   //  _id: ObjectID("507f191e810c19729de860ea"),
   //  firstName: "Fred",
   //  lastName: "Rodgers",
   //  dob: "1911-07-12",
   //  createdAt: Date(2020-06-22T17:55:32Z)
   //  updatedAt: Date(2020-06-22T17:55:32Z)
   //}   
```

You can even persist into the database
```js
   const user = await persistUser({lastName: "Rodgers"});
   //{
   //  _id: ObjectID("507f191e810c19729de860ea"),
   //  firstName: "Fred",
   //  lastName: "Rodgers",
   //  dob: "1911-07-12",
   //  createdAt: Date(2020-06-22T17:55:32Z)
   //  updatedAt: Date(2020-06-22T17:55:32Z)
   //} 
   
   const dbUser = await userRepo.findById(user._id);
   //{
   //  _id: ObjectID("507f191e810c19729de860ea"),
   //  firstName: "Fred",
   //  lastName: "Rodgers",
   //  dob: "1911-07-12",
   //  createdAt: Date(2020-06-22T17:55:32Z)
   //  updatedAt: Date(2020-06-22T17:55:32Z)
   //} 
```
