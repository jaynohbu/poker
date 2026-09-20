import { Amplify } from 'aws-amplify';
import { cognitoConfig } from '../../core/config/cognito.config';

let configured = false;

export const ensureAmplifyConfigured = (): void => {
  if (configured) return;
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: cognitoConfig.userPoolId,
        userPoolClientId: cognitoConfig.userPoolClientId,
        identityPoolId: cognitoConfig.identityPoolId,
        loginWith: {
          email: true,
          oauth: {
            domain: cognitoConfig.oauth.domain,
            scopes: cognitoConfig.oauth.scopes,
            redirectSignIn: cognitoConfig.oauth.redirectSignIn,
            redirectSignOut: cognitoConfig.oauth.redirectSignOut,
            responseType: cognitoConfig.oauth.responseType
          }
        }
      }
    },
    Storage: {
      S3: {
        bucket: cognitoConfig.s3.bucket,
        region: cognitoConfig.s3.region
      }
    }
  });
  configured = true;
};
