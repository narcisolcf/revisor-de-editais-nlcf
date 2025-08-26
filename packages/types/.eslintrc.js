module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  rules: {
    // Permitir enums não utilizados pois são definições de tipos
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        // Ignorar membros de enum não utilizados
        ignoreRestSiblings: true,
        args: 'after-used',
        // Permitir enums exportados não utilizados
        caughtErrors: 'none'
      }
    ],
    // Desabilitar regra padrão de variáveis não utilizadas
    'no-unused-vars': 'off'
  },
  env: {
    node: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
};