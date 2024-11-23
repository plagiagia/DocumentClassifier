import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, X, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TagManagerProps {
  documentId: number;
  tags: string[];
  onUpdate: (id: number, tags: string[]) => void;
}

export default function TagManager({ documentId, tags, onUpdate }: TagManagerProps) {
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      onUpdate(documentId, [...tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdate(documentId, tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="h-4 w-4 mr-2" />
          Manage Tags
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add new tag..."
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button size="sm" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
