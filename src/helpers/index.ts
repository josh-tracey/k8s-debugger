import * as path from 'path'
import * as fs from 'fs'
import { IOperation } from '../operations/interface'
import api from '../api'
import {
  V1ConfigMap,
  V1Deployment,
  V1Job,
  V1Namespace,
  V1Pod,
  V1Secret,
  V1Service,
  V1ServiceAccount,
} from '@kubernetes/client-node'
import Separator from 'inquirer/lib/objects/separator'

export const configDirectoryExists = () =>
  fs.existsSync(path.join(process.cwd(), 'k8configs'))

export const isOperation = (obj: Separator | IOperation): obj is IOperation => {
  return !!obj['execute']
}

export interface ResourceMap {
  [key: string]: { api: (namespace: string) => Promise<any>; type: any }
}

export const mapResource: ResourceMap = {
  configMaps: { api: api.getConfigMaps, type: V1ConfigMap },
  deployments: { api: api.getDeployments, type: V1Deployment },
  namespaces: { api: api.getNamespaces, type: V1Namespace },
  pods: { api: api.getPods, type: V1Pod },
  secrets: { api: api.getSecrets, type: V1Secret },
  serviceAccounts: { api: api.getServiceAccounts, type: V1ServiceAccount },
  services: { api: api.getServices, type: V1Service },
  jobs: { api: api.getJobs, type: V1Job },
}
