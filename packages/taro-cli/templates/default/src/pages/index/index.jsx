import { View, Text } from '@spcsn/taro-components'
import { useLoad } from '@spcsn/taro'
import './index.{{ cssExt }}'

export default function {{ to_pascal_case pageName }} () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='{{ pageName }}'>
      <Text>Hello world!</Text>
    </View>
  )
}
