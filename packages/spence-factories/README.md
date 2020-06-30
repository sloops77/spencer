# Spencejs: Factories

Test Factories is engineering applied to managing your data. Factories make it easy to create, manage, reuse & extend data sets needed for making great integration & e2e tests

Data can be either generated for creation tests, or persisted to databases. Mocks, which look like persisted data but are not added to any database are also supported.

## Getting started
Lets say you have a user object like this
```js
{
    firstName: "Fred",
    lastName: "Astaire",
    dob: "1899-05-10"
}
```

Your first factory can be defined in a file like this

```js 
// user-factory.js
const { register } = require("@spencejs/spence-factories");
const userRepo = require("./user-repo");
module.exports = register("user", userRepo, (overrides) => ({
    firstName: "Fred",
    lastName: "Astaire",
    dob: "1899-05-10",
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
  //  lastName: "Astaire",
  //  dob: "1899-05-10"
  //}
```

You can use overrides to change the data for a specific test
```js
   const user = newUser({lastName: "Rodgers"});
   //{
   //  firstName: "Fred",
   //  lastName: "Rodgers",
   //  dob: "1899-05-10"
   //}   
```

You can even persist into the database
```js
   const user = await persistUser({lastName: "Rodgers"});
   //{
   //  _id: ObjectID("507f191e810c19729de860ea"),
   //  firstName: "Fred",
   //  lastName: "Rodgers",
   //  dob: "1899-05-10",
   //  createdAt: Date(2020-06-22T17:55:32Z)
   //  updatedAt: Date(2020-06-22T17:55:32Z)
   //} 
   
   const dbUser = await userRepo.findById(user._id);
   //{
   //  _id: ObjectID("507f191e810c19729de860ea"),
   //  firstName: "Fred",
   //  lastName: "Rodgers",
   //  dob: "1899-05-10",
   //  createdAt: Date(2020-06-22T17:55:32Z)
   //  updatedAt: Date(2020-06-22T17:55:32Z)
   //} 
```

You can use mock persisted data that creates data that conforms to what it would look like if persisted, but doesnt actually persist anything. These are useful for when stubbing out api calls to apis or microservices.
```js
   const user = await createdUser({lastName: "Rodgers"});
   //{
   //  _id: ObjectID("507f191e810c19729de860ea"),
   //  firstName: "Fred",
   //  lastName: "Rodgers",
   //  dob: "1899-05-10",
   //  createdAt: Date(2020-06-22T17:55:32Z)
   //  updatedAt: Date(2020-06-22T17:55:32Z)
   //}   
   
   const dbUser = await userRepo.findById(user._id);
   // throws Not found error
```

## Nested Documents & Relationships
### Nested Documents
More complex object graphs describe relationships that exist in the data that is persisted. Factories allow you to specify these relationships once only. spence supports creating the graphs as follows:

```js
const { register } = require("@spencejs/spence-factories");
const userFactory = require("./user-factory");
const groupRepo = require("./group-repo");
module.exports = register("group", groupRepo, (overrides, { getOrBuild }) => ({
    name: "Dancing Stars",
    admin: getOrBuild("admin", userFactory),
    ...overrides()
}));
```

Such a factory allows you build complex objects as easily as

```js
const { newUser, createdUser, persistUser } = require("./user-factory.js");
const { newGroup, createGroup, persistGroup } = require("./group-factory.js");

async function examples() {
  const group = newGroup()
  //{
  //  name: "Dancing Stars"
  //  admin: { firstName: "Fred", lastName: "Astaire", dob: "1899-05-10" }
  // }

  const mockGroup = await createdGroup();
  //{
  //  _id: ObjectID("507f191e810c19729de860ea"),
  //  name: "Dancing Stars"
  //  admin: { _id: ObjectID("5efb07ac9baa66d86149b695"), firstName: "Fred", lastName: "Astaire", dob: "1899-05-10", createdAt: Date(2020-06-22T17:55:32Z), updatedAt: Date(2020-06-22T17:55:32Z) },
  //  createdAt: Date(2020-06-22T17:55:32Z)
  //  updatedAt: Date(2020-06-22T17:55:32Z)
  // }

  const dbGroup = await persistGroup();
  //{
  //  _id: ObjectID("5efb07b7c2bb549ef5611262"),
  //  name: "Dancing Stars"
  //  admin: { _id: ObjectID("5123f19112319f729de860df"), firstName: "Fred", lastName: "Astaire", dob: "1899-05-10", createdAt: Date(2020-06-22T17:55:32Z), updatedAt: Date(2020-06-22T17:55:32Z) },
  //  createdAt: Date(2020-06-22T17:55:32Z)
  //  updatedAt: Date(2020-06-22T17:55:32Z)
  // }
  ```

  Overriding is of course supported
  ```js
  const admin = newUser({ firstName: "Lucille", lastName: "Ball", dob: "1911-08-06" })
  const group = newGroup({ admin });

  //{
  //  _id: ObjectID("5efb0911c425921f99415f33"),
  //  name: "Dancing Stars"
  //  admin: { _id: ObjectID("5efb09096d38f572cf104a03"), firstName: "Lucille", lastName: "Ball", dob: "1911-08-06", createdAt: Date(2020-06-22T17:55:32Z), updatedAt: Date(2020-06-22T17:55:32Z) },
  //  createdAt: Date(2020-06-22T17:55:32Z)
  //  updatedAt: Date(2020-06-22T17:55:32Z)
  // }
}
```

### Modelling foreign keys

```js
const { register } = require("@spencejs/spence-factories");
const userFactory = require("./user-factory");
const groupRepo = require("./group-repo");
const groupFactory = register("group", groupRepo, (overrides, { getOrBuild }) => ({
    name: "Dancing Stars",
    adminId: getOrBuild("admin", userFactory).id,
    ...overrides()
}));

async function testData() {
  const dbGroup = await persistGroup();
  //{
  //  _id: ObjectID("5efb07b7c2bb549ef5611262"),
  //  name: "Dancing Stars"
  //  admin: ObjectID("5123f19112319f729de860df"),
  //  createdAt: Date(2020-06-22T17:55:32Z)
  //  updatedAt: Date(2020-06-22T17:55:32Z)
  // }

  const dbUser = await userRepo.findById(dbGroup._id);
  //{
  //  _id: ObjectID("507f191e810c19729de860ea"),
  //  firstName: "Fred",
  //  lastName: "Astaire",
  //  dob: "1899-05-10",
  //  createdAt: Date(2020-06-22T17:55:32Z)
  //  updatedAt: Date(2020-06-22T17:55:32Z)
  //} 
}
```

