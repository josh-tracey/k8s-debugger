import api from '../api'
import RootStore from '../store'
import * as columnify from 'columnify'
import { IOperation } from './interface'


//TODO Needs to be updated, not too great, doesn't reflect the current state correctly.
const PodStatuses: IOperation = {
  execute: async () => {
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
  },
  label: 'Display Pod Statuses',
}

export default PodStatuses
