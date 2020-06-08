import { k8sCore, k8sApps } from '.'
import { ResourceType } from '../../types'
import { findState, colorStatus } from '../../questions'

export let namespace: string | undefined = 'default'

export const getCurrentNamespace = () => {
  return namespace || 'default'
}

export const getNamespaces = async () => {
  try {
    return k8sCore.listNamespace()
  } catch (e) {
    console.log(e.message)
    return
  }
}

export const setNamespace = async (nextNamespace: string) => {
  namespace = nextNamespace
}

export const getServices = async (namespace: string) => {
  try {
    return k8sCore.listNamespacedService(namespace)
  } catch (e) {
    console.log(e.message)
    return
  }
}

export const getPods = (namespace: string) => {
  return k8sCore.listNamespacedPod(namespace)
}

export const getDeployments = async (namespace: string) => {
  return k8sApps.listNamespacedDeployment(namespace)
}

export const setScaleDeployment = async (
  name: string,
  namespace: string,
  spec: object
) => {
  try {
    return await k8sApps
      .replaceNamespacedDeploymentScale(name, namespace, spec)
      .then((response) => response)
      .catch((error) => {
        console.log(error)
        return error
      })
  } catch (e) {
    console.log(e.message)
    return
  }
}

export const getDeploymentDetails = async (name: string, namespace: string) => {
  try {
    return {
      scale: await k8sApps.readNamespacedDeploymentScale(name, namespace),
      deployment: await k8sApps.readNamespacedDeployment(name, namespace),
    }
  } catch (e) {
    console.log(e.message)
    return
  }
}

export const getAllDeployments = () => {
  try {
    return k8sApps.listDeploymentForAllNamespaces()
  } catch (e) {
    console.log(e.message)
    return
  }
}

export const getSecrets = (namespace: string) => {
  return k8sCore.listNamespacedSecret(namespace)
}

export const getConfigMaps = (namespace: string) => {
  return k8sCore.listNamespacedConfigMap(namespace)
}

export const getServiceAccounts = (namespace: string) => {
  return k8sCore.listNamespacedServiceAccount(namespace)
}

export const getPodStatus = async (pod: string, namespace: string) => {
  const podStatus = (await k8sCore.readNamespacedPodStatus(pod, namespace)).body

  return {
    podName: pod,
    phase: colorStatus(podStatus.status?.phase),
    lastCondition: colorStatus(
      findState(
        podStatus.status?.containerStatuses![
          podStatus.status?.containerStatuses?.length! - 1
        ].state!
      )
    ),
    type: podStatus.status?.conditions![
      podStatus.status?.conditions!.length - 1
    ].type,
    statusReason: podStatus.status?.conditions![
      podStatus.status?.conditions!.length - 1
    ].reason,
    statusMessage: podStatus.status?.conditions![
      podStatus.status?.conditions!.length - 1
    ].message,
  }
}

export const getServiceProxy = async (service: string, namespace: string) => {
  return (await k8sCore.connectGetNamespacedServiceProxy(service, namespace))
    .body
}

export const getPodLogs = async (pod: string, namespace: string) => {
  const logTimestampLOCALRegex = /(\d{4}-\d{2}-\d{2}[A-Z]\d{2}:\d{2}:\d{2}\.\d{1,12}\+\d{2}:\d{2}) (.*)/gu
  const logTimestampGTCRegex = /(\d{4}-\d{2}-\d{2}[A-Z]\d{2}:\d{2}:\d{2}\.\d{1,12}[A-Z]) (.*)/gu
  try {
    const logs = (
      await k8sCore.readNamespacedPodLog(
        pod,
        namespace,
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true
      )
    ).body

    const matchs = logs.match(/(.*)/gu)

    if (matchs)
      return matchs.map((line: string) => {
        let match = logTimestampLOCALRegex.exec(line)
        if (match === null) {
          match = logTimestampGTCRegex.exec(line)
        }
        return match
      })

    throw Error('Found No Logs!')
  } catch (e) {
    if (e.message.includes('HTTP request failed')) {
      console.log('Failed to retrieve logs!')
    } else {
      console.log(e)
    }
    return
  }
}

// export const streamLog = async (pod: string, namespace: string) => {
//   return (
//     await k8sCore.readNamespacedPodLog(
//       pod,
//       namespace,
//       undefined,
//       true,
//       false,
//       undefined,
//       ' '
//     )
//   ).body
// }

export const deleteResource = (
  resourceType: ResourceType,
  namespace: string,
  name: string
) => {
  if (resourceType === 'pods') {
    return k8sCore.deleteNamespacedPod(name, namespace)
  } else if (resourceType === 'deployments') {
    return k8sApps.deleteNamespacedDeployment(name, namespace)
  } else if (resourceType === 'daemonsets') {
    return k8sApps.deleteNamespacedDaemonSet(name, namespace)
  } else if (resourceType === 'services') {
    return k8sCore.deleteNamespacedService(name, namespace)
  } else if (resourceType === 'secrets') {
    return k8sCore.deleteNamespacedSecret(name, namespace)
  } else if (resourceType === 'configMaps') {
    return k8sCore.deleteNamespacedConfigMap(name, namespace)
  } else if (resourceType === 'serviceAccounts') {
    return k8sCore.deleteNamespacedServiceAccount(name, namespace)
  }
  return
}
