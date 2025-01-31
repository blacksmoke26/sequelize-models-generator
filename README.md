# node-ts-boilerplate

Developer Ready: A comprehensive template. Works out of the box for most [Node.js](https://nodejs.org) projects.

Instant Value: All basic tools included and configured:

- [TypeScript](https://www.typescriptlang.org/) 5.7+.
- Using [Babel-node](https://babeljs.io/docs/en/babel-node) for transpilation.
- [ESLint](https://eslint.org/) with some initial rules' recommendation.
- [Jest](https://jestjs.io/) for fast unit testing and code coverage.
- Type definitions for Node.js and Jest.
- [Prettier](https://prettier.io/) to enforce consistent code style.
- NPM [scripts](#available-scripts) for common operations.
- .editorconfig for consistent file format.
- Simple example of TypeScript code and unit test.
- Use all ES6 features *(including experimental and proposal)*.
- Minimal `.env` files for environment customization.
- Clean imports: No relative files path.
- Zero dependencies: Install your own packages.
- `yarn` PM by default.
- `pm2` as a process manager

🤲 Free as in speech: available under the APLv2 license.

## Getting Started

This project is intended to be used with the latest Active LTS release of [Node.js][nodejs].

### Use as a repository template

To start,
1. Install PM2 process manager: `yarn global add pm2` or `npm i -g pm2`.
2. Clone this repository.
3. Copy `.env.sample` to `.env`.
4. Install packages: `yarn install` or `npm i`.
5. Start adding your code in the `src` and unit tests in the `__tests__` directories.

### Clone repository

To clone the repository, use the following commands:

```sh
git clone https://github.com/jiifw/node-ts-boilerplate
cd node-ts-boilerplate
yarn
```

### Download latest release

Download and unzip the current **main** branch or one of the tags:

```sh
wget https://github.com/jiifw/node-ts-boilerplate/archive/main.zip -O node-ts-boilerplate.zip
unzip node-ts-boilerplate.zip && rm node-ts-boilerplate.zip
```

## Available Scripts

- `start` - serve built project.
- `start:dev` - interactive watch mode to automatically transpile source files.
- `start:debug` - interactive watch mode with debugger to automatically transpile source files.
- `clean` - remove coverage data, Jest cache, transpiled files and runtime files.
- `prebuild` - lint source files and tests before building.
- `build` - transpile TypeScript to ES6 (node compatible).
- `build:prod` - transpile TypeScript to ES6 for production *(minified)*.
- `lint` - lint source files and tests.
- `prettier` - reformat files.
- `test` - run tests.
- `test:watch` - interactive watch mode to automatically re-run tests.
- `pm2:start` - [PM2](https://pm2.keymetrics.io/) specific start service(s).
- `pm2:stop` - [PM2](https://pm2.keymetrics.io/) specific stop service(s).
- `pm2:delete` - [PM2](https://pm2.keymetrics.io/) specific delete service(s).

## Additional Information

### CommonJS Modules

This template uses native *CommonJS*.

Please do not open issues for questions regarding ESM or TS-Node on this repo.

## License

Licensed under the APLv2. See the [LICENSE](https://github.com/jiifw/node-ts-boilerplate/blob/main/LICENSE) file for details.
