# Noetis FSM Migration Plan
## Converting JiveAI Intake Agent to Ava - Noetis Intake Agent

### Phase 1: Core Identity & Branding (2-3 hours)
- [ ] Update all "JiveAI" references to "Noetis"
- [ ] Change agent name from "Intake Agent" to "Ava"
- [ ] Update UI components, headers, and branding
- [ ] Modify API responses and error messages

### Phase 2: Data Structure Transformation (4-5 hours)
- [ ] Create new Noetis-compliant output schema
- [ ] Implement customer object restructuring
- [ ] Add job_type mapping from current service_type
- [ ] Implement route_to logic (dispatch_queue vs quote_queue)
- [ ] Create notes field from ai_summary transformation

### Phase 3: Address Validation & Serviceability (3-4 hours)
- [ ] Integrate address validation service (Google Maps API)
- [ ] Define service coverage zones
- [ ] Implement serviceability checking logic
- [ ] Create fallback notification system for out-of-area requests

### Phase 4: Auto-tagging System (2-3 hours)
- [ ] Define predefined HVAC categories
- [ ] Implement warranty status detection
- [ ] Create emergency classification rules
- [ ] Build tag assignment logic

### Phase 5: Routing Intelligence (3-4 hours)
- [ ] Create dispatch queue routing rules
- [ ] Implement quote queue logic
- [ ] Add complexity assessment for routing decisions
- [ ] Build priority-based routing

### Phase 6: Memory & Context System (5-6 hours)
- [ ] Implement historical intake pattern analysis
- [ ] Create similar job detection system
- [ ] Build suspicious request flagging
- [ ] Add human escalation workflow
- [ ] Implement duplicate detection

### Phase 7: FSM Integration Points (2-3 hours)
- [ ] Create FSM-compatible API endpoints
- [ ] Implement job status callbacks
- [ ] Add workforce management integration hooks
- [ ] Build reporting interfaces

## Priority Order for Implementation:
1. **High Priority**: Phase 1 (Branding), Phase 2 (Data Structure)
2. **Medium Priority**: Phase 3 (Address), Phase 4 (Tagging), Phase 5 (Routing)
3. **Low Priority**: Phase 6 (Memory), Phase 7 (Integration)

## Estimated Total Time: 21-28 hours