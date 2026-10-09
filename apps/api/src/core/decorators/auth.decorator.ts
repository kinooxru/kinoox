/**
 * Декоратор авторизации.
 *
 * В файле нет никакого кода — декораторы объявляются в middleware,
 * этот модуль служит точкой входа для единообразных импортов.
 */
export {
  authGuard,
  optionalAuth,
  adminGuard,
  registerAuthDecorators,
} from '../middleware/auth.middleware.js'
