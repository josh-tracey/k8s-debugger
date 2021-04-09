import { IOperation } from './interface'
import RootStore from '../store'
import { k8sEvents } from '../api/k8s/index'
import { FgBlue, FgGreen, Reset } from '../colors'

const Events: IOperation = {
  execute: async () => {
    const res = (
      await k8sEvents.listNamespacedEvent(RootStore.currentNamespace)
    ).body

    if (!res.items.length) {
      console.log(`No recent events happened in ${RootStore.currentNamespace}`)
      return
    }

    res.items.map((e) => {
      console.log(
        `${FgBlue}${new Date(
          e.metadata!.creationTimestamp!
        ).toISOString()} - ${FgGreen}${e.regarding?.name}: ${Reset}${e.note}`
      )
    })
  },
  label: 'Display Events',
}

export default Events
