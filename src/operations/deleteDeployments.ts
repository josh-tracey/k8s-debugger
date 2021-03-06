import { IOperation } from './interface'
import { deleteResourceResponse } from '../helpers/prompts'

const DeleteDeployment: IOperation = {
  execute: async () => await deleteResourceResponse('deployments'),
  label: 'Delete Deployment',
}

export default DeleteDeployment
