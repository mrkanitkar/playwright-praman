# Changelog

## [1.3.2](https://github.com/mrkanitkar/playwright-praman/compare/playwright-praman-v1.3.1...playwright-praman-v1.3.2) (2026-06-02)


### ⚠ BREAKING CHANGES

* **deps:** Minimum Node.js version raised from 20 to 22
* Build output now includes CJS alongside ESM

### Features

* add extension system, matcher registry, and fix lint errors ([71a5b49](https://github.com/mrkanitkar/playwright-praman/commit/71a5b49aa06264429b76f4eba7874819e0182bce))
* add FLP locks/settings fixtures, update plan for Phase 6.1 completion ([fb21721](https://github.com/mrkanitkar/playwright-praman/commit/fb21721af9a960e2269a713dd9e477ad37d952d3))
* add SAP agent workspace, BOM test specs, and auth hardening ([3ac9d88](https://github.com/mrkanitkar/playwright-praman/commit/3ac9d88c1eecd2bf275d506dfc2ecbd1b46f92f9))
* **ai:** implement SAP AI agents for planning, generation, and healing ([c419a4e](https://github.com/mrkanitkar/playwright-praman/commit/c419a4e4f48c49a112ad0dee761fff41af8de613))
* **ai:** phase 5 complete — AI layer, intents, vocabulary, LLM service ([42b1c87](https://github.com/mrkanitkar/playwright-praman/commit/42b1c87f05e66673e49037761eed9c60bce7d1b7))
* **ai:** promote capabilities API to main entry + add typed helpers ([c2264cb](https://github.com/mrkanitkar/playwright-praman/commit/c2264cbedbb297b35ebf7d86a8b6c195fb80a946))
* **ai:** replace broken AST-based capability registry with YAML-driven system ([7a583ce](https://github.com/mrkanitkar/playwright-praman/commit/7a583cedf08fa6fea87a5fdf3034b6f2aa0cb203))
* **api:** export Space navigation and WorkZone manager from root ([a687cec](https://github.com/mrkanitkar/playwright-praman/commit/a687cec30005e55bb4113f08e0120b0aa11deb51))
* **auth:** add auth handler + setup/teardown with TDD (A12/B4b+B4c) ([ea85f2b](https://github.com/mrkanitkar/playwright-praman/commit/ea85f2b9b9b2cdb1597e25e73008a99bc390263e))
* **auth:** add auth types + auth-checks (A3/B2a) ([4b10f58](https://github.com/mrkanitkar/playwright-praman/commit/4b10f58086373537436bdcd5fb6724b098858362))
* **auth:** add multi-tenant strategy + auth factory (A8/B2f) ([8c99c3f](https://github.com/mrkanitkar/playwright-praman/commit/8c99c3fdd3a3fe42373bbf91a137c7e80eec7e60))
* **auth:** add O365 + API + Certificate strategies (A7/B2d+B2e) ([cb6aee5](https://github.com/mrkanitkar/playwright-praman/commit/cb6aee51f3f443559220a2d1a31bbc411fb83372))
* **auth:** add OnPrem + CloudSAML auth strategies (A6/B2b+B2c) ([244666e](https://github.com/mrkanitkar/playwright-praman/commit/244666e89021da6e9764872586b83e1a13959139))
* **barrels:** wire bridge + proxy barrels with full exports (B21a+B21b) ([40e3e51](https://github.com/mrkanitkar/playwright-praman/commit/40e3e5145fa799eacaf6dfbe6fe1fc32f6fe4a08))
* **bridge:** add adapters + factory (B16) ([4a4d74e](https://github.com/mrkanitkar/playwright-praman/commit/4a4d74e87476d4d61d19671fadbbb6b80dbeee15))
* **bridge:** add API resolver + injection engine (B14) ([b09bd8c](https://github.com/mrkanitkar/playwright-praman/commit/b09bd8cdf73676c79617d743519e442019e39c7b))
* **bridge:** add bridge types, constants, method blacklist (B12) ([6d319b5](https://github.com/mrkanitkar/playwright-praman/commit/6d319b54d8abce9954633feff0484020a05b4345))
* **bridge:** add BridgeAdapter interface + barrel (B8a) ([cf1dff4](https://github.com/mrkanitkar/playwright-praman/commit/cf1dff4bcd9631f50834fe68a4fef0306e343e46))
* **bridge:** add browser scripts for injection, discovery, execution (B13) ([0bf1c6d](https://github.com/mrkanitkar/playwright-praman/commit/0bf1c6de19d15ee97f78998106483c638af8bd16))
* **bridge:** add interaction strategies + factory (B15) ([6fe159d](https://github.com/mrkanitkar/playwright-praman/commit/6fe159d063fc2bf42311649ca0ccbe6a7e7e8815))
* **bridge:** add test helpers for Phase 2 (TH4/TH5/TH6) ([b7a0b18](https://github.com/mrkanitkar/playwright-praman/commit/b7a0b18e54c31be7bbb7bf28c12aee49186fd5ba))
* **bridge:** extend BridgePage + add 'unknown' return type (PRE-1/3) ([7557a3c](https://github.com/mrkanitkar/playwright-praman/commit/7557a3cfc7eaa9991cfea4c674367c3c3dfd4c60))
* **bridge:** fix async injection + integration smoke tests (INT1) ([3bd0387](https://github.com/mrkanitkar/playwright-praman/commit/3bd03874fa39b0242c174c8301de253810f1cf5f))
* **ci:** add Playwright canary (next) to integration matrix ([a93f3b3](https://github.com/mrkanitkar/playwright-praman/commit/a93f3b30b74c27cd5f7549936e01a7839a26614e))
* **ci:** add TS 5.9/6.0 compat matrix and build fixes ([e0157b3](https://github.com/mrkanitkar/playwright-praman/commit/e0157b3515603704a595734f6745957507a98d23))
* **ci:** add Windows install zip artifact to build job ([9cf7cd0](https://github.com/mrkanitkar/playwright-praman/commit/9cf7cd0b2d185f400dd5753deb36512a80e65e6a))
* **ci:** harden CI/CD with Playwright best practices ([b7e81b2](https://github.com/mrkanitkar/playwright-praman/commit/b7e81b2b489d70a4282948d06fbdbefc13488901))
* **ci:** replace Windows zip with universal npm tarball artifact ([fe5dccb](https://github.com/mrkanitkar/playwright-praman/commit/fe5dccbed447665d8a07793989d4d71aeb4d4f89))
* **cli,docs:** remove inspect, safe uninstall, 61→199 ([dce31b0](https://github.com/mrkanitkar/playwright-praman/commit/dce31b02516a398d15fa0550106a965037eaaff5))
* **cli:** add 'config' command to display resolved configuration ([a1a4ce1](https://github.com/mrkanitkar/playwright-praman/commit/a1a4ce10df52a6469b58785f3fc44e4cd7de2480))
* **cli:** add GitHub Copilot IDE support and agent-setup docs ([b19d6a4](https://github.com/mrkanitkar/playwright-praman/commit/b19d6a4c20f073aa82e30a564cf7bb2939e08d0b))
* **cli:** add init-agents command for lightweight ide-specific agent installation ([cf7fde9](https://github.com/mrkanitkar/playwright-praman/commit/cf7fde9d1c5c1968a650c080fdaae233e2ab4df3))
* **cli:** add Playwright CLI support as token-efficient alternative to MCP ([dc05ef4](https://github.com/mrkanitkar/playwright-praman/commit/dc05ef475c09ec4b39b4261f3a655b0b23a2fe8e))
* **cli:** implement interactive inspect command ([a91c2eb](https://github.com/mrkanitkar/playwright-praman/commit/a91c2ebaa58c4be7e5abb017199f62db3881a58e))
* **cli:** implement Playwright CLI integration for SAP UI5 test automation ([a788da5](https://github.com/mrkanitkar/playwright-praman/commit/a788da50c3f533e2f338cebd6fc3a4f0874dcf8e))
* **cli:** install CLI agents by default; add MCP vs CLI to README and website ([acf79e7](https://github.com/mrkanitkar/playwright-praman/commit/acf79e75ca70c3fb10f1fb3881f7653079b2bf7b))
* **cli:** zero-step init with auth config backup and SAML fix ([971a5bb](https://github.com/mrkanitkar/playwright-praman/commit/971a5bbfbe3daa9ada405d756696be35212391ed))
* complete P1-002, P4-002, P4-008, P4-011, P4-015, P5-003 ([4d76c01](https://github.com/mrkanitkar/playwright-praman/commit/4d76c017e4240b97691d580dd83c105698980148))
* **config:** add config loader + mock helpers (TH1, B3b, B3b-t) ([60b41a4](https://github.com/mrkanitkar/playwright-praman/commit/60b41a455611c4d923843c2ada3343182434f34a))
* **config:** add discoveryStrategies env var support (C-B2) ([4048637](https://github.com/mrkanitkar/playwright-praman/commit/404863753cf63acc7ff8053139a874bbd83ae376))
* **config:** add nested env var support for auth, ai, telemetry, odataTracing ([4125fb7](https://github.com/mrkanitkar/playwright-praman/commit/4125fb75cc48651bd1c5ef49f513691699960d84))
* **config:** add PramanConfigSchema with Zod (B3a, B3a-t) ([02230f7](https://github.com/mrkanitkar/playwright-praman/commit/02230f7de8548a369373b3cb59c20e871ecdf8f5))
* **config:** add strategy enums + opa5 schema (C-B1) ([e952400](https://github.com/mrkanitkar/playwright-praman/commit/e952400acbb0a94ca83111e6043bddc8c08270e4))
* **core:** add bridge + proxy re-exports to main barrel (B21c) ([209a730](https://github.com/mrkanitkar/playwright-praman/commit/209a7309541803b476d96fba0fa2e8d4d991ab63))
* **core:** add logging, telemetry, wait-helpers, compat (Wave 2) ([036e364](https://github.com/mrkanitkar/playwright-praman/commit/036e3640bd43855f360f797566572e17cb87e37c))
* **core:** add utils, redaction, mock-bridge (Wave 1) ([38e9bae](https://github.com/mrkanitkar/playwright-praman/commit/38e9bae6073ac13204b4151c92087b2193e40ce0))
* **core:** AI readiness audit fixes — config presets, docs, TSDoc tags ([#92](https://github.com/mrkanitkar/playwright-praman/issues/92)) ([3f7c8c6](https://github.com/mrkanitkar/playwright-praman/commit/3f7c8c6d52ce15aae42f24ee3cf000e3012fad3f))
* **deps:** raise minimum Node.js to 22, drop EOL Node 20 ([485492c](https://github.com/mrkanitkar/playwright-praman/commit/485492c37c48a28dff986672b7c236a85e050d50))
* **deps:** upgrade Playwright to 1.59.0, add feature flags ([402d39c](https://github.com/mrkanitkar/playwright-praman/commit/402d39c499fa697869bef90dbee100b632d76ccf))
* **deps:** upgrade TypeScript 5.9.3 → 6.0.2 ([ac0de5a](https://github.com/mrkanitkar/playwright-praman/commit/ac0de5a1591485fe8f7a2d161597cca193d5f12f))
* **docs-verify:** add checks 5-6, CI workflow, register all 8 checks ([#111](https://github.com/mrkanitkar/playwright-praman/issues/111)) ([37372a4](https://github.com/mrkanitkar/playwright-praman/commit/37372a45c6731729bfdde952fa8b4737999be2e9))
* **docs-verify:** add docs accuracy verification pipeline with 6 checks ([#105](https://github.com/mrkanitkar/playwright-praman/issues/105)) ([3648a9c](https://github.com/mrkanitkar/playwright-praman/commit/3648a9cca44928e42f49e0714bb6daa85450791b))
* **docs,ci:** add SAP test automation comparison blog + fix lint/build compliance ([c8aa8e6](https://github.com/mrkanitkar/playwright-praman/commit/c8aa8e6bc3d11c14ff71ca0ae65c65b42c10088e))
* **docs:** add Example Reports page, remove WDI5 column from features ([8304440](https://github.com/mrkanitkar/playwright-praman/commit/8304440388ee0b2973f6305ce983c579cdbafe59))
* **docs:** add IndexNow key for Bing/Yandex/DuckDuckGo instant indexing ([1928b77](https://github.com/mrkanitkar/playwright-praman/commit/1928b77367479a1f61ee42f5f71d636a18ccec87))
* **docs:** add llms.txt generation and Docusaurus plugins ([fe23796](https://github.com/mrkanitkar/playwright-praman/commit/fe23796e3af0d6003d0ec10ae6e4cd536bbba94f))
* **docs:** add second demo video to carousel and demo page ([#153](https://github.com/mrkanitkar/playwright-praman/issues/153)) ([2f7c4ef](https://github.com/mrkanitkar/playwright-praman/commit/2f7c4ef24570607cc57171716903e3faefa00936))
* **docs:** add SEO badges, keywords, FAQ schema, config ([b7ccc64](https://github.com/mrkanitkar/playwright-praman/commit/b7ccc642632c2074a01073bbdc155c4b67d315dd))
* **docs:** add SEO meta tags, social card, sitemap priorities, and persistent H1 ([8c93145](https://github.com/mrkanitkar/playwright-praman/commit/8c93145fef0a7dedd2c91b76817ff0460e900f9d))
* **docs:** add third demo video and fix card alignment ([#156](https://github.com/mrkanitkar/playwright-praman/issues/156)) ([6753eec](https://github.com/mrkanitkar/playwright-praman/commit/6753eeca1ed7c73ad0ff492d939a65dc163b1c51))
* **docs:** apply Teal+Amber dual accent theme with DM Sans ([fc64bcf](https://github.com/mrkanitkar/playwright-praman/commit/fc64bcf51e96627d26fbd9b7b568d37259a309e7))
* **docs:** seo overhaul for api descriptions, keywords, competitive positioning ([019297f](https://github.com/mrkanitkar/playwright-praman/commit/019297f4290c30730c254b886709d91478c9d4cb))
* **docs:** simplify onboarding to 2 commands, elevate AI agent pipeline ([66e762f](https://github.com/mrkanitkar/playwright-praman/commit/66e762f9259c603cb8f0d87b7cb716ffebd8a56d))
* dx audit — 19 developer experience improvements (F-01–F-19) ([ba20565](https://github.com/mrkanitkar/playwright-praman/commit/ba2056516dbdb83170e01daf4798a162ab5c51f0))
* enhance npm discoverability and readme for growth ([41c8a67](https://github.com/mrkanitkar/playwright-praman/commit/41c8a67f393e823e6f4eefc8836096d2598f600f))
* **errors:** add 10 error subclasses + test helper (B2c-B2g, TH3) ([f39be9c](https://github.com/mrkanitkar/playwright-praman/commit/f39be9c25de8fed87b09911d68864bf54f44cac9))
* **errors:** add docs url to error messages, json, and ai context ([c35f2bf](https://github.com/mrkanitkar/playwright-praman/commit/c35f2bf546fc69bf946b8586ee403cafbae40dc2))
* **errors:** add ErrorCode constant + type union (B2a) ([7171c59](https://github.com/mrkanitkar/playwright-praman/commit/7171c599514c9a94c24795be9dcd7b3afbdb684c))
* **errors:** add errors barrel + update tracker (B2h) ([1d59f94](https://github.com/mrkanitkar/playwright-praman/commit/1d59f9448e6c6a763e1a7c0a3924b83769a6afcf))
* **errors:** add PramanError base class with TDD (B2b, B2b-t) ([c3aa125](https://github.com/mrkanitkar/playwright-praman/commit/c3aa125630370eca5c9276048467ec57defb9d83))
* **eslint:** add comprehensive best practices configuration ([14cbf5a](https://github.com/mrkanitkar/playwright-praman/commit/14cbf5ab0ab52320912a23d727a60962f955594b))
* **fixtures:** add auth fixtures with TDD (A13/B5a) ([c6c2441](https://github.com/mrkanitkar/playwright-praman/commit/c6c2441f44785d27bd75dcb7a44208ffe9d80f99))
* **fixtures:** add nav fixtures with TDD (A14/B5c) ([8e772b8](https://github.com/mrkanitkar/playwright-praman/commit/8e772b85d8c90cb2c92d88645c81029145946a28))
* **fixtures:** add shell + footer handlers with TDD (A18/B6c) ([9367bf3](https://github.com/mrkanitkar/playwright-praman/commit/9367bf3fc0d3c34719fec900199ef5dbe74ca0ae))
* **fixtures:** add stability fixtures with TDD (A10/B4a) ([78750e9](https://github.com/mrkanitkar/playwright-praman/commit/78750e9e8a36cde47f71e7699806cc5ff43979ab))
* **fixtures:** add test-scoped core fixtures (A5/B3b) ([c76e8c1](https://github.com/mrkanitkar/playwright-praman/commit/c76e8c1d90c4e216b09b91749dbee664ad18cc0e))
* **fixtures:** add UI5Handler with TDD (A9/B3c) ([033eca5](https://github.com/mrkanitkar/playwright-praman/commit/033eca5363ca29571d64bf7b4f52223039b2eec7))
* **fixtures:** add worker-scoped core fixtures (A4/B3a) ([b5965ef](https://github.com/mrkanitkar/playwright-praman/commit/b5965efe4e601b18f41cc874fa976ade735d46af))
* **fixtures:** assemble merged test+expect via mergeTests (A19/B7+B6b) ([4f934e0](https://github.com/mrkanitkar/playwright-praman/commit/4f934e0c6ba838c6a15ccc2d2eaa95fbb42b2d02))
* **fixtures:** implement A4+A5+B5 — teardown cleanup + stability guards ([59d1be5](https://github.com/mrkanitkar/playwright-praman/commit/59d1be51e791b883150a06bd6d80d74c3f6d75a8))
* gap-2 fixes, agent updates, and capability schema expansion ([a1fd446](https://github.com/mrkanitkar/playwright-praman/commit/a1fd446341015b2e4d9259bc3260fbd85b02155e))
* implement phase 6 — step instrumentation, reporters, CLI ([514e336](https://github.com/mrkanitkar/playwright-praman/commit/514e3369dbf5692c6cc1a564edd3247b015a6dd3))
* **lint:** add UI5 deprecated API detection + infra updates ([2be0ecc](https://github.com/mrkanitkar/playwright-praman/commit/2be0eccdcf609166a8601f3a59805d6768897ce9))
* **modules:** add navigation module with TDD (A11/B5b) ([503cad2](https://github.com/mrkanitkar/playwright-praman/commit/503cad2139300f68b0b86d7c49a875d61187a17b))
* **modules:** add WorkZone module with TDD (A16/B6a) ([f4214e2](https://github.com/mrkanitkar/playwright-praman/commit/f4214e2d142bf52c3a3e611017c8abc8a4072eea))
* multi-OS, multi-IDE, dual ESM+CJS build, AI agents support ([1462690](https://github.com/mrkanitkar/playwright-praman/commit/1462690ddcee6be8331c8f2639e65963903ee96e))
* phase 3 complete — simplify architecture, fixtures+auth+E2E ([6d67a67](https://github.com/mrkanitkar/playwright-praman/commit/6d67a673a96a852ba2ce97f2628c9ea2490784e4))
* phase 4 — table, dialog, date, OData, FE modules + fixtures ([bd9a002](https://github.com/mrkanitkar/playwright-praman/commit/bd9a00292b64215d5be242ccad93a1d289c7919a))
* phase 6.1 implementation — fixtures, types, AI, auth, docs ([458a284](https://github.com/mrkanitkar/playwright-praman/commit/458a28425e2ee70774c4406166965a3baeb6a965))
* phase 7.0 batch 1 — bug fixes and quality hardening ([8c8c095](https://github.com/mrkanitkar/playwright-praman/commit/8c8c095f7539068d2b675a517f76d1b02605afee))
* phase 7.0 batches 3-7 — docs, code hardening, ADRs ([864e97f](https://github.com/mrkanitkar/playwright-praman/commit/864e97f86ac0c3e24672f0d397ef153a3f42671d))
* Playwright 1.60 quick-win cluster (aria grounding, screencast highlight, OData onError) ([#145](https://github.com/mrkanitkar/playwright-praman/issues/145)) ([c4d5f06](https://github.com/mrkanitkar/playwright-praman/commit/c4d5f06591efc146daa47769d23e0409f4640156))
* **playwright:** add selectors, matchers (Wave 4) ([d5fe43a](https://github.com/mrkanitkar/playwright-praman/commit/d5fe43a0d2bfc14654cb2dbcc003e535b254a225))
* **prompts:** add prompt factory with two SAP prompts and disclaimers ([d27fab4](https://github.com/mrkanitkar/playwright-praman/commit/d27fab435d5117df7b7bddbb2186ef7524797f1c))
* **proxy+bridge:** remove G2 stubs, wire scripts (B1a+B1b) ([4342b6f](https://github.com/mrkanitkar/playwright-praman/commit/4342b6fd18f9f1813676d6a3a8620a8715f07655))
* **proxy:** add dynamic control proxy handler (B17c) ([54bebbf](https://github.com/mrkanitkar/playwright-praman/commit/54bebbf65e5ef8b90e8ae4e8df3fa3b5cedcc231))
* **proxy:** add method-filter, playwright-api, return-handler (B17a+B17b) ([b0976e4](https://github.com/mrkanitkar/playwright-praman/commit/b0976e4e2649ff8c536a7c6602f860ab3d6ed365))
* **proxy:** add object proxy, object cache, discovery (B18b+B18c+B19c) ([9703285](https://github.com/mrkanitkar/playwright-praman/commit/9703285799c4dc20d3603a1d99f4ee29b51f81d0))
* **proxy:** add proxy converter for result→proxy routing (B18d) ([787d671](https://github.com/mrkanitkar/playwright-praman/commit/787d671fa8fe9483ff95f39e5a0622f79cd06e1d))
* **proxy:** add UI5Object, proxy cache, discovery factory (B18a+B19a+B19b) ([1e3a880](https://github.com/mrkanitkar/playwright-praman/commit/1e3a880afd24a18f527647e16a376a49d3da738b))
* **proxy:** wire Playwright API routing with TDD (A15/B5d) ([1fd1af7](https://github.com/mrkanitkar/playwright-praman/commit/1fd1af7c5a58ced95daaa4585439c8c4adf9dbcb))
* **proxy:** wire sub-proxy creation in return handler (B3d) ([03ecbc3](https://github.com/mrkanitkar/playwright-praman/commit/03ecbc3cd645da382bfc5aedb6010a7ad5f15c9b))
* **selectors:** add :not(), :labeled(), positional and sibling selectors ([8c5aea6](https://github.com/mrkanitkar/playwright-praman/commit/8c5aea67524c544a3d8e226e263e711901f76dbf))
* **selectors:** unify UI5 selector engine with fontoxpath + css-selector-parser ([ae1010c](https://github.com/mrkanitkar/playwright-praman/commit/ae1010cfdcd671406ba761631fb8bd8e809ff290))
* **telemetry:** OpenTelemetry phase 2 — dynamic loading, exporters, reporter + Docusaurus 3.10 ([#104](https://github.com/mrkanitkar/playwright-praman/issues/104)) ([422f689](https://github.com/mrkanitkar/playwright-praman/commit/422f68999439eabb85e12a7de21260f2eb065418))
* **types:** add foundation type definitions (B1a, B1b) ([2d69438](https://github.com/mrkanitkar/playwright-praman/commit/2d6943812e3144ce87ac817aabbca0621b506de6))
* **types:** add types barrel and ui5 ambient types (B1g) ([92ca6d8](https://github.com/mrkanitkar/playwright-praman/commit/92ca6d8f76bff3f737a35a3bbfd4b31c478c4b5d))
* **types:** add UI5 control interfaces (B1c-B1f) ([2322652](https://github.com/mrkanitkar/playwright-praman/commit/2322652ec541678c1fd6f52c747227205604b3a4))
* **types:** expand auto-gen to 199 controls + fix docs ([c70c74c](https://github.com/mrkanitkar/playwright-praman/commit/c70c74c9b74cf150f657e453b0cfe8896e96a6ee))


### Bug Fixes

* **agents:** wire SAP agent workspace for testing readiness ([c09be76](https://github.com/mrkanitkar/playwright-praman/commit/c09be76fcce620efcd36955c976fc467c18aa19d))
* **ai:** remove unused export from MAX_CONTEXT_CHARS ([6562b3c](https://github.com/mrkanitkar/playwright-praman/commit/6562b3c7fa04db345000e3aefdf0db396e51c8e9))
* **api:** resolve API Extractor unresolved-link warnings (P24) ([6623c91](https://github.com/mrkanitkar/playwright-praman/commit/6623c91568f7fd39c8ae956099326b286ae583d2))
* **audit:** implement all 40 self-audit remediation items (P1-P40) ([b20acdf](https://github.com/mrkanitkar/playwright-praman/commit/b20acdffcf6e27372c699d6ebd263bee711d3448))
* **audit:** pre-release audit fixes — Docker tag, changelog link, fixture cleanup ([7f952d1](https://github.com/mrkanitkar/playwright-praman/commit/7f952d1051311ce3148f98d4e759fc45882be24b))
* **auth:** update stale test mocks for cloud-saml-strategy ([6f15539](https://github.com/mrkanitkar/playwright-praman/commit/6f155395f11b4bd3dff90d970b11192f6f653646))
* **bridge:** add fireSelect to press() fallback chain ([a8469fb](https://github.com/mrkanitkar/playwright-praman/commit/a8469fb493e1f347ba7bd3f5816b5023b5a61d59))
* **bridge:** add v8 ignore for browser-context functions in opa5-strategy ([#77](https://github.com/mrkanitkar/playwright-praman/issues/77)) ([93c331e](https://github.com/mrkanitkar/playwright-praman/commit/93c331e988b9348027db9e5fdc4946f05dd2b8b0))
* **bridge:** implement searchOpenDialogs priority and add FLP Space Tab navigation ([e8d2c5d](https://github.com/mrkanitkar/playwright-praman/commit/e8d2c5d807edd0aa23eb6e89de9feb0955ee27ed))
* **bridge:** remove fictional sap.ui.Global.version and RecordReplay.getAutoWaiter APIs ([#93](https://github.com/mrkanitkar/playwright-praman/issues/93)) ([2955929](https://github.com/mrkanitkar/playwright-praman/commit/2955929329a121138215c0c53ee3e888968d492b))
* **bridge:** remove incorrect interactionTimeout param and fix FilterBar.clear usage ([#94](https://github.com/mrkanitkar/playwright-praman/issues/94)) ([ef61066](https://github.com/mrkanitkar/playwright-praman/commit/ef61066b414dc433481390af26756b203be4c5d7))
* **build:** disable chunk splitting to resolve Socket.dev obfuscation alert ([dbe1df0](https://github.com/mrkanitkar/playwright-praman/commit/dbe1df0bc6101e3c257a0cff669f396794875520))
* **ci:** add --ignore-npm-errors to SBOM generation ([1acb99a](https://github.com/mrkanitkar/playwright-praman/commit/1acb99aeee091f9c193333dac8852500c6dae2a9))
* **ci:** add @playwright/cli to knip ignoreDependencies ([1174928](https://github.com/mrkanitkar/playwright-praman/commit/1174928b5ed695430099857b9b97edf5dee614a4))
* **ci:** add appendable and cursorrules to cspell dictionary ([76ed512](https://github.com/mrkanitkar/playwright-praman/commit/76ed5124baab71d0b5472f9aa5f6c901773e2bd8))
* **ci:** add CSpell check to pre-push hook ([a008166](https://github.com/mrkanitkar/playwright-praman/commit/a008166aeab62493c0d5f04410f40ae784acb754))
* **ci:** add docs-check job, security eslint, sbom step, fix defineConfig export ([5bb610f](https://github.com/mrkanitkar/playwright-praman/commit/5bb610f6f67e9e82c016592e219b0d3991afc548))
* **ci:** add generated report/planning docs to markdownlint ignore ([d1acfd8](https://github.com/mrkanitkar/playwright-praman/commit/d1acfd8fed7fa2a6925c25de28e10d25f1674efa))
* **ci:** add missing commit scopes (deps, release, adapter) ([8e3cd83](https://github.com/mrkanitkar/playwright-praman/commit/8e3cd830c93824ae6ae5a5949a077c95c6085907))
* **ci:** add missing words to cspell dictionary ([0433683](https://github.com/mrkanitkar/playwright-praman/commit/04336833769566c041f63af60db38afe1b351249))
* **ci:** add missing words to CSpell dictionary ([f70a17c](https://github.com/mrkanitkar/playwright-praman/commit/f70a17c4f7c9a16780308663f9b6de66454af772))
* **ci:** add playwright-praman to knip ignoreBinaries ([8e5a662](https://github.com/mrkanitkar/playwright-praman/commit/8e5a6623b8bd0071c384ae266d41203d54cab666))
* **ci:** add preuninstall to cspell dictionary ([06beaa1](https://github.com/mrkanitkar/playwright-praman/commit/06beaa1fb4f69c404a0256f658d72760cdd0240b))
* **ci:** add SAP domain words to cspell dictionary ([6a607b2](https://github.com/mrkanitkar/playwright-praman/commit/6a607b2ea6e7e851da900fa9a7803539a61b69db))
* **ci:** add specs/ to eslint ignores, move gold-standard spec ([36539b3](https://github.com/mrkanitkar/playwright-praman/commit/36539b3aef1560e1026987d89dd9200277bd6fc3))
* **ci:** auto-increment canary alpha version from npm ([68b5396](https://github.com/mrkanitkar/playwright-praman/commit/68b53965986da9dc38f4dc97cb1cdccbe011eb5b))
* **ci:** disable FORCE_COLOR for canary version stamp ([8b73c55](https://github.com/mrkanitkar/playwright-praman/commit/8b73c55aca7c997258dcd5110ca8fdd0a94c239b))
* **ci:** download dist artifact in integration test jobs ([cb055a4](https://github.com/mrkanitkar/playwright-praman/commit/cb055a4c0274458141f21c485dd32113fca32c10))
* **ci:** fix canary clean tree check for package-lock.json ([0d9ff0b](https://github.com/mrkanitkar/playwright-praman/commit/0d9ff0b133af9b79b69dfdf13ce5f68d373d6f50))
* **ci:** handle corrupted npm on macOS ARM64 runners ([cc2a306](https://github.com/mrkanitkar/playwright-praman/commit/cc2a306bc443ce8a72b275aeace60d63b5634592))
* **ci:** ignore auto-generated CHANGELOG.md in markdownlint ([3a3dc15](https://github.com/mrkanitkar/playwright-praman/commit/3a3dc15d7584e38a90ec05ae37eafb97207cce53))
* **ci:** inline upload-pages-artifact for SHA-pinning compliance ([5de6a9a](https://github.com/mrkanitkar/playwright-praman/commit/5de6a9a8aeeb3fc534c935f22b2b38bc73759e64))
* **ci:** regenerate lockfile and fix docs broken links ([fb4be6a](https://github.com/mrkanitkar/playwright-praman/commit/fb4be6a20a8978faa978fd15f87a3414a0939f5e))
* **ci:** regenerate lockfile for strict npm ci on Node.js 24 ([054f764](https://github.com/mrkanitkar/playwright-praman/commit/054f764e3348baaa82afd56710ade74fef1e8b0a))
* **ci:** remove export validation from ts-compat job ([057e108](https://github.com/mrkanitkar/playwright-praman/commit/057e1085cd4a24ddd74aa3fa59fc4c9da10f44ee))
* **ci:** resolve all GitHub Actions workflow failures ([838ee53](https://github.com/mrkanitkar/playwright-praman/commit/838ee53771273c66dec6df69193d19c3c753052f))
* **ci:** resolve knip unused export warnings ([52d0142](https://github.com/mrkanitkar/playwright-praman/commit/52d014239b1309bc58289684f06dbce140b1d601))
* **ci:** set coverage thresholds to 0% for initial release ([23fbc0b](https://github.com/mrkanitkar/playwright-praman/commit/23fbc0b8ab31a0f0cefea6d9e989f4124b6af642))
* **ci:** skip azure playwright job when secret not configured ([5015dff](https://github.com/mrkanitkar/playwright-praman/commit/5015dffa74e66211c1687726647f3f24b9e6a3ff))
* **ci:** skip DTS in ts-compat job for TS 5.9 ([b69542c](https://github.com/mrkanitkar/playwright-praman/commit/b69542ce910ed80f6d6aadc59960926fe28cfd9c))
* **ci:** skip integration tests when SAP credentials unavailable ([4e9f10e](https://github.com/mrkanitkar/playwright-praman/commit/4e9f10e163e26d992649815483e58c0a742e55f0))
* **ci:** update husky hooks to use tsx instead of deleted bash script ([3b37299](https://github.com/mrkanitkar/playwright-praman/commit/3b3729940d8efc855894ff2d2b76bcd019f522f7))
* **cli:** add iife wrappers, unexport cleanEmptyDirs, remove unused logger fns ([928f87b](https://github.com/mrkanitkar/playwright-praman/commit/928f87baf0400d4a70027c7d9201de44bd198994))
* **cli:** fix mock-filesystem readdir for Windows path separators ([b3b1fcd](https://github.com/mrkanitkar/playwright-praman/commit/b3b1fcdc77ca3827f26cf0b48a1c8d912edc3d30))
* **cli:** fix playwright-cli integration — config, build, and docs ([460b7d7](https://github.com/mrkanitkar/playwright-praman/commit/460b7d78680e8e36961323154f6adc7ce46bb509))
* **cli:** fix scaffold file resolution broken by tsup chunk splitting ([32579b8](https://github.com/mrkanitkar/playwright-praman/commit/32579b8ca496e933a903500f21cf2a6b67ff51a4))
* **cli:** pass cli flag to scaffoldIDEFiles in new project path ([45fbe83](https://github.com/mrkanitkar/playwright-praman/commit/45fbe8319e8b930e9e2a745fa376bc2297e02149))
* **cli:** remove logRaw and logDivider from test mocks ([e89f453](https://github.com/mrkanitkar/playwright-praman/commit/e89f453428a6246422f41faff8d6d2bc06b7f3cb))
* **cli:** remove redundant package install step from init command ([717fcf1](https://github.com/mrkanitkar/playwright-praman/commit/717fcf199642a656e1323b7f734716fb2fdddc25))
* **cli:** remove unused export on runEslintCheck (knip) ([85b2fd8](https://github.com/mrkanitkar/playwright-praman/commit/85b2fd8e0af795cf10fc3097b82d94aa44c170a6))
* **cli:** use CJS bin entry for Windows npx compatibility ([209b8f5](https://github.com/mrkanitkar/playwright-praman/commit/209b8f59f7d58a86b337ec69ef58402ae5eb83e6))
* **config:** add screencast to cspell dictionary ([a56fd7d](https://github.com/mrkanitkar/playwright-praman/commit/a56fd7d973b797a3a5031e2e1709939c4b00197a))
* **config:** remove dead PRAMAN_AUTH_* env var layer ([#100](https://github.com/mrkanitkar/playwright-praman/issues/100)) ([c30472b](https://github.com/mrkanitkar/playwright-praman/commit/c30472b872b20a0be4f924cd2d8be87a35453bbe))
* **core:** resolve 4 HIGH audit issues (H3, H4, H7, H9) ([#90](https://github.com/mrkanitkar/playwright-praman/issues/90)) ([0c20b49](https://github.com/mrkanitkar/playwright-praman/commit/0c20b495167b5020c8d8d202b5f07cbbdcc7f3ce))
* **core:** resolve lint errors in control-tree tests ([f9e1584](https://github.com/mrkanitkar/playwright-praman/commit/f9e15841f064db3159f87362fd9d105a01d5576c))
* **cspell:** add pwtest and British serialise variants to project dictionary ([b06dc51](https://github.com/mrkanitkar/playwright-praman/commit/b06dc51bb481f126ae83feb6873ba4f4cdd1b930))
* **deps:** resolve all npm audit vulnerabilities (0 remaining) ([618df81](https://github.com/mrkanitkar/playwright-praman/commit/618df81b174d7369ee5a192e893bd99d7c84fc65))
* **deps:** resolve docs vulnerabilities (0 remaining) ([6eed6f6](https://github.com/mrkanitkar/playwright-praman/commit/6eed6f6b5fd964f10c9200c17cdccd50242a633c))
* **deps:** restore zod 4.4.3, bump dotenv 17.4.2 ([#143](https://github.com/mrkanitkar/playwright-praman/issues/143)) ([f91bbba](https://github.com/mrkanitkar/playwright-praman/commit/f91bbba8ffb4a54e1ecce87820ead1114dedae7a))
* **docs:** add lastmod to all sitemap urls including typedoc api pages ([b8086fc](https://github.com/mrkanitkar/playwright-praman/commit/b8086fc6b92b0446dfd37188647724888c24ada3))
* **docs:** add missing cspell words and fix typo in example-reports ([03b0dd4](https://github.com/mrkanitkar/playwright-praman/commit/03b0dd4f6a296422e120dc82ae5efc0ccb728d3a))
* **docs:** add Playwright-Praman to page titles for SEO ([107a18e](https://github.com/mrkanitkar/playwright-praman/commit/107a18e6b679f7cc633ea3b444dd7219270a635f))
* **docs:** correct stale version refs in architecture and reports ([cfac057](https://github.com/mrkanitkar/playwright-praman/commit/cfac057db932e1284f341eb0d87ef02956119f9b))
* **docs:** fix carousel h1 color — add praman-hero-section class ([bb40865](https://github.com/mrkanitkar/playwright-praman/commit/bb40865d5fd5caca8728b496e9adc9cc7db36bfa))
* **docs:** fix CHANGELOG markdownlint MD012 errors ([cd788f0](https://github.com/mrkanitkar/playwright-praman/commit/cd788f0235ff864bc7d224b8a39fcbb1d6af1fe6))
* **docs:** link TypeDoc API to index.html to avoid 404 ([a70699a](https://github.com/mrkanitkar/playwright-praman/commit/a70699a2bfea0acc7dee367e63b60b2d32821d72))
* **docs:** migrate to custom domain praman.zestest.in ([b6d05ea](https://github.com/mrkanitkar/playwright-praman/commit/b6d05eabc11910872924925d9f7907a81f607657))
* **docs:** mobile nav menu hidden by backdrop-filter containing block ([39e0f11](https://github.com/mrkanitkar/playwright-praman/commit/39e0f11ba50c615a181a2e7d7dec3a78d0e7a9ec))
* **docs:** move TypeDoc theme CSS out of generated output dir ([f1a0466](https://github.com/mrkanitkar/playwright-praman/commit/f1a0466d59e9987bc8803de881e9b780667ed307))
* **docs:** navbar logo clipping and menu overflow ([12adc14](https://github.com/mrkanitkar/playwright-praman/commit/12adc1466e3c4a3603be970b100e0ec8ecc31925))
* **docs:** remove duplicate h1 tag from carousel slide 1 ([7c785f0](https://github.com/mrkanitkar/playwright-praman/commit/7c785f041b05d999408d82aad7fcffb2c1f15655))
* **docs:** remove stale /playwright-praman/ prefix from internal links ([f758769](https://github.com/mrkanitkar/playwright-praman/commit/f758769e3251ace81cb58d69ce49955d96b443e1))
* **docs:** replace hardcoded example passwords with safe placeholders ([#98](https://github.com/mrkanitkar/playwright-praman/issues/98)) ([2a86dfb](https://github.com/mrkanitkar/playwright-praman/commit/2a86dfb8d10d49594c7e3cb38f5fb7d3bc5f6eef))
* **docs:** replace placeholder logo with Praman verification seal ([0fc1421](https://github.com/mrkanitkar/playwright-praman/commit/0fc14211f58da9650d33b3b49146475a592390a3))
* **docs:** replace westeurope with eastus in Azure guide to fix cspell ([888599f](https://github.com/mrkanitkar/playwright-praman/commit/888599f7103a60be2b4afb2d583300e6a57789ac))
* **docs:** resolve 3 agent audit warnings (W-1, W-2, W-3) ([6fccc83](https://github.com/mrkanitkar/playwright-praman/commit/6fccc834a35029e88df0a86b61e124b778e75581))
* **docs:** resolve Bing SEO scan issues and update footer copyright ([52f0f24](https://github.com/mrkanitkar/playwright-praman/commit/52f0f24246fa96918b91cb3ec29ec90a783425a1))
* **docs:** restyle Ask AI FAB to pill with label ([9a4913f](https://github.com/mrkanitkar/playwright-praman/commit/9a4913fa58ba169ebf6f0dd906bf7b8f43ca6684))
* **docs:** revert manual version bump, let release-please manage ([eb8bc51](https://github.com/mrkanitkar/playwright-praman/commit/eb8bc5119e25ed7c4d3eac9ce348ff770f8b1219))
* **docs:** set correct baseUrl for GitHub Pages ([b108b91](https://github.com/mrkanitkar/playwright-praman/commit/b108b91e239b1fe010593e98954a7eaa4e476bf2))
* **docs:** simplify landing page h1 and tagline, fix &amp; encoding in jsx ([1f20424](https://github.com/mrkanitkar/playwright-praman/commit/1f204243a4d236b33641d73125e8d3b8fb6691a3))
* **docs:** sitemap priority tuning — demote legal pages, promote demo ([675ba0a](https://github.com/mrkanitkar/playwright-praman/commit/675ba0a77ced9dda4a1f1960e4a658c8d701a63d))
* **docs:** stack demo videos vertically with equal size ([#155](https://github.com/mrkanitkar/playwright-praman/issues/155)) ([fad6d2a](https://github.com/mrkanitkar/playwright-praman/commit/fad6d2a960a4c701b768e25f0f6b30aa8ca2796d))
* **docs:** standardize messaging across all pages ([9d23f32](https://github.com/mrkanitkar/playwright-praman/commit/9d23f326232d7546e122cfccde70f5a1c762389c))
* **docs:** update title and description for docs, personas, demo, migration pages ([978f25c](https://github.com/mrkanitkar/playwright-praman/commit/978f25c6d37e2002193b652e2d349e337ef42ba1))
* **docs:** use absolute URL for TypeDoc API link to bypass SPA ([cec268e](https://github.com/mrkanitkar/playwright-praman/commit/cec268e688c22c1bb42b7bf12ed69cb0970fe0c5))
* **fe:** migrate byFieldGroupId to Element.registry.all and document undocumented API risks ([#95](https://github.com/mrkanitkar/playwright-praman/issues/95)) ([05fec34](https://github.com/mrkanitkar/playwright-praman/commit/05fec3450354c8701f314c43d3e66cb65aec4198))
* **fe:** wire getFilterBarFieldValue into FE fixture ([58f5406](https://github.com/mrkanitkar/playwright-praman/commit/58f5406575cfe8f5c842fee8b42893941474faa9))
* **fixtures:** add browserBindTest and screencastTest to mergeTests() ([#99](https://github.com/mrkanitkar/playwright-praman/issues/99)) ([a8da811](https://github.com/mrkanitkar/playwright-praman/commit/a8da811ced16c8cbfa4bbbc402c279f24b25f3aa))
* **knip:** resolve unused dep and stale ignore warnings ([a78927e](https://github.com/mrkanitkar/playwright-praman/commit/a78927ef4c79060a0afc196fdaf1da95fbca85bc))
* **lint:** exclude auto-generated dirs from markdownlint ([7422cfc](https://github.com/mrkanitkar/playwright-praman/commit/7422cfca05cd405b4e7b08305878fa8accbf3a2b))
* **lint:** move eslint-disable to correct line in navigation + fix mock type ([2e91ccd](https://github.com/mrkanitkar/playwright-praman/commit/2e91ccde01673e5f7de4eaec8567da4077b84e37))
* migrate remaining ElementRegistry direct-access to sap.ui.require ([#157](https://github.com/mrkanitkar/playwright-praman/issues/157)) ([4a38998](https://github.com/mrkanitkar/playwright-praman/commit/4a389981f4069a4a2d0bc8509697128fca72599c))
* **phase1:** address review findings + add API docs ([f1a1dbb](https://github.com/mrkanitkar/playwright-praman/commit/f1a1dbb694c09baa06953543ab624a06cecfda61))
* **proxy:** resolve promise-function-async lint in ui5-object test ([83f5da4](https://github.com/mrkanitkar/playwright-praman/commit/83f5da4ff90ca2c7815c0f143405b4dbfbaceff0))
* **proxy:** resolve typecheck errors in proxy + error code additions ([2201580](https://github.com/mrkanitkar/playwright-praman/commit/220158080eff9e42e241f2f47db3034a2b7166b6))
* **proxy:** wire discovery strategy chain (G1) ([2727ba6](https://github.com/mrkanitkar/playwright-praman/commit/2727ba661844eab447d6dfb36b444199b5f1b339))
* **release:** add workflow_dispatch for manual npm publish, fix license & homepage ([cfd5138](https://github.com/mrkanitkar/playwright-praman/commit/cfd5138c989061eec3309fa4a688906b97c511c4))
* remove 17 `as never` casts via interface return type fixes ([e39dd97](https://github.com/mrkanitkar/playwright-praman/commit/e39dd97683fe34e599966d4cd1c01c40988b0ddc))
* remove license-report.json to resolve GitHub "Unknown licenses" badge ([c151f69](https://github.com/mrkanitkar/playwright-praman/commit/c151f6917097a38df3a7a74b5cf028f0754bdec8))
* remove unused locale/timezone, document PW-MERGE-1 ([#102](https://github.com/mrkanitkar/playwright-praman/issues/102)) ([949a249](https://github.com/mrkanitkar/playwright-praman/commit/949a2499925fd369fbb206de086d4aed077538af))
* replace 5 `as never` casts with BridgeInjectablePage interface ([705bcbe](https://github.com/mrkanitkar/playwright-praman/commit/705bcbe25a48736da1ee57015d117f3b6378173b))
* resolve CI failures — cspell, typedoc, audit, Windows paths ([7abb76e](https://github.com/mrkanitkar/playwright-praman/commit/7abb76ebcd9f771ff2cda4e62be3a737e491d93b))
* resolve OData exactOptionalPropertyTypes incompatibility ([23dbb35](https://github.com/mrkanitkar/playwright-praman/commit/23dbb357ad3659312638d5fff98e1501b0c988db))
* resolve remaining CI failures — MDX, knip, TypeDoc TS ([816c526](https://github.com/mrkanitkar/playwright-praman/commit/816c526b64765f4784ff11a51a84c450f23c439b))
* **security:** harden regex anchoring, XSS escaping, and hostname checks ([36c2325](https://github.com/mrkanitkar/playwright-praman/commit/36c23256bd385cb1589c24c2f91e6113b63b447a))
* **security:** production-readiness audit fixes ([3da1a0e](https://github.com/mrkanitkar/playwright-praman/commit/3da1a0ecbba8d18299a15aca58bde647e1a49dcf))
* **selectors,proxy:** resolve MEDIUM audit issues M5 and M9 ([#91](https://github.com/mrkanitkar/playwright-praman/issues/91)) ([356b772](https://github.com/mrkanitkar/playwright-praman/commit/356b772c1efcbddf17699c1fcca7d36d05500a94))
* **selectors:** fix ui5:property() type fidelity, error surfacing, and tree builder gaps ([4341b87](https://github.com/mrkanitkar/playwright-praman/commit/4341b8760f3142f6a27faf1c82680f9716973c00))
* **selectors:** preserve array types, align area node name, handle negative nth-child ([d148db9](https://github.com/mrkanitkar/playwright-praman/commit/d148db94f77c14c1f073b525fe5901404c573610))
* **selectors:** wire ui5= selector engine at runtime ([2c0ada5](https://github.com/mrkanitkar/playwright-praman/commit/2c0ada5d7bc4c14a307147ddcdf7028516c1a44e))
* **test:** add Babel decorator plugin for Vite 8 OXC compatibility ([#84](https://github.com/mrkanitkar/playwright-praman/issues/84)) ([e98f245](https://github.com/mrkanitkar/playwright-praman/commit/e98f245ef49674b94f07d50d9af6d4a218ff5296))
* **test:** increase scaffolder test timeout for Windows CI ([#78](https://github.com/mrkanitkar/playwright-praman/issues/78)) ([d5260dd](https://github.com/mrkanitkar/playwright-praman/commit/d5260dd950a89693bdf9145cda800805c6153c02))
* **tests:** fix integration tests and enforce headless CI ([#97](https://github.com/mrkanitkar/playwright-praman/issues/97)) ([4b9dfd7](https://github.com/mrkanitkar/playwright-praman/commit/4b9dfd74bc1f3fa75213df8d3e680d4822d619f9))
* **tests:** resolve 101 type errors and stale lint suppressions ([f882a13](https://github.com/mrkanitkar/playwright-praman/commit/f882a1307ed396954d39b69517ea91333ccd8370))
* **tests:** resolve all lint errors and boost test coverage ([21d9c46](https://github.com/mrkanitkar/playwright-praman/commit/21d9c4619950baf5fefc0ea251da4f8e7fa007f9))
* **tests:** use bracket notation for index signature access (TS4111) ([cfc2486](https://github.com/mrkanitkar/playwright-praman/commit/cfc24862736e5fd72c25625a28dc741beb063db7))
* **test:** update config test to match simplified CLI template ([d8b1dc0](https://github.com/mrkanitkar/playwright-praman/commit/d8b1dc062cd7a26dedb2c884de3bf87010e74ce4))
* **types:** resolve Playwright type erasure and DTS build failures ([889b76e](https://github.com/mrkanitkar/playwright-praman/commit/889b76e28c3702ca682e48a18b60777bef5385b8))
* UI5 1.136+ ElementRegistry access + CLI bridge config path ([#152](https://github.com/mrkanitkar/playwright-praman/issues/152)) ([d3ff24f](https://github.com/mrkanitkar/playwright-praman/commit/d3ff24f9e7db7639d3ecd4a6c167c7ebe5e9c871))
* use generic placeholder for SAP system URL in examples and tests ([c68ae03](https://github.com/mrkanitkar/playwright-praman/commit/c68ae0381fd66505b15d8d25543160deb1ad1889))


### Reverts

* **fixtures:** undo unintended behavior changes to core & module fixtures ([a1f2932](https://github.com/mrkanitkar/playwright-praman/commit/a1f2932b0b93118df9bc7b38716227c77462b59c))

## [1.3.1](https://github.com/mrkanitkar/playwright-praman/compare/v1.3.0...v1.3.1) (2026-05-30)


### Bug Fixes

* updated examples and tests, verified against Node.js 26 and supported ([c68ae03](https://github.com/mrkanitkar/playwright-praman/commit/c68ae0381fd66505b15d8d25543160deb1ad1889))

## [1.3.0](https://github.com/mrkanitkar/playwright-praman/compare/v1.2.0...v1.3.0) (2026-05-25)


### Features

* **docs-verify:** add checks 5-6, CI workflow, register all 8 checks ([#111](https://github.com/mrkanitkar/playwright-praman/issues/111)) ([ac06c43](https://github.com/mrkanitkar/playwright-praman/commit/ac06c43e3592ec7b0044b70305bf369673a1877f))
* Playwright 1.60 quick-win cluster (aria grounding, screencast highlight, OData onError) ([#145](https://github.com/mrkanitkar/playwright-praman/issues/145)) ([c844e31](https://github.com/mrkanitkar/playwright-praman/commit/c844e31e75e9f2056b51957e29b234fbf89b4e4d))


### Bug Fixes

* **deps:** restore zod 4.4.3, bump dotenv 17.4.2 ([#143](https://github.com/mrkanitkar/playwright-praman/issues/143)) ([7376f3e](https://github.com/mrkanitkar/playwright-praman/commit/7376f3e30d15442132ca9d93e607294cbf6f5dff))

## [1.2.0](https://github.com/mrkanitkar/playwright-praman/compare/v1.1.2...v1.2.0) (2026-04-08)


### Features

* add extension system, matcher registry, and fix lint errors ([64903fb](https://github.com/mrkanitkar/playwright-praman/commit/64903fb02d5797771d3bec128380d77efdae45a2))
* **api:** export Space navigation and WorkZone manager from root ([2410866](https://github.com/mrkanitkar/playwright-praman/commit/241086655a1b19938891aeab6a423e699b4ac7b1))
* **ci:** add Playwright canary (next) to integration matrix ([afe0bb6](https://github.com/mrkanitkar/playwright-praman/commit/afe0bb650b390dda23f392bb6d61948c67468deb))
* **ci:** add TS 5.9/6.0 compat matrix and build fixes ([c05deab](https://github.com/mrkanitkar/playwright-praman/commit/c05deab112b65c899e2fe8e82b7ff91967f9fe18))
* **cli,docs:** remove inspect, safe uninstall, 61→199 ([7ec473b](https://github.com/mrkanitkar/playwright-praman/commit/7ec473b8b07982b5925c33c6386a5ab95da878b4))
* **cli:** add 'config' command to display resolved configuration ([4beafd7](https://github.com/mrkanitkar/playwright-praman/commit/4beafd7dfacceb66f7ea98e6d2c60e7b66d4b9d9))
* **cli:** add init-agents command for lightweight ide-specific agent installation ([6519f28](https://github.com/mrkanitkar/playwright-praman/commit/6519f288638d6f28eff21dc6fbb3d979ce102a19))
* **cli:** add Playwright CLI support as token-efficient alternative to MCP ([33ebae0](https://github.com/mrkanitkar/playwright-praman/commit/33ebae07f8453611b9f02dbb10e1a45e6745c0c9))
* **cli:** implement interactive inspect command ([9bfbeb8](https://github.com/mrkanitkar/playwright-praman/commit/9bfbeb8ed7d6439c7d8f320485953677f633b89b))
* **cli:** implement Playwright CLI integration for SAP UI5 test automation ([d2b8582](https://github.com/mrkanitkar/playwright-praman/commit/d2b85823c378060fcc15e20072c2170407826783))
* **cli:** install CLI agents by default; add MCP vs CLI to README and website ([f35f1f8](https://github.com/mrkanitkar/playwright-praman/commit/f35f1f870e26d420b26dc5555d4f0bdb736f6dc3))
* **config:** add nested env var support for auth, ai, telemetry, odataTracing ([cbb67a4](https://github.com/mrkanitkar/playwright-praman/commit/cbb67a4e350ca5c3a5fee337134678ae5bc22250))
* **core:** AI readiness audit fixes — config presets, docs, TSDoc tags ([#92](https://github.com/mrkanitkar/playwright-praman/issues/92)) ([9ba9bce](https://github.com/mrkanitkar/playwright-praman/commit/9ba9bce50aaef35c4467f4d7358212d96f82b2d5))
* **deps:** raise minimum Node.js to 22, drop EOL Node 20 ([87aeba9](https://github.com/mrkanitkar/playwright-praman/commit/87aeba98b6989d4c5369fa02e093fe4df6a08b4c))
* **deps:** upgrade Playwright to 1.59.0, add feature flags ([295e984](https://github.com/mrkanitkar/playwright-praman/commit/295e9840569da71e83c496ddeab287363fc37741))
* **deps:** upgrade TypeScript 5.9.3 → 6.0.2 ([f6204bd](https://github.com/mrkanitkar/playwright-praman/commit/f6204bd3249d96d0979b2f746a2ba9ffa132f9e7))
* **docs-verify:** add docs accuracy verification pipeline with 6 checks ([#105](https://github.com/mrkanitkar/playwright-praman/issues/105)) ([8cec7ff](https://github.com/mrkanitkar/playwright-praman/commit/8cec7ffdd6bee32afc92736582bc5cb97480380b))
* **docs,ci:** add SAP test automation comparison blog + fix lint/build compliance ([2dc7832](https://github.com/mrkanitkar/playwright-praman/commit/2dc78321ad83f391ef95b22e12bff93253d90cfa))
* **docs:** add IndexNow key for Bing/Yandex/DuckDuckGo instant indexing ([53175ab](https://github.com/mrkanitkar/playwright-praman/commit/53175ab3c720693e7ca038b4e8f107fedf0b7b79))
* **docs:** add SEO meta tags, social card, sitemap priorities, and persistent H1 ([df73079](https://github.com/mrkanitkar/playwright-praman/commit/df730795f084e3b0a6093e31a8e7e729745013cf))
* **docs:** seo overhaul for api descriptions, keywords, competitive positioning ([f24593c](https://github.com/mrkanitkar/playwright-praman/commit/f24593c09a9d07618afc46731bed0ae644488e0b))
* dx audit — 19 developer experience improvements (F-01–F-19) ([64d68c0](https://github.com/mrkanitkar/playwright-praman/commit/64d68c03b87d172d642bdc195affddaa94790e54))
* enhance npm discoverability and readme for growth ([2f67ad6](https://github.com/mrkanitkar/playwright-praman/commit/2f67ad66b6825db520ef0df7bd7c2c360fadf44c))
* **errors:** add docs url to error messages, json, and ai context ([0754979](https://github.com/mrkanitkar/playwright-praman/commit/0754979c9943914c0f01727dda68af26e21d6a94))
* **selectors:** add :not(), :labeled(), positional and sibling selectors ([dc5961d](https://github.com/mrkanitkar/playwright-praman/commit/dc5961d04fa13e43a16deb1822b7d4f203b9d1e6))
* **selectors:** unify UI5 selector engine with fontoxpath + css-selector-parser ([4b3fda8](https://github.com/mrkanitkar/playwright-praman/commit/4b3fda8a9dfa536f57ed8e35063060dd2eb5b1e5))
* **telemetry:** OpenTelemetry phase 2 — dynamic loading, exporters, reporter + Docusaurus 3.10 ([#104](https://github.com/mrkanitkar/playwright-praman/issues/104)) ([3576feb](https://github.com/mrkanitkar/playwright-praman/commit/3576feb98b4f6cf0003b1ea13e45a109362f9616))


### Bug Fixes

* **bridge:** add v8 ignore for browser-context functions in opa5-strategy ([#77](https://github.com/mrkanitkar/playwright-praman/issues/77)) ([5ba7c34](https://github.com/mrkanitkar/playwright-praman/commit/5ba7c34e08cd663e1d925d67aaaf36de54673eb9))
* **bridge:** implement searchOpenDialogs priority and add FLP Space Tab navigation ([7d2dfd8](https://github.com/mrkanitkar/playwright-praman/commit/7d2dfd8de7e35a46737def05a04f816465c36d60))
* **bridge:** remove fictional sap.ui.Global.version and RecordReplay.getAutoWaiter APIs ([#93](https://github.com/mrkanitkar/playwright-praman/issues/93)) ([ba83373](https://github.com/mrkanitkar/playwright-praman/commit/ba8337314bbbec2e1b79cf8fd9e11c73917b13fa))
* **bridge:** remove incorrect interactionTimeout param and fix FilterBar.clear usage ([#94](https://github.com/mrkanitkar/playwright-praman/issues/94)) ([23f3f5e](https://github.com/mrkanitkar/playwright-praman/commit/23f3f5eb0356095605060e6a026b09c3259df6ca))
* **ci:** add @playwright/cli to knip ignoreDependencies ([67664b0](https://github.com/mrkanitkar/playwright-praman/commit/67664b0e3e2906ae8ae30c8a3e18bbc4f70bb993))
* **ci:** add CSpell check to pre-push hook ([5b85a35](https://github.com/mrkanitkar/playwright-praman/commit/5b85a35ad28c9bb875986ba41b2fa5cb7d1402ef))
* **ci:** add generated report/planning docs to markdownlint ignore ([1eaf3b5](https://github.com/mrkanitkar/playwright-praman/commit/1eaf3b5981ac4120adc1d193b8c2f3da9aae454f))
* **ci:** add missing commit scopes (deps, release, adapter) ([0c202aa](https://github.com/mrkanitkar/playwright-praman/commit/0c202aaec57cbf433244b1032c94105b7753455c))
* **ci:** add missing words to CSpell dictionary ([6cfdb73](https://github.com/mrkanitkar/playwright-praman/commit/6cfdb7365172f83b077f459b894038c8121621b9))
* **ci:** add preuninstall to cspell dictionary ([9793e11](https://github.com/mrkanitkar/playwright-praman/commit/9793e1126621282c856a9e38607788e55b75521f))
* **ci:** add specs/ to eslint ignores, move gold-standard spec ([071870b](https://github.com/mrkanitkar/playwright-praman/commit/071870bf902edd3333f0f1f6b87304a24486f128))
* **ci:** handle corrupted npm on macOS ARM64 runners ([b03ab59](https://github.com/mrkanitkar/playwright-praman/commit/b03ab59c90abdb0bcd6f62b0997c3f8111755d97))
* **ci:** regenerate lockfile and fix docs broken links ([9114f77](https://github.com/mrkanitkar/playwright-praman/commit/9114f77fcc28189677bb3cc526318f8ce49112c1))
* **ci:** regenerate lockfile for strict npm ci on Node.js 24 ([a5af8b1](https://github.com/mrkanitkar/playwright-praman/commit/a5af8b1982f4462b78a1378dc644a803f53aa017))
* **ci:** remove export validation from ts-compat job ([9f1643d](https://github.com/mrkanitkar/playwright-praman/commit/9f1643df6ef4c74e80b5464a538a118a7dadb8d1))
* **ci:** resolve knip unused export warnings ([9500766](https://github.com/mrkanitkar/playwright-praman/commit/9500766005a51f59d76a90c731b756f00f729b70))
* **ci:** skip azure playwright job when secret not configured ([d6c4154](https://github.com/mrkanitkar/playwright-praman/commit/d6c41541cf981c774201b5af47ad883ed9c6dc85))
* **ci:** skip DTS in ts-compat job for TS 5.9 ([bcf2b5e](https://github.com/mrkanitkar/playwright-praman/commit/bcf2b5e7dbae4b227049566c3beb7c6478bc9c37))
* **cli:** add iife wrappers, unexport cleanEmptyDirs, remove unused logger fns ([b4b03fe](https://github.com/mrkanitkar/playwright-praman/commit/b4b03fea6899d11639dc037fea799f8b7d6d5bb7))
* **cli:** fix mock-filesystem readdir for Windows path separators ([3066ffd](https://github.com/mrkanitkar/playwright-praman/commit/3066ffdb2bbd9743ecf956c8afc56c2ce4135a91))
* **cli:** fix playwright-cli integration — config, build, and docs ([bc026be](https://github.com/mrkanitkar/playwright-praman/commit/bc026be9ebe0e3e32c5659f7f99452023d66fdcb))
* **cli:** pass cli flag to scaffoldIDEFiles in new project path ([277ade8](https://github.com/mrkanitkar/playwright-praman/commit/277ade89a4cd42eddc3f478995141df21d30f9d0))
* **cli:** remove logRaw and logDivider from test mocks ([ae2e37f](https://github.com/mrkanitkar/playwright-praman/commit/ae2e37f45a32df91179c47fe9d7dbe9137b3f392))
* **cli:** remove redundant package install step from init command ([709139c](https://github.com/mrkanitkar/playwright-praman/commit/709139cc3b70af6048614de8c5fb204a04a03a65))
* **cli:** remove unused export on runEslintCheck (knip) ([6b1c0ea](https://github.com/mrkanitkar/playwright-praman/commit/6b1c0ea126b66a30130cc52a6d764629d702463a))
* **config:** add screencast to cspell dictionary ([0083b9b](https://github.com/mrkanitkar/playwright-praman/commit/0083b9b6bea9651a26a4b912b69cca4e0ec4adc4))
* **config:** remove dead PRAMAN_AUTH_* env var layer ([#100](https://github.com/mrkanitkar/playwright-praman/issues/100)) ([542c50a](https://github.com/mrkanitkar/playwright-praman/commit/542c50a751a30a38b042e430eb64bca354eef196))
* **core:** resolve 4 HIGH audit issues (H3, H4, H7, H9) ([#90](https://github.com/mrkanitkar/playwright-praman/issues/90)) ([3ca5931](https://github.com/mrkanitkar/playwright-praman/commit/3ca5931a791b1949faa1654b793409bfe52e2950))
* **core:** resolve lint errors in control-tree tests ([79040a1](https://github.com/mrkanitkar/playwright-praman/commit/79040a1e9258026354ca1b9918a3773985cf3849))
* **cspell:** add pwtest and British serialise variants to project dictionary ([3cf74a0](https://github.com/mrkanitkar/playwright-praman/commit/3cf74a0d64031bd2f251cb97e11a6416fa460784))
* **deps:** resolve all npm audit vulnerabilities (0 remaining) ([1df96dc](https://github.com/mrkanitkar/playwright-praman/commit/1df96dc8d7dbca1c212894b4ce613e6f238e9aa4))
* **deps:** resolve docs vulnerabilities (0 remaining) ([f2a0f70](https://github.com/mrkanitkar/playwright-praman/commit/f2a0f70bd3733d7323b017cba3794cc626de97fd))
* **docs:** add lastmod to all sitemap urls including typedoc api pages ([f8c113a](https://github.com/mrkanitkar/playwright-praman/commit/f8c113a393c0f5e6700118d5bfcb9afca962283d))
* **docs:** add Playwright-Praman to page titles for SEO ([a1100c8](https://github.com/mrkanitkar/playwright-praman/commit/a1100c8fe5e9c36a28834383339f6206460505a0))
* **docs:** mobile nav menu hidden by backdrop-filter containing block ([3b8e185](https://github.com/mrkanitkar/playwright-praman/commit/3b8e18577f0600963dac2c55fe9fedab634028ad))
* **docs:** navbar logo clipping and menu overflow ([06463ea](https://github.com/mrkanitkar/playwright-praman/commit/06463ea432e7f51bf03e3058bb8c1bd2e2ed49b8))
* **docs:** remove duplicate h1 tag from carousel slide 1 ([b20b063](https://github.com/mrkanitkar/playwright-praman/commit/b20b06387e74ed9c0b946b88f7ef27e08d6f6023))
* **docs:** replace hardcoded example passwords with safe placeholders ([#98](https://github.com/mrkanitkar/playwright-praman/issues/98)) ([ded8681](https://github.com/mrkanitkar/playwright-praman/commit/ded86816f1233130ff187a9a3e6e1dd73fc85767))
* **docs:** replace placeholder logo with Praman verification seal ([ae142bf](https://github.com/mrkanitkar/playwright-praman/commit/ae142bfb4f6867ff4bde6e1108d2710de9adb7fc))
* **docs:** resolve 3 agent audit warnings (W-1, W-2, W-3) ([db2ceac](https://github.com/mrkanitkar/playwright-praman/commit/db2ceac0dc520de04f7b5006aa01e267100dea37))
* **docs:** simplify landing page h1 and tagline, fix &amp; encoding in jsx ([ddfa98f](https://github.com/mrkanitkar/playwright-praman/commit/ddfa98fc3181c64437eb07736c47a575f0f1d97b))
* **docs:** sitemap priority tuning — demote legal pages, promote demo ([aba7174](https://github.com/mrkanitkar/playwright-praman/commit/aba717479fffb024c3320048536249d63f78e97d))
* **docs:** standardize messaging across all pages ([994942e](https://github.com/mrkanitkar/playwright-praman/commit/994942eb884e633bbd32eba953a0c0ef8894b332))
* **docs:** update title and description for docs, personas, demo, migration pages ([a2ffecd](https://github.com/mrkanitkar/playwright-praman/commit/a2ffecd0b62d7813186bf5fcd2245b59f5029bb0))
* **fe:** migrate byFieldGroupId to Element.registry.all and document undocumented API risks ([#95](https://github.com/mrkanitkar/playwright-praman/issues/95)) ([d6120fb](https://github.com/mrkanitkar/playwright-praman/commit/d6120fbc9d671b5004ea8e543392adc1da7454e4))
* **fixtures:** add browserBindTest and screencastTest to mergeTests() ([#99](https://github.com/mrkanitkar/playwright-praman/issues/99)) ([78c884a](https://github.com/mrkanitkar/playwright-praman/commit/78c884ab6f24f2ab6f9f15fb55bf9d5f28752ce7))
* remove 17 `as never` casts via interface return type fixes ([5071573](https://github.com/mrkanitkar/playwright-praman/commit/5071573f09a94b7e9e8d726446263c36ecf99cab))
* remove unused locale/timezone, document PW-MERGE-1 ([#102](https://github.com/mrkanitkar/playwright-praman/issues/102)) ([8a61281](https://github.com/mrkanitkar/playwright-praman/commit/8a612817b8e5914211839be1e55a8685c94a464e))
* replace 5 `as never` casts with BridgeInjectablePage interface ([f2e63ef](https://github.com/mrkanitkar/playwright-praman/commit/f2e63efc816499a28691f4faf241898b6ab6eef1))
* resolve OData exactOptionalPropertyTypes incompatibility ([b5dee52](https://github.com/mrkanitkar/playwright-praman/commit/b5dee526496de5495e28ff76228f1e7c0f449581))
* **selectors,proxy:** resolve MEDIUM audit issues M5 and M9 ([#91](https://github.com/mrkanitkar/playwright-praman/issues/91)) ([60359cc](https://github.com/mrkanitkar/playwright-praman/commit/60359ccb9d87852716c812cf43d1dae11bfb7e55))
* **selectors:** fix ui5:property() type fidelity, error surfacing, and tree builder gaps ([7eaebeb](https://github.com/mrkanitkar/playwright-praman/commit/7eaebeb2cf481b75de7ee8981ccde751dfd4f9ef))
* **selectors:** preserve array types, align area node name, handle negative nth-child ([737dafd](https://github.com/mrkanitkar/playwright-praman/commit/737dafd020c55cd3737ed0b2c166f8f770412d2e))
* **test:** add Babel decorator plugin for Vite 8 OXC compatibility ([#84](https://github.com/mrkanitkar/playwright-praman/issues/84)) ([d16ff9b](https://github.com/mrkanitkar/playwright-praman/commit/d16ff9bc8f42dd5931dbeee5eff71dca885cc543))
* **test:** increase scaffolder test timeout for Windows CI ([#78](https://github.com/mrkanitkar/playwright-praman/issues/78)) ([4160640](https://github.com/mrkanitkar/playwright-praman/commit/41606406d5cef5647b2fdf3c07176c1f7b660191))
* **tests:** fix integration tests and enforce headless CI ([#97](https://github.com/mrkanitkar/playwright-praman/issues/97)) ([26beabe](https://github.com/mrkanitkar/playwright-praman/commit/26beabe1f20c9042a6fc4a8b46cea85b619cb362))
* **test:** update config test to match simplified CLI template ([b786342](https://github.com/mrkanitkar/playwright-praman/commit/b7863420338b6f8e23eaac40a40f03ca10652cd1))

## [1.1.2](https://github.com/mrkanitkar/playwright-praman/compare/v1.1.1...v1.1.2) (2026-03-07)


### Bug Fixes

* **build:** disable chunk splitting to resolve Socket.dev obfuscation alert ([bdbc93e](https://github.com/mrkanitkar/playwright-praman/commit/bdbc93e30e68f875367a14d5f8d98f8c908b7d90))

## [1.1.1](https://github.com/mrkanitkar/playwright-praman/compare/v1.1.0...v1.1.1) (2026-03-07)


### Features

* **docs:** simplify onboarding to 2 commands, elevate AI agent pipeline ([c325010](https://github.com/mrkanitkar/playwright-praman/commit/c3250109cf8221b95b094c4d7681094ca46d3e0c))
* **prompts:** add prompt factory with two SAP prompts and disclaimers ([92e3c68](https://github.com/mrkanitkar/playwright-praman/commit/92e3c68b6c12c2cdfc8d6a85a9886f8bf1c57671))


### Bug Fixes

* **ci:** add SAP domain words to cspell dictionary ([9089051](https://github.com/mrkanitkar/playwright-praman/commit/9089051f516a02e7461faa9488048a6fe19df476))
* **ci:** inline upload-pages-artifact for SHA-pinning compliance ([68b89b5](https://github.com/mrkanitkar/playwright-praman/commit/68b89b588799ce51cef9bd27ec507bcd940df513))

## [1.1.0](https://github.com/mrkanitkar/playwright-praman/compare/v1.0.4...v1.1.0) (2026-03-07)


### Features

* **docs:** add SEO badges, keywords, FAQ schema, config ([5fc93bb](https://github.com/mrkanitkar/playwright-praman/commit/5fc93bbbc708f92b1e4254944fe4aecb794b7c3c))


### Bug Fixes

* **docs:** resolve Bing SEO scan issues and update footer copyright ([c831ac3](https://github.com/mrkanitkar/playwright-praman/commit/c831ac3e5151da95eba0222d601f5c4e4e2ef62b))
* **docs:** revert manual version bump, let release-please manage ([8d47917](https://github.com/mrkanitkar/playwright-praman/commit/8d47917b4ad5707d5411a932c9b2fb2004deab8e))

## [1.0.4](https://github.com/mrkanitkar/playwright-praman/compare/v1.0.3...v1.0.4) (2026-03-07)


### Bug Fixes

* **ci:** ignore auto-generated CHANGELOG.md in markdownlint ([a65c1b9](https://github.com/mrkanitkar/playwright-praman/commit/a65c1b994e34ee05bec8279e552ba0c2be505163))
* **security:** harden regex anchoring, XSS escaping, and hostname checks ([3c1cbe9](https://github.com/mrkanitkar/playwright-praman/commit/3c1cbe95f22c4d03a5b5326d36db41ee1850e322))

## [1.0.3](https://github.com/mrkanitkar/playwright-praman/compare/v1.0.2...v1.0.3) (2026-03-07)


### Bug Fixes

* **ci:** auto-increment canary alpha version from npm ([c8f3dc2](https://github.com/mrkanitkar/playwright-praman/commit/c8f3dc2216cf539c4a2be0f4d6a3e8a3ea3b3448))
* **ci:** disable FORCE_COLOR for canary version stamp ([71e307e](https://github.com/mrkanitkar/playwright-praman/commit/71e307eb2d7bde18cca16f44f40865648204bfbb))

## [1.0.1] - 2026-02-23

### Added

- LICENSE copyright holder updated
- NOTICE file for Apache 2.0 attribution
- SECURITY.md vulnerability disclosure policy
- Package metadata improvements (author, files)

## 1.0.0 (2026-02-16)

### Breaking Changes

- Build output now includes CJS alongside ESM

### Features

- **eslint:** add comprehensive best practices configuration ([ea794d6](https://github.com/mrkanitkar/playwright-praman/commit/ea794d6809e9b4b9aec8bc22d58d1da6901b5573))
- multi-OS, multi-IDE, dual ESM+CJS build, AI agents support ([860d52c](https://github.com/mrkanitkar/playwright-praman/commit/860d52c4cad11c2a227c2254920f1a23625beed5))

### Bug Fixes

- **ci:** add docs-check job, security eslint, sbom step, fix defineConfig export ([8d8a74c](https://github.com/mrkanitkar/playwright-praman/commit/8d8a74ca3f1177ab650e5686e19835a0c7cb4df3))
- **ci:** resolve all GitHub Actions workflow failures ([5c3f212](https://github.com/mrkanitkar/playwright-praman/commit/5c3f21237b8ef61ceb3f8a509c7e0d64b0556d60))
- **ci:** set coverage thresholds to 0% for initial release ([5b35d37](https://github.com/mrkanitkar/playwright-praman/commit/5b35d37afb05fe78c2f79f6938acc6d56c1e8072))
- **ci:** update husky hooks to use tsx instead of deleted bash script ([bee1620](https://github.com/mrkanitkar/playwright-praman/commit/bee1620afe278317b6d1a52fe937a199f78ec3e6))

## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Automated via [release-please](https://github.com/googleapis/release-please) from Conventional Commits.
