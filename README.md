# spence - an simple nodejs API Framework
Opinionated API Framework For Fastify and Postgres for FAST coding and EXTREME extensibility

[![CircleCI](https://circleci.com/gh/sloops77/spencer.svg?style=svg)](https://circleci.com/gh/sloops77/spencer)
[![codecov](https://codecov.io/gh/sloops77/spencer/branch/master/graph/badge.svg)](https://codecov.io/gh/sloops77/spencer)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/sloops77/spencer.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/sloops77/spencer/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/sloops77/spencer.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/sloops77/spencer/context:javascript)


## Getting started:
- creating a table
- creating a controller
- subscribe to changes

## Documentation
### [spence-api](./packages/spence-api)
Api Building Libraries for fastify that simplifies quickly building enterprise grade apis with reusable json schemas, open api v3 compliant documentation and generatable integration tests.

### [spence-events](./packages/spence-events)
Event layer that enables event driven architectures. All changes on the persistence layer are evented.
*Rabbitmq & Kafka support comming soon*

### [spence-mongo-repos](./packages/spence-mongo-repos)
Repo library over mongo. Build a extensible data layer for mongo in 3 lines of code.

### [spence-pg-repos](./packages/spence-pg-repos)
Repo library over postgres. Build a extensible data layer for postgres & knex in 3 lines of code.

### [spence-factories](./packages/spence-factories)
Factories library for your tests. Generate reusable & extensible plain objects, mocks and really persisted data by specifying fixtures.


## Philosophy
- FP first
- Productivity oriented
- extensible and flexible. Easy to customize
- Scalable - monolith are easy, microservices made fun
- Best practices
  - schemas & comprehensive integration tests are the most effective ways to document and create a maintainable system
- Performance is important
- ORMs - only change a db for specialization reasons. The native query language is usually the best
What is familiar but of no benefit:
- DI - IoC & mocking can be done in other ways
- Classes - (statics, singletons pointless)

## Controllers
- adding extra routes
- multitenant support

## Events
- why are events important?
- monoliths
- rabbit
- redis
- errors

## Auth
- api tokens
- oauth
- userId

## Errors
- errors & error handling
- the importance of error reporting & aggregation

## Database
- finders
- db configuration
- creating an effect extension

## Testing
- jest only
- factories & testing



