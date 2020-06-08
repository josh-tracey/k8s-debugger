import * as inquirer from 'inquirer'
import {
  V1Pod,
  V1Deployment,
  V1Namespace,
  V1Service,
  V1ConfigMap,
  V1ServiceAccount,
  V1Secret,
  V1ContainerState,
} from '@kubernetes/client-node'
import api from './api'
import RootStore, { ILog } from './store'
import { ResourceType } from './types'
import * as columnify from 'columnify'

interface Confirm {
  confirm: string
}

inquirer.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus'))

const refreshPeriod = 4000
const gracePeriod = refreshPeriod * 4

interface Selection {
  selection: string | string[]
}

const defaultPageSize = 15

const FgRed = '\x1b[31m'
const FgYellow = '\x1b[33m'
const Reset = '\x1b[0m'
const FgGreen = '\x1b[32m'
const FgLightGreen = '\x1b[92m'

const FgBlue = '\x1b[34m'

const getTargetContext = async () => {
  return (
    await inquirer.prompt<{ answer: string }>({
      type: 'list',
      name: 'answer',
      choices: api.getContexts().map((x) => ({
        name: x.name,
        value: x.name,
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
      new inquirer.Separator('--Mission Critical--'),
      'Live reload',
      new inquirer.Separator('--Logging--'),
      'Log merger',
      new inquirer.Separator('--Resource Management--'),
      'Pod statuses',
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
  type: 'checkbox-plus' | 'list'
) => {
  const response = (
    await mapResource[resourceType].api(RootStore.currentNamespace)
  ).body

  const resources = response.items.map((item: any) => ({
    name: item.metadata.name,
    value: item.metadata.name,
  }))

  return inquirer.prompt([
    {
      name: 'selection',
      pageSize: defaultPageSize,
      searchable: true,
      highlight: true,
      choices: resources.map((item: { name: string; value: string }) => {
        return item.name || ''
      }),
      source: function (_: any, input: string) {
        input = input || ''

        return new Promise(function (resolve) {
          let data = resources.filter((item: any) => item.name.includes(input))

          resolve(data)
        })
      },
      type: type,
    },
  ])
}

// const logsStream = async (answer: Selection) => {
//   console.clear()
//   const choices: string[] = answer.selection as string[]
//   if (choices.length > 0)
//     choices.map((name: string) => {
//       api
//         .streamLog(name, RootStore.currentNamespace)
//         .then((log: any) => console.log(log))
//     })
//   else {
//     mainMenu()
//   }
// }

export const colorStatus = (status?: string) => {
  if (status === 'Running') {
    return `${FgLightGreen}${status}${Reset}`
  } else if (status === 'Succeeded') {
    return `${FgGreen}${status}${Reset}`
  } else if (
    status === 'Failed' ||
    status === 'Terminating' ||
    status === 'Terminated'
  ) {
    return `${FgRed}${status}${Reset}`
  }
  return status || 'Unknown'
}

export const findState = (state: V1ContainerState) => {
  if (state.running) {
    return 'Running'
  } else if (state.terminated) {
    return 'Terminating'
  } else if (state.waiting) {
    return 'Waiting'
  } else {
    return 'Unknown'
  }
}

const podStatuses = async (answer: Selection) => {
  const data: any[] = []
  const pods = (await api.getPods(RootStore.currentNamespace)).body.items.map(
    (pod) => pod.metadata?.name!
  )
  await Promise.all(
    pods.map(async (pod: string) => {
      if (pod) {
        data.push(await api.getPodStatus(pod!, RootStore.currentNamespace!))
      }
    })
  )
  const columns = columnify(data, {
    minWidth: 20,
    config: { name: { maxWidth: 30 } },
  })
  console.log(columns)
  mainMenu()
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const waitForPodsTobeReady = async (pods: string[]) => {
  await Promise.all(
    pods.map(async (pod) => {
      let state = await api
        .getPodStatus(pod, RootStore.currentNamespace)
        .catch((error) => 'Pending')
      while (state !== 'Running') {
        await sleep(refreshPeriod)
        state = await api
          .getPodStatus(pod, RootStore.currentNamespace)
          .catch((error) => {
            return 'Running'
          })
      }
      return
    })
  )
  return true
}

const liveReload = async () => {
  const question = await selector('deployments', 'list')
  const name = question.selection as string
  let deployment = await api.getDeploymentDetails(
    name,
    RootStore.currentNamespace
  )

  // Retrieve existing pods and store for later reference.
  let allPods = await api.getPods(RootStore.currentNamespace)
  const originalPods = allPods.body.items
    .filter((pod) =>
      pod.metadata?.name?.includes(
        deployment?.deployment.body.metadata?.name || ''
      )
    )
    .map((pod) => pod.metadata?.name)

  // replica size and then Scale up deployment
  let originalReplicas
  if (deployment?.scale.body.spec && deployment.scale.body.spec.replicas) {
    originalReplicas = deployment.scale.body.spec.replicas
    deployment.scale.body.spec.replicas =
      deployment.scale.body.spec.replicas + 1
    deployment.scale = await api.setScaleDeployment(
      name,
      RootStore.currentNamespace,
      deployment.scale.body
    )
  }

  console.log(originalPods)

  if (originalReplicas) {
    console.log('Scaled to ', deployment?.scale.body.spec?.replicas)
    // wait for deployments new pods to be ready
    await sleep(gracePeriod)

    allPods = await api.getPods(RootStore.currentNamespace)

    const updatedPods = allPods.body.items
      .filter((pod) =>
        pod.metadata?.name?.includes(
          deployment?.deployment.body.metadata?.name || ''
        )
      )
      .map((pod) => pod.metadata?.name || '')
    const newPods = updatedPods.filter((pod) => !originalPods.includes(pod))

    console.log('New Pods: ', newPods)

    // wait for new pods to be ready
    await waitForPodsTobeReady(newPods)
    console.log('New Backup Pod Created...')

    console.log('Deleteing Old Pods')
    // delete old pods
    await Promise.all(
      originalPods.map(
        async (pod) =>
          await api.deleteResource(
            'pods',
            RootStore.currentNamespace,
            pod || ''
          )
      )
    )
    console.log('Deleted old pods.')

    await waitForPodsTobeReady(updatedPods)

    allPods = await api.getPods(RootStore.currentNamespace)
    const newUpdatedPods = allPods.body.items
      .filter(
        (pod) =>
          pod.metadata?.name?.includes(
            deployment?.deployment.body.metadata?.name || ''
          ) &&
          (pod.status?.phase === 'Pending' || pod.status?.phase === 'Running')
      )
      .map((pod) => pod.metadata?.name || '')

    console.log('Waiting for pods to be ready...')

    // wait for new pods to be ready
    await waitForPodsTobeReady(newUpdatedPods)

    await sleep(gracePeriod)

    deployment = await api.getDeploymentDetails(
      name,
      RootStore.currentNamespace
    )

    console.log('Scaled to ', originalReplicas)
    // scale back to original replica size
    deployment!.scale.body.spec!.replicas = originalReplicas
    deployment!.scale = await api.setScaleDeployment(
      name,
      RootStore.currentNamespace,
      deployment!.scale.body
    )
    console.log('Live Reload Done!')
  } else {
    console.log(`${question.selection} deployment has no replicas running`)
  }
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
  const selection = answer.selection as string[]

  await Promise.all(
    selection.map(async (name: string) => {
      const logs = await api.getLogs(name, RootStore.currentNamespace)
      return logs?.map(async (matchedLine: RegExpExecArray | null) => {
        if (matchedLine) {
          RootStore.addLog({
            podName: name,
            timestamp: new Date(matchedLine[1]),
            log: matchedLine[2],
          })
        }
      })
    })
  )
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
  selector(resourceType, 'checkbox-plus').then(async (answer: Selection) => {
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
      selector('pods', 'checkbox-plus').then(async (answer: Selection) => {
        await logsConsole(answer)
      })
      // } else if (answer.selection.includes('Log streamer')) {
      //   console.log(
      //     `\n###########################\nLog Streamer\n###########################`
      //   )
      //   selector('pods', 'checkbox-plus').then(async (answer: Selection) => {
      //     logsStream(answer)
      //   })
    } else if (answer.selection.includes('Live reload')) {
      liveReload()
    } else if (answer.selection.includes('Pod statuses')) {
      await podStatuses(answer)
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
