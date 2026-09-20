export const cognitoConfig = {
  region: 'us-west-2',
  userPoolId: 'us-west-2_DySPN8sLZ',
  userPoolClientId: '2bqkoopvvl8jfta9h8t9cmr82g',
  identityPoolId: 'us-west-2:29c62ee3-3215-4fe0-a3e5-1c968d5cf8d5',
  oauth: {
    domain: 'blackjack-web-086723604095.auth.us-west-2.amazoncognito.com',
    redirectSignIn: [
      'http://localhost:4200/auth/login',
      'https://d1fqi0i49yjph9.cloudfront.net/auth/login',
      'https://rldojo.net/auth/login',
      'https://www.rldojo.net/auth/login'
    ],
    redirectSignOut: [
      'http://localhost:4200/',
      'https://d1fqi0i49yjph9.cloudfront.net/',
      'https://rldojo.net/',
      'https://www.rldojo.net/'
    ],
    scopes: ['openid', 'email', 'profile'],
    responseType: 'code' as const
  },
  socialProviders: ['Google', 'Facebook', 'Apple', 'Amazon'],
  s3: {
    bucket: 'blackjack-web-avatars-086723604095',
    region: 'us-west-2'
  }
};
