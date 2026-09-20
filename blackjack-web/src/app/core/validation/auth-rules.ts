export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
export const nicknamePattern = /^[A-Za-z0-9_-]+$/;
export const codePattern = /^\d{6}$/;

export const passwordValidators = {
  minLength: 10,
  pattern: passwordPattern
};
