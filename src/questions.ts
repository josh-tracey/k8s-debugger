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
import { ResourceType } from './types'
import * as columnify from 'columnify'

interface Confirm {
  confirm: string
}

interface Selection {
  selection: string | string[]
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
      'Pod Statuses',
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

interface ResourceMap {
  [key: string]: { api: (namespace: string) => Promise<any>; type: any }
}

const mapResource: ResourceMap = {
  configMaps: { api: api.getConfigMaps, type: V1ConfigMap },
  deployments: { api: api.getDeployments, type: V1Deployment },
  namespaces: { api: api.getNamespaces, type: V1Namespace },
  pods: { api: api.getPods, type: V1Pod },
  secrets: { api: api.getSecrets, type: V1Secret },
  serviceAccounts: { api: api.getServiceAccounts, type: V1ServiceAccount },
  services: { api: api.getServices, type: V1Service },
}

const selector = async (
  resourceType: ResourceType,
  type: 'checkbox' | 'list'
) => {
  const resource = (
    await mapResource[resourceType].api(RootStore.currentNamespace)
  ).body
  return inquirer.prompt<Selection>({
    name: 'selection',
    pageSize: defaultPageSize,
    choices: resource.items.map((item: typeof resource.type) => {
      return item.metadata ? item.metadata.name! : ''
    }),
    type: type,
  })
}

const logsStream = async (answer: Selection) => {
  console.clear()
  const choices: string[] = answer.selection as string[]
  if (choices.length > 0)
    choices.forEach((name: string) => {
      api.streamLog(name, RootStore.currentNamespace)
    })
  else {
    mainMenu()
  }
}

const podStatuses = async () => {
  const data: { [key: string]: string }[] = []
  const pods = (await api.getPods(RootStore.currentNamespace)).body
  pods.items.forEach((pod: V1Pod) => {
    if (pod.metadata && pod.status) {
      data.push({ podName: pod.metadata.name!, status: pod.status.phase!, reason: pod.status.reason! })
    }
  })
  const columns = columnify(data, {
    minWidth: 20,
    config: { name: { maxWidth: 30 } },
  })
  console.log(columns)
  mainMenu()
}

const deleteResources = async (
  resourceType: ResourceType,
  resources: string[]
) => {
  console.clear()
  let confirmed = true
  if (RootStore.currentContext?.match(/prod/)) {
    console.log('To be deleted: ', resources)
    await prodConfirm().then((answer: Confirm) => {
      if (!['Yes'].includes(answer.confirm)) confirmed = false
    })
  }

  if (confirmed) {
    resources.forEach((name: string) => {
      api.deleteResource(resourceType, RootStore.currentNamespace, name)
    })
    console.log('Deleted: ', resources)
  }
  mainMenu()
}

const logsConsole = async (answer: Selection) => {
  const start = new Date().getTime()
  RootStore.clearLogs()
  ;(answer.selection as string[]).forEach((name: string) => {
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

const deleteResourceResponse = async (resourceType: ResourceType) => {
  console.log(
    `\n###########################\nDelete ${resourceType}\n###########################`
  )
  selector(resourceType, 'checkbox').then(async (answer: Selection) => {
    await deleteResources(resourceType, answer.selection as string[])
  })
}

export const mainMenu = async () => {
  rootMenu().then(async (answer: Selection) => {
    console.clear()
    if (answer.selection.includes('Log merger')) {
      console.log(
        `\n###########################\nLog Merger\n###########################`
      )
      selector('pods', 'checkbox').then(async (answer: Selection) => {
        await logsConsole(answer)
      })
    } else if (answer.selection.includes('Log streamer')) {
      console.log(
        `\n###########################\nLog Streamer\n###########################`
      )
      selector('pods', 'checkbox').then(async (answer: Selection) => {
        logsStream(answer)
      })
    } else if (answer.selection.includes('Pod Statuses')) {
      podStatuses()
    } else if (answer.selection.includes('Delete pods')) {
      deleteResourceResponse('pods')
    } else if (answer.selection.includes('Delete deployments')) {
      deleteResourceResponse('deployments')
    } else if (answer.selection.includes('Delete services')) {
      deleteResourceResponse('services')
    } else if (answer.selection.includes('Delete secrets')) {
      deleteResourceResponse('secrets')
    } else if (answer.selection.includes('Delete configMap')) {
      deleteResourceResponse('configMaps')
    } else if (answer.selection.includes('Delete service account')) {
      deleteResourceResponse('serviceAccounts')
    } else if (answer.selection.includes('Change context')) {
      console.log(
        `\n###########################\nChange Context\n###########################`
      )
      await contextSwitcher()
      console.clear()
      await mainMenu()
    } else if (answer.selection.includes('Change namespace')) {
      console.log(
        `\n###########################\nChange Namespace\n###########################`
      )
      await selector('namespaces', 'list').then(async (answer: Selection) => {
        RootStore.setNamespace(answer.selection as string)
      })
      console.clear()
      await mainMenu()
    } else if (answer.selection.includes('Exit')) {
      console.clear()
      process.exit(0)
    }
  })
}
