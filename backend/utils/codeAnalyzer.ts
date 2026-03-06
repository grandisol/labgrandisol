/**
 * Code Analyzer - LabGrandisol
 * Análise de complexidade e qualidade de código multi-linguagem
 */

import Logger from './logger.js';

const logger = new Logger('CodeAnalyzer');

export interface CodeMetrics {
  language: string;
  linesOfCode: number;
  functions: number;
  complexity: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  testCoverage: number;
  codeSmells: number;
  vulnerabilities: number;
  dependencies: string[];
  lastAnalysis: Date;
}

export interface LanguageSupport {
  name: string;
  extensions: string[];
  keywords: string[];
  commentPatterns: RegExp[];
  functionPatterns: RegExp[];
  classPatterns: RegExp[];
}

// Configuração de suporte multi-linguagem
const LANGUAGE_CONFIGS: Record<string, LanguageSupport> = {
  html: {
    name: 'HTML',
    extensions: ['.html', '.htm'],
    keywords: ['<!DOCTYPE', '<html>', '<head>', '<body>', '<div>', '<span>', '<p>', '<a>'],
    commentPatterns: [/<!--[\s\S]*?-->/g],
    functionPatterns: [],
    classPatterns: []
  },
  css: {
    name: 'CSS',
    extensions: ['.css', '.scss', '.sass', '.less'],
    keywords: ['{', '}', ':', ';', '@media', '@import', '@keyframes'],
    commentPatterns: [/\/\*[\s\S]*?\*\//g],
    functionPatterns: [],
    classPatterns: []
  },
  javascript: {
    name: 'JavaScript',
    extensions: ['.js', '.jsx', '.mjs'],
    keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'class', 'import', 'export'],
    commentPatterns: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
    functionPatterns: [
      /function\s+\w+/g,
      /\w+\s*[:=]\s*function/g,
      /\w+\s*[:=]\s*\([^)]*\)\s*=>/g
    ],
    classPatterns: [/class\s+\w+/g]
  },
  python: {
    name: 'Python',
    extensions: ['.py', '.pyw'],
    keywords: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'return'],
    commentPatterns: [/#.*$/gm],
    functionPatterns: [/def\s+\w+/g],
    classPatterns: [/class\s+\w+/g]
  },
  java: {
    name: 'Java',
    extensions: ['.java', '.jsp'],
    keywords: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'import', 'package'],
    commentPatterns: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
    functionPatterns: [/public\s+\w+\s+\w+/g, /private\s+\w+\s+\w+/g, /protected\s+\w+\s+\w+/g],
    classPatterns: [/public\s+class\s+\w+/g, /class\s+\w+/g]
  },
  php: {
    name: 'PHP',
    extensions: ['.php', '.phtml'],
    keywords: ['<?php', 'function', 'class', 'public', 'private', 'protected', 'if', 'else', 'for', 'while', 'return'],
    commentPatterns: [/\/\/.*$/gm, /#.*$/gm, /\/\*[\s\S]*?\*\//g],
    functionPatterns: [/function\s+\w+/g],
    classPatterns: [/class\s+\w+/g]
  },
  cpp: {
    name: 'C++',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
    keywords: ['#include', '#define', 'class', 'struct', 'public', 'private', 'protected', 'template', 'namespace'],
    commentPatterns: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
    functionPatterns: [/\w+\s+\w+\s*\([^)]*\)\s*{/g],
    classPatterns: [/class\s+\w+/g, /struct\s+\w+/g]
  }
};

/**
 * Analisa a complexidade de código para múltiplas linguagens
 */
