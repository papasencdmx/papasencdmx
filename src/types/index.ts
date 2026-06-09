// ── Database Types ──

export interface City {
  id: string;
  name: string;
  slug: string;
  domain: string;
  newsletter_subdomain: string | null;
  region: string | null;
  country: string;
  subscriber_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Zone {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  type: "distrito" | "barrio" | "municipio";
  snippet: string | null;
  hub_description: string | null;
  latitude: number | null;
  longitude: number | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  // Joined
  adjacent_zones?: Zone[];
  listing_count?: number;
}

export interface Category {
  id: string;
  name: string;
  name_long: string;
  slug: string;
  description: string | null;
  como_elegir: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  name_long: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Listing {
  id: string;
  city_id: string;
  zone_id: string | null;
  category_id: string;
  subcategory_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  recommendation_reason: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  street_address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  age_min: number | null;
  age_max: number | null;
  price_min: number | null;
  price_max: number | null;
  price_range: "$" | "$$" | "$$$" | null;
  languages: string[];
  schedule: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  tier: "free" | "standard" | "presencia_anual" | "presencia_total";
  meta_title: string | null;
  meta_description: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_place_id?: string | null;
  google_photos_enabled?: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  active_expires_at: string | null;
  verified_expires_at: string | null;
  featured_expires_at: string | null;
  section_content?: Record<string, unknown>;
  social_links?: { facebook?: string; instagram?: string; twitter?: string; youtube?: string; linkedin?: string; tiktok?: string };
  founded_date?: string;
  is_claimed?: boolean;
  discount_percent?: number | null;
  discount_label?: string | null;
  // Partner-submission workflow (added by pages-system migration)
  submission_status?: "pending" | "approved" | "rejected" | null;
  source?: "manual" | "submission";
  booking_url?: string | null;
  contact_name?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  // Joined
  zone?: Zone;
  category?: Category;
  subcategory?: Subcategory;
  tags?: ListingTag[];
  review_avg?: number;
  review_count?: number;
}

// Filtered listing pages — drive /p/[slug] dynamic routes
export interface PageFilterConfig {
  show_zone_filter?: boolean;
  show_age_filter?: boolean;
  show_type_filter?: boolean;
  show_price_filter?: boolean;
  // Tag-based listing membership: a listing appears on this page if it has
  // at least one listing_tags row matching ANY of (tag_type, tag_value).
  tag_types?: string[];
  tag_values?: string[];
  default_sort?: "featured_first" | "price_asc" | "price_desc" | "recent";
}

export interface Page {
  id: string;
  city_id: string;
  title: string;
  slug: string;
  page_type: "guide" | "ofertas" | "events" | "extraescolares" | "planes";
  hero_headline: string | null;
  hero_subheadline: string | null;
  meta_title: string | null;
  meta_description: string | null;
  filter_config: PageFilterConfig;
  featured_listing_ids: string[];
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

// ── Offer Table Types ──

export interface OfferTableCell {
  text: string;
  bold?: boolean;
  color?: string;
  bgColor?: string;
  colspan?: number;
  align?: "left" | "center" | "right";
}

export interface OfferTableRow {
  type: "header" | "section" | "data";
  cells: OfferTableCell[];
}

export interface OfferTable {
  id: string;
  title: string;
  visible: boolean;
  columns: number;
  rows: OfferTableRow[];
  footnote?: string;
}

export interface ColegioSectionContent {
  modelo_educativo?: string;
  etapas?: string[];
  extraescolares?: string[];
  servicios?: string[];
  instalaciones?: string[];
  admisiones?: string;
  faqs?: Array<{ question: string; answer: string }>;
  horario_ampliado?: string;
  idiomas_ensenanza?: string[];
  alumnos_por_clase?: number;
  uniforme?: boolean;
  confesional?: string;
}

export interface ListingSection {
  id: string;
  listing_id: string;
  title: string;
  slug: string;
  content: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListingTag {
  id: string;
  listing_id: string;
  tag_type: string;
  tag_value: string;
}

export interface Lead {
  id: string;
  listing_id: string;
  city_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string | null;
  message: string | null;
  children_ages: string | null;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: "new" | "sent" | "opened" | "responded";
  notified_at: string | null;
  created_at: string;
}

export interface ClickEvent {
  id: string;
  listing_id: string;
  city_id: string;
  event_type:
  | "phone_reveal"
  | "website_click"
  | "whatsapp_click"
  | "email_reveal"
  | "share_whatsapp"
  | "share_facebook"
  | "share_copy_link"
  | "directions_click"
  | "save_favorite";
  source_page: string | null;
  session_id: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  listing_id: string;
  reviewer_name: string;
  reviewer_email: string | null;
  is_verified_subscriber: boolean;
  rating: number;
  title: string | null;
  body: string | null;
  status: "pending" | "approved" | "rejected";
  moderated_at: string | null;
  moderated_by: string | null;
  created_at: string;
}

export type EventSection = "actividades" | "colegios" | "campamentos";

export interface EventCategory {
  id: string;
  name: string;
  name_long: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  section: EventSection;
}

export interface EventOccurrence {
  id: string;
  event_id: string;
  occurrence_date: string;
  date_end: string | null;
  time_start: string | null;
  time_end: string | null;
  location_name: string | null;
  street_address: string | null;
  latitude: number | null;
  longitude: number | null;
  ticket_url: string | null;
  availability: "available" | "few_left" | "sold_out" | "cancelled";
  notes: string | null;
  pack_name: string | null;
  pack_description: string | null;
  price_override: number | null;
  // Inventory
  ticket_quantity: number | null;
  max_per_purchase: number | null;
  is_visible: boolean;
}

export interface EventFeature {
  id: string;
  event_id: string;
  group_name: string;
  icon_name: string;
  items: string[];
  sort_order: number;
}

export interface Event {
  id: string;
  city_id: string;
  listing_id: string | null;
  event_category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  price_min: number | null;
  price_max: number | null;
  is_free: boolean;
  age_min: number | null;
  age_max: number | null;
  duration_minutes: number | null;
  external_url: string | null;
  affiliate_params: string | null;
  location_name: string | null;
  street_address: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string;
  source_id: string | null;
  source_url: string | null;
  status: "pending" | "approved" | "rejected";
  is_featured: boolean;
  is_promoted: boolean;
  use_mollie: boolean;
  payment_provider: "stripe";
  section: EventSection;
  submitted_by: string | null;
  // Per-event discount (0-80). NULL = no discount.
  discount_percent?: number | null;
  discount_label?: string | null;
  // Per-event deposit %. When set, public page shows a "Reservar plaza" button
  // that charges only this percentage; the rest is paid offline to the organizer.
  deposit_percent?: number | null;
  // Per-event organizer display info (independent of linked listing).
  organizer_name?: string | null;
  organizer_logo_url?: string | null;
  organizer_founded_year?: number | null;
  organizer_is_verified?: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  event_category?: EventCategory;
  listing?: {
    name: string;
    slug: string;
    category?: { slug: string };
  };
  occurrences?: EventOccurrence[];
  features?: EventFeature[];
  // Computed
  next_occurrence_date?: string;
  occurrence_count?: number;
}

export interface Order {
  id: string;
  event_id: string;
  occurrence_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  quantity: number;
  total_amount: number;
  attendee_names: string[];
  notes: string | null;
  payment_provider: "stripe";
  mollie_payment_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: "pending" | "paid" | "deposit_paid" | "failed" | "expired" | "refunded" | "cancelled";
  pack_name: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  is_deposit: boolean;
  deposit_percent: number | null;
  deposit_amount: number | null;
  remaining_amount: number | null;
  order_number: string | null;
  access_token: string | null;
  paid_at: string | null;
  confirmation_email_sent_at: string | null;
  failure_email_sent_at: string | null;
  admin_notes: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  created_at: string;
  // Joined
  event?: { title: string; slug: string; image_url: string | null; price_min: number | null };
  occurrence?: { occurrence_date: string; time_start: string | null; location_name: string | null };
}

export interface Guide {
  id: string;
  city_id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  // Joined
  guide_listings?: GuideListing[];
}

export interface GuideListing {
  id: string;
  guide_id: string;
  listing_id: string;
  is_featured: boolean;
  sort_order: number;
  listing?: Listing;
}

// ── SEO Types ──

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export interface JsonLdSchema {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

// ── UI Types ──

export interface FilterState {
  zone?: string;
  category?: string;
  ageMin?: number;
  ageMax?: number;
  priceRange?: string;
  features?: string[];
  sortBy?: "featured" | "name" | "newest" | "rating";
  query?: string;
}

export interface SearchResult {
  type: "listing" | "zone" | "category" | "event";
  id: string;
  name: string;
  slug: string;
  description?: string;
  href: string;
}

// ── Config Types ──

export interface CityConfig {
  cityName: string;
  citySlug: string;
  domain: string;
  newsletterDomain: string;
  region: string;
  subscriberCount: number;
  categories: CategoryConfig[];
  zones: ZoneConfig[];
  supportPhoneE164: string;
  supportPhoneDisplay: string;
  supportEmail: string;
}

export interface CategoryConfig {
  slug: string;
  name: string;
  nameLong: string;
  icon: string;
}

export interface ZoneConfig {
  slug: string;
  name: string;
  type: "distrito" | "barrio" | "municipio";
  adjacent: string[];
}
