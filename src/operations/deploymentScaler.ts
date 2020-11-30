import { IOperation } from './interface'
import * as inquirer from 'inquirer'
import RootStore from '../store'
import { setScaleDeployment } from '../api/k8s/resources'
import { selector } from './prompts'

const Scaler: IOperation = {
  execute: async () => {
    const deployments = (await selector('deployments', 'checkbox-plus'))
      .selection as string[]

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
  },
  label: 'Scaler',
}

export default Scaler
