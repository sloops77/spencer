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
- DI - (mocking can be done in other ways)
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



