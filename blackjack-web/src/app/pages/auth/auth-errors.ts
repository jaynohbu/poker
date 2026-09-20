import { AbstractControl } from '@angular/forms';
import { Language } from '../../core/models/language.model';

type Field = 'email' | 'password' | 'newPassword' | 'nickname' | 'confirmPassword' | 'code';

const msg = {
  en: { required: 'Required field.', email: 'Enter a valid email.', password: 'Use 10+ chars with upper/lower/number/symbol.', newPassword: 'Use 10+ chars with upper/lower/number/symbol.', nickname: 'Use 2-20 letters, numbers, _ or -.', confirmPassword: 'Passwords do not match.', code: 'Enter a 6-digit code.', generic: 'Please check your input.' },
  ko: { required: '필수 입력 항목입니다.', email: '올바른 이메일 형식을 입력하세요.', password: '10자 이상, 대소문자/숫자/특수문자를 포함하세요.', newPassword: '10자 이상, 대소문자/숫자/특수문자를 포함하세요.', nickname: '2-20자 영문, 숫자, _, - 만 사용하세요.', confirmPassword: '비밀번호가 일치하지 않습니다.', code: '6자리 숫자 코드를 입력하세요.', generic: '입력 내용을 확인하세요.' },
  ja: { required: '必須項目です。', email: '有効なメールアドレスを入力してください。', password: '10文字以上で英大文字・小文字・数字・記号を含めてください。', newPassword: '10文字以上で英大文字・小文字・数字・記号を含めてください。', nickname: '2〜20文字の英数字、_、- を使用してください。', confirmPassword: 'パスワードが一致しません。', code: '6桁のコードを入力してください。', generic: '入力内容を確認してください。' }
};

export const fieldError = (language: Language, field: Field, c: AbstractControl): string => {
  if (!c.touched && !c.dirty) return '';
  const m = msg[language];
  if (c.hasError('required')) return m.required;
  if (c.hasError('email')) return m.email;
  if (c.hasError('minlength') || c.hasError('pattern')) return m[field] ?? m.generic;
  if (c.hasError('mismatch')) return m.confirmPassword;
  return '';
};

export const authApiError = (language: Language, error: unknown): string => {
  const m = msg[language];
  const name = String((error as { name?: string }).name ?? '');
  if (name.includes('UserNotFound')) return m.email;
  if (name.includes('NotAuthorized')) return m.password;
  if (name.includes('CodeMismatch')) return m.code;
  return String((error as { message?: string }).message ?? m.generic);
};
