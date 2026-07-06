import React, { useEffect, useState } from "react";
import { CheckCircle, Home, Loader2, Mail, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminContactMessages() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/contact-messages");
      setMessages(await response.json());
    } catch (error: any) {
      toast({ title: "Could not load messages", description: error.message || "Check admin permissions.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);

  const updateStatus = async (id: string, status: "reviewed" | "resolved") => {
    const response = await apiRequest("PATCH", `/api/admin/contact-messages/${id}`, { status });
    const updated = await response.json();
    setMessages((current) => current.map((message) => message.id === id ? updated : message));
  };

  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-6">
          <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setLocation("/admin")}>
            <Home className="mr-2 h-4 w-4" />
            Admin
          </Button>
          <div>
            <h1 className="text-lg font-bold">Contact Messages</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Support inbox</p>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading messages</div>
        ) : messages.length === 0 ? (
          <Card className="border-border/60 shadow-sm"><CardContent className="p-10 text-center"><Mail className="mx-auto mb-3 h-10 w-10 text-primary" /><h2 className="font-black">No contact messages yet</h2><p className="mt-2 text-sm text-muted-foreground">New messages from the Contact page will appear here.</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {messages.map((message) => (
              <Card key={message.id} className="border-border/60 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black">{message.name}</h2>
                      <p className="text-sm text-muted-foreground">{message.email}</p>
                    </div>
                    <Badge variant="outline" className={message.status === "new" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-green-200 bg-green-50 text-green-700"}>{message.status}</Badge>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1 font-bold">{message.category}</span>
                    <span className="rounded-full bg-muted px-3 py-1">{formatDate(message.createdAt)}</span>
                  </div>
                  <p className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm leading-7 text-muted-foreground">{message.message}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" className="rounded-2xl font-bold" onClick={() => updateStatus(message.id, "reviewed")}><MessageSquare className="mr-2 h-4 w-4" />Mark Reviewed</Button>
                    <Button className="rounded-2xl font-bold" onClick={() => updateStatus(message.id, "resolved")}><CheckCircle className="mr-2 h-4 w-4" />Resolve</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(value: unknown) {
  const date = value ? new Date(value as string) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
