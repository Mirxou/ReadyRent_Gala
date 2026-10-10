// Type shim: components/booking-calendar.tsx imports 'hijri-date-converter',
// which ships without bundled type declarations. Only the surface actually
// used by the app is declared here.
declare module 'hijri-date-converter' {
  export default class HijriDate {
    constructor(date?: Date | string | number);
    getDay(): number;
    getMonthName(): string;
    getYear(): number;
  }
}
