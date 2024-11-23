import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Document } from "@db/schema";
import { format } from "date-fns";
import { Eye, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Document as PDFDocument, Page } from 'react-pdf';
import { decryptData } from "../lib/encryption";
import TagManager from "./TagManager";

interface DocumentWithTags extends Document {
  tags: string[];
  encrypted: string;
  content: string;
  contentType: string;
}

interface DocumentPreviewProps {
  document: DocumentWithTags;
}

interface DocumentCardProps {
  document: DocumentWithTags;
  onTagsUpdate: (id: number, tags: string[]) => void;
}

function DocumentPreview({ document }: DocumentPreviewProps) {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadPreview() {
      try {
        const decrypted = await decryptData(document.encrypted, document.content);
        const blob = new Blob([decrypted], { type: document.contentType });
        const url = URL.createObjectURL(blob);
        setPreviewContent(url);
        return () => {
          if (url) URL.revokeObjectURL(url);
        };
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load preview",
          variant: "destructive"
        });
      }
    }
    loadPreview();
  }, [document, toast]);

  if (!previewContent) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  switch (document.contentType) {
    case 'application/pdf':
      return (
        <div className="w-full h-[600px] overflow-auto">
          <PDFDocument file={previewContent}>
            <Page pageNumber={1} width={800} />
          </PDFDocument>
        </div>
      );
    case 'image/jpeg':
    case 'image/png':
    case 'image/gif':
      return (
        <div className="w-full flex justify-center">
          <img src={previewContent} alt={document.title} className="max-h-[600px] object-contain" />
        </div>
      );
    case 'text/plain':
    case 'text/markdown':
      return (
        <div className="w-full h-[600px] overflow-auto p-4 bg-muted rounded-lg">
          <iframe src={previewContent} className="w-full h-full border-0" title={document.title} />
        </div>
      );
    default:
      return (
        <div className="w-full h-96 flex items-center justify-center">
          <p>Preview not available for this file type</p>
        </div>
      );
  }
}

export default function DocumentCard({ document, onTagsUpdate }: DocumentCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1603513492128-ba7bc9b3e143)',
            backgroundSize: 'cover',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}>
      <CardHeader>
        <CardTitle className="truncate text-lg font-semibold">{document.title}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {format(new Date(document.createdAt), 'MMM dd, yyyy')}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {document.tags.slice(0, 3).map((tag: string, i: number) => (
            <Badge key={i} variant="secondary">{tag}</Badge>
          ))}
          {document.tags.length > 3 && (
            <Badge variant="outline">+{document.tags.length - 3}</Badge>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-black/5 flex items-center justify-center gap-2">
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Eye className="h-4 w-4 mr-1" /> Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DocumentPreview document={document} />
            </DialogContent>
          </Dialog>
          
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-1" /> Download
          </Button>
        </div>
      </CardContent>

      <CardFooter>
        <TagManager 
          documentId={document.id} 
          tags={document.tags} 
          onUpdate={onTagsUpdate}
        />
      </CardFooter>
    </Card>
  );
}
