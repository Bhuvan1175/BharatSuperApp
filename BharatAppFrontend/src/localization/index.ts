import {en, Translation} from './en';
import {hi} from './hi';
import {LanguageCode} from '../types';

export const translations: Record<LanguageCode, Translation> = {en, hi};

export const languageOptions: {code: LanguageCode; label: string; native: string}[] = [
  {code: 'en', label: 'English', native: 'English'},
  {code: 'hi', label: 'Hindi', native: 'हिन्दी'},
];

export type {Translation};
