/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, PlayerStats } from '../types';

export interface ExtendedStats extends PlayerStats {
  ceviklik: number;       // Agility
  dayaniklilik: number;   // Stamina
  kararVerme: number;     // Decision making
  havaHakimiyeti: number; // Aerial strength
  vizyon: number;         // Vision
  topKapma: number;       // Interceptions/Tackles
}

export interface PlaystyleInfo {
  name: string;
  description: string;
  score: number;       // Dynamically computed playstyle score 1-100
  boostedStatEn: string;
  badgeColor: string;  // Tailwind badge color style
}

// Map roles to gorgeous authentic Turkish soccer playstyles
export const getPlaystyleForRole = (role: string, stats: PlayerStats): PlaystyleInfo => {
  let name = 'Taktisyen';
  let description = 'Oyunun gidişatını analiz eden dengeli oyun yapısı.';
  let score = 75;
  let boostedStatEn = 'kararVerme';
  let badgeColor = 'bg-slate-500/20 text-slate-300 border-slate-700';

  if (role.includes('Libero')) {
    name = 'Panter Süpürücü';
    description = 'Kalesinden çıkıp savunma arkası topları süpüren hızlı refleks.';
    score = Math.round((stats.hiz * 2 + stats.teknik * 2 + stats.pas) * 1.5 + 40);
    boostedStatEn = 'ceviklik';
    badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-800/60';
  } else if (role.includes('Çizgi')) {
    name = 'Geçilmez Duvar';
    description = 'Kale çizgisinde devleşen, refleksleri ve pozisyon alması kusursuz.';
    score = Math.round((stats.savunma * 3 + stats.guc * 2) * 1.4 + 45);
    boostedStatEn = 'dayaniklilik';
    badgeColor = 'bg-red-500/20 text-red-350 border-red-800/60';
  } else if (role.includes('Bek') && role.includes('Ofansif')) {
    name = 'Ciğersiz Bindirici';
    description = 'Kanattan sürekli hücuma çıkan, bitmek bilmeyen enerji ve orta kalitesi.';
    score = Math.round((stats.hiz * 3 + stats.pas * 2) * 1.3 + 47);
    boostedStatEn = 'dayaniklilik';
    badgeColor = 'bg-yellow-500/20 text-yellow-350 border-yellow-800/60';
  } else if (role.includes('Bek') && role.includes('Defansif')) {
    name = 'Kanat Kilitleyici';
    description = 'Rakip kanat akınlarını fiziksel gücü ve agresif savunmasıyla kesen bek.';
    score = Math.round((stats.savunma * 3 + stats.guc * 2) * 1.3 + 49);
    boostedStatEn = 'topKapma';
    badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-800/60';
  } else if (role.includes('Teknik') && role.includes('Defans')) {
    name = 'Bilek Koklayan Stoper';
    description = 'Topla sakin çıkabilen, zarif müdahalelere sahip teknik oyun kurucu savunma.';
    score = Math.round((stats.teknik * 3 + stats.savunma * 2 + stats.pas) * 1.2 + 50);
    boostedStatEn = 'kararVerme';
    badgeColor = 'bg-teal-500/20 text-teal-300 border-teal-800/60';
  } else if (role.includes('Ağır Pasör')) {
    name = 'Hava Kulesi Maestro';
    description = 'Hava toplarında geçit vermeyen, geriden uzun fırfırlı paslar dağıtan stoper.';
    score = Math.round((stats.guc * 2.5 + stats.pas * 2.5) * 1.4 + 45);
    boostedStatEn = 'havaHakimiyeti';
    badgeColor = 'bg-orange-500/20 text-orange-355 border-orange-850';
  } else if (role.includes('Defansif Orta Saha')) {
    name = 'Orta Saha Çapa Dinamosu';
    description = 'Rakiplerin belini büken sarsılmaz ikili mücadele gücü ve pres kraliçesi.';
    score = Math.round((stats.savunma * 2.5 + stats.guc * 2.5) * 1.35 + 48);
    boostedStatEn = 'topKapma';
    badgeColor = 'bg-red-500/20 text-orange-300 border-red-900/60';
  } else if (role.includes('Merkez Orta Saha')) {
    name = 'Tiki-Taka Maestrosu';
    description = 'Dinamik pas istasyonu oluşturan, oyunun temposunu çift yönlü belirleme.';
    score = Math.round((stats.pas * 3 + stats.teknik * 2) * 1.3 + 50);
    boostedStatEn = 'vizyon';
    badgeColor = 'bg-sky-500/20 text-sky-305 border-sky-805';
  } else if (role.includes('Ofansif Orta Saha')) {
    name = 'Sihirbaz 10 Numara';
    description = 'Anahtar deliğinden geçecek paslar ve öldürücü hücum asist vizyonu.';
    score = Math.round((stats.teknik * 3 + stats.pas * 2) * 1.32 + 50);
    boostedStatEn = 'vizyon';
    badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-800/60';
  } else if (role.includes('Kanat') && role.includes('Çizgiye')) {
    name = 'Sürat Kramponu';
    description = 'Top çizgideyken rakip eksiltip, adrese teslim havadan ortalar kesen rüzgar.';
    score = Math.round((stats.hiz * 3.2 + stats.pas * 1.8) * 1.3 + 45);
    boostedStatEn = 'ceviklik';
    badgeColor = 'bg-amber-500/20 text-amber-302 border-amber-802';
  } else if (role.includes('Kanat') && role.includes('İçeri')) {
    name = 'Kanat Forvet Plasecisi';
    description = 'Ters kanattan içeri sızıp uzak köşeye jilet gibi plaseler bırakan golcü.';
    score = Math.round((stats.hiz * 2.5 + stats.sut * 2.5) * 1.35 + 47);
    boostedStatEn = 'ceviklik';
    badgeColor = 'bg-pink-500/20 text-pink-300 border-pink-800/60';
  } else if (role.includes('Pivot')) {
    name = 'Yıkılmaz Tank Pivot';
    description = 'Fiziksel olarak stoperleri sürklase eden, hava hakimiyeti canavarı sırtı dönük santrafor.';
    score = Math.round((stats.guc * 3.5 + stats.sut * 1.5) * 1.4 + 40);
    boostedStatEn = 'havaHakimiyeti';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-800/50';
  } else if (role.includes('Fırsatçı')) {
    name = 'Ceza Sahası Akrebi';
    description = 'Savunma arkası boşlukları sezme yeteneği üst düzey, tek vuruş bitiricisi.';
    score = Math.round((stats.sut * 3.5 + stats.hiz * 1.5) * 1.4 + 42);
    boostedStatEn = 'kararVerme';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-800/60';
  } else if (role.includes('Sahte 9')) {
    name = 'Akıl Küpü Sahte Oyun';
    description = 'Orta sahaya gelip alan boşaltan, pas istasyonu oluşturan dahi forvet.';
    score = Math.round((stats.pas * 2.5 + stats.teknik * 2.5) * 1.35 + 48);
    boostedStatEn = 'vizyon';
    badgeColor = 'bg-violet-500/20 text-violet-300 border-violet-800/60';
  } else if (role.includes('Komple Forvet')) {
    name = 'Süper Elit Gol Makinesi';
    description = 'Hem hızlı hem güçlü, modern futbolun tüm gereksinimlerini karşılayan süper star.';
    score = Math.round((stats.hiz * 1.8 + stats.sut * 1.8 + stats.guc * 1.4) * 1.3 + 52);
    boostedStatEn = 'ceviklik';
    badgeColor = 'bg-indigo-505 bg-indigo-600/25 text-indigo-300 border-indigo-500/50';
  }

  // Constrain playstyle score between 55 and 99
  if (score > 99) score = 99;
  if (score < 55) score = 55;

  return { name, description, score, boostedStatEn, badgeColor };
};

