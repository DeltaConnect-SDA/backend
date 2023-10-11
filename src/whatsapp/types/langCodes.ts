export const SUPPORTED_LANGUAGES_CODE = {
  Afrikaans: 'af',
  Albanian: 'sq',
  Arabic: 'ar',
  Azerbaijani: 'az',
  Bengali: 'bn',
  Bulgarian: 'bg',
  Catalan: 'ca',
  Chinese_CHN: 'zh_CN',
  Chinese_HKG: 'zh_HK',
  Chinese_TAI: 'zh_TW',
  Croatian: 'hr',
  Czech: 'cs',
  Danish: 'da',
  Dutch: 'nl',
  English: 'en',
  English_UK: 'en_GB',
  English_US: 'en_US',
  Estonian: 'et',
  Filipino: 'fil',
  Finnish: 'fi',
  French: 'fr',
  Georgian: 'ka',
  German: 'de',
  Greek: 'el',
  Gujarati: 'gu',
  Hausa: 'ha',
  Hebrew: 'he',
  Hindi: 'hi',
  Hungarian: 'hu',
  Icelandic: 'is',
  Igbo: 'ig',
  Indonesian: 'id',
  Irish: 'ga',
  Italian: 'it',
  Japanese: 'ja',
  Javanese: 'jv',
  Kannada: 'kn',
  Kazakh: 'kk',
  Khmer: 'km',
  Kinyarwanda: 'rw',
  Korean: 'ko',
  Kurdish: 'ku',
  Kyrgyz: 'ky',
  Lao: 'lo',
  Latin: 'la',
  Latvian: 'lv',
  Lithuanian: 'lt',
  Luxembourgish: 'lb',
  Macedonian: 'mk',
  Malagasy: 'mg',
  Malay: 'ms',
  Malayalam: 'ml',
  Maltese: 'mt',
  Maori: 'mi',
  Marathi: 'mr',
  Mongolian: 'mn',
  Nepali: 'ne',
  Norwegian: 'no',
  Nyanja: 'ny',
  Odia: 'or',
  Pashto: 'ps',
  Persian: 'fa',
  Polish: 'pl',
  Portuguese_BR: 'pt_BR',
  Portuguese_PT: 'pt_PT',
  Punjabi: 'pa',
  Romanian: 'ro',
  Russian: 'ru',
  ScotsGaelic: 'gd',
  Serbian: 'sr',
  Sesotho: 'st',
  Shona: 'sn',
  Sindhi: 'sd',
  Sinhala: 'si',
  Slovak: 'sk',
  Slovenian: 'sl',
  Somali: 'so',
  Spanish: 'es',
  Sundanese: 'su',
  Swahili: 'sw',
  Swedish: 'sv',
  Tajik: 'tg',
  Tamil: 'ta',
  Tatar: 'tt',
  Telugu: 'te',
  Thai: 'th',
  Turkish: 'tr',
  Turkmen: 'tk',
  Ukrainian: 'uk',
  Urdu: 'ur',
  Uyghur: 'ug',
  Uzbek: 'uz',
  Vietnamese: 'vi',
  Welsh: 'cy',
  WesternFrisian: 'fy',
  Xhosa: 'xh',
  Yiddish: 'yi',
  Yoruba: 'yo',
  Zulu: 'zu',
} as const;

export type SupportedLanguagesCodeUnion =
  (typeof SUPPORTED_LANGUAGES_CODE)[keyof typeof SUPPORTED_LANGUAGES_CODE];
