import i18n from '../i18n';

export const MSG = {
  // Erros de API (fallbacks quando o backend não retorna mensagem)
  AUTH_FAILED: () => i18n.t('errors.authFailed'),
  ACCESS_DENIED: () => i18n.t('errors.accessDenied'),
  ACCOUNT_BLOCKED: () => i18n.t('errors.accountBlocked'),
  REQUEST_ERROR: () => i18n.t('errors.requestError'),
  UNEXPECTED_ERROR: () => i18n.t('errors.unexpectedError'),
  CONNECTION_ERROR: () => i18n.t('errors.connectionError'),
  WRONG_CREDENTIALS: () => i18n.t('errors.wrongCredentials'),
  RESET_EMAIL_SENT: () => i18n.t('errors.resetEmailSent'),
  RESET_PASSWORD_SUCCESS: () => i18n.t('errors.resetPasswordSuccess'),

  // Erros de validação frontend
  FILL_ALL_FIELDS: () => i18n.t('errors.fillAllFields'),
  FILL_REQUIRED_FIELDS: () => i18n.t('errors.fillRequiredFields'),
  PASSWORD_MIN_LENGTH: () => i18n.t('errors.passwordMinLength'),
  PASSWORDS_DONT_MATCH: () => i18n.t('errors.passwordsDontMatch'),
  CNPJ_INVALID: () => i18n.t('errors.cnpjInvalid'),
  EMAIL_INVALID: () => i18n.t('errors.emailInvalid'),
  STATE_INVALID: () => i18n.t('errors.stateInvalid'),

  // Carregamento de dados
  LOAD_USERS_ERROR: () => i18n.t('errors.loadUsersError'),
  LOAD_DATA_ERROR: () => i18n.t('errors.loadDataError'),
  LOAD_SETTINGS_ERROR: () => i18n.t('errors.loadSettingsError'),
  LOAD_SUPER_ADMINS_ERROR: () => i18n.t('errors.loadSuperAdminsError'),

  // UI genérica
  GENERIC_ERROR: () => i18n.t('errors.genericError'),
  GENERIC_ERROR_RELOAD: () => i18n.t('errors.genericErrorReload'),
} as const;
