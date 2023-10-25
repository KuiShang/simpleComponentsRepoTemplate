# 打包之后再引用的组件

## 安装

npm i @geip/integration-business-components -S

## 配置

```js
bable.config.js

module.exports = {
  plugins: [
    [
      'component',
      {
        libraryName: '@geip/integration-business-components',
        style: false,
      },
      'integration-business',
    ],
  ],
}
```

## 使用

```js
import { kkk } from '@geip/integration-business-components'
```

## 调试

参考 https://xiaodongxier.com/2045.html
