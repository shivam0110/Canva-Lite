import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import CreateModal from "@/components/designs/create-modal";
import DesignCard from "@/components/designs/DesignCard";
import { DesignGridSkeleton } from "@/components/designs/DesignCardSkeleton";
import { fetchUserDesigns } from "@/actions/designsActions";
import type { RootState, AppDispatch } from "@/store";
import type { Design } from "@/types";

function Designs() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const { user } = useUser();
  const dispatch = useDispatch<AppDispatch>();
  const { designs, loading, creating } = useSelector(
    (state: RootState) => state.designs
  );

  // Fetch designs when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserDesigns(user.id));
    }
  }, [user?.id, dispatch]);

  const handleEditDesign = (design: Design) => {
    setEditingDesign(design);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setIsCreateModalOpen(open);
    if (!open) {
      setEditingDesign(null);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Designs</h2>
          <p className="text-gray-600">
            Create and manage your design projects
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={creating}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create New Design"}
        </Button>
      </div>

      {/* Designs Grid */}
      {loading ? (
        <DesignGridSkeleton count={6} />
      ) : designs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {designs.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              onEdit={handleEditDesign}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No designs yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first design to get started
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Your First Design
          </Button>
        </div>
      )}

      <CreateModal
        open={isCreateModalOpen}
        onOpenChange={handleCloseModal}
        editingDesign={editingDesign}
      />
    </main>
  );
}

export default Designs;
