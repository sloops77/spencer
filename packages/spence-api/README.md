Spence API

## REST Update Semantics

The built-in `update` REST handler currently registers a `PATCH /:id` route.

At the framework level, `PATCH` semantics are not currently enforced beyond whatever
`updateSchema` the caller provides. In practice, that means:

- the framework does not derive a partial-update schema automatically
- the framework does not distinguish `PUT` and `PATCH` contracts
- a caller can provide a full replacement schema even though the route uses `PATCH`

If you want partial-update behavior, supply an `updateSchema` that explicitly models
patch semantics, for example by allowing partial fields and rejecting empty payloads.
