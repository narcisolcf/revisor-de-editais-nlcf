/**
 * Design System
 * Sistema de design baseado no DSGov com componentes reutilizáveis
 */

// Export design tokens
export { colors } from './tokens/colors';
export { typography } from './tokens/typography';
export { spacing } from './tokens/spacing';
export { shadows } from './tokens/shadows';
export { radius } from './tokens/radius';
export { borders, elevation } from './tokens/borders';
export { tokens } from './tokens';

// Export migrated components
export { Button, buttonVariants } from './components/button';
export type { ButtonProps } from './components/button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/card';
export { Input } from './components/input';
export type { InputProps } from './components/input';
export { Label } from './components/label';
export { Progress } from './components/progress';

// Export utilities
export { cn } from './utils/cn';

// Export themes
export * from './themes';

// Export styles
export * from './styles';

// TODO: Implement additional components
// - Base components (modal, tooltip)
// - Layout components (header, sidebar, footer, container)
// - Form components (form-field, form-group, form-validation)
// - Data display components (table, list, badge, avatar)
// - Feedback components (alert, toast, loading)
// - Navigation components (breadcrumb, pagination, tabs, menu)