// Generate highly detailed extra attributes (the hidden stats requested - puanların türünü çoğaltalım)
export const getExtendedStats = (player: Player): ExtendedStats => {
  const base = player.stats;
  
  // Calculate consistent sub-stats using deterministic formula based on player properties
  const speed = base.hiz;
  const power = base.guc;
  const skill = base.teknik;
  const passing = base.pas;
  const shooting = base.sut;
  const defense = base.savunma;

  // Çeviklik is influenced by speed and technique
  const ceviklik = Math.max(1, Math.min(20, Math.round((speed * 0.6 + skill * 0.4) + (player.number % 3 - 1))));
  
  // Dayanıklılık is influenced by power and speed
  const dayaniklilik = Math.max(1, Math.min(20, Math.round((power * 0.5 + speed * 0.5) + (player.id.length % 3 - 1))));

  // Karar Verme is influenced by technique and coaching/role
  const isGKOrMF = player.positionGroup === 'GK' || player.positionGroup === 'MF';
  const kararVerme = Math.max(1, Math.min(20, Math.round((passing * 0.4 + defense * 0.4 + (isGKOrMF ? 4 : 2)))));

  // Hava Hakimiyeti is mostly power, with height factor based on name/id
  const hasTowerName = player.name.includes('Kule') || player.role.includes('Pivot') || player.role.includes('Ağır');
  const havaHakimiyeti = Math.max(1, Math.min(20, Math.round((power * 0.7 + (hasTowerName ? 5 : 1)))));

  // Vizyon is mostly technique and passing
  const vizyon = Math.max(1, Math.min(20, Math.round((skill * 0.5 + passing * 0.5) + (player.positionGroup === 'MF' ? 3 : 0))));

  // Top Kapma is defense plus power/speed helpers
  const topKapma = Math.max(1, Math.min(20, Math.round((defense * 0.8 + power * 0.2) + (player.positionGroup === 'DF' ? 2 : 0))));

  return {
    ...base,
    ceviklik,
    dayaniklilik,
    kararVerme,
    havaHakimiyeti,
    vizyon,
    topKapma
  };
};

// Calculate FUT Overall Rating (OVR) for card layout
export const calculatePlayerOverall = (player: Player): number => {
  const base = player.stats;
  let weights = { hiz: 0.16, guc: 0.16, teknik: 0.16, pas: 0.16, sut: 0.16, savunma: 0.2 };

  if (player.positionGroup === 'GK') {
    weights = { hiz: 0.12, guc: 0.22, teknik: 0.1, pas: 0.1, sut: 0.04, savunma: 0.42 };
  } else if (player.positionGroup === 'DF') {
    weights = { hiz: 0.15, guc: 0.22, teknik: 0.1, pas: 0.1, sut: 0.03, savunma: 0.4 };
  } else if (player.positionGroup === 'MF') {
    weights = { hiz: 0.13, guc: 0.11, teknik: 0.22, pas: 0.28, sut: 0.13, savunma: 0.13 };
  } else if (player.positionGroup === 'FW') {
    weights = { hiz: 0.25, guc: 0.15, teknik: 0.15, pas: 0.08, sut: 0.32, savunma: 0.05 };
  }

  const weightedSum = 
    base.hiz * weights.hiz +
    base.guc * weights.guc +
    base.teknik * weights.teknik +
    base.pas * weights.pas +
    base.sut * weights.sut +
    base.savunma * weights.savunma;

  // Convert 1-20 scale into premium FUT rating scale (60 to 95)
  const ovr = Math.round((weightedSum / 20) * 35 + 60);
  return Math.max(62, Math.min(96, ovr));
};
