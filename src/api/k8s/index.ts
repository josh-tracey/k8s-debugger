import * as k8s from '@kubernetes/client-node'
import { Context } from '@kubernetes/client-node/dist/config_types'

export const kc = new k8s.KubeConfig()

kc.loadFromDefault()

export const k8sCore = kc.makeApiClient(k8s.CoreV1Api)

export const k8sApps = kc.makeApiClient(k8s.AppsV1Api)

export const getCurrentContext = () => kc.getCurrentContext()

export const getContexts = () => kc.getContexts().map((context: Context) => ({name: context.name, cluster: context.cluster, user: context.user}))

export const setContext = (context: string) => {
  kc.setCurrentContext(context)
}
