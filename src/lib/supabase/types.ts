export type PlayerRole = "levantador" | "passador" | "atacante" | "defensor";
export type SessionStatus = "draft" | "drawn" | "playing" | "done";
export type TeamLabel = "A" | "B" | "C";
export type ConstraintType = "lock" | "avoid";
export type ProfileRole = "admin" | "viewer";

type PlayerRow = {
  id: string;
  name: string;
  slug: string;
  stars: number;
  elo: number;
  roles: PlayerRole[];
  active: boolean;
  pending_review: boolean;
  created_at: string;
};
type PlayerInsert = {
  id?: string;
  name: string;
  slug: string;
  stars?: number;
  elo?: number;
  roles?: PlayerRole[];
  active?: boolean;
  pending_review?: boolean;
  created_at?: string;
};

type SessionRow = {
  id: string;
  date: string;
  title: string | null;
  location: string | null;
  status: SessionStatus;
  slug: string;
  created_by: string | null;
  created_at: string;
};
type SessionInsert = {
  id?: string;
  date: string;
  title?: string | null;
  location?: string | null;
  status?: SessionStatus;
  slug: string;
  created_by?: string | null;
  created_at?: string;
};

type AttendanceRow = {
  id: string;
  session_id: string;
  player_id: string;
  slot: number | null;
  confirmed: boolean;
  is_reserve: boolean;
};
type AttendanceInsert = {
  id?: string;
  session_id: string;
  player_id: string;
  slot?: number | null;
  confirmed?: boolean;
  is_reserve?: boolean;
};

type ConstraintRow = {
  id: string;
  session_id: string;
  type: ConstraintType;
  player_a: string;
  player_b: string;
};
type ConstraintInsert = Omit<ConstraintRow, "id"> & { id?: string };

type TeamRow = {
  id: string;
  session_id: string;
  label: TeamLabel;
  color: string | null;
};
type TeamInsert = {
  id?: string;
  session_id: string;
  label: TeamLabel;
  color?: string | null;
};

type TeamMemberRow = { team_id: string; player_id: string };

type MatchRow = {
  id: string;
  session_id: string;
  team_home: string;
  team_away: string;
  score_home: number;
  score_away: number;
  winner: string | null;
  played_at: string;
};
type MatchInsert = {
  id?: string;
  session_id: string;
  team_home: string;
  team_away: string;
  score_home?: number;
  score_away?: number;
  winner?: string | null;
  played_at?: string;
};

type ProfileRow = {
  id: string;
  role: ProfileRole;
  display_name: string | null;
};

export type Database = {
  public: {
    Tables: {
      players:      { Row: PlayerRow;     Insert: PlayerInsert;     Update: Partial<PlayerInsert> };
      sessions:     { Row: SessionRow;    Insert: SessionInsert;    Update: Partial<SessionInsert> };
      attendances:  { Row: AttendanceRow; Insert: AttendanceInsert; Update: Partial<AttendanceInsert> };
      constraints:  { Row: ConstraintRow; Insert: ConstraintInsert; Update: Partial<ConstraintInsert> };
      teams:        { Row: TeamRow;       Insert: TeamInsert;       Update: Partial<TeamInsert> };
      team_members: { Row: TeamMemberRow; Insert: TeamMemberRow;    Update: Partial<TeamMemberRow> };
      matches:      { Row: MatchRow;      Insert: MatchInsert;      Update: Partial<MatchInsert> };
      profiles:     { Row: ProfileRow;    Insert: ProfileRow;       Update: Partial<ProfileRow> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
