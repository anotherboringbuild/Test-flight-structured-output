import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Using Replit's AI Integrations service for Gemini access
const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface ValidationCriteria {
  field_names_english: boolean;
  content_language_preserved: boolean;
  superscripts_correct: boolean;
  completeness: boolean;
  legal_refs_match: boolean;
}

export interface JudgeResult {
  confidence: number;
  scores: ValidationCriteria;
  reasoning: string;
  issues: string[];
}

export interface ValidationResult {
  confidence: number;
  issues: string[];
  scores: ValidationCriteria;
  reasoning: string;
  passedValidation: boolean;
  gpt4oJudge?: JudgeResult;
  geminiJudge?: JudgeResult;
}

const VALIDATION_PROMPT = `You are a meticulous quality assurance judge evaluating document extraction accuracy.

Your task is to compare the ORIGINAL TEXT with the EXTRACTED JSON and validate that the extraction follows these strict rules:

EXTRACTION RULES:
1. JSON field names (ProductCopy, BusinessCopy, UpgraderCopy, ProductName, Headlines, AdvertisingCopy, KeyFeatureBullets, LegalReferences) MUST be in English
2. Content values (product names, headlines, copy, features) MUST remain in the source document's original language (no translation)
3. Superscripts (¹, ², ³, etc.) MUST be converted to {{sup:N}} tokens in content
4. ALL products mentioned in the document MUST be extracted (check completeness)
5. Legal references MUST be prefixed with matching {{sup:N}} tokens to link them to content

THINK STEP-BY-STEP:
1. First, identify what language the source document is in
2. Check each criterion carefully
3. List specific issues if found
4. Calculate overall confidence (0-1 scale)

Respond with valid JSON only (no markdown).`;

