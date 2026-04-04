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

// Siorin Admin API Types

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  vehicle_type: string;
  description: string;
  features: {
    fitur_utama: string[];
    bonus?: string;
    server?: string;
  };
  price: string;
  installation_type: string;
  can_shutdown_engine: boolean;
  is_realtime_tracking: boolean;
  ecommerce_links: {
    tokopedia?: string;
    shopee?: string;
  };
  images: string[];
  specifications: Record<string, unknown>;
  compatibility: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  count: number;
}

export interface UpdateProductResponse {
  success: boolean;
  message: string;
  product_id: number;
}

export interface ResetProductsResponse {
  success: boolean;
  message: string;
  deleted: number;
  created: number;
  errors: string[];
}

export interface Prompt {
  prompt_key: string;
  prompt_name: string;
  prompt_text: string;
  description: string;
  prompt_type: string;
  is_active: boolean;
}

export interface PromptsResponse {
  success: boolean;
  prompts: Prompt[];
  count: number;
}

export interface UpdatePromptResponse {
  success: boolean;
  message: string;
  prompt_key: string;
}

export interface ResetPromptsResponse {
  success: boolean;
  message: string;
  deleted: number;
  created: number;
  errors: string[];
}

// Chat History API Types

export interface ContactItem {
  id: number;
  phone_number: string;
  name: string | null;
  domicile: string | null;
  vehicle: string | null;
  unit_qty: number | null;
  human_takeover: boolean;
  created_at: string | null;
  last_message_time: string | null;
}

export interface ToggleHumanTakeoverResponse {
  success: boolean;
  message: string;
  customer_id: number;
  human_takeover: boolean;
}

export interface GetContactsResponse {
  success: boolean;
  contacts: ContactItem[];
  count: number;
}

export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface GetChatHistoryResponse {
  success: boolean;
  customer_id: number;
  messages: ChatMessageItem[];
  count: number;
}
