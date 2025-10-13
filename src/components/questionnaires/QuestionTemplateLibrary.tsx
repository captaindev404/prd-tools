'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  Heart,
  ThumbsUp,
  Zap,
  Users,
  Package,
  Smile,
  Star,
  BarChart3,
  MessageCircle,
  CircleHelp,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Building,
  Search,
  Plus,
} from 'lucide-react';
import {
  questionTemplates,
  getTemplatesByCategory,
  templateToQuestion,
  categoryMetadata,
  type TemplateCategory,
  type QuestionTemplate,
} from '@/lib/question-templates';
import { Question } from './question-builder';

interface QuestionTemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertTemplate: (question: Question) => void;
}

/**
 * Map icon names to Lucide icon components
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Heart,
  ThumbsUp,
  Zap,
  Users,
  Package,
  Smile,
  Star,
  BarChart3,
  MessageCircle,
  CircleHelp,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Building,
};

/**
 * Template Card Component
 */
function TemplateCard({
  template,
  onInsert,
}: {
  template: QuestionTemplate;
  onInsert: () => void;
}) {
  const IconComponent = template.icon ? iconMap[template.icon] : null;

  return (
    <Card className="transition-all duration-200 hover:border-primary hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {IconComponent && (
              <div className="mt-0.5">
                <IconComponent className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold leading-tight">
                {template.name}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {template.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Question Preview */}
        <div className="rounded-md bg-muted/50 p-3 border border-muted">
          <p className="text-sm font-medium text-foreground mb-2">
            {template.question.text}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {template.question.type.replace('_', ' ').toUpperCase()}
            </Badge>
            {template.question.required && (
              <Badge variant="outline" className="text-xs">
                Required
              </Badge>
            )}
            {template.question.type === 'likert' && template.question.config?.scale && (
              <span>{template.question.config.scale}-point scale</span>
            )}
            {template.question.type === 'rating' && template.question.config?.scale && (
              <span>{template.question.config.scale} stars</span>
            )}
            {template.question.type === 'mcq_single' && template.question.config?.options && (
              <span>{template.question.config.options.length} options</span>
            )}
            {template.question.type === 'mcq_multiple' && template.question.config?.options && (
              <span>{template.question.config.options.length} options</span>
            )}
          </div>
        </div>

        {/* Insert Button */}
        <Button
          onClick={onInsert}
          size="sm"
          className="w-full"
          aria-label={`Insert ${template.name} template`}
        >
          <Plus className="mr-2 h-4 w-4" />
          Insert Template
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Category Tab Content Component
 */
function CategoryTabContent({
  category,
  templates,
  searchQuery,
  onInsert,
}: {
  category: TemplateCategory;
  templates: QuestionTemplate[];
  searchQuery: string;
  onInsert: (template: QuestionTemplate) => void;
}) {
  // Filter templates by search query
  const filteredTemplates = templates.filter(
    template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.question.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredTemplates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No templates found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1">
      {filteredTemplates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onInsert={() => onInsert(template)}
        />
      ))}
    </div>
  );
}

/**
 * Question Template Library Component
 *
 * Sheet-based modal that displays categorized question templates.
 * Users can browse templates by category and insert them with one click.
 */
export function QuestionTemplateLibrary({
  open,
  onOpenChange,
  onInsertTemplate,
}: QuestionTemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('nps');

  const handleInsert = (template: QuestionTemplate) => {
    const question = templateToQuestion(template);
    onInsertTemplate(question);
    onOpenChange(false);

    // Clear search when closing
    setSearchQuery('');
  };

  // Get template counts by category
  const templateCounts = Object.keys(categoryMetadata).reduce((acc, cat) => {
    acc[cat as TemplateCategory] = getTemplatesByCategory(cat as TemplateCategory).length;
    return acc;
  }, {} as Record<TemplateCategory, number>);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
        aria-label="Question template library"
      >
        <SheetHeader>
          <SheetTitle className="text-xl">Question Templates</SheetTitle>
          <SheetDescription>
            Choose from {questionTemplates.length} pre-built question templates.
            All templates are fully editable after insertion.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search templates"
            />
          </div>

          {/* Category Tabs */}
          <Tabs
            value={activeCategory}
            onValueChange={value => setActiveCategory(value as TemplateCategory)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 h-auto">
              {(Object.keys(categoryMetadata) as TemplateCategory[]).map(category => {
                const metadata = categoryMetadata[category];
                const IconComponent = iconMap[metadata.icon];
                const count = templateCounts[category];

                return (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    aria-label={`${metadata.label} category (${count} templates)`}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    <span className="text-xs font-medium">{metadata.label}</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1 min-w-[20px] justify-center"
                    >
                      {count}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <ScrollArea className="h-[calc(100vh-300px)] mt-4 pr-4">
              {(Object.keys(categoryMetadata) as TemplateCategory[]).map(category => {
                const templates = getTemplatesByCategory(category);
                const metadata = categoryMetadata[category];

                return (
                  <TabsContent
                    key={category}
                    value={category}
                    className="mt-0 space-y-4"
                  >
                    {/* Category Description */}
                    <div className="bg-muted/50 rounded-lg p-3 border border-muted">
                      <p className="text-sm text-muted-foreground">
                        {metadata.description}
                      </p>
                    </div>

                    {/* Template Cards */}
                    <CategoryTabContent
                      category={category}
                      templates={templates}
                      searchQuery={searchQuery}
                      onInsert={handleInsert}
                    />
                  </TabsContent>
                );
              })}
            </ScrollArea>
          </Tabs>
        </div>

        {/* Screen reader announcement for template count */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {searchQuery && (
            <>
              {questionTemplates.filter(
                t =>
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.question.text.toLowerCase().includes(searchQuery.toLowerCase())
              ).length}{' '}
              templates found
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