// Helper to call GPT-4o judge
async function callGPT4oJudge(originalText: string, extractedData: any): Promise<JudgeResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1, // Low for deterministic results
    messages: [
      {
        role: "system",
        content: VALIDATION_PROMPT
      },
      {
        role: "user",
        content: `ORIGINAL TEXT:
${originalText.substring(0, 8000)} ${originalText.length > 8000 ? '...[truncated]' : ''}

EXTRACTED JSON:
${JSON.stringify(extractedData, null, 2)}

EVALUATION CRITERIA:
1. Are ALL field names (ProductCopy, Headlines, etc.) in English? (yes/no)
2. Is content in the source document's original language? (yes/no)
3. Are superscripts correctly converted to {{sup:N}} tokens? (yes/no)
4. Are all products mentioned in the document extracted? (yes/no)
5. Do legal references match their {{sup:N}} markers? (yes/no)

Provide your evaluation as JSON:
{
  "reasoning": "step-by-step analysis",
  "criteria_scores": {
    "field_names_english": true/false,
    "content_language_preserved": true/false,
    "superscripts_correct": true/false,
    "completeness": true/false,
    "legal_refs_match": true/false
  },
  "overall_confidence": 0.0-1.0,
  "issues_found": ["list of specific issues"]
}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from GPT-4o validation");
  }

  const validation = JSON.parse(content);
  
  return {
    confidence: validation.overall_confidence,
    scores: validation.criteria_scores,
    reasoning: validation.reasoning,
    issues: validation.issues_found || []
  };
}

// Helper to call Gemini judge
async function callGeminiJudge(originalText: string, extractedData: any): Promise<JudgeResult> {
  const response = await gemini.models.generateContent({
    model: "gemini-2.5-pro",
    contents: `${VALIDATION_PROMPT}

ORIGINAL TEXT:
${originalText.substring(0, 8000)} ${originalText.length > 8000 ? '...[truncated]' : ''}

EXTRACTED JSON:
${JSON.stringify(extractedData, null, 2)}

EVALUATION CRITERIA:
1. Are ALL field names (ProductCopy, Headlines, etc.) in English? (yes/no)
2. Is content in the source document's original language? (yes/no)
3. Are superscripts correctly converted to {{sup:N}} tokens? (yes/no)
4. Are all products mentioned in the document extracted? (yes/no)
5. Do legal references match their {{sup:N}} markers? (yes/no)

Provide your evaluation as JSON:
{
  "reasoning": "step-by-step analysis",
  "criteria_scores": {
    "field_names_english": true/false,
    "content_language_preserved": true/false,
    "superscripts_correct": true/false,
    "completeness": true/false,
    "legal_refs_match": true/false
  },
  "overall_confidence": 0.0-1.0,
  "issues_found": ["list of specific issues"]
}`,
    config: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from Gemini validation");
  }

  const validation = JSON.parse(text);
  
  return {
    confidence: validation.overall_confidence,
    scores: validation.criteria_scores,
    reasoning: validation.reasoning,
    issues: validation.issues_found || []
  };
}

// Dual-judge validation using both GPT-4o and Gemini
export async function validateExtraction(
  originalText: string,
  extractedData: any
): Promise<ValidationResult> {
  try {
    // Run both judges in parallel
    const [gpt4oResult, geminiResult] = await Promise.all([
      callGPT4oJudge(originalText, extractedData).catch(error => {
        console.error("GPT-4o judge error:", error);
        return null;
      }),
      callGeminiJudge(originalText, extractedData).catch(error => {
        console.error("Gemini judge error:", error);
        return null;
      })
    ]);

    // If both judges failed, return error result
    if (!gpt4oResult && !geminiResult) {
      return {
        confidence: 0.5,
        issues: ["Both validation judges failed - manual review recommended"],
        scores: {
          field_names_english: true,
          content_language_preserved: true,
          superscripts_correct: true,
          completeness: true,
          legal_refs_match: true
        },
        reasoning: "Validation failed due to system error",
        passedValidation: false
      };
    }

    // Use single judge result if one failed
    if (!gpt4oResult) {
      const allCriteriaPassed = Object.values(geminiResult!.scores).every((v) => v === true);
      const passedValidation = allCriteriaPassed && geminiResult!.confidence >= 0.7;
      return {
        confidence: geminiResult!.confidence,
        issues: geminiResult!.issues,
        scores: geminiResult!.scores,
        reasoning: `Gemini Judge: ${geminiResult!.reasoning}`,
        passedValidation,
        geminiJudge: geminiResult!
      };
    }

    if (!geminiResult) {
      const allCriteriaPassed = Object.values(gpt4oResult!.scores).every((v) => v === true);
      const passedValidation = allCriteriaPassed && gpt4oResult!.confidence >= 0.7;
      return {
        confidence: gpt4oResult!.confidence,
        issues: gpt4oResult!.issues,
        scores: gpt4oResult!.scores,
        reasoning: `GPT-4o Judge: ${gpt4oResult!.reasoning}`,
        passedValidation,
        gpt4oJudge: gpt4oResult!
      };
    }

    // Both judges succeeded - combine their results
    // Weighted average: GPT-4o 50%, Gemini 50%
    const combinedConfidence = (gpt4oResult.confidence * 0.5) + (geminiResult.confidence * 0.5);
    
    // Combine scores - both must agree for true
    const combinedScores: ValidationCriteria = {
      field_names_english: gpt4oResult.scores.field_names_english && geminiResult.scores.field_names_english,
      content_language_preserved: gpt4oResult.scores.content_language_preserved && geminiResult.scores.content_language_preserved,
      superscripts_correct: gpt4oResult.scores.superscripts_correct && geminiResult.scores.superscripts_correct,
      completeness: gpt4oResult.scores.completeness && geminiResult.scores.completeness,
      legal_refs_match: gpt4oResult.scores.legal_refs_match && geminiResult.scores.legal_refs_match
    };

    // Combine issues from both judges (deduplicate)
    const allIssues = [...gpt4oResult.issues, ...geminiResult.issues];
    const combinedIssues = Array.from(new Set(allIssues));
    
    const allCriteriaPassed = Object.values(combinedScores).every((v) => v === true);
    const passedValidation = allCriteriaPassed && combinedConfidence >= 0.7;

    return {
      confidence: combinedConfidence,
      issues: combinedIssues,
      scores: combinedScores,
      reasoning: `Dual-Judge Analysis (GPT-4o: ${Math.round(gpt4oResult.confidence * 100)}%, Gemini: ${Math.round(geminiResult.confidence * 100)}%)`,
      passedValidation,
      gpt4oJudge: gpt4oResult,
      geminiJudge: geminiResult
    };
  } catch (error) {
    console.error("Validation error:", error);
    // Return neutral result on error - don't block the upload
    return {
      confidence: 0.5,
      issues: ["Validation system error - manual review recommended"],
      scores: {
        field_names_english: true,
        content_language_preserved: true,
        superscripts_correct: true,
        completeness: true,
        legal_refs_match: true
      },
      reasoning: "Validation failed due to system error",
      passedValidation: false
    };
  }
}

// Quick validation checks (cheaper than full AI validation)
export function quickValidationChecks(extractedData: any): {
  passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if main structure exists
  if (!extractedData || typeof extractedData !== 'object') {
    issues.push("Invalid JSON structure");
    return { passed: false, issues };
  }

  // Check for expected English field names
  const expectedFields = ['ProductCopy', 'BusinessCopy', 'UpgraderCopy'];
  const hasAnyExpectedField = expectedFields.some(field => field in extractedData);
  
  if (!hasAnyExpectedField) {
    issues.push("Missing expected field names (ProductCopy, BusinessCopy, or UpgraderCopy)");
  }

  // Check for non-English field names (basic heuristic)
  const fieldNames = Object.keys(extractedData);
  const nonEnglishPattern = /[^\x00-\x7F]/; // Contains non-ASCII characters
  const nonEnglishFields = fieldNames.filter(name => nonEnglishPattern.test(name));
  
  if (nonEnglishFields.length > 0) {
    issues.push(`Found non-English field names: ${nonEnglishFields.join(', ')}`);
  }

  return {
    passed: issues.length === 0,
    issues
  };
}
