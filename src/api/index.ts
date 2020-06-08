
import {
  deleteResource,
  getAllDeployments,
  getConfigMaps,
  getCurrentNamespace,
  getDeployments,
  getNamespaces,
  getDeploymentDetails,
  getPods,
  getPodLogs as getLogs,
  // streamLog,
  getSecrets,
  getServiceAccounts,
  getServices,
  setScaleDeployment,
  setNamespace,
} from './k8s/resources'
import { getContexts, getCurrentContext, setContext } from './k8s'
import { getPodStatus } from './k8s/resources'

export default {
  deleteResource,
  getAllDeployments,
  getConfigMaps,
  getContexts,
  getCurrentContext,
  getCurrentNamespace,
  getDeployments,
  getDeploymentDetails,
  getLogs,
  getNamespaces,
  getPods,
  getSecrets,
  getServiceAccounts,
  getServices,
  setContext,
  getPodStatus,
  setNamespace,
  setScaleDeployment,
  // streamLog,
}
