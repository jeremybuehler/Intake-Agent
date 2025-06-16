import { JiveAIJobOutput } from "./noetis-ai";

// Noetis Mesh Agent: Felix (Field Execution & Logistics Integration eXpert)
export interface FelixDispatchJob {
  job_id: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
  job_type: string;
  urgency: "low" | "medium" | "high" | "emergency";
  scheduled_date?: string;
  estimated_duration: string;
  required_skills: string[];
  equipment_needed: string[];
  parts_list: string[];
  special_instructions: string;
  location: {
    address: string;
    zone: string;
    coordinates?: { lat: number; lng: number };
  };
  priority_score: number;
  dispatch_status: "pending" | "assigned" | "scheduled" | "in_progress" | "completed";
  assigned_technician?: string;
  created_at: string;
  updated_at: string;
}

// Noetis Mesh Agent: Quinn (Quote & Upselling Intelligence Network Navigator)
export interface QuinnQuoteRequest {
  quote_id: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
  job_type: string;
  description: string;
  complexity: "simple" | "moderate" | "complex";
  estimated_parts: Array<{
    name: string;
    quantity: number;
    estimated_cost: number;
    supplier?: string;
  }>;
  estimated_labor_hours: number;
  estimated_total: number;
  quote_status: "pending" | "draft" | "sent" | "approved" | "declined";
  valid_until: string;
  created_at: string;
  updated_at: string;
}

export class JiveAIWorkforceIntegration {
  private felixApiUrl: string;
  private quinnApiUrl: string;
  private apiKey: string;

  constructor() {
    this.felixApiUrl = process.env.FELIX_MESH_URL || "https://felix.noetis.mesh/api/dispatch";
    this.quinnApiUrl = process.env.QUINN_MESH_URL || "https://quinn.noetis.mesh/api/quotes";
    this.apiKey = process.env.NOETIS_MESH_KEY || "mesh_agent_key";
  }

