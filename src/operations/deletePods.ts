import { IOperation } from './interface'
import { deleteResourceResponse } from '../helpers/prompts'

const DeletePods: IOperation = {
  execute: async () => await deleteResourceResponse('pods'),
  label: 'Delete Pods',
}

export default DeletePods
