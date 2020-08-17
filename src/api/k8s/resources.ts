import { k8sCore, k8sApps } from '.'
import { ResourceType } from '../../types'
import { colorStatus, findState } from '../../helpers'
import { k8sLogs, k8sBatchV1, k8sBatchV2 } from './index'
import { Transform } from 'stream'

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
  replicas: number
) => {
  const res = await k8sApps.readNamespacedDeployment(name, namespace)

  let deployment = res.body

  deployment.spec!.replicas = replicas

  try {
    return await k8sApps
      //@ts-ignore
      .replaceNamespacedDeploymentScale(name, namespace, deployment)
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
    return (await k8sApps.readNamespacedDeployment(name, namespace)).body
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

export const getJobs = (namespace: string) => {
  return k8sBatchV1.listNamespacedJob(namespace)
}

export const getCronJobs = (namespace: string) => {
  return k8sBatchV2.listNamespacedCronJob(namespace)
}

export const getSecret = async (name: string, namespace: string) => {
  return (await k8sCore.readNamespacedSecret(name, namespace)).body
}

export const getConfigmap = async (name: string, namespace: string) => {
  return (await k8sCore.readNamespacedConfigMap(name, namespace)).body
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
export const streamLog = async (
  podName: string,
  namespace: string,
  writer: Transform
) => {
  const pod = await k8sCore.readNamespacedPod(podName, namespace)

  const container = pod.body.spec?.containers[0]
  k8sLogs.log(
    namespace,
    podName,
    container?.name || '',
    writer,
    (err: any) => {
      console.log(err)
    },
    { follow: true, sinceSeconds: 60, timestamps: true }
  )
}

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
