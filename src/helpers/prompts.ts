import * as inquirer from 'inquirer'
import RootStore from '../store'
import { ResourceType } from '../types'
import { Selection } from '../mainMenu'
import { defaultPageSize } from '../config'
import api from '../api'
import { mapResource } from './index'

export interface Confirm {
  confirm: string
}

export const prodConfirm = async () => {
  return inquirer.prompt<Confirm>({
    type: 'confirm',
    name: 'confirm',
    default: false,
    message:
      'Warning! \n\n This is a production environment. Do you wish to continue? y/[n]: ',
  })
}

export const selector = async (
  resourceType: ResourceType,
  type: 'checkbox-plus' | 'autocomplete'
): Promise<{ selection: string[] | string }> => {
  const response = (
    await mapResource[resourceType].api(RootStore.currentNamespace)
  ).body

  const resources = response.items.map((item: any) => ({
    name: item.metadata.name,
    value: item.metadata.name,
  }))

  return inquirer.prompt([
    {
      name: 'selection',
      pageSize: defaultPageSize,
      searchable: true,
      highlight: true,
      choices: resources.map((item: { name: string; value: string }) => {
        return item.name || ''
      }),
      source: function (_: any, input: string) {
        input = input || ''

        return new Promise(function (resolve) {
          let data = resources.filter((item: any) => item.name.includes(input))

          resolve(data)
        })
      },
      type: type,
    },
  ])
}

export const deleteResources = async (
  resourceType: ResourceType,
  resources: string[]
) => {
  console.clear()
  let confirmed = true
  if (RootStore.currentContext?.match(/prod/)) {
    console.log('To be deleted: ', resources)
    await prodConfirm().then((answer: Confirm) => {
      if (!['y', 'Y', 'Yes', 'yes'].includes(answer.confirm)) confirmed = false
    })
  }

  if (confirmed) {
    resources.forEach((name: string) => {
      api.deleteResource(resourceType, RootStore.currentNamespace, name)
    })
    console.log('Deleted: ', resources)
  }
}

export const deleteResourceResponse = async (resourceType: ResourceType) => {
  console.log(
    `\n###########################\nDelete ${resourceType}\n###########################`
  )
  await selector(resourceType, 'checkbox-plus').then(
    async (answer: Selection) => {
      await deleteResources(resourceType, answer.selection as string[])
    }
  )
}
