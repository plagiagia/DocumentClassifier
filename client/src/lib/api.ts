import { Document } from "@db/schema";

export async function fetchDocuments(): Promise<Document[]> {
  const response = await fetch('/api/documents');
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  return response.json();
}

export async function uploadDocument(formData: FormData): Promise<Document> {
  const response = await fetch('/api/documents', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload document');
  }
  
  return response.json();
}

export async function updateDocumentTags(id: number, tags: string[]): Promise<Document> {
  const response = await fetch(`/api/documents/${id}/tags`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tags })
  });

  if (!response.ok) {
    throw new Error('Failed to update tags');
  }

  return response.json();
}
