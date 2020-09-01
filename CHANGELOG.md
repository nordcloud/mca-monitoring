# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.7](https://github.com/nordcloud/mca-monitoring/compare/v0.0.6...v0.0.7) (2020-09-01)


### Bug Fixes

* **loggroup:** Cleanup alarm name ([1afe9a7](https://github.com/nordcloud/mca-monitoring/commit/1afe9a74726cb60cd10009f3f78f56b25533bfdb))

### [0.0.6](https://github.com/nordcloud/mca-monitoring/compare/v0.0.5...v0.0.6) (2020-08-18)


### Bug Fixes

* Better nested stack names ([9f9466c](https://github.com/nordcloud/mca-monitoring/commit/9f9466c45b95eaafc5821f90f130346e16d660b6))

### [0.0.5](https://github.com/nordcloud/mca-monitoring/compare/v0.0.4...v0.0.5) (2020-08-14)


### Features

* Change postinstall to prepare ([3b67645](https://github.com/nordcloud/mca-monitoring/commit/3b6764517840f6c627f7b48d3a416acaca5fa988))

### [0.0.4](https://github.com/nordcloud/mca-monitoring/compare/v0.0.3...v0.0.4) (2020-08-13)


### Bug Fixes

* **loggroup:** Check for unique metric names ([92dfe65](https://github.com/nordcloud/mca-monitoring/commit/92dfe652f8e860401c313bbf7147d9c3660ae389))

### 0.0.3 (2020-08-13)


### Features

* **versioning:** add release command ([b6aa937](https://github.com/nordcloud/mca-monitoring/commit/b6aa937474f602bcfd58f8344d2d649a20f351a2))
* add support for metric filter based log group alerts ([a32080f](https://github.com/nordcloud/mca-monitoring/commit/a32080f8538ffe65ba3f12b6b9c9ac893bd4d05f))
* **monitoring:** add support for eks clusters ([2e8cbf7](https://github.com/nordcloud/mca-monitoring/commit/2e8cbf712d514e1714997270a67bad363fe0a17c))
* **monitoring:** add support for rds instances ([70fd155](https://github.com/nordcloud/mca-monitoring/commit/70fd155c52f9b186715553b2529fc51c67c89a1d))
* Add bitbucket pipelines ([a75c2d4](https://github.com/nordcloud/mca-monitoring/commit/a75c2d41f005253e865dba1a10ab66687f78df90))
* Add cloudfront alarm stack ([565fc1a](https://github.com/nordcloud/mca-monitoring/commit/565fc1a36cef9d9537b1f8d76bce59e14e25eb80))
* Add cloudfront support ([65521e5](https://github.com/nordcloud/mca-monitoring/commit/65521e522f9d0df7f46293058da5995d830048b6))
* Add config tests ([5546af2](https://github.com/nordcloud/mca-monitoring/commit/5546af2c5ca463179176ec4ed729ba0c481e6bb6))
* Add postinstall script to package.json ([ae1bf98](https://github.com/nordcloud/mca-monitoring/commit/ae1bf9836e545c5132395629472e04e2bc1adfdc))
* Initial commit ([cd79517](https://github.com/nordcloud/mca-monitoring/commit/cd79517a1700909dbfe8eb4358079fb3c9765655))
* Refactor, add ECS and api gateway support ([36616f6](https://github.com/nordcloud/mca-monitoring/commit/36616f67931d8add107607fccb985cd1e529315c))
* Remove need for arn in config ([8215223](https://github.com/nordcloud/mca-monitoring/commit/8215223ab6c961049d9f01c85a450dbc7ee5e966))
* Update lambda config and add alias support ([9c88edd](https://github.com/nordcloud/mca-monitoring/commit/9c88eddea9002d65c22ea55ffdbbb2539de03ea8))


### Bug Fixes

* **monitoring:** Fix local metric config handling ([1375596](https://github.com/nordcloud/mca-monitoring/commit/137559663ad69d3c96e231c29836f246bdfe924b))
* Add ./ to build ([39cfb31](https://github.com/nordcloud/mca-monitoring/commit/39cfb318b795a89c0d541109d50486781b46a818))
* add eks and rds type definitions ([d08fe9c](https://github.com/nordcloud/mca-monitoring/commit/d08fe9cf81734c24e460f830afdf75572ebe9544))
* Allow ts-ignore ([ddf2a30](https://github.com/nordcloud/mca-monitoring/commit/ddf2a302fb72fd173e325bc78e0a1849b3da76f1))
* Fix configuration error with local configs ([9b24c0b](https://github.com/nordcloud/mca-monitoring/commit/9b24c0b481a2250bf8492a5bcb4e4aab5ed778df))
* Fix linter errors ([022b5ad](https://github.com/nordcloud/mca-monitoring/commit/022b5ad085d526f54f5c4650d0a146c46c6174a7))
* Fix linter errors ([9e06946](https://github.com/nordcloud/mca-monitoring/commit/9e06946c480368edf80a21f42b7e806630566b86))
* Fix type in lambda namespace, add more tests ([5c5554f](https://github.com/nordcloud/mca-monitoring/commit/5c5554fc0d6796ef31c9c681f4befa8efe0c7aa1))
* Ignore module not found error for fs ([bbaeadb](https://github.com/nordcloud/mca-monitoring/commit/bbaeadb1aecdf376654e6020437c18c998899134))
* Move tests to test folder ([51dbc6f](https://github.com/nordcloud/mca-monitoring/commit/51dbc6f9526fbb99851f2148c5e6a1caae81f4f0))
* Move types as dependency in package.json ([1c8826d](https://github.com/nordcloud/mca-monitoring/commit/1c8826de6156da6703dd022a8bcb36a7f24535a8))
* Revert prepare change ([bd648aa](https://github.com/nordcloud/mca-monitoring/commit/bd648aa50a6110dea08b0cef67948701088cd054))
* Switch from postinstall to prepare ([11e0582](https://github.com/nordcloud/mca-monitoring/commit/11e05825e5ca59342f153b4be751583f861ad172))
* Update build, add separate docs ([fd201be](https://github.com/nordcloud/mca-monitoring/commit/fd201be121a5afc9c6ae49c7796233506b22e455))

### [0.0.2](https://bitbucket.org/nordcloud/mca-monitoring/compare/v0.0.1...v0.0.2) (2020-07-17)


### Bug Fixes

* **monitoring:** Fix local metric config handling ([1375596](https://bitbucket.org/nordcloud/mca-monitoring/commit/137559663ad69d3c96e231c29836f246bdfe924b))

### [0.0.1](https://bitbucket.org/nordcloud/mca-monitoring/compare/v0.0.0...v0.0.1) (2020-07-16)


### Features

* **versioning:** add release command ([b6aa937](https://bitbucket.org/nordcloud/mca-monitoring/commit/b6aa937474f602bcfd58f8344d2d649a20f351a2))

## 0.0.0 (2020-07-16)


### Features

* Add bitbucket pipelines ([a75c2d4](https://bitbucket.org/nordcloud/mca-monitoring/commit/a75c2d41f005253e865dba1a10ab66687f78df90))
* Add cloudfront alarm stack ([565fc1a](https://bitbucket.org/nordcloud/mca-monitoring/commit/565fc1a36cef9d9537b1f8d76bce59e14e25eb80))
* Add cloudfront support ([65521e5](https://bitbucket.org/nordcloud/mca-monitoring/commit/65521e522f9d0df7f46293058da5995d830048b6))
* Add config tests ([5546af2](https://bitbucket.org/nordcloud/mca-monitoring/commit/5546af2c5ca463179176ec4ed729ba0c481e6bb6))
* Add postinstall script to package.json ([ae1bf98](https://bitbucket.org/nordcloud/mca-monitoring/commit/ae1bf9836e545c5132395629472e04e2bc1adfdc))
* add support for metric filter based log group alerts ([a32080f](https://bitbucket.org/nordcloud/mca-monitoring/commit/a32080f8538ffe65ba3f12b6b9c9ac893bd4d05f))
* Initial commit ([cd79517](https://bitbucket.org/nordcloud/mca-monitoring/commit/cd79517a1700909dbfe8eb4358079fb3c9765655))
* Refactor, add ECS and api gateway support ([36616f6](https://bitbucket.org/nordcloud/mca-monitoring/commit/36616f67931d8add107607fccb985cd1e529315c))
* Remove need for arn in config ([8215223](https://bitbucket.org/nordcloud/mca-monitoring/commit/8215223ab6c961049d9f01c85a450dbc7ee5e966))
* Update lambda config and add alias support ([9c88edd](https://bitbucket.org/nordcloud/mca-monitoring/commit/9c88eddea9002d65c22ea55ffdbbb2539de03ea8))
* **monitoring:** add support for eks clusters ([2e8cbf7](https://bitbucket.org/nordcloud/mca-monitoring/commit/2e8cbf712d514e1714997270a67bad363fe0a17c))
* **monitoring:** add support for rds instances ([70fd155](https://bitbucket.org/nordcloud/mca-monitoring/commit/70fd155c52f9b186715553b2529fc51c67c89a1d))


### Bug Fixes

* Add ./ to build ([39cfb31](https://bitbucket.org/nordcloud/mca-monitoring/commit/39cfb318b795a89c0d541109d50486781b46a818))
* add eks and rds type definitions ([d08fe9c](https://bitbucket.org/nordcloud/mca-monitoring/commit/d08fe9cf81734c24e460f830afdf75572ebe9544))
* Allow ts-ignore ([ddf2a30](https://bitbucket.org/nordcloud/mca-monitoring/commit/ddf2a302fb72fd173e325bc78e0a1849b3da76f1))
* Fix configuration error with local configs ([9b24c0b](https://bitbucket.org/nordcloud/mca-monitoring/commit/9b24c0b481a2250bf8492a5bcb4e4aab5ed778df))
* Fix linter errors ([022b5ad](https://bitbucket.org/nordcloud/mca-monitoring/commit/022b5ad085d526f54f5c4650d0a146c46c6174a7))
* Fix linter errors ([9e06946](https://bitbucket.org/nordcloud/mca-monitoring/commit/9e06946c480368edf80a21f42b7e806630566b86))
* Fix type in lambda namespace, add more tests ([5c5554f](https://bitbucket.org/nordcloud/mca-monitoring/commit/5c5554fc0d6796ef31c9c681f4befa8efe0c7aa1))
* Ignore module not found error for fs ([bbaeadb](https://bitbucket.org/nordcloud/mca-monitoring/commit/bbaeadb1aecdf376654e6020437c18c998899134))
* Move tests to test folder ([51dbc6f](https://bitbucket.org/nordcloud/mca-monitoring/commit/51dbc6f9526fbb99851f2148c5e6a1caae81f4f0))
* Move types as dependency in package.json ([1c8826d](https://bitbucket.org/nordcloud/mca-monitoring/commit/1c8826de6156da6703dd022a8bcb36a7f24535a8))
* Revert prepare change ([bd648aa](https://bitbucket.org/nordcloud/mca-monitoring/commit/bd648aa50a6110dea08b0cef67948701088cd054))
* Switch from postinstall to prepare ([11e0582](https://bitbucket.org/nordcloud/mca-monitoring/commit/11e05825e5ca59342f153b4be751583f861ad172))
* Update build, add separate docs ([fd201be](https://bitbucket.org/nordcloud/mca-monitoring/commit/fd201be121a5afc9c6ae49c7796233506b22e455))
