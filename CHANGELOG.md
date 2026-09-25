# Changelog

## [1.14.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.13.1...v1.14.0) (2026-09-25)


### Features

* **server:** require auth for admin api mutations ([6fab0bd](https://github.com/frostiks777/ai-for-developers-project-386/commit/6fab0bd156b06f27c6db7977c0505b8af567e177))

## [1.13.1](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.13.0...v1.13.1) (2026-09-25)


### Bug Fixes

* **ui:** use full navigation for dashboard links (basic auth prompt) ([6699656](https://github.com/frostiks777/ai-for-developers-project-386/commit/6699656c10e8fbff5344e6a2ab87a772cf9bc5ad))

## [1.13.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.12.0...v1.13.0) (2026-09-25)


### Features

* **ui:** add temporary dashboard access button to header ([b52352d](https://github.com/frostiks777/ai-for-developers-project-386/commit/b52352d8e3f844b79e1cd4e197ddf3c3346ff682))

## [1.12.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.11.0...v1.12.0) (2026-09-25)


### Features

* **api:** split slot buffer into before and after ([4640244](https://github.com/frostiks777/ai-for-developers-project-386/commit/464024413545815cc002c2d24b75b4a317b3193a))
* **availability:** use separate before and after buffers ([f205bc2](https://github.com/frostiks777/ai-for-developers-project-386/commit/f205bc271ba3e38d29e59b4f3eead80be09605d0))
* **booking:** add uuid self-service routes and cancel details ([937cbb7](https://github.com/frostiks777/ai-for-developers-project-386/commit/937cbb7b1a8a6c690b28bf60d9d84ea56ea27db0))
* **dashboard:** add status tabs, search and horizon presets ([c42fc2e](https://github.com/frostiks777/ai-for-developers-project-386/commit/c42fc2e989505d6358ce92da2360b343a7da507d))


### Bug Fixes

* **ui:** fix overflow, sidebar scroll and bookings nav link ([66296c5](https://github.com/frostiks777/ai-for-developers-project-386/commit/66296c504b2afd7c98351e122df12bb96f7f6232))

## [1.11.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.10.0...v1.11.0) (2026-09-25)


### Features

* **api:** add guests, consent and idempotency key to booking contract ([407bf0d](https://github.com/frostiks777/ai-for-developers-project-386/commit/407bf0d4064dfbdf74a44f2101090f951d2b3024))
* **availability:** redesign settings form with switch, presets and validation ([d44ab9d](https://github.com/frostiks777/ai-for-developers-project-386/commit/d44ab9d5d5792b1f2a3217efadda565630fb80b2))
* **booking:** add cancellation reason and confirmation modal ([bcd7f15](https://github.com/frostiks777/ai-for-developers-project-386/commit/bcd7f158f6fb98283e49f633dd576f968b340c42))
* **booking:** add phone mask, stricter name, 409 alert and direct cancel ([495f7a9](https://github.com/frostiks777/ai-for-developers-project-386/commit/495f7a978edb471cab114343294a718035081be9))
* **booking:** add timezone search and 12/24 hour format toggle ([500f134](https://github.com/frostiks777/ai-for-developers-project-386/commit/500f134458d31881b6ae51b6f10113cf6d425bcf))
* **booking:** require consent, collect guests and dedupe by idempotency key ([af4133a](https://github.com/frostiks777/ai-for-developers-project-386/commit/af4133aaf5ebdbafa953db49036fffb8cb8bc588))
* **dashboard:** add time blocks link to sidebar ([00b551c](https://github.com/frostiks777/ai-for-developers-project-386/commit/00b551c9f43a8fbf28435ee3e172a05b75f93045))
* **db:** migrate from SQLite to PostgreSQL (Neon) with PGlite tests ([f1f43c5](https://github.com/frostiks777/ai-for-developers-project-386/commit/f1f43c50e446bccbc65f7254689c4c76ebda07e8))
* **events:** add upcoming events page and confirmed booking route ([9f39d5a](https://github.com/frostiks777/ai-for-developers-project-386/commit/9f39d5a5b3d7dd446bdf9714b31dda9610dc9f19))
* **schedule:** add manual time blocks (BlockTimeModal + API) ([b62ebef](https://github.com/frostiks777/ai-for-developers-project-386/commit/b62ebeff22797f2cfc55459ff6fa8ad584913889))
* **ui:** add public nav tabs to app header ([6b0d8a9](https://github.com/frostiks777/ai-for-developers-project-386/commit/6b0d8a967ad11cdaf3ed8243973f2ee4d33ea1c5))
* **ui:** use event type title in calendar export ([0c10fe2](https://github.com/frostiks777/ai-for-developers-project-386/commit/0c10fe26baaec97f16faec26720e1e2c80d9672a))


### Bug Fixes

* **availability:** put day toggle and first interval on one row ([828119d](https://github.com/frostiks777/ai-for-developers-project-386/commit/828119d6d7130bd67e110aa5a204742c73897108))
* **dashboard:** count only active bookings in meetings counter ([075cad2](https://github.com/frostiks777/ai-for-developers-project-386/commit/075cad2e7231fb1c6c8cdce6e1cef4b8302ec1f4))
* **ui:** compact availability interval remove control ([af2a1aa](https://github.com/frostiks777/ai-for-developers-project-386/commit/af2a1aaf9bd6552bbdb67b7a6bfb28aa2975f917))

## [1.10.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.9.0...v1.10.0) (2026-09-24)


### Features

* **api:** add availability ranges settings and form ([#22](https://github.com/frostiks777/ai-for-developers-project-386/issues/22)) ([d0585e5](https://github.com/frostiks777/ai-for-developers-project-386/commit/d0585e511da6cc831ac5637512672fe3b9c31d6b))
* **api:** create bookings via v1 with type and conflict handling ([#24](https://github.com/frostiks777/ai-for-developers-project-386/issues/24)) ([912d3d0](https://github.com/frostiks777/ai-for-developers-project-386/commit/912d3d0b04c927fa4192e7ad0c903cbd031a8a82))
* **api:** filter slots by event type and add guest type picker ([#23](https://github.com/frostiks777/ai-for-developers-project-386/issues/23)) ([e4ac65d](https://github.com/frostiks777/ai-for-developers-project-386/commit/e4ac65d3025ddf91d441105638ad582b5b41a16c))
* **api:** migrate frontend to generated SDK ([#25](https://github.com/frostiks777/ai-for-developers-project-386/issues/25)) ([98b95b7](https://github.com/frostiks777/ai-for-developers-project-386/commit/98b95b7f4db9a0ae42093881d99412cadc91220f))
* **booking:** cancel and reschedule via v1 public id ([#30](https://github.com/frostiks777/ai-for-developers-project-386/issues/30)) ([60e0de7](https://github.com/frostiks777/ai-for-developers-project-386/commit/60e0de739a59fe1f3623be15f1e96777b180ceda))
* **booking:** reflect selected event type in host info panel ([b676f72](https://github.com/frostiks777/ai-for-developers-project-386/commit/b676f72116d8b19b52a9ab02b3d2d3fd77ec05b7))
* **dashboard:** reflect booking status in owner list and cancel via v1 ([#31](https://github.com/frostiks777/ai-for-developers-project-386/issues/31)) ([3176e6c](https://github.com/frostiks777/ai-for-developers-project-386/commit/3176e6cba5df4ba6b987fb19c425c92503d270a3))
* **test:** contract tests and e2e Playwright gate ([#26](https://github.com/frostiks777/ai-for-developers-project-386/issues/26)) ([387c97b](https://github.com/frostiks777/ai-for-developers-project-386/commit/387c97b4865d56a949ebda72199644fe2be751aa))
* **ui:** show booking event type in owner list and cap guest booking page height ([134e023](https://github.com/frostiks777/ai-for-developers-project-386/commit/134e0238c343f8dc5039f2b4be5f64e2d18ea546))


### Bug Fixes

* **db:** backfill hostId when migrating old availability_rules ([#20](https://github.com/frostiks777/ai-for-developers-project-386/issues/20)) ([7b526b6](https://github.com/frostiks777/ai-for-developers-project-386/commit/7b526b68261770be59346fe56a9998162dd83b89))
* **ui:** hide native scrollbar in booking card columns ([edb3dc7](https://github.com/frostiks777/ai-for-developers-project-386/commit/edb3dc799b1611584cc430c472314300c0afa028))
* **ui:** keep organizer sidebar sticky while page scrolls ([63a3643](https://github.com/frostiks777/ai-for-developers-project-386/commit/63a3643b53d84752c99a5b1acfd89a5f7984244c))
* **ui:** make month calendar fit block height ([4e4ddb6](https://github.com/frostiks777/ai-for-developers-project-386/commit/4e4ddb638e946e83485ad000963f9caec45daa56))
* **ui:** use readable select colors for event type format in dark theme ([3dea80d](https://github.com/frostiks777/ai-for-developers-project-386/commit/3dea80d76ca1b145a8c00fc10173f36fa022e535))

## [1.9.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.8.0...v1.9.0) (2026-09-24)


### Features

* **api:** add event types CRUD and owner editor ([#21](https://github.com/frostiks777/ai-for-developers-project-386/issues/21)) ([1cf1dd5](https://github.com/frostiks777/ai-for-developers-project-386/commit/1cf1dd51ae90baed56ef1c3b09eae1fb51026cbe))
* **db:** add event types, booking status and availability ranges schema ([#20](https://github.com/frostiks777/ai-for-developers-project-386/issues/20)) ([899ed88](https://github.com/frostiks777/ai-for-developers-project-386/commit/899ed88901c23260660a2a0295962a84209058c9))

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
