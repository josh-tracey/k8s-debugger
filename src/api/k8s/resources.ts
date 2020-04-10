import { k8sCore, k8sApps } from '.'

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

export const getAllDeployments = () => {
  return k8sApps.listDeploymentForAllNamespaces()
}

export const getSecrets = (namespace: string)=>{
  return k8sCore.listNamespacedSecret(namespace)
}

export const getConfigMaps = (namespace: string)=>{
  return k8sCore.listNamespacedConfigMap(namespace)
}

export const getServiceAccounts = (namespace: string)=>{
  return k8sCore.listNamespacedServiceAccount(namespace)
}

export const deleteResource = (
  resourceType:
    | 'pod'
    | 'deployment'
    | 'daemonset'
    | 'service'
    | 'secret'
    | 'configMap'
    | 'serviceAccount',
  namespace: string,
  name: string
) => {
  if (resourceType === 'pod') {
    return k8sCore.deleteNamespacedPod(name, namespace)
  } else if (resourceType === 'deployment') {
    return k8sApps.deleteNamespacedDeployment(name, namespace)
  } else if (resourceType === 'daemonset') {
    return k8sApps.deleteNamespacedDaemonSet(name, namespace)
  } else if (resourceType === 'service') {
    return k8sCore.deleteNamespacedService(name, namespace)
  } else if (resourceType === 'secret') {
    return k8sCore.deleteNamespacedSecret(name, namespace)
  }else if (resourceType === 'configMap') {
    return k8sCore.deleteNamespacedConfigMap(name, namespace)
  }else if (resourceType === 'serviceAccount') {
    return k8sCore.deleteNamespacedServiceAccount(name, namespace)
  }
  return
}
