## babel-plugin-transform-taroapi

将 `import default Taro` 的写法转换为模块化引用，以实现 tree-shaking。

### example

```
import Taro from '@spcsn/taro'
Taro.request(...)
```

会转换为：

```
import { request } from '@spcsn/taro-api'
request(...)
```
