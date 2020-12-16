import * as inquirer from 'inquirer'
import RootStore from './store'
import LogStreamer from './operations/logStreamer'
import DeployConfig from './operations/deployConfig'
import DumpConfig from './operations/dumpConfig'
import DisplaySecrets from './operations/displaySecrets'
import { isOperation } from './operations/helpers'
import DeletePods from './operations/deletePods'
import Scaler from './operations/deploymentScaler'
import DisplayConfigmaps from './operations/displayConfigmaps'
import { IOperation } from './operations/interface'
import { experimentalEnabled } from './config'
import PodStatuses from './operations/podStatues'
import LogMerger from './operations/logMerger'
import NamespaceSwitcher from './operations/namespaceSwitcher'
import ContextSwitcher from './operations/contextSwitch'
import LiveReload from './operations/liveReload'

inquirer.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus'))

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

export interface Selection {
  selection: string | string[]
}

export const searchInqurerItemArray = (entries: Array<{ name: string }>) => (
  _: any,
  input: string
) =>
  Promise.resolve(
    entries.filter((x) =>
      x.name.toLowerCase().includes((input || '').toLowerCase())
    )
  )

export const mainMenu = async () => {
  console.log(
    `-----------${RootStore.currentContext}-[${RootStore.currentNamespace}]-------------`
  )

  const options = [
    ...(experimentalEnabled
      ? [
          new inquirer.Separator('--Experimental--'),
          LiveReload,
        ]
      : []),
    new inquirer.Separator('--Configmap Management--'),
    DeployConfig,
    DumpConfig,
    new inquirer.Separator('--Logging--'),
    LogMerger,
    LogStreamer,
    new inquirer.Separator('--Resource Management--'),
    Scaler,
    DeletePods,
    new inquirer.Separator('--Displays--'),
    DisplayConfigmaps,
    PodStatuses,
    DisplaySecrets,
    new inquirer.Separator('--Other--'),
    ContextSwitcher,
    NamespaceSwitcher,
    {
      label: 'Exit',
      execute: () => {
        console.clear()
        process.exit(0)
      },
    },
  ]
  const selection = await inquirer.prompt<Selection>({
    name: 'selection',
    pageSize: 25,
    choices: options.map((option) =>
      isOperation(option) ? option.label : option
    ),
    // @ts-ignore
    type: 'autocomplete',
    source: function (_: any, input: string) {
      input = (input || '').toLocaleLowerCase()

      if (input) {
        return new Promise(function (resolve) {
          let data = options.filter(
            (item: any) =>
              isOperation(item) &&
              item.label.toLocaleLowerCase().includes(input)
          )
          resolve(
            data.map((option) => (isOperation(option) ? option.label : option))
          )
        })
      }
      return options.map((option) =>
        isOperation(option) ? option.label : option
      )
    },
  })

  try {
    const choice = (options as IOperation[]).find(
      (o) => o.label === selection.selection
    )
    await choice?.execute()
  } catch (error) {
    console.log(error)
  }
  await mainMenu()
}
