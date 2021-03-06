import {MigrationInterface, QueryRunner} from "typeorm";

export class init1607925515576 implements MigrationInterface {
    name = 'init1607925515576'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "configs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "configmap" text NOT NULL, "file_name" text NOT NULL, "data" text NOT NULL, "updated_at" text NOT NULL, "created_at" text NOT NULL, "namespace" text NOT NULL, "context" text NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "pod_name" text NOT NULL, "data" text NOT NULL, "created_at" text NOT NULL, "namespace" text NOT NULL, "context" text NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "logs"`);
        await queryRunner.query(`DROP TABLE "configs"`);
    }

}
