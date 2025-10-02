export interface Design {
  id: string;
  title: string;
  width?: number;
  height?: number;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface DesignsState {
  designs: Design[];
  loading: boolean;
  error: string | null;
  creating: boolean;
}
