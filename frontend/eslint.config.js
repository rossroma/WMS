import js from '@eslint/js'
import vue from 'eslint-plugin-vue'

export default [
  // 基础 JavaScript 配置
  js.configs.recommended,
  
  // Vue 配置
  ...vue.configs['flat/essential'],
  ...vue.configs['flat/strongly-recommended'],
  ...vue.configs['flat/recommended'],
  
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Vue 3 Composition API 全局变量
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
        // 浏览器环境
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        FormData: 'readonly',
        localStorage: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // Vue 相关规则
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'warn',
      'vue/require-default-prop': 'off',
      'vue/require-prop-types': 'warn',
      'vue/prefer-import-from-vue': 'off',
      'vue/no-v-html': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/attributes-order': 'off',
      
      // JavaScript 规则
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      
      // 代码风格规则（基础）
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'never'],
      'comma-dangle': ['error', 'never'],
      'eol-last': ['error', 'always'],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'space-before-function-paren': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'comma-spacing': ['error', { before: false, after: true }],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      
      // 最佳实践
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error'
    }
  },
  
  // 忽略文件
  {
    ignores: [
      'dist/',
      'build/',
      'node_modules/',
      '*.config.js',
      'vite.config.js',
      'eslint.config.js',
      '.env*',
      '*.log',
      '.DS_Store',
      '.vscode/',
      '.idea/',
      'coverage/',
      'public/',
      'index.html'
    ]
  }
] 