  // Route job to Felix (Field Execution & Logistics Agent)
  async routeToFelix(jiveAIJob: JiveAIJobOutput): Promise<FelixDispatchJob> {
    try {
      const dispatchJob: FelixDispatchJob = {
        job_id: `dispatch_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        customer: jiveAIJob.customer,
        job_type: jiveAIJob.job_type,
        urgency: jiveAIJob.urgency,
        estimated_duration: this.estimateDuration(jiveAIJob.job_type, jiveAIJob.urgency),
        required_skills: this.mapSkillsRequired(jiveAIJob.job_type, jiveAIJob.tags),
        equipment_needed: this.mapEquipmentNeeded(jiveAIJob.job_type),
        parts_list: jiveAIJob.tags.filter((tag: string) => !["emergency", "residential", "commercial"].includes(tag)),
        special_instructions: this.buildSpecialInstructions(jiveAIJob),
        location: {
          address: jiveAIJob.address,
          zone: jiveAIJob.location.zone || "default",
          coordinates: jiveAIJob.location.coordinates
        },
        priority_score: this.calculatePriorityScore(jiveAIJob.urgency, jiveAIJob.tags),
        dispatch_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Send to Felix Agent
      const response = await this.sendToFelix(dispatchJob);
      
      console.log(`Job routed to Noetis Dispatch (Mill): ${dispatchJob.job_id}`);
      return response;

    } catch (error) {
      console.error("Failed to route to Felix agent:", error);
      throw new Error(`Felix agent routing failed: ${(error as Error).message}`);
    }
  }

  // Route job to Quinn (Quote & Upselling Intelligence Agent)
  async routeToQuinn(jiveAIJob: JiveAIJobOutput): Promise<QuinnQuoteRequest> {
    try {
      const quoteRequest: QuinnQuoteRequest = {
        quote_id: `quote_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        customer: jiveAIJob.customer,
        job_type: jiveAIJob.job_type,
        description: jiveAIJob.notes,
        complexity: this.assessComplexity(jiveAIJob.job_type, jiveAIJob.tags),
        estimated_parts: this.estimateParts(jiveAIJob.job_type, jiveAIJob.tags),
        estimated_labor_hours: this.estimateLaborHours(jiveAIJob.job_type),
        estimated_total: 0, // Will be calculated by quote system
        quote_status: "pending",
        valid_until: this.getQuoteValidUntil(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Send to Quinn Agent
      const response = await this.sendToQuinn(quoteRequest);
      
      console.log(`Job routed to Quinn Agent: ${quoteRequest.quote_id}`);
      return response;

    } catch (error) {
      console.error("Failed to route to Quinn agent:", error);
      throw new Error(`Quinn agent routing failed: ${(error as Error).message}`);
    }
  }

  // Send fallback notification for jobs outside coverage or requiring manual review
  async sendFallbackNotification(jiveAIJob: JiveAIJobOutput, reason: string): Promise<{success: boolean, notification_id: string}> {
    try {
      const notification = {
        notification_id: `fallback_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        customer: jiveAIJob.customer,
        reason,
        job_details: jiveAIJob,
        requires_manual_review: true,
        created_at: new Date().toISOString()
      };

      // In a real implementation, this would send to a notification service
      console.log(`Fallback notification sent: ${notification.notification_id} - Reason: ${reason}`);
      
      return {
        success: true,
        notification_id: notification.notification_id
      };

    } catch (error) {
      console.error("Failed to send fallback notification:", error);
      throw new Error(`Fallback notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods
  private estimateDuration(jobType: string, urgency: string): string {
    const durationMap: Record<string, string> = {
      emergency: "2-4 hours",
      high: "4-6 hours", 
      medium: "1-2 days",
      low: "3-5 days"
    };
    
    return durationMap[urgency] || "1-2 days";
  }

  private mapSkillsRequired(jobType: string, tags: string[]): string[] {
    const skillsMap: Record<string, string[]> = {
      ac_repair: ["hvac_certified", "electrical", "refrigeration"],
      ac_install: ["hvac_certified", "electrical", "heavy_lifting"],
      heating_repair: ["hvac_certified", "gas_certified", "electrical"],
      heating_install: ["hvac_certified", "gas_certified", "heavy_lifting"],
      duct_cleaning: ["duct_specialist", "cleaning_equipment"],
      emergency_hvac: ["emergency_response", "hvac_certified"]
    };

    const baseSkills = skillsMap[jobType] || ["hvac_certified"];
    
    // Add additional skills based on tags
    if (tags.includes("emergency")) baseSkills.push("emergency_response");
    if (tags.includes("commercial")) baseSkills.push("commercial_certified");
    
    return Array.from(new Set(baseSkills));
  }

  private mapEquipmentNeeded(jobType: string): string[] {
    const equipmentMap: Record<string, string[]> = {
      ac_repair: ["basic_tools", "multimeter", "gauges"],
      ac_install: ["lifting_equipment", "basic_tools", "gauges"],
      heating_repair: ["gas_detector", "basic_tools", "multimeter"],
      duct_cleaning: ["duct_cleaning_equipment", "vacuum", "brushes"]
    };

    return equipmentMap[jobType] || ["basic_tools"];
  }

  private buildSpecialInstructions(jiveAIJob: JiveAIJobOutput): string {
    let instructions = [];
    
    if (jiveAIJob.urgency === "emergency") {
      instructions.push("EMERGENCY CALL - Priority dispatch required");
    }
    
    if (jiveAIJob.tags.includes("elderly_residents")) {
      instructions.push("Elderly residents on site - exercise patience and clear communication");
    }
    
    if (jiveAIJob.tags.includes("commercial")) {
      instructions.push("Commercial property - coordinate with business hours");
    }
    
    if (!jiveAIJob.location.validated) {
      instructions.push("Address requires verification - call customer to confirm location");
    }

    return instructions.join(". ");
  }

  private calculatePriorityScore(urgency: string, tags: string[]): number {
    const urgencyScores: Record<string, number> = {
      emergency: 100,
      high: 75,
      medium: 50,
      low: 25
    };

    let score = urgencyScores[urgency] || 50;
    
    // Boost for special circumstances
    if (tags.includes("elderly_residents")) score += 10;
    if (tags.includes("commercial")) score += 5;
    if (tags.includes("warranty")) score += 15;
    
    return Math.min(score, 100);
  }

  private assessComplexity(jobType: string, tags: string[]): "simple" | "moderate" | "complex" {
    const complexJobTypes = ["ac_install", "heating_install", "hvac_inspection"];
    const simpleJobTypes = ["ac_maintenance", "thermostat_service"];
    
    if (complexJobTypes.includes(jobType)) return "complex";
    if (simpleJobTypes.includes(jobType)) return "simple";
    if (tags.includes("installation")) return "complex";
    if (tags.includes("maintenance")) return "simple";
    
    return "moderate";
  }

  private estimateParts(jobType: string, tags: string[]): Array<{name: string, quantity: number, estimated_cost: number}> {
    const partsMap: Record<string, Array<{name: string, quantity: number, estimated_cost: number}>> = {
      ac_repair: [
        { name: "Capacitor", quantity: 1, estimated_cost: 45 },
        { name: "Contactor", quantity: 1, estimated_cost: 65 }
      ],
      heating_repair: [
        { name: "Ignition Control", quantity: 1, estimated_cost: 125 },
        { name: "Gas Valve", quantity: 1, estimated_cost: 200 }
      ],
      thermostat_service: [
        { name: "Thermostat", quantity: 1, estimated_cost: 150 }
      ]
    };

    return partsMap[jobType] || [
      { name: "Miscellaneous Parts", quantity: 1, estimated_cost: 100 }
    ];
  }

  private estimateLaborHours(jobType: string): number {
    const laborMap: Record<string, number> = {
      ac_repair: 2,
      ac_install: 8,
      heating_repair: 3,
      heating_install: 6,
      ac_maintenance: 1,
      thermostat_service: 1
    };

    return laborMap[jobType] || 3;
  }

  private getQuoteValidUntil(): string {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30); // 30 days validity
    return validUntil.toISOString();
  }

  private async sendToFelix(dispatchJob: FelixDispatchJob): Promise<FelixDispatchJob> {
    // In production, this would make actual HTTP requests to Mill API
    try {
      console.log(`Sending job to Mill Dispatch: ${JSON.stringify(dispatchJob, null, 2)}`);
      
      // Simulate API call
      const response = await this.simulateFelixResponse(dispatchJob);
      return response;
      
    } catch (error) {
      throw new Error(`Felix API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async sendToQuinn(quoteRequest: QuinnQuoteRequest): Promise<QuinnQuoteRequest> {
    // In production, this would make actual HTTP requests to Quote API
    try {
      console.log(`Sending job to Quote System: ${JSON.stringify(quoteRequest, null, 2)}`);
      
      // Simulate API call
      const response = await this.simulateQuinnResponse(quoteRequest);
      return response;
      
    } catch (error) {
      throw new Error(`Quinn API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async simulateFelixResponse(dispatchJob: FelixDispatchJob): Promise<FelixDispatchJob> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      ...dispatchJob,
      dispatch_status: "pending",
      updated_at: new Date().toISOString()
    };
  }

  private async simulateQuinnResponse(quoteRequest: QuinnQuoteRequest): Promise<QuinnQuoteRequest> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Calculate estimated total
    const partsTotal = quoteRequest.estimated_parts.reduce((sum, part) => sum + part.estimated_cost, 0);
    const laborTotal = quoteRequest.estimated_labor_hours * 85; // $85/hour rate
    
    return {
      ...quoteRequest,
      estimated_total: partsTotal + laborTotal,
      quote_status: "draft",
      updated_at: new Date().toISOString()
    };
  }
}

export const workforceIntegration = new JiveAIWorkforceIntegration();