export function analyzeCodeComplexity(
  code: string, 
  language: string = 'javascript'
): CodeMetrics {
  try {
    const config = LANGUAGE_CONFIGS[language.toLowerCase()] || LANGUAGE_CONFIGS.javascript;
    
    // Contagem de linhas
    const lines = code.split('\n');
    const linesOfCode = lines.filter(line => line.trim().length > 0).length;
    
    // Remover comentários para análise de código real
    let cleanCode = code;
    config.commentPatterns.forEach(pattern => {
      cleanCode = cleanCode.replace(pattern, '');
    });
    
    // Contagem de funções
    const functions = countFunctions(cleanCode, config.functionPatterns);
    
    // Contagem de classes
    const classes = countClasses(cleanCode, config.classPatterns);
    
    // Complexidade ciclomática (simplificada)
    const cyclomaticComplexity = calculateCyclomaticComplexity(cleanCode);
    
    // Complexidade total
    const complexity = calculateTotalComplexity(functions, cyclomaticComplexity, linesOfCode);
    
    // Índice de manutenibilidade (simplificado)
    const maintainabilityIndex = calculateMaintainabilityIndex(linesOfCode, cyclomaticComplexity, functions);
    
    // Cobertura de testes (mock)
    const testCoverage = Math.floor(Math.random() * 40) + 60; // 60-100%
    
    // Code smells (mock)
    const codeSmells = Math.floor(Math.random() * 10);
    
    // Vulnerabilidades (mock)
    const vulnerabilities = Math.floor(Math.random() * 5);
    
    // Dependências (mock)
    const dependencies = getMockDependencies(language);
    
    const metrics: CodeMetrics = {
      language: config.name,
      linesOfCode,
      functions: functions + classes,
      complexity,
      cyclomaticComplexity,
      maintainabilityIndex,
      testCoverage,
      codeSmells,
      vulnerabilities,
      dependencies,
      lastAnalysis: new Date()
    };

    logger.info(`Análise de código concluída para ${config.name}: ${linesOfCode} linhas, ${functions + classes} funções/classes`);

    return metrics;
  } catch (error) {
    logger.error('Erro ao analisar complexidade de código:', error as Error);
    throw new Error('Falha na análise de código');
  }
}

/**
 * Conta funções baseado em padrões regex
 */
function countFunctions(code: string, patterns: RegExp[]): number {
  let count = 0;
  patterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      count += matches.length;
    }
  });
  return count;
}

/**
 * Conta classes baseado em padrões regex
 */
function countClasses(code: string, patterns: RegExp[]): number {
  let count = 0;
  patterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      count += matches.length;
    }
  });
  return count;
}

/**
 * Calcula complexidade ciclomática simplificada
 */
function calculateCyclomaticComplexity(code: string): number {
  const controlFlowKeywords = [
    'if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'
  ];
  
  let complexity = 1; // Base complexity
  
  controlFlowKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = code.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  });
  
  return complexity;
}

/**
 * Calcula complexidade total
 */
function calculateTotalComplexity(functions: number, cyclomaticComplexity: number, linesOfCode: number): number {
  // Fórmula simplificada de complexidade
  const functionComplexity = functions * 2;
  const cyclomaticWeight = cyclomaticComplexity * 1.5;
  const sizeComplexity = linesOfCode / 50;
  
  return Math.round(functionComplexity + cyclomaticWeight + sizeComplexity);
}

/**
 * Calcula índice de manutenibilidade simplificado
 */
function calculateMaintainabilityIndex(linesOfCode: number, cyclomaticComplexity: number, functions: number): number {
  // Fórmula simplificada baseada no Maintainability Index
  const halsteadVolume = linesOfCode * 10; // Mock
  const mi = 171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(functions + 1);
  
  return Math.max(0, Math.min(100, Math.round(mi)));
}

/**
 * Obtém dependências mock para cada linguagem
 */
