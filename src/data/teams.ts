/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TeamTheme {
  id: string;
  name: string;
  primaryBg: string;      // main color of jersey/poker chip bg on field
  secondaryBg: string;    // accent highlights/numbers of jersey
  textAccent: string;     // safe text contrast styling
  textColor: string;      // general text color
  cardBg: string;         // player card gradient backgrounds
  cardBorder: string;     // player card individual borders
  glowClass: string;      // visual pitch drop-shadow glows
}

export const TEAMS: TeamTheme[] = [
  {
    id: 'siyah-beyaz',
    name: 'Siyah Beyaz',
    primaryBg: '#0f172a',    // Deep charcoal/black
    secondaryBg: '#ffffff',  // True white
    textAccent: '#e2e8f0',   // Slate gray text light
    textColor: '#ffffff',
    cardBg: 'from-slate-900 via-slate-800 to-black',
    cardBorder: 'border-slate-700 hover:border-slate-500',
    glowClass: 'shadow-[0_0_12px_rgba(255,255,255,0.15)]'
  },
  {
    id: 'bordo-mavi',
    name: 'Bordo Mavi',
    primaryBg: '#7f1d1d',    // Maroon/Bordo
    secondaryBg: '#38bdf8',  // Mavi/Sky Blue
    textAccent: '#38bdf8',   // Sky-blue contrast text
    textColor: '#fef2f2',
    cardBg: 'from-rose-950 via-slate-900 to-sky-950',
    cardBorder: 'border-rose-900 hover:border-sky-500/50',
    glowClass: 'shadow-[0_0_12px_rgba(56,189,248,0.25)]'
  },
  {
    id: 'sari-lacivert',
    name: 'Sarı Lacivert',
    primaryBg: '#1e3a8a',    // Lacivert/Navy Blue
    secondaryBg: '#facc15',  // Sarı/Yellow
    textAccent: '#facc15',   // Yellow contrast text
    textColor: '#eff6ff',
    cardBg: 'from-blue-950 via-slate-900 to-yellow-950',
    cardBorder: 'border-blue-900 hover:border-yellow-500/50',
    glowClass: 'shadow-[0_0_12px_rgba(250,204,21,0.25)]'
  },
  {
    id: 'sari-kirmizi',
    name: 'Sarı Kırmızı',
    primaryBg: '#b91c1c',    // Kırmızı/Red
    secondaryBg: '#facc15',  // Sarı/Yellow
    textAccent: '#facc15',   // Yellow contrast text
    textColor: '#fff5f5',
    cardBg: 'from-red-950 via-slate-900 to-amber-900/60',
    cardBorder: 'border-red-900 hover:border-yellow-500/50',
    glowClass: 'shadow-[0_0_12px_rgba(250,204,21,0.3)]'
  },
  {
    id: 'yesil-beyaz',
    name: 'Yeşil Beyaz',
    primaryBg: '#14532d',    // Yeşil/Green
    secondaryBg: '#ffffff',  // Beyaz/White
    textAccent: '#a7f3d0',   // Emerald light text
    textColor: '#f0fdf4',
    cardBg: 'from-emerald-950 via-slate-900 to-black',
    cardBorder: 'border-emerald-900 hover:border-emerald-500/50',
    glowClass: 'shadow-[0_0_12px_rgba(52,211,153,0.2)]'
  },
  {
    id: 'lacivert-turuncu',
    name: 'Lacivert Turuncu',
    primaryBg: '#0369a1',    // Lacivert/Sky Blue-Dark
    secondaryBg: '#ea580c',  // Turuncu/Orange
    textAccent: '#ffedd5',   // Warm cream-orange-like text
    textColor: '#f0f9ff',
    cardBg: 'from-sky-950 via-slate-900 to-orange-950',
    cardBorder: 'border-sky-900 hover:border-orange-500/50',
    glowClass: 'shadow-[0_0_12px_rgba(249,115,22,0.25)]'
  }
];
