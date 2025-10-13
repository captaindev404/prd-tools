'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReleaseNotes } from '@/components/roadmap/ReleaseNotes';
import { StakeholderNotifications } from '@/components/roadmap/StakeholderNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface RoadmapItem {
  id: string;
  title: string;
  stage: string;
  progress: number;
}

export default function CommunicationsPage() {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoadmapItems();
  }, []);

  const fetchRoadmapItems = async () => {
    try {
      const response = await fetch('/api/roadmap?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch roadmap items');
      }

      const data = await response.json();
      setRoadmapItems(data.items);
    } catch (err) {
      console.error('Error fetching roadmap items:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const selectedTitles = roadmapItems
    .filter((item) => selectedItems.includes(item.id))
    .map((item) => item.title);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link href="/roadmap">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Roadmap
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Communications Hub</h1>
          <p className="mt-2 text-muted-foreground">
            Manage roadmap communications, changelogs, and stakeholder notifications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="release-notes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="release-notes">
            <FileText className="mr-2 h-4 w-4" />
            Release Notes
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Send className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Release Notes Tab */}
        <TabsContent value="release-notes" className="mt-6">
          <ReleaseNotes />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          {/* Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Roadmap Items</CardTitle>
              <CardDescription>
                Choose which roadmap items to include in your notification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading roadmap items...</div>
              ) : (
                <div className="space-y-3">
                  {roadmapItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No roadmap items available</p>
                  ) : (
                    roadmapItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={item.id}
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={item.id} className="cursor-pointer font-normal">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.stage} • {item.progress}% complete
                            </div>
                          </Label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedItems.length > 0 && (
                <div className="mt-4 rounded-lg bg-blue-50 p-3">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Configuration */}
          <StakeholderNotifications
            roadmapIds={selectedItems}
            roadmapTitles={selectedTitles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
