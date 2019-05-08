# Whimmy - Your music on your own terms!

<p align="center">
  <img src="https://github.com/nerdic-coder/whimmy/blob/master/electron/icons/png/256x256.png?raw=true" width="256" height="256">
</p>

[![github](https://img.shields.io/github/release/nerdic-coder/whimmy.svg)](https://github.com/nerdic-coder/whimmy/releases/)
[![github](https://img.shields.io/github/downloads/nerdic-coder/whimmy/total.svg)](https://github.com/nerdic-coder/whimmy/releases/)
[![github](https://img.shields.io/github/license/nerdic-coder/whimmy.svg)](https://github.com/nerdic-coder/whimmy)
[![github](https://img.shields.io/github/repo-size/nerdic-coder/whimmy.svg)](https://github.com/nerdic-coder/whimmy)
[![snyk](https://img.shields.io/snyk/vulnerabilities/github/nerdic-coder/whimmy.svg)](https://github.com/nerdic-coder/whimmy)
[![CodeFactor](https://www.codefactor.io/repository/github/nerdic-coder/whimmy/badge/master)](https://www.codefactor.io/repository/github/nerdic-coder/whimmy/overview/master)
[![website-up-down-green-red](https://img.shields.io/website-up-down-green-red/https/app.whimmy.com.svg?label=my-website)](https://app.whimmy.com/)
[![twitter](https://img.shields.io/twitter/follow/Whimmy.svg?label=Follow&style=social)](https://twitter.com/Whimmy)

## Project links

Visit the website here: [whimmy.com](https://whimmy.com/)

Test the web app here: [app.whimmy.com](https://app.whimmy.com/)

Follow Whimmy on Twitter: [@Whimmy](https://twitter.com/Whimmy)

## Donations

If you like this project please donate to preferred cryptocurrency below:

### Coinbase commerce

[Click here to donate with Coinbase commerce](https://commerce.coinbase.com/checkout/9d35f08b-bd51-40b0-a502-b88250cffc6b)

### Bitcoin

3JkxUQ763fbf1cYVAitqpWUMeY4QLaBU8M

<p>
  <img src="https://github.com/nerdic-coder/whimmy/blob/master/resources/btc-qrcode.png?raw=true">
</p>

### Etherium

0x6e54183E7b22dA87fb48e0d79ADaDa4f665A4D5a

<p>
  <img src="https://github.com/nerdic-coder/whimmy/blob/master/resources/etherium-qrcode.png?raw=true">
</p>

### XRP

rGaGGSbeF8HmmrLnTg8gaT92Wa77qg3Y8k

<p>
  <img src="https://github.com/nerdic-coder/whimmy/blob/master/resources/xrp-qrcode.png?raw=true">
</p>

### IOTA

HTPB9JVTMCDHEDMCIPOJELELVLNWLGMHVGZJUCKOYNBZGN9EVCDKFEIUJKINPCBWZI9BKAVIHRVRNWPFC9CQXJYQSZ

<p>
  <img src="https://github.com/nerdic-coder/whimmy/blob/master/resources/iota-qrcode.png?raw=true">
</p>

### NEO

ALNbr6NSuEkWE7ASNB9iB5VcpZmhz1FaAg

## Developing the project

To test this project do the following...

Installation:

```bash
git clone https://github.com/nerdic-coder/whimmy.git whimmy
cd whimmy
npm install
```

Starting Test server:

```bash
npm run serve
```

Starting Electron app:

```bash
npm start
```

Build and package Electron app:

```bash
npm run package
```

Build and package for web app distribution:

```bash
npm run build:web
```

Build for Android app distribution:

```bash
npm run build:android
```

Build for iOS app distribution:

```bash
npm run build:ios
```

Test ESLint:

```bash
npm run lint
```

Run unit tests:

```bash
npm test
```

Run e2e tests:

1. Start the apps dev server:

```bash
npm run serve
```

2. Start selenium

```bash
npm run selenium
```

3. Run the tests

```bash
npm run e2e
```

## Uglify

Uglify javascript files with: https://www.npmjs.com/package/uglify-es
