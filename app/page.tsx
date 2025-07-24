'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import VscodeIcon from '@/components/vscode';
import { zodResolver } from '@hookform/resolvers/zod';
import { DownloadIcon } from 'lucide-react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  url: z
    .url('Invalid marketplace URL')
    .refine((val) => val.includes('marketplace.visualstudio.com/items?itemName='), {
      message: 'URL must be a VS Code Marketplace link',
    })
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          const itemName = parsed.searchParams.get('itemName');
          return itemName && /^[\w-]+\.[\w-]+$/.test(itemName); // e.g., ms-azuretools.vscode-docker
        } catch {
          return false;
        }
      },
      {
        message: 'URL must contain a valid itemName (e.g., ms-azuretools.vscode-docker)',
      },
    ),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const form = useForm<FormData>({
    defaultValues: { url: '' },
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const link = document.createElement('a');
    link.href = `/api/download?url=${encodeURIComponent(data.url)}`;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-dvh flex flex-col items-center justify-center">
      <main className="max-w-2xl w-full flex flex-col items-center -mt-20">
        <VscodeIcon className="size-28 mb-4" />
        <h1 className="text-3xl font-medium font-mono">download VSIX package</h1>
        <Form {...form}>
          <form className="max-w-3xl w-full mt-8" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-containers"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                download
                <DownloadIcon />
              </Button>
            </div>
          </form>
        </Form>
        <div className="mt-10">
          <p className="text-muted-foreground/80 text-sm">
            note: unofficial API's are used to download the package and may stop working at any
            time.
          </p>
        </div>
      </main>
    </div>
  );
}
