import api from '../api'
import RootStore from '../store'
import { sleep } from '../helpers'
import { selector, mainMenu } from '../questions'
import { refreshPeriod, gracePeriod } from '../config'

export const waitForPodsToBeReady = async (pods: string[]) => {
  await Promise.all(
    pods.map(async (pod) => {
      let state = await api
        .getPodStatus(pod, RootStore.currentNamespace)
        .catch((error) => 'Pending')
      while (state !== 'Running') {
        await sleep(refreshPeriod)
        state = await api
          .getPodStatus(pod, RootStore.currentNamespace)
          .catch((error) => {
            return 'Running'
          })
      }
      return
    })
  )
  return true
}

export const liveReload = async () => {
  const question = await selector('deployments', 'list')
  const name = question.selection as string
  let deployment = await api.getDeploymentDetails(
    name,
    RootStore.currentNamespace
  )

  // Retrieve existing pods and store for later reference.
  let allPods = await api.getPods(RootStore.currentNamespace)
  const originalPods = allPods.body.items
    .filter((pod) =>
      pod.metadata?.name?.includes(deployment?.metadata?.name || '')
    )
    .map((pod) => pod.metadata?.name)

  // replica size and then Scale up deployment
  let originalReplicas
  if (deployment?.spec && deployment.spec?.replicas) {
    originalReplicas = deployment.spec.replicas
    const newReplicas = deployment.spec.replicas + 1
    deployment = await api.setScaleDeployment(
      name,
      RootStore.currentNamespace,
      newReplicas
    )
  }

  console.log(originalPods)

  if (originalReplicas) {
    console.log('Scaled to ', deployment?.spec?.replicas)
    // wait for deployments new pods to be ready
    await sleep(gracePeriod)

    allPods = await api.getPods(RootStore.currentNamespace)

    const updatedPods = allPods.body.items
      .filter((pod) =>
        pod.metadata?.name?.includes(deployment?.metadata?.name || '')
      )
      .map((pod) => pod.metadata?.name || '')
    const newPods = updatedPods.filter((pod) => !originalPods.includes(pod))

    console.log('New Pods: ', newPods)

    // wait for new pods to be ready
    await waitForPodsToBeReady(newPods)
    console.log('New Backup Pod Created...')

    console.log('Deleteing Old Pods')
    // delete old pods
    await Promise.all(
      originalPods.map(
        async (pod) =>
          await api.deleteResource(
            'pods',
            RootStore.currentNamespace,
            pod || ''
          )
      )
    )
    console.log('Deleted old pods.')

    await waitForPodsToBeReady(updatedPods)

    allPods = await api.getPods(RootStore.currentNamespace)
    const newUpdatedPods = allPods.body.items
      .filter(
        (pod) =>
          pod.metadata?.name?.includes(deployment?.metadata?.name || '') &&
          (pod.status?.phase === 'Pending' || pod.status?.phase === 'Running')
      )
      .map((pod) => pod.metadata?.name || '')

    console.log('Waiting for pods to be ready...')

    // wait for new pods to be ready
    await waitForPodsToBeReady(newUpdatedPods)

    await sleep(gracePeriod)

    deployment = await api.getDeploymentDetails(
      name,
      RootStore.currentNamespace
    )
    console.log('Scaled to ', originalReplicas)
    // scale back to original replica size
    deployment! = await api.setScaleDeployment(
      name,
      RootStore.currentNamespace,
      originalReplicas
    )
    console.log('Live Reload Done!')
  } else {
    console.log(`${question.selection} deployment has no replicas running`)
  }
  mainMenu()
}
