/**
 * Validadores compartilhados
 */

export * from './common';
export * from './domain';

// Re-exportações organizadas
export {
  // Validadores básicos
  idSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  titleSchema,
  descriptionSchema,
  urlSchema,
  
  // Validadores de documentos brasileiros
  cpfSchema,
  cnpjSchema,
  cepSchema,
  
  // Validadores de telefone e endereço
  phoneSchema,
  addressSchema,
  
  // Validadores de paginação e filtro
  paginationSchema,
  filterSchema,
  
  // Validadores de arquivo e data
  fileSchema,
  dateSchema,
  futureDateSchema,
  pastDateSchema,
  
  // Validadores de resultado
  resultSchema,
  paginatedResponseSchema
} from './common';

export {
  // Validadores de User
  userRoleSchema,
  userContextSchema,
  userStatusSchema,
  userProfileSchema,
  userPermissionsSchema,
  userPreferencesSchema,
  userCreateSchema,
  userUpdateSchema,
  
  // Validadores de Organization
  organizationTypeSchema,
  organizationSizeSchema,
  organizationStatusSchema,
  organizationContactSchema,
  organizationSettingsSchema,
  organizationMetricsSchema,
  organizationCreateSchema,
  organizationUpdateSchema,
  
  // Validadores de Document
  documentStatusSchema,
  documentMetadataSchema,
  documentCreateSchema,
  documentUpdateSchema,
  
  // Validadores de Analysis
  analysisTypeSchema,
  analysisStatusSchema,
  analysisPrioritySchema,
  analysisConfigSchema,
  analysisResultSchema,
  analysisCreateSchema,
  analysisUpdateSchema
} from './domain';