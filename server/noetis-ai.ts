import OpenAI from "openai";
import { jiveAIJobOutputSchema } from "@shared/schema";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MeridianJobOutput {
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    service_history?: string[];
    preferred_contact?: "phone" | "sms" | "email";
  };
  job_type: string;
  urgency: "low" | "medium" | "high" | "emergency";
  address: string;
  location: {
    validated: boolean;
    serviceable: boolean;
    zone?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  notes: string;
  tags: string[];
  route_to: "dispatch_queue" | "quote_queue" | "fallback_notification";
  confidence: number;
  requires_review: boolean;
  similar_jobs?: string[];
  processing_metadata: {
    ai_model: string;
    processing_time: number;
    timestamp: string;
  };
}

// HVAC-specific job type mappings for Meridian FSM
const HVAC_JOB_TYPES = {
  "AC Repair": "ac_repair",
  "AC Installation": "ac_install", 
  "AC Maintenance": "ac_maintenance",
  "Heating Repair": "heating_repair",
  "Heating Installation": "heating_install",
  "Heating Maintenance": "heating_maintenance",
  "HVAC Inspection": "hvac_inspection",
  "Duct Cleaning": "duct_cleaning",
  "Thermostat Service": "thermostat_service",
  "Emergency Service": "emergency_hvac",
  "Quote Request": "quote_request",
  "Other": "general_hvac"
};

// Predefined tags for auto-tagging system
const HVAC_TAGS = {
  emergency: ["emergency", "urgent", "no heat", "no cooling", "broken", "not working"],
  warranty: ["warranty", "under warranty", "covered", "new install"],
  commercial: ["commercial", "business", "office", "store", "restaurant"],
  residential: ["home", "house", "apartment", "condo", "residential"],
  maintenance: ["maintenance", "tune-up", "cleaning", "inspection", "service"],
  installation: ["install", "new", "replacement", "upgrade"],
  repair: ["repair", "fix", "broken", "problem", "issue", "malfunction"]
};

// Service zone validation (example zones - replace with actual coverage areas)
const SERVICE_ZONES = {
  "zone_1": { name: "Downtown", serviceable: true },
  "zone_2": { name: "North District", serviceable: true },
  "zone_3": { name: "South District", serviceable: true },
  "zone_4": { name: "East District", serviceable: false },
  "zone_5": { name: "West District", serviceable: true }
};

export async function processJobWithAva(
  description: string,
  customerInfo: string,
  customerPhone: string,
  customerEmail?: string,
  address?: string
): Promise<JiveAIJobOutput> {
  const startTime = Date.now();

  try {
    // Enhanced AI prompt for JiveAI FSM compliance
    const prompt = `You are Ava, the AI Intake Agent for JiveAI FSM Operating System. 
    Analyze this HVAC service request and provide structured output for field service management.

    Customer Request: "${description}"
    Customer Info: "${customerInfo}"
    
    Analyze and provide JSON response with:
    1. HVAC-specific job classification
    2. Urgency assessment (emergency, high, medium, low)
    3. Required parts prediction
    4. Routing decision (dispatch_queue for simple repairs, quote_queue for complex jobs)
    5. Auto-tags for categorization
    6. Service complexity assessment
    
    Focus on HVAC industry specifics: AC, heating, ventilation, ductwork, thermostats.
    Consider seasonal factors, emergency indicators, and complexity for proper routing.
    
    Respond in JSON format:
    {
      "hvac_job_type": "specific HVAC service type",
      "urgency_level": "emergency|high|medium|low", 
      "issue_description": "technical summary",
      "required_parts": ["part1", "part2"],
      "service_complexity": "simple|moderate|complex",
      "seasonal_priority": true/false,
      "requires_specialist": true/false,
      "estimated_duration": "time estimate",
      "tags": ["tag1", "tag2"],
      "routing_recommendation": "dispatch_queue|quote_queue",
      "confidence_score": 85
    }`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Ava, an expert HVAC service intake agent. Provide precise, technical analysis for field service routing decisions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const aiResult = JSON.parse(response.choices[0].message.content || "{}");
    
    // Extract customer info
    const customerName = extractCustomerName(customerInfo);
    
    // Auto-generate tags based on description
    const autoTags = generateAutoTags(description, aiResult.tags || []);
    
    // Determine routing based on complexity and urgency
    const routeTo = determineRouting(aiResult.service_complexity, aiResult.urgency_level, aiResult.requires_specialist);
    
    // Address validation (simplified - replace with actual geocoding service)
    const locationData = await validateAddress(address || "Address to be confirmed");
    
    // Check for similar jobs (placeholder - implement with actual database query)
    const similarJobs = await findSimilarJobs(description);
    
    const processingTime = Date.now() - startTime;
    
    // Build Meridian-compliant output
    const meridianOutput: MeridianJobOutput = {
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: address || "Address to be confirmed",
        preferred_contact: determinePreferredContact(customerPhone, customerEmail)
      },
      job_type: mapToHVACJobType(aiResult.hvac_job_type),
      urgency: mapUrgencyLevel(aiResult.urgency_level),
      address: address || "Address to be confirmed", 
      location: locationData,
      notes: `${aiResult.issue_description}\n\nEstimated Duration: ${aiResult.estimated_duration}\nRequired Parts: ${aiResult.required_parts?.join(', ') || 'TBD'}`,
      tags: autoTags,
      route_to: routeTo,
      confidence: aiResult.confidence_score || 75,
      requires_review: aiResult.requires_specialist || aiResult.urgency_level === "emergency",
      similar_jobs: similarJobs,
      processing_metadata: {
        ai_model: "gpt-4o",
        processing_time: processingTime,
        timestamp: new Date().toISOString()
      }
    };

    // Validate against schema
    return meridianJobOutputSchema.parse(meridianOutput);

  } catch (error) {
    console.error("Maya processing error:", error);
    
    // Fallback output for errors
    return createFallbackOutput(description, customerInfo, customerPhone, customerEmail, address, Date.now() - startTime);
  }
}

