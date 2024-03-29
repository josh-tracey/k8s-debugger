import RootStore from '../store'
import * as inquirer from 'inquirer'
import { Confirm } from '../helpers/prompts'
import api from '../api'
import { searchInqurerItemArray } from '../mainMenu'
import * as querystring from 'querystring'
import { IOperation } from './interface'
import NamespaceSwitcher from './namespaceSwitcher'

const getTargetContext = async () => {
  const environments = api.getContexts()
  return (
    await inquirer.prompt<any>({
      // @ts-ignore
      type: 'autocomplete',
      name: 'environment',
      source: searchInqurerItemArray(
        environments.map((env) => ({
          name: querystring.unescape(env.name),
          value: {
            ...env,
            name: querystring.unescape(env.name),
          },
        }))
      ),
      message: 'Choose k8s context: ',
    })
  ).environment
}

const ContextSwitcher: IOperation = {
  label: 'Change Context',
  execute: async (clear?: boolean) => {
    const context = await getTargetContext()

    if (context.name.includes('prod')) {
      const answer = await inquirer.prompt<Confirm>({
        type: 'input',
        name: 'confirm',
        message:
          'You are about to use a production environment, are you sure you want to continue? yes/[no]: ',
      })

      if (['y', 'Y', 'Yes', 'yes'].includes(answer.confirm)) {
        await RootStore.setContext(context.name)
        await NamespaceSwitcher.execute(true)
      } else {
        await ContextSwitcher.execute()
      }
    } else {
      await RootStore.setContext(context.name)
      await NamespaceSwitcher.execute(true)
    }
    clear && console.clear()
  },
}

export default ContextSwitcher
