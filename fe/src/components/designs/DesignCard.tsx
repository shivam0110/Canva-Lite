import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { deleteDesign } from "@/actions/designsActions";
import type { AppDispatch } from "@/store";
import { type Design } from "@/types";

interface DesignCardProps {
  design: Design;
  onEdit?: (design: Design) => void;
}

export default function DesignCard({ design, onEdit }: DesignCardProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(design);
    } else {
      navigate(`/design/${design.id}`);
    }
  };

  const handleOpen = () => {
    navigate(`/design/${design.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      !confirm(
        `Are you sure you want to delete "${design.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      await dispatch(deleteDesign(design.id));
      toast.success("Design deleted successfully");
    } catch (error) {
      console.error("Error deleting design:", error);
      toast.error("Failed to delete design");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDimensions = () => {
    if (design.width && design.height) {
      return `${design.width} × ${design.height}`;
    }
    return "Custom size";
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail placeholder */}
      <div
        className="w-full h-48 bg-gray-100 flex items-center justify-center cursor-pointer"
        onClick={handleOpen}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🎨</div>
          <div className="text-sm">{getDimensions()}</div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 truncate">
          {design.title}
        </h3>
        <p className="text-sm text-gray-500">
          Created {formatDate(design.createdAt)}
        </p>
      </CardContent>

      <CardFooter className="px-4 pb-4 flex gap-2">
        <Button
          onClick={handleEdit}
          size="sm"
          variant="outline"
          className="text-gray-600 hover:text-gray-800"
        >
          Rename
        </Button>
        <Button
          onClick={handleDelete}
          size="sm"
          variant="outline"
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  );
}
