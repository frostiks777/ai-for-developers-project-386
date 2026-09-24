# Changelog

## [1.8.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.7.0...v1.8.0) (2026-09-24)


### Features

* **api:** add TypeSpec contract for /api/v1 ([a875980](https://github.com/frostiks777/ai-for-developers-project-386/commit/a8759800179f7d66d2e5cc1627941f9dbde0b113))
* **api:** generate OpenAPI and client SDK from TypeSpec via api:generate ([18b33e0](https://github.com/frostiks777/ai-for-developers-project-386/commit/18b33e0193e64e6c98f37c782581def92a34b676))
* **api:** generate server API types from OpenAPI ([8ed202f](https://github.com/frostiks777/ai-for-developers-project-386/commit/8ed202f01cf328c69223b6ad6bd1714f7a2807b8))
* **booking:** add landing page and move booking to /book/:slug ([d45367d](https://github.com/frostiks777/ai-for-developers-project-386/commit/d45367de64f2c749c2dfb312a1b416fe62a79807))


### Bug Fixes

* **dashboard:** scroll to availability section from sidebar link ([acc168e](https://github.com/frostiks777/ai-for-developers-project-386/commit/acc168e564e152ec8864140fc91b4b73f1e7a0cd))

## [1.7.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.6.0...v1.7.0) (2026-09-23)


### Features

* allow rescheduling a booking by token link ([6d9cfff](https://github.com/frostiks777/ai-for-developers-project-386/commit/6d9cfff7599d694c4865e6aaa8cdf642219ace81))
* **server:** add hosts table and versioned API v1 ([445b40c](https://github.com/frostiks777/ai-for-developers-project-386/commit/445b40cc608b529a88b3b0cd9ddcb95782df27bc))
* **ui:** add design tokens, fonts and light/dark theme ([3c97980](https://github.com/frostiks777/ai-for-developers-project-386/commit/3c97980e0448dd0cb5fdcb2ab8cb8100b7a0d0b6))
* **ui:** add mobile booking layout ([b163d03](https://github.com/frostiks777/ai-for-developers-project-386/commit/b163d036a467c219d0d9adddd4f35bf0e0d8e5c4))
* **ui:** redesign booking page desktop layout ([14df808](https://github.com/frostiks777/ai-for-developers-project-386/commit/14df808e8463d0f34cd3a1505030a01fb10dd899))
* **ui:** redesign organizer dashboard ([7293469](https://github.com/frostiks777/ai-for-developers-project-386/commit/7293469fc6e06a386f1a705f7501eff602533053))
* **ui:** restyle booking dialog ([8d0513a](https://github.com/frostiks777/ai-for-developers-project-386/commit/8d0513a11c7cf5ea2f0acf2453d7cb8ce3177236))
* **ui:** restyle booking success screen ([db5aec2](https://github.com/frostiks777/ai-for-developers-project-386/commit/db5aec205256e0663bcd49be0ec6444ec2e68a35))


### Bug Fixes

* **ui:** add theme toggle to organizer dashboard ([5a4e95e](https://github.com/frostiks777/ai-for-developers-project-386/commit/5a4e95e5d7fdae7cefb61628eec6d51858eb7706))

## [1.6.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.5.0...v1.6.0) (2026-09-23)


### Features

* allow cancelling a booking by token link ([d39fc31](https://github.com/frostiks777/ai-for-developers-project-386/commit/d39fc316e249d503995fc1625d1ca54c5da9a26c))

## [1.5.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.4.0...v1.5.0) (2026-09-23)


### Features

* add ics and Google Calendar export on success screen ([7273933](https://github.com/frostiks777/ai-for-developers-project-386/commit/72739331974b5f74a66f7bbad3aeb1b325c92cc8))

## [1.4.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.3.0...v1.4.0) (2026-09-23)


### Features

* add back button to booking success screen ([25d58bd](https://github.com/frostiks777/ai-for-developers-project-386/commit/25d58bd0d65606671b0f0e94e5c362266c7c4186))

## [1.3.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.2.0...v1.3.0) (2026-09-23)


### Features

* add organizer dashboard with cancellation and availability ([1d0c3f0](https://github.com/frostiks777/ai-for-developers-project-386/commit/1d0c3f04bad5645eabd82e3dca93237b0650d0bc))

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
