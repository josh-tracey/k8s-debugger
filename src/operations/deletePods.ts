import { IOperation } from './interface'
import { deleteResourceResponse } from './prompts'

const DeletePods: IOperation = {
  execute: async () => await deleteResourceResponse('pods'),
  label: 'Delete Pods',
}

export default DeletePods
