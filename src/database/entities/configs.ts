import { Entity, Column } from 'typeorm'
import { PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'configs' })
export class Config {
  @PrimaryGeneratedColumn('increment') id!: number

  @Column({ type: 'text', name: 'configmap' }) configMap: string

  @Column({ type: 'text', name: 'file_name' }) fileName: string

  @Column({ type: 'text', name: 'data' }) data: string

  @Column({ type: 'text', name: 'updated_at' }) updatedAt: string

  @Column({ type: 'text', name: 'created_at' }) createdAt: string

  @Column({ type: 'text', name: 'namespace' }) namespace: string

  @Column({ type: 'text', name: 'context' }) context: string
}
