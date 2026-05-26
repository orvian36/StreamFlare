export interface SubscriptionPlan {
  SUB_TYPE: string;
  BILL: number;
  NUM_PROFILES: number;
}

export interface SubscriptionDTO {
  SUB_ID: number;
  SUB_TYPE: string;
  EMAIL: string;
  START_DATE: string;
  END_DATE: string;
  BILL: number;
  TOTAL_BILL: number;
  RUNNING: number | null;
  TERMINATION_DATE: string | null;
}

export interface AddSubscriptionRequest {
  EMAIL: string;
  SUB_TYPE: string;
  END_DATE: string;
}
