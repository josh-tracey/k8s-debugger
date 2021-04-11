import {
  V1beta1CronJob,
  V1ConfigMap,
  V1DaemonSet,
  V1Deployment,
  V1Job,
  V1Namespace,
  V1Pod,
  V1Secret,
  V1Service,
  V1ServiceAccount,
} from '@kubernetes/client-node'

export declare type ResourceType =
  | 'pods'
  | 'namespaces'
  | 'deployments'
  | 'daemonsets'
  | 'services'
  | 'secrets'
  | 'configMaps'
  | 'serviceAccounts'
  | 'jobs'
  | 'cronJobs'

export declare type ResourceTypeMap = {
  pods: V1Pod
  namespaces: V1Namespace
  deployments: V1Deployment
  daemonsets: V1DaemonSet
  services: V1Service
  secrets: V1Secret
  configMaps: V1ConfigMap
  serviceAccounts: V1ServiceAccount
  jobs: V1Job
  cronJobs: V1beta1CronJob
}

// type PathParams<Path extends string> =
//     Path extends `:${infer Param}/${infer Rest}` ? Param | PathParams<Rest> :
//     Path extends `:${infer Param}` ? Param :
//     Path extends `${infer _Prefix}:${infer Rest}` ? PathParams<`:${Rest}`> :
//     never;
