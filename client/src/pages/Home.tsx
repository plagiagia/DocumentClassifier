import { useQuery } from "@tanstack/react-query";
import { fetchDocuments } from "../lib/api";
import DocumentGrid from "../components/DocumentGrid";
import SearchBar from "../components/SearchBar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [search, setSearch] = useState("");
  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments
  });
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      title: "",
      file: null as File | null,
    }
  });

  const filteredDocs = documents?.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  const onUpload = async (values: { title: string, file: File | null }) => {
    if (!values.file) return;
    
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("file", values.file);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Document uploaded successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <SearchBar value={search} onChange={setSearch} />
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onUpload)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          onChange={(e) => {
                            onChange(e.target.files?.[0] || null);
                          }}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit">Upload</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <DocumentGrid documents={filteredDocs || []} isLoading={isLoading} />
    </div>
  );
}
