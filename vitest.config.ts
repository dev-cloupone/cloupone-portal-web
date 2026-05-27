import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../vitest.setup.ts'],
    root: './src',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: '../coverage',
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
      },
      include: [
        // Utils (4 testes)
        'utils/formatters.ts',
        'utils/validate-cnpj.ts',
        'utils/get-home-route.ts',
        'utils/timesheet-export.ts',
        // Stores (4 testes)
        'stores/auth.store.ts',
        'stores/toast.store.ts',
        'stores/theme.store.ts',
        'stores/sidebar.store.ts',
        // Hooks (8 testes)
        'hooks/use-auth.ts',
        'hooks/use-pagination.ts',
        'hooks/use-month-timesheet.ts',
        'hooks/use-monthly-approvals.ts',
        'hooks/use-project-phases.ts',
        'hooks/use-timesheet-list.ts',
        'hooks/use-dashboard.ts',
        'hooks/use-nav-items.tsx',
        // Components (2 testes)
        'components/protected-route.tsx',
        'components/role-guard.tsx',
      ],
      exclude: [
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/expense**',
        '**/month-expenses**',
      ],
    },
  },
})
