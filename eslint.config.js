import path from 'node:path'
import {nostandard} from 'eslint-nostandard'
import vitest from 'eslint-nostandard/vitest'
import {includeIgnoreFile} from '@eslint/compat'
import globals from 'globals'

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore')

const ignores = [
  'docs/*',
]

export default [
  includeIgnoreFile(gitignorePath),
  ...nostandard.recommended,
  vitest,
  {
    name: 'fetch-mpx',
    ignores,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    name: 'ProductionCode',
    files: ['src/**/*.js'],
    rules: {
      'max-lines-per-function': ['warn', {max: 55}],
    },
  },
  {
    name: 'Tests',
    files: ['tests/**/*.js'],
    rules: {
      '@stylistic/max-len': ['warn', {code: 100}],
    },
  },
]
