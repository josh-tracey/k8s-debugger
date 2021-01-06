
import { getConfigmap } from '../api/k8s/resources'
import RootStore from '../store'
import { IOperation } from './interface'
import { selector } from '../helpers/prompts';

const DisplayConfigmaps: IOperation = {
  execute: async () => {
    const configMaps = (await selector('configMaps', 'checkbox-plus'))
      .selection as string[]
    const configMapDetails = await Promise.all(
      configMaps.map(async (configMap: string) => {
        const configMapResource = await getConfigmap(
          configMap,
          RootStore.currentNamespace
        )
        return {
          [configMapResource.metadata?.name!]: Object.keys(
            configMapResource.data!
          ).map((key) => {
            return {
              [key]: configMapResource.data![key],
            }
          }),
        }
      })
    )
    console.log(JSON.stringify(configMapDetails, null, ' '))
  },
  label: 'Display Configmaps',
}

export default DisplayConfigmaps