function extractCustomerName(customerInfo: string): string {
  const nameMatch = customerInfo.match(/Name:\s*([^,\n]+)/i);
  if (nameMatch) return nameMatch[1].trim();
  
  const phoneMatch = customerInfo.match(/Phone:\s*([^,\n]+)/i);
  if (phoneMatch) return `Customer ${phoneMatch[1].trim()}`;
  
  return "Customer";
}

function generateAutoTags(description: string, aiTags: string[] = []): string[] {
  const tags = new Set(aiTags);
  const lowercaseDesc = description.toLowerCase();
  
  // Check for emergency indicators
  if (HVAC_TAGS.emergency.some(keyword => lowercaseDesc.includes(keyword))) {
    tags.add("emergency");
  }
  
  // Check for service type indicators
  if (HVAC_TAGS.maintenance.some(keyword => lowercaseDesc.includes(keyword))) {
    tags.add("maintenance");
  }
  
  if (HVAC_TAGS.installation.some(keyword => lowercaseDesc.includes(keyword))) {
    tags.add("installation");
  }
  
  if (HVAC_TAGS.repair.some(keyword => lowercaseDesc.includes(keyword))) {
    tags.add("repair");
  }
  
  // Check for property type
  if (HVAC_TAGS.commercial.some(keyword => lowercaseDesc.includes(keyword))) {
    tags.add("commercial");
  } else if (HVAC_TAGS.residential.some(keyword => lowercaseDesc.includes(keyword))) {
    tags.add("residential");
  }
  
  return Array.from(tags);
}

function mapToHVACJobType(aiJobType: string): string {
  const normalizedType = aiJobType?.toLowerCase() || "";
  
  for (const [key, value] of Object.entries(HVAC_JOB_TYPES)) {
    if (normalizedType.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return "general_hvac";
}

function mapUrgencyLevel(aiUrgency: string): "low" | "medium" | "high" | "emergency" {
  const urgency = aiUrgency?.toLowerCase() || "medium";
  
  if (urgency.includes("emergency")) return "emergency";
  if (urgency.includes("high")) return "high";  
  if (urgency.includes("low")) return "low";
  
  return "medium";
}

function determineRouting(
  complexity: string, 
  urgency: string, 
  requiresSpecialist: boolean
): "dispatch_queue" | "quote_queue" | "fallback_notification" {
  
  if (urgency === "emergency") return "dispatch_queue";
  if (requiresSpecialist || complexity === "complex") return "quote_queue";
  if (complexity === "simple" || complexity === "moderate") return "dispatch_queue";
  
  return "quote_queue"; // Default to quote queue for uncertain cases
}

function determinePreferredContact(phone: string, email?: string): "phone" | "sms" | "email" {
  if (email) return "email";
  return phone ? "sms" : "phone";
}

async function validateAddress(address: string): Promise<{
  validated: boolean;
  serviceable: boolean;
  zone?: string;
  coordinates?: { lat: number; lng: number };
}> {
  // Simplified address validation - replace with actual geocoding service
  const hasNumbers = /\d/.test(address);
  const hasStreetIndicators = /\b(st|street|ave|avenue|rd|road|dr|drive|blvd|boulevard|way|ln|lane)\b/i.test(address);
  
  const validated = hasNumbers && hasStreetIndicators && address !== "Address to be confirmed";
  
  // Mock zone assignment - replace with actual zone lookup
  const zone = validated ? "zone_1" : undefined;
  const serviceable = zone ? SERVICE_ZONES[zone]?.serviceable || false : false;
  
  return {
    validated,
    serviceable,
    zone,
    coordinates: validated ? { lat: 40.7128, lng: -74.0060 } : undefined // Mock coordinates
  };
}

async function findSimilarJobs(description: string): Promise<string[]> {
  // Placeholder for similar job detection - implement with actual database query
  const keywords = description.toLowerCase().split(' ').filter(word => word.length > 3);
  
  // Mock similar job IDs based on keywords
  return keywords.length > 2 ? [`job_similar_${Date.now()}`] : [];
}

function createFallbackOutput(
  description: string,
  customerInfo: string, 
  customerPhone: string,
  customerEmail?: string,
  address?: string,
  processingTime?: number
): MeridianJobOutput {
  return {
    customer: {
      name: extractCustomerName(customerInfo),
      phone: customerPhone,
      email: customerEmail,
      address: address || "Address to be confirmed"
    },
    job_type: "general_hvac",
    urgency: "medium",
    address: address || "Address to be confirmed",
    location: {
      validated: false,
      serviceable: false
    },
    notes: `Service request: ${description}\n\nRequires manual review due to processing error.`,
    tags: ["requires_review", "processing_error"],
    route_to: "fallback_notification",
    confidence: 25,
    requires_review: true,
    processing_metadata: {
      ai_model: "fallback",
      processing_time: processingTime || 0,
      timestamp: new Date().toISOString()
    }
  };
}