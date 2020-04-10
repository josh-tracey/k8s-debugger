import { streamLog, getLogs } from './k8s/logs'
import {
  deleteResource,
  getAllDeployments,
  getConfigMaps,
  getCurrentNamespace,
  getDeployments,
  getNamespaces,
  getPods,
  getSecrets,
  getServiceAccounts,
  getServices,
  setNamespace,
} from './k8s/resources'
import { getContexts, getCurrentContext, setContext } from './k8s'

export default {
  deleteResource,
  getAllDeployments,
  getConfigMaps,
  getContexts,
  getCurrentContext,
  getCurrentNamespace,
  getDeployments,
  getLogs,
  getNamespaces,
  getPods,
  getSecrets,
  getServiceAccounts,
  getServices,
  setContext,
  setNamespace,
  streamLog,
}
