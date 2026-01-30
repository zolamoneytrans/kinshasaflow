"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { IDCardData } from "@/lib/types";
import { idCardSchema } from "@/lib/types";
import { templates } from "@/lib/templates";
import React, { useState, useTransition } from "react";
import Image from "next/image";
import { QrCode, User, Upload, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { verifyPhotoAction } from "@/app/actions";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const IDCardPreview = ({ data }: { data: IDCardData }) => {
  const {
    template,
    name,
    photo,
    idNumber,
    dob,
    title,
    department,
    validUntil,
  } = data;
  const qrData = JSON.stringify({ name, idNumber, template });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
    qrData
  )}`;
  const userAvatarPlaceholder = PlaceHolderImages.find(p => p.id === 'user-avatar-placeholder');

  return (
    <Card id="id-card-preview" className="w-full max-w-sm mx-auto bg-card shadow-lg rounded-2xl overflow-hidden font-body">
      <div className="bg-primary/90 p-4 text-center">
        <h3 className="text-xl font-bold text-primary-foreground tracking-wider">
          {template === "student" && "STUDENT ID"}
          {template === "employee" && "EMPLOYEE ID"}
          {template === "membership" && "MEMBERSHIP CARD"}
        </h3>
      </div>
      <div className="p-6 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 mb-4 ring-2 ring-primary">
          <Image
            src={photo || userAvatarPlaceholder?.imageUrl || ''}
            alt="ID Photo"
            width={128}
            height={128}
            className="object-cover w-full h-full"
            data-ai-hint={userAvatarPlaceholder?.imageHint || 'person portrait'}
          />
        </div>
        <h2 className="text-2xl font-bold text-primary">{name || "Your Name"}</h2>
        <p className="text-muted-foreground">{title || (template === 'employee' ? 'Job Title' : '')}</p>
        <div className="w-full my-6 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="font-semibold text-muted-foreground">ID No.</span>
            <span className="font-mono">{idNumber || "N/A"}</span>
          </div>
          {department && (
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold text-muted-foreground">Dept.</span>
              <span>{department}</span>
            </div>
          )}
          {dob && (
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold text-muted-foreground">D.O.B.</span>
              <span>{dob}</span>
            </div>
          )}
          {validUntil && (
            <div className="flex justify-between py-2">
              <span className="font-semibold text-muted-foreground">Valid</span>
              <span>{validUntil}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Image src={qrUrl} alt="QR Code" width={100} height={100} />
          <div className="text-xs text-muted-foreground text-center">
            <QrCode className="mx-auto mb-1" />
            Scan for verification
          </div>
        </div>
      </div>
    </Card>
  );
};


export default function IDGenerator() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);

  const form = useForm<IDCardData>({
    resolver: zodResolver(idCardSchema),
    mode: "onChange",
    defaultValues: {
      template: "student",
      name: "",
      idNumber: "",
      dob: "",
      title: "",
      department: "",
      validUntil: "",
      photo: "",
    },
  });

  const selectedTemplateId = form.watch("template");
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const formData = form.watch();

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
            variant: "destructive",
            title: "File too large",
            description: "Please upload an image smaller than 4MB.",
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const photoDataUri = e.target?.result as string;
      startTransition(async () => {
        const result = await verifyPhotoAction(photoDataUri);
        if (result.success) {
          form.setValue("photo", photoDataUri, { shouldValidate: true });
          toast({
            title: "Success!",
            description: result.message,
          });
        } else {
          form.setValue("photo", "", { shouldValidate: true });
          toast({
            variant: "destructive",
            title: "Photo Verification Failed",
            description: result.message,
          });
        }
      });
    };
    reader.readAsDataURL(file);
  };
  
  const onTemplateChange = (templateId: string) => {
    form.reset();
    form.setValue("template", templateId);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-accent" />
            Create Your ID
          </CardTitle>
          <CardDescription>
            Fill in the details below to generate your ID card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1. Choose a Template</FormLabel>
                    <Tabs
                      defaultValue={field.value}
                      onValueChange={onTemplateChange}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        {templates.map((template) => (
                          <TabsTrigger key={template.id} value={template.id}>
                            {template.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">2. Enter Information</h3>
                {currentTemplate.fields.map((fieldInfo) => (
                  <FormField
                    key={fieldInfo.name}
                    control={form.control}
                    name={fieldInfo.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{fieldInfo.label}</FormLabel>
                        <FormControl>
                          <Input
                            type={fieldInfo.type}
                            placeholder={fieldInfo.placeholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>3. Upload Photo</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {field.value ? (
                            <Image
                              src={field.value}
                              alt="preview"
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <User className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          asChild
                          disabled={isPending}
                        >
                          <label className="cursor-pointer flex items-center gap-2">
                            {isPending ? (
                              <>
                                <Spinner className="w-4 h-4" /> Verifying...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" /> Upload
                              </>
                            )}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handlePhotoUpload}
                              disabled={isPending}
                            />
                          </label>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button type="button" size="lg" className="w-full" disabled={!form.formState.isValid || isPending}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate ID
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Your ID Card is Ready!</DialogTitle>
                    <DialogDescription>
                      You can now download your generated ID card. Right-click or long-press on the image to save it.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <IDCardPreview data={formData} />
                  </div>
                </DialogContent>
              </Dialog>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="flex flex-col items-center">
        <h3 className="text-2xl font-bold mb-4">Live Preview</h3>
        <div className="sticky top-8">
          <IDCardPreview data={formData} />
        </div>
      </div>
    </div>
  );
}
