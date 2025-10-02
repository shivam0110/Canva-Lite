import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createDesign, updateDesign } from "@/actions/designsActions";
import type { AppDispatch } from "@/store";
import type { Design } from "@/types";

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Design name is required")
    .max(50, "Name must be less than 50 characters"),
  size: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDesign?: Design | null;
}

const canvasSizes = [
  {
    label: "Instagram Post (1080 × 1080)",
    value: "1080x1080",
    width: 1080,
    height: 1080,
  },
  {
    label: "Instagram Story (1080 × 1920)",
    value: "1080x1920",
    width: 1080,
    height: 1920,
  },
  {
    label: "Facebook Post (1200 × 630)",
    value: "1200x630",
    width: 1200,
    height: 630,
  },
  {
    label: "Twitter Post (1200 × 675)",
    value: "1200x675",
    width: 1200,
    height: 675,
  },
  {
    label: "YouTube Thumbnail (1280 × 720)",
    value: "1280x720",
    width: 1280,
    height: 720,
  },
  {
    label: "A4 Portrait (2480 × 3508)",
    value: "2480x3508",
    width: 2480,
    height: 3508,
  },
  {
    label: "A4 Landscape (3508 × 2480)",
    value: "3508x2480",
    width: 3508,
    height: 2480,
  },
  { label: "Custom", value: "custom", width: 800, height: 600 },
];

export default function CreateModal({
  open,
  onOpenChange,
  editingDesign,
}: CreateModalProps) {
  const [isCustomSize, setIsCustomSize] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useUser();

  const isEditMode = !!editingDesign;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingDesign?.title || "",
      size: editingDesign
        ? `${editingDesign.width}x${editingDesign.height}`
        : "",
    },
  });

  // Reset form when modal opens/closes or editing design changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: editingDesign?.title || "",
        size: editingDesign
          ? `${editingDesign.width}x${editingDesign.height}`
          : "",
      });
    }
  }, [open, editingDesign, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode && editingDesign) {
        // Edit mode - only update the title
        await dispatch(
          updateDesign({
            id: editingDesign.id,
            title: data.title,
          })
        );

        toast.success("Design updated successfully!");
        onOpenChange(false);
        form.reset();
      } else {
        // Create mode
        if (!data.size) {
          toast.error("Please select a canvas size");
          return;
        }

        if (!user?.id) {
          toast.error("User not authenticated");
          return;
        }

        const selectedSize = canvasSizes.find(
          (size) => size.value === data.size
        );
        if (!selectedSize) {
          toast.error("Please select a valid canvas size");
          return;
        }

        const designPayload = {
          title: data.title,
          width: selectedSize.width,
          height: selectedSize.height,
          userId: user.id,
        };

        const design = await dispatch(createDesign(designPayload));

        toast.success("Design created successfully!");
        onOpenChange(false);
        form.reset();

        // Navigate to the design editor
        navigate(`/design/${design.id}`);
      }
    } catch {
      toast.error(
        isEditMode
          ? "Failed to update design. Please try again."
          : "Failed to create design. Please try again."
      );
    }
  };

  const handleSizeChange = (value: string) => {
    setIsCustomSize(value === "custom");
    form.setValue("size", value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Design" : "Create New Design"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your design details."
              : "Choose a name and canvas size for your new design project."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Design Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter design name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditMode && (
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canvas Size</FormLabel>
                    <Select
                      onValueChange={handleSizeChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select canvas size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {canvasSizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isCustomSize && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Width (px)</FormLabel>
                  <Input type="number" placeholder="800" min="100" max="5000" />
                </div>
                <div>
                  <FormLabel>Height (px)</FormLabel>
                  <Input type="number" placeholder="600" min="100" max="5000" />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Update Design" : "Create Design"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
