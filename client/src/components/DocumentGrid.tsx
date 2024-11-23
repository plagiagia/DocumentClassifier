import DocumentCard from "./DocumentCard";
import { Document } from "@db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentGridProps {
  documents: Document[];
  isLoading: boolean;
}

export default function DocumentGrid({ documents, isLoading }: DocumentGridProps) {
  const queryClient = useQueryClient();

  const updateTagsMutation = useMutation({
    mutationFn: async ({ id, tags }: { id: number; tags: string[] }) => {
      const response = await fetch(`/api/documents/${id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags })
      });
      if (!response.ok) throw new Error('Failed to update tags');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[300px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-2xl font-semibold mb-2">No documents found</h3>
        <p className="text-muted-foreground">Upload your first document to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <DocumentCard 
          key={doc.id} 
          document={doc}
          onTagsUpdate={(id, tags) => updateTagsMutation.mutate({ id, tags })}
        />
      ))}
    </div>
  );
}
