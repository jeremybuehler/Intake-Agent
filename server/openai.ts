import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-fake-key-for-testing"
});

export interface AIEnrichmentResult {
  service_type: "AC Repair" | "Install" | "Maintenance" | "Heating" | "Other";
  ai_summary: string;
  issue_type: string;
  urgency: "low" | "medium" | "high";
  potential_parts: string[];
  confidence: number;
}

export async function enrichJobData(description: string, customerInfo: string): Promise<AIEnrichmentResult> {
  try {
    const prompt = `Analyze this field service job request and provide structured information in JSON format.

Customer Information: ${customerInfo}
Job Description: ${description}

Please analyze and return JSON with:
- service_type: Choose from "AC Repair", "Install", "Maintenance", "Heating", or "Other"
- ai_summary: A clear, professional summary of the issue (1-2 sentences)
- issue_type: A specific technical classification code (e.g., "HVAC_COOLING_FAILURE", "ELECTRICAL_OUTLET_ISSUE")
- urgency: "low", "medium", or "high" based on safety and comfort impact
- potential_parts: Array of likely parts/components that may be needed (up to 5 items)
- confidence: Your confidence level as a percentage (0-100) in this analysis

Consider factors like:
- Safety concerns (gas leaks, electrical issues = high urgency)
- Comfort impact (no heating in winter, no AC in summer = high urgency)
- System failures vs maintenance needs
- Common failure patterns in HVAC systems

Return only valid JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert HVAC field service analyzer. Provide accurate technical assessments in JSON format only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      service_type: result.service_type || "Other",
      ai_summary: result.ai_summary || "Service request requires assessment",
      issue_type: result.issue_type || "GENERAL_SERVICE_REQUEST",
      urgency: result.urgency || "medium",
      potential_parts: Array.isArray(result.potential_parts) ? result.potential_parts : [],
      confidence: Math.max(0, Math.min(100, result.confidence || 50))
    };

  } catch (error) {
    console.error("OpenAI enrichment failed:", error);
    
    // Fallback analysis based on keywords
    const desc = description.toLowerCase();
    let service_type: AIEnrichmentResult["service_type"] = "Other";
    let urgency: AIEnrichmentResult["urgency"] = "medium";
    
    if (desc.includes("ac") || desc.includes("air conditioning") || desc.includes("cooling")) {
      service_type = "AC Repair";
    } else if (desc.includes("heat") || desc.includes("furnace") || desc.includes("warm")) {
      service_type = "Heating";
    } else if (desc.includes("install") || desc.includes("new")) {
      service_type = "Install";
    } else if (desc.includes("maintenance") || desc.includes("tune") || desc.includes("check")) {
      service_type = "Maintenance";
    }

    if (desc.includes("emergency") || desc.includes("asap") || desc.includes("urgent") || desc.includes("cold") || desc.includes("hot")) {
      urgency = "high";
    } else if (desc.includes("when convenient") || desc.includes("routine")) {
      urgency = "low";
    }

    return {
      service_type,
      ai_summary: "Service request requires technical assessment",
      issue_type: "GENERAL_SERVICE_REQUEST",
      urgency,
      potential_parts: [],
      confidence: 20
    };
  }
}
