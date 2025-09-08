/**
 * Configuração CORS
 * LicitaReview - Sistema de Análise de Editais
 */
import { CorsOptions } from 'cors';
declare const developmentCorsConfig: CorsOptions;
declare const productionCorsConfig: CorsOptions;
declare const testCorsConfig: CorsOptions;
export declare const corsConfig: CorsOptions;
export { developmentCorsConfig, productionCorsConfig, testCorsConfig };
