'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, Copy, Check } from 'lucide-react';
import type { TranscriptionSegment } from '@/lib/recording';

export interface TranscriptViewerProps {
  segments: TranscriptionSegment[];
  onSeek?: (timestamp: number) => void;
  language?: string;
}

export function TranscriptViewer({
  segments,
  onSeek,
  language = 'en',
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [highlightedSegmentId, setHighlightedSegmentId] = useState<number | null>(null);

  const filteredSegments = segments.filter(segment =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fullTranscript = segments.map(s => s.text).join(' ');

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadTranscript = (format: 'txt' | 'srt' | 'vtt') => {
    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'txt') {
      content = fullTranscript;
    } else if (format === 'srt') {
      content = segments
        .map((segment, index) => {
          const start = formatSRTTimestamp(segment.start);
          const end = formatSRTTimestamp(segment.end);
          return `${index + 1}\n${start} --> ${end}\n${segment.text.trim()}\n`;
        })
        .join('\n');
      mimeType = 'text/srt';
      extension = 'srt';
    } else if (format === 'vtt') {
      content =
        'WEBVTT\n\n' +
        segments
          .map(segment => {
            const start = formatVTTTimestamp(segment.start);
            const end = formatVTTTimestamp(segment.end);
            return `${start} --> ${end}\n${segment.text.trim()}\n`;
          })
          .join('\n');
      mimeType = 'text/vtt';
      extension = 'vtt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSRTTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(millis, 3)}`;
  };

  const formatVTTTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(millis, 3)}`;
  };

  const pad = (num: number, size: number): string => {
    return num.toString().padStart(size, '0');
  };

  const getSegmentQuality = (segment: TranscriptionSegment): 'high' | 'medium' | 'low' => {
    if (segment.no_speech_prob > 0.5) return 'low';
    if (segment.avg_logprob < -1) return 'low';
    if (segment.avg_logprob < -0.5) return 'medium';
    return 'high';
  };

  const highlightMatch = (text: string, query: string): JSX.Element => {
    if (!query) return <>{text}</>;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (segments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No transcript available. Transcription may still be processing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transcript</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {segments.length} segments • {language.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(fullTranscript)}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTranscript('txt')}
            >
              <Download className="h-4 w-4 mr-1" />
              TXT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTranscript('srt')}
            >
              <Download className="h-4 w-4 mr-1" />
              SRT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTranscript('vtt')}
            >
              <Download className="h-4 w-4 mr-1" />
              VTT
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="segments">
          <TabsList className="mb-4">
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="full">Full Text</TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search transcript..."
              className="pl-9"
            />
            {searchQuery && (
              <Badge variant="secondary" className="absolute right-3 top-1/2 -translate-y-1/2">
                {filteredSegments.length} results
              </Badge>
            )}
          </div>

          <TabsContent value="segments" className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSegments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No results found for "{searchQuery}"
              </p>
            ) : (
              filteredSegments.map(segment => {
                const quality = getSegmentQuality(segment);
                const isHighlighted = highlightedSegmentId === segment.id;

                return (
                  <div
                    key={segment.id}
                    className={`flex gap-3 p-3 border rounded-lg hover:bg-accent transition-colors ${
                      isHighlighted ? 'bg-accent' : ''
                    }`}
                    onClick={() => {
                      setHighlightedSegmentId(segment.id);
                      onSeek?.(segment.start);
                    }}
                  >
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-xs font-mono"
                        onClick={e => {
                          e.stopPropagation();
                          onSeek?.(segment.start);
                        }}
                      >
                        {formatTimestamp(segment.start)}
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {highlightMatch(segment.text, searchQuery)}
                      </p>
                      {quality === 'low' && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Low confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="full">
            <div className="prose prose-sm max-w-none dark:prose-invert max-h-96 overflow-y-auto">
              <p className="whitespace-pre-wrap">
                {highlightMatch(fullTranscript, searchQuery)}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
