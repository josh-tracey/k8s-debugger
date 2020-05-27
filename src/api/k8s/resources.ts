import { k8sCore, k8sApps } from '.'
import { ResourceType } from '../../types'

export let namespace: string | undefined = 'default'

export const getCurrentNamespace = () => {
  return namespace || 'default'
}

export const getNamespaces = async () => {
  return k8sCore.listNamespace()
}

export const setNamespace = async (nextNamespace: string) => {
  namespace = nextNamespace
}

export const getServices = async (namespace: string) => {
  return k8sCore.listNamespacedService(namespace)
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
  return await k8sApps
    .replaceNamespacedDeploymentScale(name, namespace, spec)
    .then((response) => response)
    .catch((error) => {
      console.log(error)
      return error
    })
}

export const getDeploymentDetails = async (name: string, namespace: string) => {
  return {
    scale: await k8sApps.readNamespacedDeploymentScale(name, namespace),
    deployment: await k8sApps.readNamespacedDeployment(name, namespace),
  }
}

export const getAllDeployments = () => {
  return k8sApps.listDeploymentForAllNamespaces()
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
  return (await k8sCore.readNamespacedPodStatus(pod, namespace)).body.status
    ?.phase
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
