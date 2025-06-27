import { IOperation } from './interface'
import { k8sCore, k8sExec } from '../api/k8s/index'
import RootStore from '../store/index'
import api from '../api'
import { waitForPodReady, deleteResource } from '../api/k8s/resources'
import * as tty from 'tty'

const exec = () => {
  return new Promise<void>(async (done, error) => {
    const ttyInput = new tty.ReadStream(0)
    ttyInput.setRawMode(true)
    const res = await k8sExec.exec(
      RootStore.currentNamespace,
      'k8s-debugger',
      'debug-container',
      'bash',
      new tty.WriteStream(1),
      process.stderr,
      ttyInput,
      true /* tty */,
      () => {
        done()
      }
    )

    res.on('close', () => {
      done()
    })

    res.on('error', (err) => {
      error(err)
    })

    // stdin.on('data', (data) => {
    //   console.log(data.toString())
    //   res.send(data)
    // })
  })
}

const DebugShell: IOperation = {
  execute: async () => {
    const pods = await api.getPods(RootStore.currentNamespace)

    if (!pods.items.some((pod) => pod.metadata?.name === 'k8s-debugger')) {
      await k8sCore.createNamespacedPod({
        namespace: RootStore.currentNamespace, body: {
          metadata: { name: 'k8s-debugger' },
          spec: {
            ephemeralContainers: [],
            containers: [
              {
                name: 'debug-container',
                image: 'amouat/network-utils',
                command: ['sleep', '3600'],
              },
            ],
          },
        }
      })
    }

    await waitForPodReady('k8s-debugger', RootStore.currentNamespace)

    await exec()

    console.clear()

    console.log(`Deleteing Pod k8s-debugger`)
    await deleteResource('pods', RootStore.currentNamespace, 'k8s-debugger')
  },
  label: 'Debug Container Shell',
}

export default DebugShell
