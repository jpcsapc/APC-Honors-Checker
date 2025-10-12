'use client';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback } from 'react';

interface RowData {
  subjectCode: string;
  unit: number;
  grade: string;
  honorPoints: number;
}

interface TermTableProps {
  term: string;
  onStatsChange?: (term: string, stats: { gpa: number; totalHonorPoints: number; totalUnits: number; rGrades: number }) => void;
}

export function TermTable({ term, onStatsChange }: TermTableProps) {
  const [rows, setRows] = useState<RowData[]>(() =>
    Array(4).fill(null).map(() => ({
      subjectCode: '',
      unit: 0,
      grade: '',
      honorPoints: 0
    }))
  );

  // Helper to check for NAT/SER subjects, ignoring case and allowing partials
  const isNatSer = useCallback((code: string) => (code || '').toUpperCase().startsWith('NATSER'), []);

  const updateRow = (index: number, field: keyof RowData, value: string | number) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value } as RowData;

    // Recalculate honor points for this row
    if (field === 'grade' || field === 'unit' || field === 'subjectCode') {
      const subj = newRows[index].subjectCode;
      // If this is a NAT/SER row, honor points are not applicable
      if (isNatSer(subj)) {
        newRows[index].honorPoints = 0;
      } else {
        const gradeStr = newRows[index].grade;
        const grade = gradeStr.toUpperCase() === 'R' ? 0 : parseFloat(gradeStr) || 0;
        const unit = Number(newRows[index].unit) || 0;
        newRows[index].honorPoints = grade * unit;
      }
    }

    setRows(newRows);
  };

  const addRow = () => {
    if (rows.length < 10) {
      setRows([...rows, {
        subjectCode: '',
        unit: 0,
        grade: '',
        honorPoints: 0
      }] as RowData[]);
    }
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
    }
  };

  const termStats = React.useMemo(() => {
    const validRows = rows.filter(row => {
      // Exclude NAT/SER from GPA calculations
      if (isNatSer(row.subjectCode)) return false;
      return row.subjectCode.trim() !== '' && row.grade.trim() !== '' && row.unit > 0;
    });

    if (validRows.length === 0) {
      return { gpa: 0, totalHonorPoints: 0, totalUnits: 0, rGrades: 0 };
    }

    const totalHonorPoints = validRows.reduce((sum, row) => sum + row.honorPoints, 0);
    const totalUnits = validRows.reduce((sum, row) => sum + Number(row.unit), 0);
    const gpa = totalUnits > 0 ? totalHonorPoints / totalUnits : 0;
    const rGrades = validRows.filter(row => row.grade.toUpperCase() === 'R').length;

    return {
      gpa: gpa,
      totalHonorPoints: totalHonorPoints,
      totalUnits: totalUnits,
      rGrades: rGrades
    };
  }, [rows, isNatSer]);

  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(term, termStats);
    }
  }, [termStats, term, onStatsChange]);

  return (
    <Card className="shadow-md min-w-[250px] flex flex-col h-[650 px]">
      <CardContent className="flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-2">{term}</h2>
        <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr] gap-2 text-sm font-medium mb-2">
          <span>Subject Code</span>
          <span>Unit</span>
          <span>Grade</span>
          <span>Honor Pts</span>
        </div>

        <div className="flex-1">
          {rows.map((row, i) => {
            const isNatSerRow = isNatSer(row.subjectCode);
            const natSerClassName = 'bg-gray-100 text-gray-500';

            return (
              <div key={i} className={cn(
                "grid grid-cols-[2fr_0.7fr_1fr_1fr_auto] gap-2 mb-1 items-center",
                isNatSerRow && "opacity-60"
              )}>
                {/* Subject Code Input */}
                <Input
                  placeholder="Subject Code"
                  value={row.subjectCode}
                  onChange={(e) => updateRow(i, 'subjectCode', e.target.value)}
                  type="text"
                  className={cn(isNatSerRow && natSerClassName)}
                />

                {/* Editable Unit Input */}
                <Input
                  placeholder="0"
                  value={row.unit || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+(\.\d+)?$/.test(value)) {
                      updateRow(i, 'unit', parseFloat(value) || 0);
                    }
                  }}
                  type="text"
                  className={cn(isNatSerRow && natSerClassName)}
                />

                {/* Grade Input */}
                <Input
                  placeholder="1.25 or R"
                  value={row.grade}
                  onChange={(e) => updateRow(i, 'grade', e.target.value)}
                  type="text"
                  className={cn(isNatSerRow && natSerClassName)}
                />

                {/* Honor Points (readonly) */}
                <div>
                  {isNatSerRow ? (
                    <Input
                      value="N/A"
                      readOnly
                      disabled
                      className={cn(natSerClassName)}
                    />
                  ) : (
                    <Input
                      placeholder="0.00"
                      value={row.honorPoints.toFixed(2)}
                      readOnly
                      className="bg-gray-100"
                    />
                  )}
                </div>

                {/* Remove Row Button */}
                <button
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 1}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed p-1"
                  title="Remove row"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        {/* Add Row + Totals */}
        <div className="mt-auto pt-4">
          <div className="flex justify-center mb-4">
            <button
              onClick={addRow}
              disabled={rows.length >= 10}
              className="text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium px-3 py-1 border border-blue-300 rounded hover:bg-blue-50 disabled:hover:bg-transparent"
            >
              + Add Subject {rows.length >= 10 && "(Max 10)"}
            </button>
          </div>

          <div className="border-t-2 border-gray-300 pt-2">
            <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr_auto] gap-2 text-sm font-semibold">
              <span className="text-gray-600">TOTAL</span>
              <span className="text-gray-600">{termStats.totalUnits}</span>
              <span className="text-gray-600">GPA: {termStats.gpa.toFixed(2)}</span>
              <span className="text-gray-600">{termStats.totalHonorPoints.toFixed(2)}</span>
              <span></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
