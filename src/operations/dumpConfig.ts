import { IOperation } from './interface'
import { getConfigMaps } from '../api/k8s/resources'
import RootStore from '../store/index'
import { getRepository } from 'typeorm'
import { Config } from '../database/entities/configs'

const DumpConfig: IOperation = {
  label: 'Dump Config',
  execute: async () => {
    const configRepo = getRepository(Config)
    const configMaps = (await getConfigMaps(RootStore.currentNamespace)).body
      .items
    await Promise.all(
      configMaps.map(async (configMap) => {
        if (configMap?.data) {
          await Promise.all(
            Object.keys(configMap.data).map(async (fileName) => {
              const configmapName = configMap.metadata?.name

              let config

              config = await configRepo.findOne({
                fileName,
                configMap: configmapName,
                namespace: RootStore.currentNamespace,
                context: RootStore.currentContext,
              })

              if (!config) {
                config = configRepo.create({
                  configMap: configmapName,
                  fileName,
                  data: configMap.data![fileName],
                  context: RootStore.currentContext,
                  namespace: RootStore.currentNamespace,
                  createdAt: configMap.metadata?.creationTimestamp?.toISOString(),
                  updatedAt: configMap.metadata?.creationTimestamp?.toISOString(),
                })
              } else {
                config = { ...config, data: configMap.data![fileName] }
              }
              configRepo.save(config)
            })
          )
        }
      })
    )
    console.clear()
    console.log('Dumped configs locally')
  },
}

export default DumpConfig
