// src/app/utils/geoip.ts

export function getIpAddress(req: any): string {
  return (
    req?.headers?.['x-forwarded-for'] ||
    req?.headers?.get?.('x-forwarded-for') ||
    req?.headers?.['x-real-ip'] ||
    req?.headers?.get?.('x-real-ip') ||
    req?.socket?.remoteAddress ||
    req?.ip ||
    ''
  );
}
