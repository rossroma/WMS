const js = require('@eslint/js');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        // Node.js 全局变量
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // 基础推荐规则
      ...js.configs.recommended.rules,
      
      // 未使用变量检查 - 这是主要需求
      'no-unused-vars': ['error', {
        'vars': 'all',           // 检查所有变量
        'args': 'after-used',    // 检查未使用的函数参数
        'argsIgnorePattern': '^_', // 忽略以下划线开头的参数
        'varsIgnorePattern': '^_', // 忽略以下划线开头的变量
        'caughtErrors': 'all'    // 检查 catch 块中未使用的错误变量
      }],
      
      // 未使用的表达式
      'no-unused-expressions': 'error',
      
      // 未使用的标签
      'no-unused-labels': 'error',
      
      // 禁止不必要的 return await
      'no-return-await': 'error',
      
      // 要求使用 const 声明不会被重新赋值的变量
      'prefer-const': ['error', {
        'destructuring': 'any',
        'ignoreReadBeforeAssign': false
      }],
      
      // 禁止变量声明覆盖外层作用域的变量
      'no-shadow': 'error',
      
      // 禁止在变量定义之前使用它们
      'no-use-before-define': ['error', {
        'functions': false,
        'classes': true,
        'variables': true
      }],
      
      // 禁止未使用的私有类成员
      'no-unused-private-class-members': 'error',
      
      // 其他代码质量规则
      'no-debugger': 'error',        // 禁止 debugger
      'no-alert': 'error',           // 禁止 alert
      'no-eval': 'error',            // 禁止 eval
      'no-implied-eval': 'error',    // 禁止隐式 eval
      'no-undef': 'error',           // 禁止使用未定义的变量
      'no-redeclare': 'error',       // 禁止重复声明变量
      'no-var': 'error',             // 禁止使用 var，推荐使用 let/const
      'eqeqeq': ['error', 'always'], // 要求使用严格相等 === 和 !==
      'no-extra-semi': 'error',      // 禁止不必要的分号
      'no-unreachable': 'error',     // 禁止不可达代码
      'valid-typeof': 'error'        // 强制 typeof 表达式与有效的字符串进行比较
    }
  },
  {
    // 忽略某些文件/目录
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'logs/**',
      '*.min.js',
      '.env*',
      'docker/**',
      'Dockerfile*',
      'docker-compose*'
    ]
  }
]; 