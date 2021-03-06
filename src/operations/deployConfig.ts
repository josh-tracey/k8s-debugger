import { IOperation } from './interface'
import { getRepository } from 'typeorm'
import { Config } from '../database/entities/configs'
import RootStore from '../store/index'
import * as inquirer from 'inquirer'
import {
  configMapExists,
  updateConfigmap,
  createConfigmap,
} from '../api/k8s/resources'

const DeployConfig: IOperation = {
  label: 'Deploy Config',
  execute: async () => {
    const configRepo = getRepository(Config)

    const configs = await configRepo.find({
      namespace: RootStore.currentNamespace,
      context: RootStore.currentContext,
    })

    if (!!configs?.length) {
      const choice = await inquirer.prompt<{ configs: string[] }>({
        name: 'configs',
        type: 'checkbox',
        choices: Array.from(new Set(configs.map((config) => config.configMap))),
      })

      const deployConfigs = configs.filter((config) =>
        choice.configs.includes(config.configMap)
      )

      await Promise.all(
        choice.configs.map(async (config) => {
          const data = deployConfigs.reduce((acc, deployConfig) => {
            if (config === deployConfig.configMap) {
              acc = { ...acc, [deployConfig.fileName]: deployConfig.data }
            }
            return acc
          }, {})
          if (await configMapExists(config, RootStore.currentNamespace)) {
            await updateConfigmap(config, RootStore.currentNamespace, data)
          } else {
            await createConfigmap(config, RootStore.currentNamespace, data)
          }
        })
      )
    }

    console.clear()
  },
}

export default DeployConfig
