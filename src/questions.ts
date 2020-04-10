import * as inquirer from 'inquirer'
import {
  V1Pod,
  V1Deployment,
  V1Namespace,
  V1Service,
  V1ConfigMap,
  V1ServiceAccount,
  V1Secret,
} from '@kubernetes/client-node'
import api from './api'
import RootStore, { ILog } from './store'

interface Confirm {
  confirm: string
}

interface Selection {
  selection: string | string[]
}

interface PodSelection {
  pods: string[]
}

interface NamespaceSelection {
  namespace: string
}

interface DeploymentSelection {
  deployments: string[]
}

const defaultPageSize = 15

const FgYellow = '\x1b[33m'
const Reset = '\x1b[0m'
const FgGreen = '\x1b[32m'
const FgBlue = '\x1b[34m'

const getTargetContext = async () => {
  return (
    await inquirer.prompt<{ answer: string }>({
      type: 'list',
      name: 'answer',
      choices: api.getContexts().map((x) => ({
        name: x,
        value: x,
      })),
      message: 'Choose k8s context: ',
    })
  ).answer
}

export const contextSwitcher = async () => {
  const context = await getTargetContext()

  if (context.includes('prod')) {
    const answer = await inquirer.prompt<Confirm>({
      type: 'input',
      name: 'confirm',
      message:
        'You are about to use a production environment, are you sure you want to continue? yes/[no]: ',
    })

    if (['y', 'Y', 'Yes', 'yes'].includes(answer.confirm)) {
      RootStore.setContext(context)
    }
  } else {
    RootStore.setContext(context)
  }
  console.clear()
}

const prodConfirm = async () => {
  return inquirer.prompt<Confirm>({
    type: 'confirm',
    name: 'confirm',
    default: false,
    message:
      'Warning! \n\n This is a production environment. Do you wish to continue? y/[n]: ',
  })
}

const rootMenu = async (): Promise<Selection> => {
  console.log(
    `-----------${RootStore.currentContext}-[${RootStore.currentNamespace}]-------------`
  )
  return inquirer.prompt<Selection>({
    name: 'selection',
    pageSize: defaultPageSize,
    choices: [
      new inquirer.Separator('--Logging--'),
      'Log streamer',
      'Log merger',
      new inquirer.Separator('--Resource Management--'),
      'Delete pods',
      'Delete deployments',
      'Delete services',
      'Delete configMaps',
      'Delete secrets',
      'Delete service accounts',
      new inquirer.Separator('--Other--'),
      'Change namespace',
      'Change context',
      'Exit',
    ],
    type: 'list',
  })
}

const podSelector = async (): Promise<PodSelection> => {
  const pods = (await api.getPods(RootStore.currentNamespace)).body
  return inquirer.prompt<PodSelection>({
    name: 'pods',
    pageSize: defaultPageSize,
    choices: pods.items.map((pod: V1Pod) => {
      return pod.metadata ? pod.metadata.name! : ''
    }),
    type: 'checkbox',
  })
}

const namespaceSelector = async (): Promise<NamespaceSelection> => {
  const namespaces = (await api.getNamespaces()).body
  return inquirer.prompt<NamespaceSelection>({
    name: 'namespace',
    pageSize: defaultPageSize,
    choices: namespaces.items.map((namespace: V1Namespace) => {
      return namespace.metadata ? namespace.metadata.name! : ''
    }),
    type: 'list',
  })
}

const deploymentSelector = async (): Promise<DeploymentSelection> => {
  const deployments = (await api.getDeployments(RootStore.currentNamespace))
    .body
  return inquirer.prompt<DeploymentSelection>({
    name: 'deployments',
    pageSize: defaultPageSize,
    choices: deployments.items.map((deployment: V1Deployment) => {
      return deployment.metadata ? deployment.metadata.name! : ''
    }),
    type: 'checkbox',
  })
}

const serviceSelector = async (): Promise<Selection> => {
  const services = (await api.getServices(RootStore.currentNamespace)).body
  return inquirer.prompt<Selection>({
    name: 'selection',
    pageSize: defaultPageSize,
    choices: services.items.map((service: V1Service) => {
      return service.metadata ? service.metadata.name! : ''
    }),
    type: 'checkbox',
  })
}

const configMapSelector = async (): Promise<Selection> => {
  const configMaps = (await api.getConfigMaps(RootStore.currentNamespace)).body
  return inquirer.prompt<Selection>({
    name: 'selection',
    pageSize: defaultPageSize,
    choices: configMaps.items.map((configMap: V1ConfigMap) => {
      return configMap.metadata ? configMap.metadata.name! : ''
    }),
    type: 'checkbox',
  })
}

