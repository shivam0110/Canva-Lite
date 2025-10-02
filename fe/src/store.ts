import { configureStore } from "@reduxjs/toolkit";
import designsReducer from "./reducers/designsSlice";
import canvasReducer from "./reducers/canvasSlice";

export const store = configureStore({
  reducer: {
    designs: designsReducer,
    canvas: canvasReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
