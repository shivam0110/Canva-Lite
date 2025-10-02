import type { AppDispatch } from "../store";
import {
  createDesignStart,
  createDesignSuccess,
  createDesignFailure,
  setLoading,
  updateDesignSuccess,
  setDesigns,
  deleteDesignSuccess,
} from "../reducers/designsSlice";
import type { Design } from "../types";
import type { CanvasElement } from "../types/canvas";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface CreateDesignPayload {
  title: string;
  width: number;
  height: number;
  userId: string;
}

interface UpdateDesignPayload {
  id: string;
  title?: string;
  canvasElements?: CanvasElement[];
  liveblocksRoom?: string;
  thumbnail?: string;
}

export const createDesign = (payload: CreateDesignPayload) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(createDesignStart());

      const response = await fetch(`${API_URL}/api/designs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create design");
      }

      const design = await response.json();

      dispatch(
        createDesignSuccess({
          id: design.id,
          title: design.title,
          width: design.width,
          height: design.height,
          userId: design.userId,
        })
      );

      return design;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create design";
      dispatch(createDesignFailure(message));
      throw error;
    }
  };
};

export const fetchUserDesigns = (userId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const response = await fetch(`${API_URL}/api/designs/user/${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch designs");
      }

      const designs: Design[] = await response.json();
      dispatch(setDesigns(designs));
    } catch (error) {
      console.error("Error fetching designs:", error);
      dispatch(setDesigns([]));
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateDesign = (payload: UpdateDesignPayload) => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await fetch(`${API_URL}/api/designs/${payload.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update design");
      }

      const design = await response.json();

      if (payload.title) {
        dispatch(
          updateDesignSuccess({
            id: design.id,
            title: design.title,
          })
        );
      }

      return design;
    } catch (error) {
      console.error("Error updating design:", error);
      throw error;
    }
  };
};

export const deleteDesign = (designId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const response = await fetch(`${API_URL}/api/designs/${designId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete design");
      }

      dispatch(deleteDesignSuccess(designId));
    } catch (error) {
      console.error("Error deleting design:", error);
      throw error;
    }
  };
};

export const fetchDesignById = async (
  designId: string
): Promise<Design & { canvasElements?: CanvasElement[] }> => {
  const response = await fetch(`${API_URL}/api/designs/${designId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch design");
  }

  return response.json();
};

// Autosave function (debounced externally)
export const autosaveDesign = async (
  designId: string,
  canvasElements: CanvasElement[],
  liveblocksRoom?: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/designs/${designId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ canvasElements, liveblocksRoom }),
    });

    if (!response.ok) {
      throw new Error("Failed to autosave design");
    }
  } catch (error) {
    console.error("Autosave error:", error);
    throw error;
  }
};

// Export design as PNG
export const exportDesign = async (
  designId: string,
  canvasElements: CanvasElement[]
): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/designs/${designId}/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ canvasElements }),
    });

    if (!response.ok) {
      throw new Error("Failed to export design");
    }

    // Get the blob from the response
    const blob = await response.blob();

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `design-${designId}.png`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
};
