export type UserRole = "passenger" | "technician" | "manager" | "admin";

export type Priority = "1" | "2" | "3" | "4";

export type IncidentState = "1" | "2" | "3" | "6" | "7";

export interface Incident {
    sys_id: string;
    number: string;
    short_description: string;
    priority: Priority;
    state: IncidentState;
    location: string;
    u_area: string;
    u_department: string;
    u_ai_category: string;
    u_reported_via: string;
    u_safety_risk: string;
    u_estimated_fix_mins: string;
    u_recommended_action: string;
    u_reporter_phone: string;
    u_passenger_rating: string;
    assigned_to: string;
    sys_created_on: string;
}

export interface Asset {
    sys_id: string;
    u_name: string;
    u_asset_type: string;
    u_location: string;
    u_area: string;
    u_status: string;
    u_last_maintenance: string;
}

export interface PreventiveTask {
    sys_id: string;
    u_title: string;
    u_asset: string;
    u_assigned_team: string;
    u_due_date: string;
    u_frequency: string;
    u_state: string;
    u_description: string;
}

export interface AITriage {
    category: string;
    priority: string;
    assigned_team: string;
    estimated_fix_mins: number;
    safety_risk: boolean;
    recommended_action: string;
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}