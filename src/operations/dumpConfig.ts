import { IOperation } from './interface'

const DumpConfig: IOperation = {
  execute: async () => {
    console.clear()
  },
  label: 'Dump Config'
}

export default DumpConfig
