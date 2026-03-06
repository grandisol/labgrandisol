/**
 * Code Metrics - LabGrandisol
 * Métricas avançadas de qualidade e performance de código
 */

import Logger from './logger.js';
import { CodeMetrics, analyzeCodeComplexity } from './codeAnalyzer.js';

const logger = new Logger('CodeMetrics');

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  responseTime: number;
}

export interface QualityMetrics {
  codeCoverage: number;
  testPassRate: number;
  bugDensity: number;
  technicalDebt: number;
  codeDuplication: number;
}

export interface SecurityMetrics {
  vulnerabilities: number;
  securityScore: number;
  complianceRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface DevelopmentMetrics {
  commitsPerDay: number;
  linesOfCodePerDay: number;
  featureDeliveryRate: number;
  bugFixRate: number;
  teamVelocity: number;
}

/**
 * Calcula métricas de performance avançadas
 */
export function calculatePerformanceMetrics(
  codeMetrics: CodeMetrics,
  executionTime: number = 0
): PerformanceMetrics {
  try {
    // Métricas baseadas na complexidade do código
    const memoryUsage = calculateMemoryUsage(codeMetrics);
    const cpuUsage = calculateCpuUsage(codeMetrics);
    const throughput = calculateThroughput(codeMetrics);
    const responseTime = calculateResponseTime(codeMetrics, executionTime);

    const metrics: PerformanceMetrics = {
      executionTime,
      memoryUsage,
      cpuUsage,
      throughput,
      responseTime
    };

    logger.info(`Métricas de performance calculadas: ${codeMetrics.language}`);

    return metrics;
  } catch (error) {
    logger.error('Erro ao calcular métricas de performance:', error as Error);
    throw new Error('Falha no cálculo de métricas de performance');
  }
}

/**
 * Calcula métricas de qualidade avançadas
 */
export function calculateQualityMetrics(
  codeMetrics: CodeMetrics,
  testResults: { passed: number; failed: number; total: number }
): QualityMetrics {
  try {
    const codeCoverage = calculateCodeCoverage(codeMetrics, testResults);
    const testPassRate = calculateTestPassRate(testResults);
    const bugDensity = calculateBugDensity(codeMetrics);
    const technicalDebt = calculateTechnicalDebt(codeMetrics);
    const codeDuplication = calculateCodeDuplication(codeMetrics);

    const metrics: QualityMetrics = {
      codeCoverage,
      testPassRate,
      bugDensity,
      technicalDebt,
      codeDuplication
    };

    logger.info(`Métricas de qualidade calculadas: ${codeMetrics.language}`);

    return metrics;
  } catch (error) {
    logger.error('Erro ao calcular métricas de qualidade:', error as Error);
    throw new Error('Falha no cálculo de métricas de qualidade');
  }
}

/**
 * Calcula métricas de segurança avançadas
 */
export function calculateSecurityMetrics(
  codeMetrics: CodeMetrics,
  securityScanResults: { vulnerabilities: number; critical: number; high: number; medium: number; low: number }
): SecurityMetrics {
  try {
    const vulnerabilities = securityScanResults.vulnerabilities;
    const securityScore = calculateSecurityScore(codeMetrics, securityScanResults);
    const complianceRate = calculateComplianceRate(codeMetrics);
    const riskLevel = calculateRiskLevel(securityScanResults);

    const metrics: SecurityMetrics = {
      vulnerabilities,
      securityScore,
      complianceRate,
      riskLevel
    };

    logger.info(`Métricas de segurança calculadas: ${codeMetrics.language}`);

    return metrics;
  } catch (error) {
    logger.error('Erro ao calcular métricas de segurança:', error as Error);
    throw new Error('Falha no cálculo de métricas de segurança');
  }
}

/**
 * Calcula métricas de desenvolvimento avançadas
 */
export function calculateDevelopmentMetrics(
  timePeriod: { start: Date; end: Date },
  developmentData: {
    commits: number;
    linesAdded: number;
    linesRemoved: number;
    featuresCompleted: number;
    bugsFixed: number;
  }
): DevelopmentMetrics {
  try {
    const days = Math.max(1, Math.ceil((timePeriod.end.getTime() - timePeriod.start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const commitsPerDay = developmentData.commits / days;
    const linesOfCodePerDay = (developmentData.linesAdded - developmentData.linesRemoved) / days;
    const featureDeliveryRate = developmentData.featuresCompleted / days;
    const bugFixRate = developmentData.bugsFixed / days;
    const teamVelocity = calculateTeamVelocity(developmentData);

    const metrics: DevelopmentMetrics = {
      commitsPerDay,
      linesOfCodePerDay,
      featureDeliveryRate,
      bugFixRate,
      teamVelocity
    };

    logger.info(`Métricas de desenvolvimento calculadas: ${days} dias`);

    return metrics;
  } catch (error) {
    logger.error('Erro ao calcular métricas de desenvolvimento:', error as Error);
    throw new Error('Falha no cálculo de métricas de desenvolvimento');
  }
}

/**
 * Calcula uso de memória baseado na complexidade
 */
function calculateMemoryUsage(codeMetrics: CodeMetrics): number {
  // Fórmula simplificada baseada na complexidade e número de funções
  const baseMemory = 10; // MB base
  const complexityFactor = codeMetrics.complexity * 0.5;
  const functionsFactor = codeMetrics.functions * 0.1;
  const linesFactor = codeMetrics.linesOfCode * 0.01;
  
  return Math.round(baseMemory + complexityFactor + functionsFactor + linesFactor);
}

/**
 * Calcula uso de CPU baseado na complexidade ciclomática
 */
function calculateCpuUsage(codeMetrics: CodeMetrics): number {
  // Fórmula simplificada baseada na complexidade ciclomática
  const baseCpu = 5; // % base
  const cyclomaticFactor = codeMetrics.cyclomaticComplexity * 0.2;
  const complexityFactor = codeMetrics.complexity * 0.05;
  
  return Math.round(baseCpu + cyclomaticFactor + complexityFactor);
}

/**
 * Calcula throughput baseado na manutenibilidade
 */
function calculateThroughput(codeMetrics: CodeMetrics): number {
  // Fórmula simplificada: maior manutenibilidade = maior throughput
  const baseThroughput = 100; // requests/second base
  const maintainabilityFactor = codeMetrics.maintainabilityIndex / 10;
  const complexityFactor = 100 / (codeMetrics.complexity + 1);
  
  return Math.round(baseThroughput + maintainabilityFactor + complexityFactor);
}

/**
 * Calcula tempo de resposta baseado na complexidade
 */
function calculateResponseTime(codeMetrics: CodeMetrics, executionTime: number): number {
  // Fórmula simplificada: maior complexidade = maior tempo de resposta
  const baseResponseTime = 100; // ms base
  const complexityFactor = codeMetrics.complexity * 10;
  const cyclomaticFactor = codeMetrics.cyclomaticComplexity * 5;
  
  return Math.round(baseResponseTime + complexityFactor + cyclomaticFactor + executionTime);
}

/**
 * Calcula cobertura de código
 */
function calculateCodeCoverage(codeMetrics: CodeMetrics, testResults: any): number {
  // Baseado no número de funções e resultados dos testes
  const totalFunctions = codeMetrics.functions;
  const coveredFunctions = testResults.passed;
  
  if (totalFunctions === 0) return 100;
  
  return Math.round((coveredFunctions / totalFunctions) * 100);
}

/**
 * Calcula taxa de passagem de testes
 */
function calculateTestPassRate(testResults: any): number {
  if (testResults.total === 0) return 100;
  
  return Math.round((testResults.passed / testResults.total) * 100);
}

/**
 * Calcula densidade de bugs
 */
function calculateBugDensity(codeMetrics: CodeMetrics): number {
  // Bugs por mil linhas de código
  const linesPerK = codeMetrics.linesOfCode / 1000;
  if (linesPerK === 0) return 0;
  
  return Math.round(codeMetrics.codeSmells / linesPerK);
}

/**
 * Calcula dívida técnica
 */
function calculateTechnicalDebt(codeMetrics: CodeMetrics): number {
  // Baseado na complexidade, code smells e vulnerabilidades
  const complexityDebt = codeMetrics.complexity * 2;
  const smellDebt = codeMetrics.codeSmells * 5;
  const vulnerabilityDebt = codeMetrics.vulnerabilities * 10;
  
  return Math.round(complexityDebt + smellDebt + vulnerabilityDebt);
}

/**
 * Calcula duplicação de código
 */
function calculateCodeDuplication(codeMetrics: CodeMetrics): number {
  // Baseado no número de funções e complexidade
  const duplicationScore = (codeMetrics.functions * 0.1) + (codeMetrics.complexity * 0.05);
  
  return Math.round(Math.min(100, duplicationScore));
}

/**
 * Calcula pontuação de segurança
 */
function calculateSecurityScore(codeMetrics: CodeMetrics, securityResults: any): number {
  // Baseado no número de vulnerabilidades
  const baseScore = 100;
  const vulnerabilityPenalty = securityResults.vulnerabilities * 5;
  const criticalPenalty = securityResults.critical * 10;
  const highPenalty = securityResults.high * 5;
  
  const score = baseScore - vulnerabilityPenalty - criticalPenalty - highPenalty;
  
  return Math.max(0, Math.round(score));
}

/**
 * Calcula taxa de compliance
 */
function calculateComplianceRate(codeMetrics: CodeMetrics): number {
  // Baseado na manutenibilidade e complexidade
  const maintainabilityFactor = codeMetrics.maintainabilityIndex;
  const complexityFactor = Math.max(0, 100 - (codeMetrics.complexity * 2));
  
  return Math.round((maintainabilityFactor + complexityFactor) / 2);
}

/**
 * Calcula nível de risco
 */
function calculateRiskLevel(securityResults: any): 'low' | 'medium' | 'high' | 'critical' {
  const criticalCount = securityResults.critical || 0;
  const highCount = securityResults.high || 0;
  const mediumCount = securityResults.medium || 0;
  
  if (criticalCount > 0) return 'critical';
  if (highCount > 3) return 'high';
  if (highCount > 0 || mediumCount > 5) return 'medium';
  
  return 'low';
}

/**
 * Calcula velocidade da equipe
 */
function calculateTeamVelocity(developmentData: any): number {
  // Baseado em features completadas e bugs corrigidos
  const featureWeight = 10;
  const bugWeight = 2;
  
  return (developmentData.featuresCompleted * featureWeight) + (developmentData.bugsFixed * bugWeight);
}

/**
 * Gera relatório consolidado de métricas
 */
export function generateMetricsReport(
  codeMetrics: CodeMetrics,
  performanceMetrics: PerformanceMetrics,
  qualityMetrics: QualityMetrics,
  securityMetrics: SecurityMetrics,
  developmentMetrics: DevelopmentMetrics
): any {
  return {
    timestamp: new Date().toISOString(),
    code: codeMetrics,
    performance: performanceMetrics,
    quality: qualityMetrics,
    security: securityMetrics,
    development: developmentMetrics,
    summary: {
      overallScore: calculateOverallScore(qualityMetrics, securityMetrics),
      recommendations: generateMetricsRecommendations(qualityMetrics, securityMetrics, performanceMetrics)
    }
  };
}

/**
 * Calcula pontuação geral
 */
function calculateOverallScore(qualityMetrics: QualityMetrics, securityMetrics: SecurityMetrics): number {
  const qualityWeight = 0.4;
  const securityWeight = 0.4;
  const coverageWeight = 0.2;
  
  const qualityScore = qualityMetrics.testPassRate;
  const securityScore = securityMetrics.securityScore;
  const coverageScore = qualityMetrics.codeCoverage;
  
  return Math.round((qualityScore * qualityWeight) + (securityScore * securityWeight) + (coverageScore * coverageWeight));
}

/**
 * Gera recomendações baseadas nas métricas
 */
function generateMetricsRecommendations(
  qualityMetrics: QualityMetrics,
  securityMetrics: SecurityMetrics,
  performanceMetrics: PerformanceMetrics
): string[] {
  const recommendations: string[] = [];
  
  if (qualityMetrics.codeCoverage < 80) {
    recommendations.push('Aumentar cobertura de testes para pelo menos 80%');
  }
  
  if (qualityMetrics.technicalDebt > 50) {
    recommendations.push('Reduzir dívida técnica priorizando refatoração');
  }
  
  if (securityMetrics.vulnerabilities > 0) {
    recommendations.push(`Corrigir ${securityMetrics.vulnerabilities} vulnerabilidades de segurança`);
  }
  
  if (securityMetrics.riskLevel === 'high' || securityMetrics.riskLevel === 'critical') {
    recommendations.push('Priorizar correções de segurança de alto risco');
  }
  
  if (performanceMetrics.responseTime > 1000) {
    recommendations.push('Otimizar tempo de resposta (atualmente > 1s)');
  }
  
  if (performanceMetrics.memoryUsage > 500) {
    recommendations.push('Reduzir consumo de memória');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Métricas em bom estado! Continue monitorando.');
  }
  
  return recommendations;
}

export default {
  calculatePerformanceMetrics,
  calculateQualityMetrics,
  calculateSecurityMetrics,
  calculateDevelopmentMetrics,
  generateMetricsReport
};