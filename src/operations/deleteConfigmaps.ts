import { IOperation } from './interface'
import { deleteResourceResponse } from '../helpers/prompts'

const DeleteConfigmaps: IOperation = {
  execute: async () => await deleteResourceResponse('configMaps'),
  label: 'Delete Configmaps',
}

export default DeleteConfigmaps