function getMockDependencies(language: string): string[] {
  const dependencyMap: Record<string, string[]> = {
    javascript: ['react', 'typescript', 'node', 'express', 'lodash'],
    python: ['django', 'flask', 'requests', 'numpy', 'pandas'],
    java: ['spring', 'hibernate', 'junit', 'maven', 'gradle'],
    php: ['laravel', 'symfony', 'composer', 'guzzle', 'monolog'],
    cpp: ['boost', 'stl', 'opencv', 'qt', 'boost-asio'],
    html: ['bootstrap', 'jquery', 'react', 'vue', 'angular'],
    css: ['sass', 'less', 'postcss', 'tailwind', 'bootstrap']
  };
  
  return dependencyMap[language.toLowerCase()] || ['unknown'];
}

/**
 * Analisa múltiplos arquivos de código
 */
export function analyzeMultipleFiles(files: Array<{ content: string; language: string; filename: string }>): CodeMetrics[] {
  return files.map(file => {
    try {
      return analyzeCodeComplexity(file.content, file.language);
    } catch (error) {
      logger.error(`Erro ao analisar arquivo ${file.filename}:`, error as Error);
      return {
        language: file.language,
        linesOfCode: 0,
        functions: 0,
        complexity: 0,
        cyclomaticComplexity: 0,
        maintainabilityIndex: 0,
        testCoverage: 0,
        codeSmells: 0,
        vulnerabilities: 0,
        dependencies: [],
        lastAnalysis: new Date()
      };
    }
  });
}

/**
 * Gera relatório consolidado de análise de código
 */
export function generateCodeAnalysisReport(metrics: CodeMetrics[]): any {
  const totalLines = metrics.reduce((sum, m) => sum + m.linesOfCode, 0);
  const totalFunctions = metrics.reduce((sum, m) => sum + m.functions, 0);
  const avgComplexity = metrics.reduce((sum, m) => sum + m.complexity, 0) / metrics.length;
  const avgMaintainability = metrics.reduce((sum, m) => sum + m.maintainabilityIndex, 0) / metrics.length;
  const totalCodeSmells = metrics.reduce((sum, m) => sum + m.codeSmells, 0);
  const totalVulnerabilities = metrics.reduce((sum, m) => sum + m.vulnerabilities, 0);
  
  const languageBreakdown = metrics.reduce((acc, m) => {
    acc[m.language] = (acc[m.language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    summary: {
      totalFiles: metrics.length,
      totalLines,
      totalFunctions,
      averageComplexity: Math.round(avgComplexity),
      averageMaintainability: Math.round(avgMaintainability),
      totalCodeSmells,
      totalVulnerabilities
    },
    languageBreakdown,
    files: metrics,
    recommendations: generateRecommendations(metrics)
  };
}

/**
 * Gera recomendações baseadas na análise
 */
function generateRecommendations(metrics: CodeMetrics[]): string[] {
  const recommendations: string[] = [];
  
  const highComplexityFiles = metrics.filter(m => m.complexity > 20);
  if (highComplexityFiles.length > 0) {
    recommendations.push(`Refatorar ${highComplexityFiles.length} arquivos com alta complexidade`);
  }
  
  const lowMaintainabilityFiles = metrics.filter(m => m.maintainabilityIndex < 60);
  if (lowMaintainabilityFiles.length > 0) {
    recommendations.push(`Melhorar manutenibilidade em ${lowMaintainabilityFiles.length} arquivos`);
  }
  
  const highCodeSmells = metrics.filter(m => m.codeSmells > 5);
  if (highCodeSmells.length > 0) {
    recommendations.push(`Remover code smells em ${highCodeSmells.length} arquivos`);
  }
  
  const vulnerabilitiesFound = metrics.filter(m => m.vulnerabilities > 0);
  if (vulnerabilitiesFound.length > 0) {
    recommendations.push(`Corrigir ${vulnerabilitiesFound.reduce((sum, m) => sum + m.vulnerabilities, 0)} vulnerabilidades`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Código em bom estado! Continue assim.');
  }
  
  return recommendations;
}

export default {
  analyzeCodeComplexity,
  analyzeMultipleFiles,
  generateCodeAnalysisReport
};