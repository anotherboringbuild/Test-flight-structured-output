import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ValidationCriteria {
  field_names_english: boolean;
  content_language_preserved: boolean;
  superscripts_correct: boolean;
  completeness: boolean;
  legal_refs_match: boolean;
}

export interface ValidationResult {
  confidence: number;
  issues: string[];
  scores: ValidationCriteria;
  reasoning: string;
  passedValidation: boolean;
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

export async function validateExtraction(
  originalText: string,
  extractedData: any
): Promise<ValidationResult> {
  try {
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
      throw new Error("No response from validation model");
    }

    const validation = JSON.parse(content);
    
    // Calculate pass/fail based on criteria
    const scores = validation.criteria_scores;
    const allCriteriaPassed = Object.values(scores).every((v) => v === true);
    const passedValidation = allCriteriaPassed && validation.overall_confidence >= 0.7;

    return {
      confidence: validation.overall_confidence,
      issues: validation.issues_found || [],
      scores: scores,
      reasoning: validation.reasoning,
      passedValidation
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
