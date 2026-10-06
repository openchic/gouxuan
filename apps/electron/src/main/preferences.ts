import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'
import { isThemePreference } from '../shared/ipc'
import type { ThemePreference } from '../shared/ipc'

type Preferences = {
  getTheme: () => ThemePreference
  setTheme: (mode: ThemePreference) => void
  close: () => void
}

export const createPreferences = (userData: string): Preferences => {
  const database = new DatabaseSync(join(userData, 'preferences.sqlite'))
  database.exec(
    `CREATE TABLE IF NOT EXISTS local_preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL); PRAGMA user_version = 1;`
  )
  const read = database.prepare(
    'SELECT value FROM local_preferences WHERE key = ?'
  )
  const write = database.prepare(
    'INSERT INTO local_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  )
  const key = 'preview.theme'
  return {
    getTheme: (): ThemePreference => {
      const value = read.get(key)?.value
      return isThemePreference(value) ? value : 'system'
    },
    setTheme: (mode: ThemePreference): void => {
      write.run(key, mode)
    },
    close: (): void => database.close(),
  }
}
