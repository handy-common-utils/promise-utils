const { buildESLintConfig } = require('@handy-common-utils/dev-dependencies-mocha');
const { defineConfig } = require('eslint/config');

const config = buildESLintConfig({ defaultSourceType: 'commonjs' });

module.exports = defineConfig([
  {
    ignores: ['dist', 'coverage'],
  },
  ...config,
  // Add your customizations here
]);
