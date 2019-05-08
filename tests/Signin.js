module.exports = {
  Signin: function(browser) {
    browser
      .url('http://localhost:9876')
      .waitForElementVisible('body', 1000)
      // .setValue('input[type=text]', 'nightwatch')
      // .waitForElementVisible('button[name=btnG]', 1000)
      // .click('button[name=btnG]')
      .assert.containsText('ion-title', 'Whimmy')
      .assert.containsText('h1', 'Welcome to Whimmy!')
      .assert.containsText('ion-button', 'SIGN IN WITH BLOCKSTACK')
      .click('ion-button')
      // .assert.containsText('#main', 'Night Watch')
      .end();
  }
};
