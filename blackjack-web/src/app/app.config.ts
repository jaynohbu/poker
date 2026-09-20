import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AUTH_GATEWAY, PROFILE_GATEWAY } from './core/config/tokens';
import { CognitoAuthGateway } from './infra/cognito/cognito-auth.gateway';
import { CognitoProfileGateway } from './infra/profile/cognito-profile.gateway';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideClientHydration(withEventReplay()),
    { provide: AUTH_GATEWAY, useClass: CognitoAuthGateway },
    { provide: PROFILE_GATEWAY, useClass: CognitoProfileGateway }
  ]
};
