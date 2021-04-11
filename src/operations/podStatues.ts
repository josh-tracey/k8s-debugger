import api from '../api'
import RootStore from '../store'
import * as columnify from 'columnify'
import { IOperation } from './interface'
import { colorStatus } from '../helpers'

//TODO Needs to be updated, not too great, doesn't reflect the current state correctly.
const PodStatuses: IOperation = {
  execute: async () => {
    const data = (await api.getPods(RootStore.currentNamespace)).body.items
      .map((pod) => ({
        Name: pod.metadata?.name,
        Status: colorStatus(pod.status?.phase),
      }))
      .sort((a, b) => (a.Name! <= b?.Name! ? -1 : 1))
    const columns = columnify(data, {
      minWidth: 20,
      config: { name: { maxWidth: 30 } },
    })
    console.log(columns)
  },
  label: 'Display Pod Statuses',
}

export default PodStatuses
