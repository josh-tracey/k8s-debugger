import RootStore from '../store'
import { selector } from '../helpers/prompts'
import { IOperation } from './interface'

const NamespaceSwitcher: IOperation = {
  execute: async (clear?: boolean) => {
    const answer = await selector('namespaces', 'autocomplete')
    RootStore.setNamespace(answer.selection as string)
    clear && console.clear()
  },
  label: 'Change Namespace',
}

export default NamespaceSwitcher
