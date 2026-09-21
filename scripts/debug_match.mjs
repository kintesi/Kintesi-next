import fs from 'fs';
import path from 'path';

const COLOR_MAP = {
  black: '#000000', white: '#FFFFFF', red: '#EF4444', blue: '#3B82F6',
  'navy blue': '#1E3A8A', navy: '#1E3A8A', 'royal blue': '#1D4ED8', 'sky blue': '#38BDF8',
  sky: '#38BDF8', green: '#10B981', 'olive green': '#556B2F', olive: '#556B2F',
  teal: '#14B8A6', maroon: '#800000', marun: '#800000', wine: '#722F37',
  pink: '#EC4899', 'baby pink': '#FBCFE8', purple: '#8B5CF6', violet: '#7C3AED',
  yellow: '#EAB308', mustard: '#D97706', orange: '#F97316', brown: '#78350F',
  chocolate: '#451A03', coffee: '#6F4E37', grey: '#6B7280', gray: '#6B7280',
  silver: '#9CA3AF', golden: '#F59E0B', gold: '#F59E0B', beige: '#F5F5DC',
  cream: '#FFFDD0', 'off white': '#FAF9F6', 'off-white': '#FAF9F6', peach: '#FFDAB9',
  coral: '#FF7F50', lavender: '#E6E6FA', charcoal: '#374151', rust: '#B7410E',
  mint: '#98FF98', magenta: '#D946EF', turquoise: '#06B6D4', khaki: '#C3B091',
  ash: '#9CA3AF', paste: '#A7F3D0', petrol: '#0E7490', pettrol: '#0E7490',
  katali: '#B45309', khatali: '#B45309', 'deep sepia': '#704214', sepia: '#704214',
  army: '#4B5320', 'army green': '#4B5320', camo: '#78866B', 'camo cargo': '#78866B',
  cyan: '#06B6D4', rose: '#FB7185', 'bottle green': '#006A4E', 'sea green': '#2E8B57',
  'deep blue': '#00008B', 'light blue': '#ADD8E6', 'dark blue': '#00008B',
  'dark green': '#006400', multicolor: '#6366F1', 'multi color': '#6366F1', multi: '#6366F1'
};

function normalizeUnicodeText(str) {
  if (!str) return '';
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function testIt(title) {
  let cleaned = normalizeUnicodeText(title).trim();
  console.log('Init:', cleaned);
  const colorKeys = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);

  for (const c of colorKeys) {
    const pParen = new RegExp(`\\(\\s*${c}(?:\\s*(?:color|colour|dial|shape))?\\s*\\)`, 'i');
    if (pParen.test(cleaned)) {
      console.log('Pattern A matched color:', c);
      cleaned = cleaned.replace(pParen, ' ').trim();
      return { c, cleaned };
    }
  }

  for (const c of colorKeys) {
    const pEnd = new RegExp(`[-–—:\\(\\[/|]?\\s*\\b${c}\\b\\s*(?:color|colour)?\\s*[\\)\\]]?$`, 'i');
    if (pEnd.test(cleaned)) {
      console.log('Pattern B matched color:', c);
      cleaned = cleaned.replace(pEnd, '').trim();
      return { c, cleaned };
    }
  }

  for (const c of colorKeys) {
    const pStart = new RegExp(`^[&\\s-–—:]*\\b${c}\\b\\s*[-–—:]?\\s*`, 'i');
    if (pStart.test(cleaned)) {
      console.log('Pattern C matched color:', c);
      cleaned = cleaned.replace(pStart, '').trim();
      return { c, cleaned };
    }
  }

  for (const c of colorKeys) {
    const pMid = new RegExp(`\\b${c}\\b(?:\\s*(?:color|colour))?\\s*`, 'i');
    if (pMid.test(cleaned)) {
      console.log('Pattern D matched color:', c);
      const candidate = cleaned.replace(pMid, '').replace(/\s+/g, ' ').trim();
      if (candidate.length > 10) {
        cleaned = candidate;
        return { c, cleaned };
      }
    }
  }

  return { c: null, cleaned };
}

console.log('Test 1:', testIt("Men's Solid Colour Ban color Shirt"));
console.log('Test 2:', testIt("Premium White Jersey T-Shirt – Lightweight & Breathable"));
