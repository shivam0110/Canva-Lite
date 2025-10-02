import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { type Design, type DesignsState } from "../types";

const initialState: DesignsState = {
  designs: [],
  loading: false,
  error: null,
  creating: false,
};

export interface CreateDesignPayload {
  title: string;
  width: number;
  height: number;
}

const designsSlice = createSlice({
  name: "designs",
  initialState,
  reducers: {
    createDesignStart: (state) => {
      state.creating = true;
      state.error = null;
    },
    createDesignSuccess: (
      state,
      action: PayloadAction<
        CreateDesignPayload & { id: string; userId: string }
      >
    ) => {
      const newDesign: Design = {
        id: action.payload.id,
        title: action.payload.title,
        width: action.payload.width,
        height: action.payload.height,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: action.payload.userId,
      };
      state.designs.unshift(newDesign);
      state.creating = false;
    },
    createDesignFailure: (state, action: PayloadAction<string>) => {
      state.creating = false;
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    updateDesignSuccess: (
      state,
      action: PayloadAction<{ id: string; title: string }>
    ) => {
      const design = state.designs.find((d) => d.id === action.payload.id);
      if (design) {
        design.title = action.payload.title;
        design.updatedAt = new Date().toISOString();
      }
    },
    setDesigns: (state, action: PayloadAction<Design[]>) => {
      state.designs = action.payload;
    },
    deleteDesignSuccess: (state, action: PayloadAction<string>) => {
      state.designs = state.designs.filter((d) => d.id !== action.payload);
    },
  },
});

export const {
  createDesignStart,
  createDesignSuccess,
  createDesignFailure,
  setLoading,
  updateDesignSuccess,
  setDesigns,
  deleteDesignSuccess,
} = designsSlice.actions;

export default designsSlice.reducer;
