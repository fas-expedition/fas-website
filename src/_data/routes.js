const site = require('./site.json');

const germanSlugs = {
  about: 'ueber-uns',
  careers: 'karriere',
  configurator: 'konfigurator',
  contact: 'kontakt',
  documentation: 'dokumentation',
  'expedition-vehicles': 'expeditionsmobile',
  'modular-systems': 'modulare-systeme',
  privacy: 'datenschutz',
  terms: 'agb',
  warranty: 'garantie',
};

const pageKeys = ['index', '4x4', '6x6', '8x8', 'blog', 'brabus', 'service', 'team', ...Object.keys(germanSlugs)];

module.exports = Object.fromEntries(site.locales.map(locale => [
  locale,
  Object.fromEntries(pageKeys.map(key => [
    key,
    `/${locale}/${key === 'index' ? '' : `${locale === 'de' ? germanSlugs[key] ?? key : key}/`}`,
  ])),
]));
