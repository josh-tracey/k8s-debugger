import { IOperation } from './interface'
import RootStore from '../store'
import { k8sEvents } from '../api/k8s/index'
import { FgBlue, FgGreen, Reset } from '../colors'
import * as columnify from 'columnify'

const Events: IOperation = {
  execute: async () => {
    const res = (
      await k8sEvents.listNamespacedEvent(RootStore.currentNamespace)
    ).body

    if (!res.items.length) {
      console.log(`No recent events happened in ${RootStore.currentNamespace}`)
      return
    }

    console.log(
      columnify(
        res.items
          .map((e) => {
            return {
              Timestamp: `${FgBlue}${new Date(
                e.metadata!.creationTimestamp!
              ).toISOString()}`,
              Resource: `${FgGreen}${e.regarding?.name}`,
              Event: `${Reset}${e.note}`,
            }
          })
          .sort((a, b) => (a.Timestamp <= b.Timestamp ? -1 : 1)),
        {
          config: {
            Event: { maxWidth: 96 },
          },
        }
      )
    )
  },
  label: 'Display Events',
}

export default Events
