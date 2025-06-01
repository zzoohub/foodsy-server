import { Database } from "../connection";
import fs from "fs";
import path from "path";

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

class MigrationManager {
  private db = Database.getInstance();

  async initialize(): Promise<void> {
    // 마이그레이션 테이블 생성
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
  }

  async getExecutedMigrations(): Promise<string[]> {
    const result = await this.db.query<{ id: string }>("SELECT id FROM migrations ORDER BY id");
    return result.rows.map(row => row.id);
  }

  async getMigrationFiles(): Promise<Migration[]> {
    const migrationsDir = __dirname;
    const files = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith(".sql"))
      .sort();

    return files.map(filename => {
      const id = filename.replace(".sql", "");
      const sql = fs.readFileSync(path.join(migrationsDir, filename), "utf8");
      return { id, filename, sql };
    });
  }

  async runMigrations(): Promise<void> {
    await this.initialize();

    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();

    const pendingMigrations = migrationFiles.filter(migration => !executedMigrations.includes(migration.id));

    if (pendingMigrations.length === 0) {
      console.log("✅ No pending migrations");
      return;
    }

    console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`📄 Executing migration: ${migration.filename}`);

        await this.db.transaction(async client => {
          // 마이그레이션 실행
          await client.query(migration.sql);

          // 마이그레이션 기록
          await client.query("INSERT INTO migrations (id, filename) VALUES ($1, $2)", [
            migration.id,
            migration.filename,
          ]);
        });

        console.log(`✅ Migration completed: ${migration.filename}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migration.filename}`, error);
        throw error;
      }
    }

    console.log("🎉 All migrations completed successfully!");
  }

  async rollback(migrationId?: string): Promise<void> {
    // 간단한 롤백 구현 (실제 프로덕션에서는 더 복잡한 로직 필요)
    if (migrationId) {
      await this.db.query("DELETE FROM migrations WHERE id = $1", [migrationId]);
      console.log(`🔄 Rolled back migration: ${migrationId}`);
    } else {
      const lastMigration = await this.db.query<{ id: string }>(
        "SELECT id FROM migrations ORDER BY executed_at DESC LIMIT 1",
      );

      if (lastMigration.rows.length > 0) {
        const id = lastMigration.rows[0].id;
        await this.db.query("DELETE FROM migrations WHERE id = $1", [id]);
        console.log(`🔄 Rolled back last migration: ${id}`);
      } else {
        console.log("❌ No migrations to rollback");
      }
    }
  }
}

// CLI 실행
async function main() {
  const command = process.argv[2];
  const migrationManager = new MigrationManager();

  try {
    switch (command) {
      case "up":
        await migrationManager.runMigrations();
        break;
      case "down":
        const migrationId = process.argv[3];
        await migrationManager.rollback(migrationId);
        break;
      default:
        console.log("Usage: npm run migrate [up|down] [migration_id]");
        console.log("  up: Run pending migrations");
        console.log("  down: Rollback last migration (or specific migration)");
    }
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await Database.getInstance().disconnect();
  }
}

if (require.main === module) {
  main();
}

export { MigrationManager };
