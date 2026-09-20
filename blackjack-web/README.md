# BlackjackWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Deploy to CloudFront

This project includes a one-command deploy script for S3 + CloudFront static hosting:

```bash
npm run deploy:cloudfront
```

The script will:

- Build the app
- Ensure a private S3 bucket exists
- Ensure a CloudFront distribution exists (with Origin Access Control)
- Upload `dist/blackjack-web/browser` to S3
- Invalidate CloudFront cache (`/*`)

Optional environment overrides:

```bash
APP_NAME=blackjack-web AWS_REGION=eu-west-2 BUCKET_NAME=my-bucket npm run deploy:cloudfront
```

## Cognito Auth Setup

This app now includes full email auth flows (login, register, confirm, forgot password), social sign-in buttons, and profile management.

Quick bootstrap in `us-west-2`:

```bash
npm run bootstrap:aws-auth
```

This creates:

- Cognito User Pool
- User Pool App Client
- Cognito Identity Pool
- S3 avatar bucket
- IAM authenticated role for avatar upload/download

It also updates `src/app/core/config/cognito.config.ts` automatically.

Optional parameters:

```bash
AWS_REGION=us-west-2 APP_PREFIX=blackjack-web CALLBACK_URL=https://example.com/auth/login LOGOUT_URL=https://example.com/ SOCIAL_PROVIDERS="COGNITO Google Facebook SignInWithApple LoginWithAmazon" npm run bootstrap:aws-auth
```

Note: social providers need provider credentials configured in Cognito first. Without that, keep `SOCIAL_PROVIDERS=COGNITO`.

Update these values in `src/app/core/config/cognito.config.ts`:

- `userPoolId`
- `userPoolClientId`
- `identityPoolId`
- `s3.bucket`

Configuration choices already applied:

- Region: `us-west-2`
- Email-first login
- Auto-login after email confirmation (for users coming from in-app registration)
- Profile nickname stored in `custom:nickname`
- Avatar key stored in `custom:avatar`

Avatar support:

- 5 preset avatars under `public/avatars`
- Custom avatar upload to S3 (through Amplify Storage)

Notes:

- Email is shown as read-only in profile UI
- Password reset flow is available in auth pages

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
