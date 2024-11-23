import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Document } from "@db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import TagManager from "./TagManager";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { format } from "date-fns";

interface DocumentCardProps {
  document: Document;
  onTagsUpdate: (id: number, tags: string[]) => void;
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
          {document.tags.slice(0, 3).map((tag, i) => (
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
              <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
                Preview content for {document.title}
              </div>
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
