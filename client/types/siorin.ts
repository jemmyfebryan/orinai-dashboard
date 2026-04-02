// Siorin Dashboard API Types

export interface OverviewMetrics {
  total_customers: number;
  active_today: number;
  meetings_booked: number;
  product_inquiries: number;
  b2b_customers: number;
  b2c_customers: number;
}

export interface ConversationTrendPoint {
  date: string;
  count: number;
  unique_customers: number;
}

export interface ConversationTrendsCard {
  title: string;
  subtitle: string;
  period_days: number;
  data: ConversationTrendPoint[];
  total_conversations: number;
  avg_per_day: number;
}

export interface RouteDistributionItem {
  route: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RouteDistributionCard {
  title: string;
  subtitle: string;
  data: RouteDistributionItem[];
  total_routed: number;
}

export interface IntentAnalysisItem {
  intent: string;
  count: number;
  avg_confidence: number;
  color: string;
}

export interface IntentAnalysisCard {
  title: string;
  subtitle: string;
  data: IntentAnalysisItem[];
  total_classified: number;
}

export interface MeetingStatusItem {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface MeetingStatusCard {
  title: string;
  subtitle: string;
  data: MeetingStatusItem[];
  total_meetings: number;
}

export interface RecentActivityItem {
  conversation_id: string | null;
  phone_number: string | null;
  contact_name: string | null;
  agent_route: string | null;
  status: string;
  processing_duration_ms: number | null;
  timestamp: string;
  error_message: string | null;
}

export interface RecentActivitiesCard {
  title: string;
  subtitle: string;
  max_items: number;
  data: RecentActivityItem[];
}

export interface PerformanceMetrics {
  title: string;
  avg_processing_time_ms: number;
  success_rate: number;
  total_processed: number;
  timeout_count: number;
  human_takeover_count: number;
  avg_ai_replies: number;
}

export interface B2BB2CItem {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface B2BB2CCard {
  title: string;
  subtitle: string;
  data: B2BB2CItem[];
  total_customers: number;
}

export interface ProductInquiryItem {
  product_type: string;
  count: number;
  vehicle_type: string | null;
}

export interface ProductInquiryCard {
  title: string;
  subtitle: string;
  data: ProductInquiryItem[];
  total_inquiries: number;
}

export interface TopInquiryItem {
  customer_name: string | null;
  phone_number: string | null;
  product_type: string | null;
  vehicle_type: string | null;
  unit_qty: number | null;
  status: string;
  created_at: string;
}

export interface TopInquiriesCard {
  title: string;
  subtitle: string;
  max_items: number;
  data: TopInquiryItem[];
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  generated_at: string;
  timezone: string;
  overview: OverviewMetrics;
  conversation_trends: ConversationTrendsCard;
  route_distribution: RouteDistributionCard;
  intent_analysis: IntentAnalysisCard;
  meeting_status: MeetingStatusCard;
  recent_activities: RecentActivitiesCard;
  performance: PerformanceMetrics;
  b2b_b2c_distribution: B2BB2CCard;
  product_inquiries: ProductInquiryCard;
  top_inquiries: TopInquiriesCard;
}
