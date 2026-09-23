# Changelog

## [1.2.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.1.0...v1.2.0) (2026-09-23)


### Features

* add month calendar with date filtering ([a4af7e8](https://github.com/frostiks777/ai-for-developers-project-386/commit/a4af7e80f56010edf26d2051d099e8ab5031186f))
* add optional booking comment field ([bca6297](https://github.com/frostiks777/ai-for-developers-project-386/commit/bca6297c392624acfb96eaf852c1fc0eb1f3ed1b))
* add time zone selector and zone-aware formatting ([97afbf3](https://github.com/frostiks777/ai-for-developers-project-386/commit/97afbf38812d36ff7bfe38d68f2cfd92c6db7e31))
* generate slots from availability rules ([e5715ed](https://github.com/frostiks777/ai-for-developers-project-386/commit/e5715ed4642fd3363e16e845f1c5a66bc6dc2153))
* make booking phone optional ([88af484](https://github.com/frostiks777/ai-for-developers-project-386/commit/88af484514c971b6fd77b6d43c38bfc23a6dcca8))
* show success screen with booking summary ([1c75422](https://github.com/frostiks777/ai-for-developers-project-386/commit/1c75422054c1318b70a37194ec17f10a9c7a1752))


### Bug Fixes

* prevent double booking with unique index on bookings.slotId ([f305a41](https://github.com/frostiks777/ai-for-developers-project-386/commit/f305a4125e66d4906e5fcb879939253cb269cf98))

## [1.1.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.0.0...v1.1.0) (2026-09-23)


### Features

* **api:** add GET /api/bookings with slot details ([5e7c56c](https://github.com/frostiks777/ai-for-developers-project-386/commit/5e7c56ccb2481b8c0f2980a99926170b800fd5c4))


### Bug Fixes

* **ci:** upgrade vitest to 4 and drop EOL Node 20 from matrix ([d5954e7](https://github.com/frostiks777/ai-for-developers-project-386/commit/d5954e7787596d243e80e1a7d8e7a98f954cd078))

## 1.0.0 (2026-09-22)


### Features

* add call calendar app skeleton ([21b287e](https://github.com/frostiks777/ai-for-developers-project-386/commit/21b287eb297aa8c3aabd58be70633b25250184c9))
* add slot booking dialog with toasts ([722d27c](https://github.com/frostiks777/ai-for-developers-project-386/commit/722d27c50aa67eb2f4fe4d4d23c5a66432b7bac0))
* require email on booking and hide past slots ([b485216](https://github.com/frostiks777/ai-for-developers-project-386/commit/b4852167bd01a7803914716a90ca1793473459c0))
* serve SPA from Fastify and add Render deploy config ([1202442](https://github.com/frostiks777/ai-for-developers-project-386/commit/12024421bab50ff36e97489185bf7e5cdf9b51c9))
* validate phone format in booking form ([2afafeb](https://github.com/frostiks777/ai-for-developers-project-386/commit/2afafebe21e39e63788eb2f2b01ba70aa91c5138))


### Bug Fixes

* bind vite dev server to ipv4 ([3c94887](https://github.com/frostiks777/ai-for-developers-project-386/commit/3c948876e40503178a436ec533d7c163e1aeda8f))
