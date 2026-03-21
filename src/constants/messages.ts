export const MSG = {
  // Erros de API (fallbacks quando o backend não retorna mensagem)
  AUTH_FAILED: 'Falha na autenticação',
  ACCESS_DENIED: 'Acesso negado',
  ACCOUNT_BLOCKED: 'Conta bloqueada',
  REQUEST_ERROR: 'Erro na requisição',
  UNEXPECTED_ERROR: 'Erro inesperado',
  CONNECTION_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
  WRONG_CREDENTIALS: 'Email ou senha incorretos',
  RESET_EMAIL_SENT: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
  RESET_PASSWORD_SUCCESS: 'Senha redefinida com sucesso! Faça login com sua nova senha.',

  // Erros de validação frontend
  FILL_ALL_FIELDS: 'Preencha todos os campos',
  FILL_REQUIRED_FIELDS: 'Preencha os campos obrigatórios',
  PASSWORD_MIN_LENGTH: 'Senha deve ter no mínimo 8 caracteres',
  PASSWORDS_DONT_MATCH: 'As senhas não coincidem',
  CNPJ_INVALID: 'CNPJ inválido',
  EMAIL_INVALID: 'Email de contato inválido',
  STATE_INVALID: 'Estado inválido',

  // Carregamento de dados
  LOAD_USERS_ERROR: 'Erro ao carregar usuários',
  LOAD_DATA_ERROR: 'Erro ao carregar dados',
  LOAD_SETTINGS_ERROR: 'Erro ao carregar configurações',
  LOAD_SUPER_ADMINS_ERROR: 'Erro ao carregar super admins',

  // UI genérica
  GENERIC_ERROR: 'Algo deu errado',
  GENERIC_ERROR_RELOAD: 'Ocorreu um erro inesperado. Tente recarregar a página.',
} as const;
