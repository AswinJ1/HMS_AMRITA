// Static list of clubs available for student registration
export const CLUBS = [
  "ICPC@Amrita",
  "amFOSS",
  "DreamTeam",
  "bi0s",
] as const

export type ClubName = (typeof CLUBS)[number]
