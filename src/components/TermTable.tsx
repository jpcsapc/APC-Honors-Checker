'use client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export function TermTable({ term }: { term: string }) {
  return (
    <Card className="shadow-md min-w-[250px]">
      <CardContent>
        <h2 className="text-lg font-semibold mb-2">{term}</h2>
        <div className="grid grid-cols-4 gap-2 text-sm font-medium mb-2">
          <span>Subject</span>
          <span>Unit</span>
          <span>Grade</span>
          <span>Honor Pts</span>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 mb-1">
            <Input placeholder="e.g. Math" />
            <Input placeholder="3" />
            <Input placeholder="1.25" />
            <Input placeholder="3.0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
