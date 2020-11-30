import { IOperation } from './interface'

const DeployConfig: IOperation = {
  execute: async () => {
    console.clear()
  },
  label: 'Deploy Config',
}

export default DeployConfig
