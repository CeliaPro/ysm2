declare module 'crypto-otp' {
  export const totp: {
    generateSecret(): string;
    verify(opts: { secret: string; token: string }): boolean;
  };
}
