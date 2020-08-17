import * as inquirer from 'inquirer'
import {
  V1Pod,
  V1Deployment,
  V1Namespace,
  V1Service,
  V1ConfigMap,
  V1ServiceAccount,
  V1Secret,
  V1Job,
  V2alpha1CronJob,
} from '@kubernetes/client-node'
import api from './api'
import RootStore from './store'
import { ResourceType } from './types'
import { logsConsole } from './operations/logMerger'
import { liveReload } from './operations/liveReload'
import { podStatuses } from './operations/podStatues'
import { logsStream } from './operations/logStreamer'
import { getSecret, setScaleDeployment } from './api/k8s/resources'
interface Confirm {
  confirm: string
}

inquirer.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus'))

export interface Selection {
  selection: string | string[]
}

const defaultPageSize = 15

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
      new inquirer.Separator('--Experimental--'),
      'Live reload',
      'Scaler',
      new inquirer.Separator('--Logging--'),
      'Log streamer',
      'Log merger',
      new inquirer.Separator('--Display--'),
      // 'Display configMaps',
      'Pod statuses',
      'Display secrets',
      new inquirer.Separator('--Resource Management--'),
      'Delete pods',
      'Delete deployments',
      'Delete services',
      'Delete configMaps',
      'Delete secrets',
      'Delete cronjobs',
      'Delete jobs',
      'Delete service accounts',
      new inquirer.Separator('--Other--'),
      'Change namespace',
      'Change context',
      'Exit',
    ],
    type: 'list',
  })
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
  cronJobs: { api: api.getCronJobs, type: V2alpha1CronJob },
}

export const selector = async (
  resourceType: ResourceType,
  type: 'checkbox-plus' | 'list'
): Promise<{ selection: string[] | string }> => {
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

const displaySecrets = async () => {
  const secrets = (await (await selector('secrets', 'checkbox-plus'))
    .selection) as string[]
  const secretDetails = await Promise.all(
    secrets.map(async (secret: string) => {
      const secretResource = await getSecret(secret, RootStore.currentNamespace)
      return {
        [secretResource.metadata?.name!]: Object.keys(secretResource.data!).map(
          (key) => {
            return {
              [key]: Buffer.from(
                secretResource.data![key],
                'base64'
              ).toLocaleString(),
            }
          }
        ),
      }
    })
  )
  console.log(JSON.stringify(secretDetails, null, ' '))
  mainMenu()
}

const scaler = async () => {
  const deployments = (await (await selector('deployments', 'checkbox-plus'))
    .selection) as string[]

  await inquirer
    .prompt({
      type: 'number',
      name: 'scale',
    })
    .then(async (answer: { scale: number }) => {
      await Promise.all(
        deployments.map(async (deployment: string) => {
          await setScaleDeployment(
            deployment,
            RootStore.currentNamespace,
            answer.scale
          )
          console.log(`Scaled ${deployment} to ${answer.scale} pods`)
          return
        })
      )
    })

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
    if (answer.selection.includes('Log merger')) {
      console.log(
        `\n###########################\nLog Merger\n###########################`
      )
      selector('pods', 'checkbox-plus').then(async (answer: Selection) => {
        await logsConsole(answer)
      })
    } else if (answer.selection.includes('Log streamer')) {
      console.log(
        `\n###########################\nLog Streamer\n###########################`
      )
      selector('pods', 'checkbox-plus').then(async (answer: Selection) => {
        logsStream(answer)
      })
    } else if (answer.selection.includes('Live reload')) {
      liveReload()
    } else if (answer.selection.includes('Scaler')) {
      await scaler()
    } else if (answer.selection.includes('Pod statuses')) {
      await podStatuses(answer)
    } else if (answer.selection.includes('Display secrets')) {
      displaySecrets()
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
    } else if (answer.selection.includes('Delete cronjobs')) {
      deleteResourceResponse('cronJobs')
    } else if (answer.selection.includes('Delete jobs')) {
      deleteResourceResponse('jobs')
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
