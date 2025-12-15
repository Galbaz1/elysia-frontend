export type ProfileModels = {
  base_provider: string;
  base_model: string;
  complex_provider: string;
  complex_model: string;
};

export type Profile = {
  tenant_id: string;
  profile_id: string;
  name: string;
  is_default: boolean;
  prompt_bundle_slug: string;
  models: ProfileModels;
  collections: string[];
  tool_policy?: { [key: string]: unknown } | null;
  updated_at: string;
};

export type ProfileSnapshot = {
  bundle_slug: string;
  models: ProfileModels;
  collections: string[];
  tool_policy?: { [key: string]: unknown } | null;
};

export type ConversationBinding = {
  tenant_id: string;
  user_id: string;
  conversation_id: string;
  profile_id: string;
  snapshot: ProfileSnapshot;
};

export type ProfilesPayload = {
  profiles: Profile[];
  error?: string;
};

export type BindProfilePayload = {
  binding?: ConversationBinding;
  error?: string;
};
