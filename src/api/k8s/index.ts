import * as k8s from '@kubernetes/client-node'
import { Context } from '@kubernetes/client-node/dist/config_types'
import * as shell from 'shelljs'

export const kc = new k8s.KubeConfig()

kc.loadFromDefault()

export let k8sLogs = new k8s.Log(kc)

export let k8sBatchV2 = kc.makeApiClient(k8s.BatchV2alpha1Api)

export let k8sBatchV1 = kc.makeApiClient(k8s.BatchV1Api)

export let k8sCustomApp = kc.makeApiClient(k8s.ApiextensionsV1Api)

export let k8sCore = kc.makeApiClient(k8s.CoreV1Api)

export let k8sApps = kc.makeApiClient(k8s.AppsV1Api)

export const getCurrentContext = () => kc.getCurrentContext()

const reinitApis = ()=>{
  k8sBatchV2 = kc.makeApiClient(k8s.BatchV2alpha1Api)
  k8sBatchV1 = kc.makeApiClient(k8s.BatchV1Api)
  k8sBatchV1 = kc.makeApiClient(k8s.BatchV1Api)
  k8sCustomApp = kc.makeApiClient(k8s.ApiextensionsV1Api)
  k8sCore = kc.makeApiClient(k8s.CoreV1Api)
  k8sApps = kc.makeApiClient(k8s.AppsV1Api)
}

export const getContexts = () =>
  kc.getContexts().map((context: Context) => ({
    name: context.name,
    cluster: context.cluster,
    user: context.user,
  }))

export const setContext = (context: string) => {
  kc.setCurrentContext(context)
  shell.exec(`kubectl config use-context ${context}`)
  shell.exec('kubectl get nodes', { silent: true })
  reinitApis()
}
