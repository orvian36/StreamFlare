export interface ProfileDTO {
  profileId: string;
  email: string;
  dob: string;
}

export interface CreateProfileRequest {
  EMAIL: string;
  PROFILE_ID: string;
  DOB: string;
}

export interface UpdateProfileRequest {
  EMAIL: string;
  OLD_PROFILE_ID: string;
  NEW_PROFILE_ID: string;
}

export interface DeleteProfileRequest {
  EMAIL: string;
  PROFILE_ID: string;
}
