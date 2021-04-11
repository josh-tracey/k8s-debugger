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

type PathImpl<T, Key extends keyof T> =
  Key extends string
  ? T[Key] extends Record<string, any>
    ? | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
      | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
    : never
  : never;

type PathImpl2<T> = PathImpl<T, keyof T> | keyof T;

type Path<T> = PathImpl2<T> extends string | keyof T ? PathImpl2<T> : keyof T;

type PathValue<T, P extends Path<T>> =
  P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

declare function get<T, P extends Path<T>>(obj: T, path: P): PathValue<T, P>;
