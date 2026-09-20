import { Language } from '../../core/models/language.model';

export type AuthCopyKey =
  | 'login' | 'register' | 'confirm' | 'forgot' | 'email' | 'password'
  | 'nickname' | 'confirmPassword' | 'code' | 'newPassword' | 'loginBtn'
  | 'registerBtn' | 'confirmBtn' | 'sendCode' | 'resetBtn' | 'createAccount'
  | 'forgotLink' | 'backLogin' | 'backHome' | 'resend' | 'google' | 'facebook' | 'apple' | 'amazon';

const copy: Record<Language, Record<AuthCopyKey, string>> = {
  en: { login: 'Login', register: 'Register', confirm: 'Confirm Email', forgot: 'Forgot Password', email: 'Email', password: 'Password', nickname: 'Nickname', confirmPassword: 'Confirm Password', code: 'Verification Code', newPassword: 'New Password', loginBtn: 'Login', registerBtn: 'Register', confirmBtn: 'Confirm', sendCode: 'Send Code', resetBtn: 'Reset Password', createAccount: 'Create account', forgotLink: 'Forgot password', backLogin: 'Back to login', backHome: 'Back to home', resend: 'Resend code', google: 'Continue with Google', facebook: 'Continue with Facebook', apple: 'Continue with Apple', amazon: 'Continue with Amazon' },
  ko: { login: '로그인', register: '회원가입', confirm: '이메일 인증', forgot: '비밀번호 찾기', email: '이메일', password: '비밀번호', nickname: '닉네임', confirmPassword: '비밀번호 확인', code: '인증 코드', newPassword: '새 비밀번호', loginBtn: '로그인', registerBtn: '가입하기', confirmBtn: '인증하기', sendCode: '코드 전송', resetBtn: '비밀번호 재설정', createAccount: '계정 만들기', forgotLink: '비밀번호 찾기', backLogin: '로그인으로', backHome: '메인으로', resend: '코드 재전송', google: 'Google로 계속', facebook: 'Facebook으로 계속', apple: 'Apple로 계속', amazon: 'Amazon으로 계속' },
  ja: { login: 'ログイン', register: '新規登録', confirm: 'メール確認', forgot: 'パスワード再設定', email: 'メール', password: 'パスワード', nickname: 'ニックネーム', confirmPassword: 'パスワード確認', code: '認証コード', newPassword: '新しいパスワード', loginBtn: 'ログイン', registerBtn: '登録', confirmBtn: '確認', sendCode: 'コード送信', resetBtn: 'パスワードを再設定', createAccount: 'アカウント作成', forgotLink: 'パスワードを忘れた場合', backLogin: 'ログインへ戻る', backHome: 'ホームへ戻る', resend: 'コード再送', google: 'Googleで続行', facebook: 'Facebookで続行', apple: 'Appleで続行', amazon: 'Amazonで続行' }
};

export const authCopy = (language: Language, key: AuthCopyKey): string => copy[language][key];
