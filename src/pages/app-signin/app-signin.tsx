import { Component, Prop, State } from '@stencil/core';
// import { blockstack } from 'blockstack';

import { Plugins } from '@capacitor/core';

import AnalyticsService from '../../services/analytics-service';
import PresentingService from '../../services/presenting-service';
import isElectron from 'is-electron';

declare var blockstack;

@Component({
  tag: 'app-signin',
  styleUrl: 'app-signin.css'
})
export class AppSignin {
  @Prop({ connect: 'ion-router' }) nav;

  @State() loaded: boolean;

  private present: PresentingService;

  constructor() {
    this.present = new PresentingService();
  }

  async componentDidLoad() {
    const router: any = document.querySelector('ion-router');
    await router.componentOnReady();

    const userSession = new blockstack.UserSession();
    if (userSession.isUserSignedIn()) {
      this.hideSplash();
      router.push('/photos', 'root');
      return;
    } else if (userSession.isSignInPending() && !userSession.isUserSignedIn()) {
      try {
        await userSession.handlePendingSignIn();
        this.hideSplash();

        router.push('/photos', 'root');
        AnalyticsService.logEvent('login');
        return;
      } catch (error) {
        console.error('handlePendingSignIn failed', error);
        this.hideSplash();
        this.present.toast(
          'Failed to login with Blockstack. Please try again!'
        );
      }
    }

    this.loaded = true;

    this.hideSplash();
  }

  async hideSplash() {
    const { Device } = Plugins;

    const info = await Device.getInfo();
    if (info.platform !== 'web') {
      // Hide the splash (you should do this on app launch)
      setTimeout(() => {
        const { SplashScreen } = Plugins;
        SplashScreen.hide();
      }, 4000);
    }
  }

  async handleSignIn(e) {
    e.preventDefault();

    AnalyticsService.logEvent('login-started');

    const { Device } = Plugins;
    const info = await Device.getInfo();

    if (
      info.platform === 'android' ||
      info.platform === 'ios' ||
      isElectron()
    ) {
      const userSession = new blockstack.UserSession();
      const appDomain = 'https://app.whimmy.com';
      const transitPrivateKey = userSession.generateAndStoreTransitKey();
      const redirectURI = appDomain + '/redirect.html';
      const manifestURI = appDomain + '/manifest.json';
      const scopes = blockstack.DEFAULT_SCOPE;
      const authRequest = blockstack.makeAuthRequest(
        transitPrivateKey,
        redirectURI,
        manifestURI,
        scopes,
        appDomain
      );
      blockstack.redirectToSignInWithAuthRequest(authRequest);
    } else {
      blockstack.redirectToSignIn();
    }
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar mode="md" color="primary">
          <ion-title>Whimmy</ion-title>
        </ion-toolbar>
      </ion-header>,
      <ion-content text-center class="signin">
        {!this.loaded ? (
          <ion-grid class="spinner-grid">
            <ion-row>
              <ion-col align-self-center>
                <ion-spinner name="circles" />
              </ion-col>
            </ion-row>
          </ion-grid>
        ) : (
          <ion-grid>
            <ion-row justify-content-center>
              <ion-col>
                <h1>Welcome to Whimmy!</h1>
                <ion-img padding src="assets/whimmy-logo.png" />

                <ion-card color="light" margin-horizontal>
                  <ion-card-content text-left>
                    <p>To get started click the login button below.</p>
                    <p>
                      Blockstack will ask you to register an account if you
                      don&apos;t have one already.
                    </p>
                    <p>
                      Then all you need is to start adding music with the upload
                      button (
                      <ion-icon size="small" name="cloud-upload" />) or drag and
                      drop them into the app view from your computers file
                      browser.
                    </p>
                  </ion-card-content>
                </ion-card>
                <ion-button
                  margin-horizontal
                  margin-bottom
                  expand="block"
                  onClick={event => this.handleSignIn(event)}
                >
                  Sign In with Blockstack
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        )}
      </ion-content>
    ];
  }
}
