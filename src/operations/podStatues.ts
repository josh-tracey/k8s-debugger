import api from '../api'
import { Selection, mainMenu } from '../questions'
import RootStore from '../store'
import * as columnify from 'columnify'

export const podStatuses = async (answer: Selection) => {
  const data: any[] = []
  const pods = (await api.getPods(RootStore.currentNamespace)).body.items.map(
    (pod) => pod.metadata?.name!
  )
  await Promise.all(
    pods.map(async (pod: string) => {
      if (pod) {
        data.push(await api.getPodStatus(pod!, RootStore.currentNamespace!))
      }
    })
  )
  const columns = columnify(data, {
    minWidth: 20,
    config: { name: { maxWidth: 30 } },
  })
  console.log(columns)
  mainMenu()
}
