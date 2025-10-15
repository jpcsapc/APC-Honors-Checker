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
  onStatsChange?: (term: string, rows: RowData[]) => void;
  initialRows?: RowData[];
  onEdge?: (direction: "up" | "down" | "left" | "right", fromTerm: string, fromRow: number, fromCol: number) => void;
}

export function TermTable({ term, onStatsChange, initialRows, onEdge }: TermTableProps) {
  const [rows, setRows] = useState<RowData[]>(() => {
    if (initialRows) {
      return initialRows;
    }
    return Array(4).fill(null).map(() => ({
      subjectCode: '',
      unit: 0,
      grade: '',
      honorPoints: 0
    }));
  });

  useEffect(() => {
    if (initialRows) {
      setRows(initialRows);
    }
  }, [initialRows]);

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

  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(term, rows);
    }
  }, [rows, term, onStatsChange]);

  // Handle arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    // Only handle arrow keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }

    e.preventDefault();

    let newRowIndex = rowIndex;
    let newColIndex = colIndex;

    switch (e.key) {
      case 'ArrowUp':
        if (rowIndex > 0) {
          newRowIndex = rowIndex - 1;
          const cellId = `cell-${term}-${newRowIndex}-${colIndex}`;
          const targetInput = document.getElementById(cellId) as HTMLInputElement;
          if (targetInput) {
            targetInput.focus();
            targetInput.select();
          }
        } else if (onEdge) {
          // At top edge, try to go to table above
          onEdge('up', term, rowIndex, colIndex);
        }
        return;

      case 'ArrowDown':
        if (rowIndex < rows.length - 1) {
          newRowIndex = rowIndex + 1;
          const cellId = `cell-${term}-${newRowIndex}-${colIndex}`;
          const targetInput = document.getElementById(cellId) as HTMLInputElement;
          if (targetInput) {
            targetInput.focus();
            targetInput.select();
          }
        } else if (onEdge) {
          // At bottom edge, try to go to table below
          onEdge('down', term, rowIndex, colIndex);
        }
        return;

      case 'ArrowLeft':
        if (colIndex > 0) {
          newColIndex = colIndex - 1;
          const cellId = `cell-${term}-${rowIndex}-${newColIndex}`;
          const targetInput = document.getElementById(cellId) as HTMLInputElement;
          if (targetInput) {
            targetInput.focus();
            targetInput.select();
          }
        } else if (onEdge) {
          // At left edge, try to go to table on the left
          onEdge('left', term, rowIndex, colIndex);
        }
        return;

      case 'ArrowRight':
        if (colIndex < 2) { // Max is column 2 (Grade column)
          newColIndex = colIndex + 1;
          const cellId = `cell-${term}-${rowIndex}-${newColIndex}`;
          const targetInput = document.getElementById(cellId) as HTMLInputElement;
          if (targetInput) {
            targetInput.focus();
            targetInput.select();
          }
        } else if (onEdge) {
          // At right edge, try to go to table on the right
          onEdge('right', term, rowIndex, colIndex);
        }
        return;
    }
  };

  return (
    <Card className="shadow-md min-w-[250px] flex flex-col">
      <CardContent className="flex flex-col">
        <h2 className="text-lg font-semibold mb-2">{term}</h2>
        <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr] gap-2 text-sm font-medium mb-2">
          <span>Subject Code</span>
          <span>Unit</span>
          <span>Grade</span>
          <span className="relative left-[-12px]">Honor Pts</span>
        </div>

        <div>
          {rows.map((row, i) => {
            const isNatSerRow = isNatSer(row.subjectCode);
            const natSerClassName = 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';

            return (
              <div key={i} className={cn(
                "grid grid-cols-[2fr_0.7fr_1fr_1fr_auto] gap-2 mb-1 items-center",
                isNatSerRow && "opacity-60"
              )}>
                {/* Subject Code Input */}
                <Input
                  id={`cell-${term}-${i}-0`}
                  placeholder="Subject Code"
                  value={row.subjectCode}
                  onChange={(e) => updateRow(i, 'subjectCode', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, i, 0)}
                  type="text"
                  className={cn(isNatSerRow && natSerClassName)}
                />

                {/* Editable Unit Input */}
                <Input
                  id={`cell-${term}-${i}-1`}
                  placeholder="0"
                  value={row.unit || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+(\.\d+)?$/.test(value)) {
                      updateRow(i, 'unit', parseFloat(value) || 0);
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, i, 1)}
                  type="text"
                  className={cn(isNatSerRow && natSerClassName)}
                />

                {/* Grade Input */}
                <Input
                  id={`cell-${term}-${i}-2`}
                  placeholder="1.25 or R"
                  value={row.grade}
                  onChange={(e) => updateRow(i, 'grade', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, i, 2)}
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
                      tabIndex={-1}
                    />
                  ) : (
                    <Input
                      placeholder="0.00"
                      value={row.honorPoints.toFixed(2)}
                      readOnly
                      className="bg-gray-100 dark:bg-gray-800"
                      tabIndex={-1}
                    />
                  )}
                </div>

                {/* Remove Row Button */}
                <button
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 1}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed p-1"
                  title="Remove row"
                  tabIndex={-1}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        {/* Add Row + Totals */}
        <div className="mt-4 pt-4">
          <div className="flex justify-center mb-4">
            <button
              onClick={addRow}
              disabled={rows.length >= 10}
              className="text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium px-3 py-1 border border-blue-300 rounded hover:bg-blue-50 disabled:hover:bg-transparent dark:border-blue-600 dark:hover:bg-blue-950"
            >
              + Add Subject {rows.length >= 10 && "(Max 10)"}
            </button>
          </div>

          <div className="border-t-2 border-gray-300 pt-2 dark:border-gray-700">
            <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr_auto] gap-2 text-sm font-semibold">
              <span className="text-gray-600"></span>
              <span className="text-gray-600"></span>
              <span className="text-gray-600"></span>
              <span className="text-gray-600"></span>
              <span></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
