import { FormControl, Validators } from '@angular/forms';
import { codePattern, passwordValidators } from '../../core/validation/auth-rules';
import { authApiError, fieldError } from './auth-errors';

describe('auth-errors', () => {
  it('returns localized required message', () => {
    const c = new FormControl('', [Validators.required]);
    c.markAsTouched();
    expect(fieldError('ko', 'email', c)).toContain('필수');
  });

  it('returns password pattern message', () => {
    const c = new FormControl('weak', [Validators.minLength(passwordValidators.minLength)]);
    c.markAsTouched();
    expect(fieldError('en', 'password', c)).toContain('10+ chars');
  });

  it('returns code error from API name', () => {
    const msg = authApiError('ja', { name: 'CodeMismatchException' });
    expect(msg).toContain('6桁');
  });

  it('validates six-digit reset code pattern', () => {
    const c = new FormControl('12', [Validators.pattern(codePattern)]);
    c.markAsTouched();
    expect(fieldError('en', 'code', c)).toContain('6-digit');
  });
});
