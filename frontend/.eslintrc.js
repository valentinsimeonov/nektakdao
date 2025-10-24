module.exports = {
	env: {
	  browser: true,
	  es2021: true,
	  node: true,
	},
	extends: [
	  'next/core-web-vitals', // This extends the recommended Next.js ESLint rules optimized for Core Web Vitals
	  'eslint:recommended',
	  'plugin:react/recommended',
	  'plugin:@typescript-eslint/recommended', // If you're using TypeScript
	],
	parser: '@typescript-eslint/parser', // If you're using TypeScript
	parserOptions: {
	  ecmaFeatures: {
		jsx: true,
	  },
	  ecmaVersion: 12,
	  sourceType: 'module',
	},
	plugins: [
	  'react',
	  '@typescript-eslint', // If you're using TypeScript
	],
	rules: {
	  
	  'react/react-in-jsx-scope': 'off', // Next.js does not require React to be in scope
	  'react/no-unescaped-entities': 'off', // Disables the rule for unescaped entities
	  'no-mixed-spaces-and-tabs': 'off',
	  'no-extra-semi': 'off',
	  '@typescript-eslint/no-unused-vars': 'warn', // Change to 'warn' if you prefer warnings over errors for unused variables
	  'react/prop-types': 'off', // If you're not using prop-types
	},
  };