const serviceAccountSelector = async (): Promise<Selection> => {
  const serviceAccounts = (
    await api.getServiceAccounts(RootStore.currentNamespace)
  ).body
  return inquirer.prompt<Selection>({
    name: 'selection',
    pageSize: defaultPageSize,
    choices: serviceAccounts.items.map((serviceAccount: V1ServiceAccount) => {
      return serviceAccount.metadata ? serviceAccount.metadata.name! : ''
    }),
    type: 'checkbox',
  })
}

const secretSelector = async (): Promise<Selection> => {
  const secrets = (await api.getSecrets(RootStore.currentNamespace)).body
  return inquirer.prompt<Selection>({
    name: 'selection',
    pageSize: defaultPageSize,
    choices: secrets.items.map((secret: V1Secret) => {
      return secret.metadata ? secret.metadata.name! : ''
    }),
    type: 'checkbox',
  })
}

const logsStream = async (answer: PodSelection) => {
  console.clear()
  const choices: string[] = answer.pods
  if (choices.length > 0)
    choices.forEach((name: string) => {
      api.streamLog(name, RootStore.currentNamespace)
    })
  else {
    mainMenu()
  }
}

const deletePods = async (answer: PodSelection) => {
  console.clear()
  let confirmed = true
  if (RootStore.currentContext?.match(/prod/)) {
    console.log('To be deleted: ', answer.pods)
    await prodConfirm().then((answer: Confirm) => {
      if (!['Yes'].includes(answer.confirm)) confirmed = false
    })
  }

  if (confirmed) {
    answer.pods.forEach((name: string) => {
      api.deleteResource('pod', RootStore.currentNamespace, name)
    })
    console.log('Deleted: ', answer.pods)
  }
  mainMenu()
}

const deleteDeployment = async (answer: DeploymentSelection) => {
  console.clear()
  let confirmed = true
  if (RootStore.currentContext?.match(/prod/)) {
    console.log('To be deleted: ', answer.deployments)
    await prodConfirm().then((answer: Confirm) => {
      if (!['y', 'yes', 'Y', 'YES'].includes(answer.confirm)) confirmed = false
    })
  }

  if (confirmed) {
    answer.deployments.forEach((name: string) => {
      api.deleteResource('deployment', RootStore.currentNamespace, name)
    })
    console.log('Deleted: ', answer.deployments)
  }
  mainMenu()
}

const deleteServices = async (answer: Selection) => {
  console.clear()
  let confirmed = true
  if (RootStore.currentContext?.match(/prod/)) {
    console.log('To be deleted: ', answer.selection)
    await prodConfirm().then((answer: Confirm) => {
      if (!['Yes'].includes(answer.confirm)) confirmed = false
    })
  }

  if (confirmed) {
    ;(answer.selection as string[]).forEach((name: string) => {
      api.deleteResource('service', RootStore.currentNamespace, name)
    })
    console.log('Deleted: ', answer.selection)
  }
  mainMenu()
}

const deleteSecrets = async (answer: Selection) => {
  console.clear()
  let confirmed = true
  if (RootStore.currentContext?.match(/prod/)) {
    console.log('To be deleted: ', answer.selection)
    await prodConfirm().then((answer: Confirm) => {
      if (!['Yes'].includes(answer.confirm)) confirmed = false
    })
  }

  if (confirmed) {
    ;(answer.selection as string[]).forEach((name: string) => {
      api.deleteResource('secret', RootStore.currentNamespace, name)
    })
    console.log('Deleted: ', answer.selection)
  }
  mainMenu()
}

const deleteConfigMaps = async (answer: Selection) => {
  console.clear()
  let confirmed = true
  if (RootStore.currentContext?.match(/prod/)) {
    console.log('To be deleted: ', answer.selection)
    await prodConfirm().then((answer: Confirm) => {
      if (!['Yes'].includes(answer.confirm)) confirmed = false
    })
  }

  if (confirmed) {
    ;(answer.selection as string[]).forEach((name: string) => {
      api.deleteResource('configMap', RootStore.currentNamespace, name)
    })
    console.log('Deleted: ', answer.selection)
  }
  mainMenu()
}

const deleteServiceAccounts = async (answer: Selection) => {
  console.clear()
  let confirmed = true
  if (RootStore.currentContext?.match(/prod/)) {
    console.log('To be deleted: ', answer.selection)
    await prodConfirm().then((answer: Confirm) => {
      if (!['Yes'].includes(answer.confirm)) confirmed = false
    })
  }

  if (confirmed) {
    ;(answer.selection as string[]).forEach((name: string) => {
      api.deleteResource('serviceAccount', RootStore.currentNamespace, name)
    })
    console.log('Deleted: ', answer.selection)
  }
  mainMenu()
}

