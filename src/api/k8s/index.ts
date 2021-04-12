import * as k8s from '@kubernetes/client-node'
import { Context } from '@kubernetes/client-node/dist/config_types'
import * as shelljs from 'shelljs'
import { K8S_DEBUGGER_ISOLATED_CONTEXT } from '../../config'
import RootStore from '../../store/index'

export const kc = new k8s.KubeConfig()

kc.loadFromDefault()

export let k8sLogs = new k8s.Log(kc)

export let k8sExec = new k8s.Exec(kc)

export let k8sBatchV2 = kc.makeApiClient(k8s.BatchV2alpha1Api)

export let k8sBatchV1 = kc.makeApiClient(k8s.BatchV1Api)

export let k8sCustomApi = kc.makeApiClient(k8s.ApiextensionsV1Api)

export let k8sCore = kc.makeApiClient(k8s.CoreV1Api)

export let k8sApps = kc.makeApiClient(k8s.AppsV1Api)

export let k8sEvents: k8s.EventsV1Api | k8s.EventsV1beta1Api = kc.makeApiClient(
  k8s.EventsV1Api
)

// k8s.topNodes(k8sCore).then((obj) => console.log(JSON.stringify(obj[0].Node.status?.nodeInfo?.kubeletVersion, null, ' ')))

export let getCurrentContext = () => kc.getCurrentContext()

const reinitApis = async () => {
  const eventVersion = await kc.makeApiClient(k8s.EventsApi).getAPIGroup()

  k8sLogs = new k8s.Log(kc)
  k8sBatchV2 = kc.makeApiClient(k8s.BatchV2alpha1Api)
  k8sBatchV1 = kc.makeApiClient(k8s.BatchV1Api)
  k8sCustomApi = kc.makeApiClient(k8s.ApiextensionsV1Api)
  k8sCore = kc.makeApiClient(k8s.CoreV1Api)
  k8sApps = kc.makeApiClient(k8s.AppsV1Api)

  if (eventVersion.body.preferredVersion?.version === 'v1') {
    k8sEvents = kc.makeApiClient(k8s.EventsV1Api)
  } else {
    k8sEvents = kc.makeApiClient(k8s.EventsV1beta1Api)
  }

  k8sExec = new k8s.Exec(kc)
}

export const getContexts = () =>
  kc.getContexts().map((context: Context) => ({
    name: context.name,
    cluster: context.cluster,
    user: context.user,
  }))

export const setContext = (context: string) => {
  kc.setCurrentContext(context)
  !K8S_DEBUGGER_ISOLATED_CONTEXT &&
    shelljs.exec(`kubectl config use-context ${context}`)
  RootStore.setNamespace('default')
  reinitApis()
}