const logsConsole = async (answer: PodSelection) => {
  const start = new Date().getTime()
  RootStore.clearLogs()
  answer.pods.forEach((name: string) => {
    api
      .getLogs(name, RootStore.currentNamespace)
      ?.forEach((matchedLine: RegExpExecArray | null) => {
        if (matchedLine) {
          RootStore.addLog({
            podName: name,
            timestamp: new Date(matchedLine[1]),
            log: matchedLine[2],
          })
        }
      })
  })
  RootStore.sortLogs()
  const end = new Date().getTime() - start
  let prevLogRecord: ILog | null = null
  RootStore.currentLogs.forEach((log: ILog) => {
    if (prevLogRecord) {
      if (prevLogRecord.podName !== log.podName)
        console.log(
          `\n${FgYellow}[${log.podName}] ${FgGreen} ${
            log.timestamp
          }${Reset}\n${FgBlue}${log.timestamp.getHours()}:${log.timestamp.getMinutes()}:${log.timestamp.getSeconds()}.${log.timestamp.getMilliseconds()}${Reset}`,
          log.log
        )
      else {
        console.log(
          `${FgBlue}${log.timestamp.getHours()}:${log.timestamp.getMinutes()}:${log.timestamp.getSeconds()}.${log.timestamp.getMilliseconds()}${Reset}`,
          log.log
        )
      }
    } else {
      console.log(
        `${FgBlue}${log.timestamp.getHours()}:${log.timestamp.getMinutes()}:${log.timestamp.getSeconds()}.${log.timestamp.getMilliseconds()}${Reset}`,
        log.log
      )
    }
    prevLogRecord = log
  })
  console.info('Merge time: %ds', end / 1000.0)
  mainMenu()
}

export const mainMenu = async () => {
  rootMenu().then(async (answer: Selection) => {
    if (answer.selection.includes('Log merger')) {
      console.clear()
      console.log(
        `\n###########################\nLog Merger\n###########################`
      )
      podSelector().then(async (answer: PodSelection) => {
        await logsConsole(answer)
      })
    } else if (answer.selection.includes('Log streamer')) {
      console.clear()
      console.log(
        `\n###########################\nLog Streamer\n###########################`
      )
      podSelector().then(async (answer: PodSelection) => {
        logsStream(answer)
      })
    } else if (answer.selection.includes('Delete pods')) {
      console.log(
        `\n###########################\nDelete Pods\n###########################`
      )
      podSelector().then(async (answer: PodSelection) => {
        await deletePods(answer)
      })
    } else if (answer.selection.includes('Delete deployments')) {
      console.clear()
      console.log(
        `\n###########################\nDelete Deployments\n###########################`
      )
      deploymentSelector().then(async (answer: DeploymentSelection) => {
        await deleteDeployment(answer)
      })
    } else if (answer.selection.includes('Delete services')) {
      console.log(
        `\n###########################\nDelete Services\n###########################`
      )
      serviceSelector().then(async (answer: Selection) => {
        await deleteServices(answer)
      })
    } else if (answer.selection.includes('Delete secrets')) {
      console.log(
        `\n###########################\nDelete Secrets\n###########################`
      )
      secretSelector().then(async (answer: Selection) => {
        await deleteSecrets(answer)
      })
    } else if (answer.selection.includes('Delete configMap')) {
      console.log(
        `\n###########################\nDelete configMaps\n###########################`
      )
      configMapSelector().then(async (answer: Selection) => {
        await deleteConfigMaps(answer)
      })
    } else if (answer.selection.includes('Delete service account')) {
      console.log(
        `\n###########################\nDelete Service Accounts\n###########################`
      )
      serviceAccountSelector().then(async (answer: Selection) => {
        await deleteServiceAccounts(answer)
      })
    } else if (answer.selection.includes('Change context')) {
      console.clear()

      console.log(
        `\n###########################\nChange Context\n###########################`
      )
      await contextSwitcher()
      mainMenu()
    } else if (answer.selection.includes('Change namespace')) {
      console.log(
        `\n###########################\nChange Namespace\n###########################`
      )
      await namespaceSelector().then(async (answer: NamespaceSelection) => {
        RootStore.setNamespace(answer.namespace)
      })
      console.clear()
      await mainMenu()
    } else if (answer.selection.includes('Exit')) {
      console.clear()
      process.exit(0)
    }
  })
}
