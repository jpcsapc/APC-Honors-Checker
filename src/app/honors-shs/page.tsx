"use client"
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calculator, Zap, Award, Upload } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";

interface SHSRowData {
  subjectCode: string;
  grade: string;
}

// ── Custom SHS Term Table Component for Full Mode ──
interface SHSTermTableProps {
  term: string;
  initialRows: SHSRowData[];
  onChange: (term: string, rows: SHSRowData[]) => void;
  onEdge: (direction: "up" | "down" | "left" | "right", fromTerm: string, fromRow: number, fromCol: number) => void;
}

const SHSTermTable = React.memo(({ term, initialRows, onChange, onEdge }: SHSTermTableProps) => {
  const [rows, setRows] = React.useState<SHSRowData[]>(() => {
    if (initialRows && initialRows.length > 0) {
      // Safely filter out units if migrated from older localStorage schemas
      return initialRows.map(row => ({
        subjectCode: row.subjectCode || '',
        grade: row.grade || ''
      }));
    }
    return Array(4).fill(null).map(() => ({ subjectCode: '', grade: '' }));
  });

  const isEditingRef = React.useRef(false);
  const lastInitialRowsRef = React.useRef(initialRows);

  React.useEffect(() => {
    if (initialRows && !isEditingRef.current && initialRows !== lastInitialRowsRef.current) {
      setRows(initialRows);
      lastInitialRowsRef.current = initialRows;
    }
  }, [initialRows]);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (onChange) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onChange(term, rows);
      }, 300);
    }
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [rows, term, onChange]);

  const totals = React.useMemo(() => {
    const validRows = rows.filter(row => row.subjectCode.trim() !== '' && row.grade.trim() !== '');
    const totalSubjects = validRows.length;
    const totalGradePoints = validRows.reduce((sum, row) => sum + parseFloat(row.grade), 0);
    const average = totalSubjects > 0 ? (totalGradePoints / totalSubjects).toFixed(2) : '0.00';

    return { totalSubjects, average };
  }, [rows]);

  const isValidGrade = React.useCallback((value: string): boolean => {
    if (value === '') return true;
    const numericRegex = /^\d*\.?\d*$/;
    if (!numericRegex.test(value)) return false;

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue < 0 || numValue > 100) return false;
      const decimalPart = value.split('.')[1];
      if (decimalPart !== undefined && decimalPart.length > 2) return false;
    }
    return true;
  }, []);

  const updateRow = React.useCallback((index: number, field: keyof SHSRowData, value: string | number) => {
    isEditingRef.current = true;
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[index] = { ...newRows[index], [field]: value } as SHSRowData;
      return newRows;
    });
    setTimeout(() => {
      isEditingRef.current = false;
    }, 500);
  }, []);

  const addRow = React.useCallback(() => {
    if (rows.length < 10) {
      setRows(prev => [...prev, { subjectCode: '', grade: '' }]);
    }
  }, [rows.length]);

  const removeRow = React.useCallback((index: number) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter((_, i) => i !== index));
    }
  }, [rows.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();

    let newRowIndex = rowIndex;
    let newColIndex = colIndex;

    switch (e.key) {
      case 'ArrowUp':
        if (rowIndex > 0) {
          newRowIndex = rowIndex - 1;
          const cellId = `cell-shs-${term}-${newRowIndex}-${colIndex}`;
          const el = document.getElementById(cellId) as HTMLInputElement;
          if (el) { el.focus(); el.select(); }
        } else if (onEdge) {
          onEdge('up', term, rowIndex, colIndex);
        }
        return;
      case 'ArrowDown':
        if (rowIndex < rows.length - 1) {
          newRowIndex = rowIndex + 1;
          const cellId = `cell-shs-${term}-${newRowIndex}-${colIndex}`;
          const el = document.getElementById(cellId) as HTMLInputElement;
          if (el) { el.focus(); el.select(); }
        } else if (onEdge) {
          onEdge('down', term, rowIndex, colIndex);
        }
        return;
      case 'ArrowLeft':
        if (colIndex > 0) {
          newColIndex = colIndex - 1;
          const cellId = `cell-shs-${term}-${rowIndex}-${newColIndex}`;
          const el = document.getElementById(cellId) as HTMLInputElement;
          if (el) { el.focus(); el.select(); }
        } else if (onEdge) {
          onEdge('left', term, rowIndex, colIndex);
        }
        return;
      case 'ArrowRight':
        if (colIndex < 1) {
          newColIndex = colIndex + 1;
          const cellId = `cell-shs-${term}-${rowIndex}-${newColIndex}`;
          const el = document.getElementById(cellId) as HTMLInputElement;
          if (el) { el.focus(); el.select(); }
        } else if (onEdge) {
          onEdge('right', term, rowIndex, colIndex);
        }
        return;
    }
  };

  return (
    <Card className="shadow-md min-w-[250px] flex flex-col">
      <CardContent className="flex flex-col pt-6">
        <h2 className="text-lg font-semibold mb-3">{term}</h2>
        <div className="grid grid-cols-[3fr_1.5fr_auto] gap-2 text-sm font-medium mb-2 px-1">
          <span>Subject Code</span>
          <span>Grade (%)</span>
          <span className="w-6"></span>
        </div>

        <div className="space-y-1.5">
          {rows.map((row, i) => {
            const parsedGrade = parseFloat(row.grade);
            const isAlertGrade = !isNaN(parsedGrade) && parsedGrade < 85.00 && parsedGrade >= 0;

            return (
              <div key={i} className="grid grid-cols-[3fr_1.5fr_auto] gap-2 items-center">
                <Input
                  id={`cell-shs-${term}-${i}-0`}
                  placeholder="e.g. GenMath"
                  value={row.subjectCode}
                  onChange={(e) => updateRow(i, 'subjectCode', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, i, 0)}
                  type="text"
                />

                <Input
                  id={`cell-shs-${term}-${i}-1`}
                  placeholder="85.00"
                  value={row.grade}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isValidGrade(value)) {
                      updateRow(i, 'grade', value);
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, i, 1)}
                  type="text"
                  autoComplete="off"
                  className={cn(
                    isAlertGrade && "border-red-500 text-red-500 bg-red-50 focus-visible:ring-red-500 dark:bg-red-950/20"
                  )}
                />

                <button
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 1}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed text-lg w-6 flex justify-center"
                  title="Remove row"
                  tabIndex={-1}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t">
          <div className="grid grid-cols-[3fr_1.5fr_auto] gap-2 text-xs font-semibold text-muted-foreground px-1 mb-4">
            <span>TOTALS</span>
            <span className="text-foreground">Avg: {totals.average}% ({totals.totalSubjects} {totals.totalSubjects === 1 ? 'Subject' : 'Subjects'})</span>
            <span></span>
          </div>

          <div className="flex justify-center">
            <button
              onClick={addRow}
              disabled={rows.length >= 10}
              className="text-foreground hover:text-foreground disabled:text-gray-400 disabled:cursor-not-allowed text-xs font-medium px-3 py-1.5 border border-border rounded hover:bg-muted disabled:hover:bg-transparent transition-colors"
            >
              + Add Subject {rows.length >= 10 && "(Max 10)"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SHSTermTable.displayName = 'SHSTermTable';

// ── Lite Mode term row grade input ──
function SHSLiteTermRow({
  termNum,
  yearKey,
  gradeValue,
  onGradeChange,
  onKeyDown,
}: {
  termNum: number;
  yearKey: string;
  gradeValue: string;
  onGradeChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, termNum: number, yearKey: string) => void;
}) {
  const parsedGrade = parseFloat(gradeValue);
  const isAlertGrade = !isNaN(parsedGrade) && parsedGrade < 85.00 && parsedGrade >= 0;

  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <label
        htmlFor={`lite-shs-${yearKey}-grade-${termNum}`}
        className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
      >
        Term {termNum}
      </label>
      <input
        id={`lite-shs-${yearKey}-grade-${termNum}`}
        type="number"
        step="0.01"
        min="0"
        max="100"
        value={gradeValue}
        onChange={e => {
          const val = e.target.value;
          if (val === '' || (/^\d*\.?\d*$/.test(val) && parseFloat(val) <= 100)) {
            onGradeChange(val);
          }
        }}
        onKeyDown={e => onKeyDown(e, termNum, yearKey)}
        placeholder="88.00"
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors",
          isAlertGrade && "border-red-500 text-red-500 bg-red-50 dark:bg-red-950/20 focus:ring-red-500"
        )}
      />
    </div>
  );
}

export default function SHSHonorsCalcu() {
  const [liteMode, setLiteMode] = React.useState(true);
  const [strictGradesMode, setStrictGradesMode] = React.useState(false);
  const [peGrades, setPeGrades] = React.useState({ pe1: "", pe2: "", pe3: "", pe4: "" });
  const [liteData, setLiteData] = React.useState<Record<string, { term1: string; term2: string; term3: string; hasLowerThan85: boolean }>>({
    "Grade 11": { term1: "", term2: "", term3: "", hasLowerThan85: false },
    "Grade 12": { term1: "", term2: "", term3: "", hasLowerThan85: false },
  });

  const [fullData, setFullData] = React.useState<Record<string, SHSRowData[]>>({});

  const fullDataRef = React.useRef(fullData);
  fullDataRef.current = fullData;

  // ── JSON Import ──
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importError, setImportError] = React.useState<string | null>(null);

  const handleJsonImport = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        const grades: Array<{
          subject_id: string;
          subject_code: string;
          units: string;
          grade: string;
          period_id: number;
          subject?: { id: string; name: string };
          term: { school_year: string; term: string };
        }> = json.grades || [];

        if (grades.length === 0) {
          setImportError("No grades found in the JSON. Make sure you copied the full response from the RAMS gradesviewer network request.");
          return;
        }

        setImportError(null);

        // Find min school_year to identify Grade 11 vs 12
        const uniqueYears = [...new Set(grades.map(g => parseInt(g.term.school_year)))].filter(y => !isNaN(y)).sort();

        if (uniqueYears.length === 0) {
          setImportError("No valid school years found in the JSON.");
          return;
        }
        const minYear = uniqueYears[0];

        interface GroupedGrade {
          termKey: string;
          subjectCode: string;
          subjectName: string;
          period5Grade: number | null;
          period6Grade: number | null;
        }

        const groups: Record<string, GroupedGrade> = {};

        for (const entry of grades) {
          const yearVal = parseInt(entry.term.school_year);
          if (isNaN(yearVal)) continue;

          let gradeYear = "";
          if (yearVal === minYear) {
            gradeYear = "Grade 11";
          } else if (yearVal >= minYear + 1) {
            gradeYear = "Grade 12";
          } else {
            continue;
          }

          const termKey = `${gradeYear} Term ${entry.term.term}`;
          const subjectId = entry.subject_id || entry.subject_code || entry.subject?.id || entry.subject?.name || "";
          if (!subjectId) continue;

          const key = `${termKey}_${subjectId}`;
          if (!groups[key]) {
            groups[key] = {
              termKey,
              subjectCode: entry.subject_code || "",
              subjectName: entry.subject?.name || "",
              period5Grade: null,
              period6Grade: null,
            };
          }

          const gradeVal = parseFloat(entry.grade);
          if (!isNaN(gradeVal)) {
            if (entry.period_id === 5) {
              groups[key].period5Grade = gradeVal;
            } else if (entry.period_id === 6) {
              groups[key].period6Grade = gradeVal;
            } else {
              groups[key].period6Grade = gradeVal;
            }
          }
        }

        const newFullData: Record<string, SHSRowData[]> = {
          "Grade 11 Term 1": [],
          "Grade 11 Term 2": [],
          "Grade 11 Term 3": [],
          "Grade 12 Term 1": [],
          "Grade 12 Term 2": [],
          "Grade 12 Term 3": [],
        };

        const newPeGrades = { pe1: "", pe2: "", pe3: "", pe4: "" };

        for (const group of Object.values(groups)) {
          let finalGradeVal: number;
          if (group.period5Grade !== null && group.period6Grade !== null) {
            finalGradeVal = (group.period5Grade + group.period6Grade) / 2;
          } else if (group.period6Grade !== null) {
            finalGradeVal = group.period6Grade;
          } else if (group.period5Grade !== null) {
            finalGradeVal = group.period5Grade;
          } else {
            continue;
          }

          const gradeStr = finalGradeVal % 1 === 0 ? finalGradeVal.toString() : finalGradeVal.toFixed(1);
          const subCode = group.subjectCode.toUpperCase();
          const subName = group.subjectName.toUpperCase();

          if (subCode === "SHPEH01" || subName.includes("PHYSICAL EDUCATION AND HEALTH 1")) {
            newPeGrades.pe1 = gradeStr;
          } else if (subCode === "SHPEH02" || subName.includes("PHYSICAL EDUCATION AND HEALTH 2")) {
            newPeGrades.pe2 = gradeStr;
          } else if (subCode === "SHPEH03" || subName.includes("PHYSICAL EDUCATION AND HEALTH 3")) {
            newPeGrades.pe3 = gradeStr;
          } else if (subCode === "SHPEH04" || subName.includes("PHYSICAL EDUCATION AND HEALTH 4")) {
            newPeGrades.pe4 = gradeStr;
          } else {
            if (newFullData[group.termKey]) {
              newFullData[group.termKey].push({
                subjectCode: group.subjectCode,
                grade: gradeStr,
              });
            }
          }
        }

        Object.keys(newFullData).forEach(termKey => {
          const rows = newFullData[termKey];
          while (rows.length < 4) {
            rows.push({ subjectCode: "", grade: "" });
          }
        });

        setFullData(newFullData);
        setPeGrades(newPeGrades);
        setLiteMode(false);
        setStrictGradesMode(true);
      } catch (err) {
        console.error("Failed to parse JSON", err);
        setImportError("Invalid JSON file. The file could not be parsed — make sure you saved the complete response from the RAMS gradesviewer network tab, not a partial copy.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  // Load persisted data
  React.useEffect(() => {
    try {
      const savedLiteMode = localStorage.getItem("shsLiteMode");
      if (savedLiteMode !== null) setLiteMode(JSON.parse(savedLiteMode));

      const savedStrictGrades = localStorage.getItem("shsStrictGradesMode");
      if (savedStrictGrades !== null) {
        const isStrict = JSON.parse(savedStrictGrades);
        setStrictGradesMode(isStrict);
        if (isStrict) setLiteMode(false);
      }

      const savedPEGrades = localStorage.getItem("shsPeGrades");
      if (savedPEGrades) {
        setPeGrades(JSON.parse(savedPEGrades));
      }

      const savedLiteData = localStorage.getItem("shsLiteData");
      if (savedLiteData) {
        const parsed = JSON.parse(savedLiteData);
        if (parsed["Grade 11"] || parsed["Grade 12"]) {
          setLiteData(parsed);
        }
      }

      const savedFullData = localStorage.getItem("shsFullData");
      if (savedFullData) {
        const parsed = JSON.parse(savedFullData);
        const cleaned: Record<string, SHSRowData[]> = {};
        Object.entries(parsed).forEach(([termKey, rows]) => {
          if (Array.isArray(rows)) {
            cleaned[termKey] = rows.map((row: any) => ({
              subjectCode: row.subjectCode || "",
              grade: row.grade || ""
            }));
          }
        });
        setFullData(cleaned);
      } else {
        // Initialize default empty rows
        setFullData({
          "Grade 11 Term 1": Array(4).fill(null).map(() => ({ subjectCode: "", grade: "" })),
          "Grade 11 Term 2": Array(4).fill(null).map(() => ({ subjectCode: "", grade: "" })),
          "Grade 11 Term 3": Array(4).fill(null).map(() => ({ subjectCode: "", grade: "" })),
          "Grade 12 Term 1": Array(4).fill(null).map(() => ({ subjectCode: "", grade: "" })),
          "Grade 12 Term 2": Array(4).fill(null).map(() => ({ subjectCode: "", grade: "" })),
          "Grade 12 Term 3": Array(4).fill(null).map(() => ({ subjectCode: "", grade: "" })),
        });
      }
    } catch (e) {
      console.error("Failed to load SHS calculator data", e);
    }
  }, []);

  // Save changes
  React.useEffect(() => {
    localStorage.setItem("shsLiteMode", JSON.stringify(liteMode));
  }, [liteMode]);

  React.useEffect(() => {
    localStorage.setItem("shsStrictGradesMode", JSON.stringify(strictGradesMode));
  }, [strictGradesMode]);

  React.useEffect(() => {
    localStorage.setItem("shsPeGrades", JSON.stringify(peGrades));
  }, [peGrades]);

  React.useEffect(() => {
    localStorage.setItem("shsLiteData", JSON.stringify(liteData));
  }, [liteData]);

  const persistFullTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    if (Object.keys(fullData).length === 0) return;
    if (persistFullTimerRef.current) clearTimeout(persistFullTimerRef.current);
    persistFullTimerRef.current = setTimeout(() => {
      localStorage.setItem("shsFullData", JSON.stringify(fullData));
    }, 300);
    return () => { if (persistFullTimerRef.current) clearTimeout(persistFullTimerRef.current); };
  }, [fullData]);

  // Handler for full mode term edits
  const handleTermChange = React.useCallback((term: string, rows: SHSRowData[]) => {
    setFullData(prev => ({ ...prev, [term]: rows }));
  }, []);

  const handleLiteChange = React.useCallback((year: string, field: "term1" | "term2" | "term3", value: string) => {
    setLiteData(prev => ({
      ...prev,
      [year]: { ...prev[year], [field]: value }
    }));
  }, []);

  // Keyboard navigation helpers in Full Mode
  const tableLayout = React.useMemo(() => [
    ["Grade 11 Term 1", "Grade 11 Term 2", "Grade 11 Term 3"],
    ["Grade 12 Term 1", "Grade 12 Term 2", "Grade 12 Term 3"],
  ], []);

  const handleEdge = (
    direction: "up" | "down" | "left" | "right",
    fromTerm: string,
    fromRow: number,
    fromCol: number
  ) => {
    const currentFullData = fullDataRef.current;
    const termRowIndex = tableLayout.findIndex(row => row.includes(fromTerm));
    const termColIndex = tableLayout[termRowIndex]?.indexOf(fromTerm) ?? -1;

    let nextTermName = "";
    let nextCellRow = fromRow;
    let nextCellCol = fromCol;

    if (direction === "left" && fromCol === 0) {
      if (termColIndex > 0) {
        nextTermName = tableLayout[termRowIndex][termColIndex - 1];
        nextCellCol = 1;
      }
    } else if (direction === "right" && fromCol === 1) {
      if (termColIndex < tableLayout[termRowIndex].length - 1) {
        nextTermName = tableLayout[termRowIndex][termColIndex + 1];
        nextCellCol = 0;
      }
    } else if (direction === "up" && fromRow === 0) {
      if (termRowIndex > 0) {
        nextTermName = tableLayout[termRowIndex - 1][termColIndex];
        const targetRows = currentFullData[nextTermName] || [];
        nextCellRow = Math.max(0, targetRows.length - 1);
      }
    } else if (direction === "down" && fromRow === (currentFullData[fromTerm]?.length || 0) - 1) {
      if (termRowIndex < tableLayout.length - 1) {
        nextTermName = tableLayout[termRowIndex + 1][termColIndex];
        nextCellRow = 0;
      }
    }

    if (nextTermName) {
      const nextTermRows = currentFullData[nextTermName] || [];
      if (nextTermRows.length > 0 && nextCellRow >= nextTermRows.length) nextCellRow = nextTermRows.length - 1;
      if (nextCellRow < 0) nextCellRow = 0;
      const nextCellId = `cell-shs-${nextTermName}-${nextCellRow}-${nextCellCol}`;
      const targetInput = document.getElementById(nextCellId) as HTMLInputElement;
      if (targetInput) { targetInput.focus(); targetInput.select(); }
    }
  };

  const handleLiteKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    termNum: number,
    yearKey: string
  ) => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();

    let nextId = "";

    if (e.key === "ArrowRight") {
      if (termNum < 3) {
        nextId = `lite-shs-${yearKey}-grade-${termNum + 1}`;
      } else if (yearKey === "Grade 11") {
        nextId = `lite-shs-Grade 12-grade-1`;
      }
    } else if (e.key === "ArrowLeft") {
      if (termNum > 1) {
        nextId = `lite-shs-${yearKey}-grade-${termNum - 1}`;
      } else if (yearKey === "Grade 12") {
        nextId = `lite-shs-Grade 11-grade-3`;
      }
    } else if (e.key === "ArrowDown" && yearKey === "Grade 11") {
      nextId = `lite-shs-Grade 12-grade-${termNum}`;
    } else if (e.key === "ArrowUp" && yearKey === "Grade 12") {
      nextId = `lite-shs-Grade 11-grade-${termNum}`;
    }

    if (nextId) {
      const el = document.getElementById(nextId) as HTMLInputElement;
      if (el) { el.focus(); el.select(); }
    }
  };

  // ── Calculation Logic ──

  const peStats = React.useMemo(() => {
    const pe1Val = parseFloat(peGrades.pe1);
    const pe2Val = parseFloat(peGrades.pe2);
    const pe3Val = parseFloat(peGrades.pe3);
    const pe4Val = parseFloat(peGrades.pe4);

    const hasPE1 = !isNaN(pe1Val) && pe1Val >= 0 && peGrades.pe1 !== "";
    const hasPE2 = !isNaN(pe2Val) && pe2Val >= 0 && peGrades.pe2 !== "";
    const hasPE3 = !isNaN(pe3Val) && pe3Val >= 0 && peGrades.pe3 !== "";
    const hasPE4 = !isNaN(pe4Val) && pe4Val >= 0 && peGrades.pe4 !== "";

    let midtermPE = 0;
    let endtermPE = 0;
    let finalPE = 0;

    const hasMidterm = hasPE1 && hasPE2;
    const hasEndterm = hasPE3 && hasPE4;

    if (hasMidterm) {
      midtermPE = (pe1Val + pe2Val) / 2;
    }
    if (hasEndterm) {
      endtermPE = (pe3Val + pe4Val) / 2;
    }

    if (hasMidterm && hasEndterm) {
      finalPE = (midtermPE + endtermPE) / 2;
    } else if (hasMidterm) {
      finalPE = midtermPE;
    } else if (hasEndterm) {
      finalPE = endtermPE;
    }

    return {
      midtermPE,
      endtermPE,
      finalPE,
      hasMidterm,
      hasEndterm,
      hasPE: hasMidterm || hasEndterm,
    };
  }, [peGrades]);

  // Lite Mode Calculation Stats
  const liteStats = React.useMemo(() => {
    const stats: Record<string, { average: number; eligible: string; award: string; hasTermBelow85: boolean }> = {};

    Object.entries(liteData).forEach(([year, data]) => {
      const t1 = parseFloat(data.term1);
      const t2 = parseFloat(data.term2);
      const t3 = parseFloat(data.term3);

      const terms = [t1, t2, t3].filter(v => !isNaN(v) && v > 0);
      if (terms.length === 0) {
        stats[year] = { average: 0, eligible: "No data", award: "None", hasTermBelow85: false };
        return;
      }

      const avg = terms.reduce((a, b) => a + b, 0) / terms.length;
      const hasTermBelow85 = terms.some(v => v < 85.00);

      let award = "None";
      let eligible = "No";

      if (data.hasLowerThan85) {
        eligible = "No, has grade lower than 85.00";
      } else if (hasTermBelow85) {
        eligible = "No, term average below 85.00";
      } else if (avg >= 88.00) {
        eligible = "Yes";
        if (avg >= 97.00) award = "With Highest Honors";
        else if (avg >= 93.00) award = "With High Honors";
        else award = "With Honors";
      } else {
        eligible = "No, average below 88.00";
      }

      stats[year] = { average: avg, eligible, award, hasTermBelow85 };
    });

    return stats;
  }, [liteData]);

  // Lite Mode Overall Summary
  const liteSummary = React.useMemo(() => {
    const years = Object.values(liteStats).filter(s => s.average > 0);
    if (years.length === 0) return { overallAverage: "0.00", overallAward: "None", reason: "No data entered" };

    const sum = years.reduce((acc, curr) => acc + curr.average, 0);
    const overallAverage = sum / years.length;

    const hasAnyLowerThan85 = Object.entries(liteData).some(([year, data]) => {
      const stats = liteStats[year];
      return data.hasLowerThan85 || stats.hasTermBelow85;
    });

    let overallAward = "None";
    let reason = "";

    if (hasAnyLowerThan85) {
      reason = "Has subject grade or term average below 85.00";
    } else if (overallAverage >= 88.00) {
      if (overallAverage >= 97.00) overallAward = "With Highest Honors";
      else if (overallAverage >= 93.00) overallAward = "With High Honors";
      else overallAward = "With Honors";
    } else {
      reason = "Overall General Average below 88.00";
    }

    return {
      overallAverage: overallAverage.toFixed(2),
      overallAward,
      reason,
      rawAverage: overallAverage
    };
  }, [liteStats, liteData]);

  // Lite Mode averages term grades instead of individual subject grades, so a result
  // sitting right on an honors cutoff may flip once precise subject-level data is used.
  const liteThresholdWarning = React.useMemo(() => {
    if (liteSummary.rawAverage === undefined) return false;
    const margin = 0.5;
    const thresholds = [88.00, 93.00, 97.00];
    return thresholds.some(t => Math.abs((liteSummary.rawAverage as number) - t) <= margin);
  }, [liteSummary]);

  // Full Mode Calculation Stats
  const fullStats = React.useMemo(() => {
    const stats: Record<string, { average: number; eligible: string; award: string; hasLowerThan85: boolean; totalSubjects: number }> = {};
    const years = ["Grade 11", "Grade 12"];

    years.forEach(year => {
      const termKeys = [`${year} Term 1`, `${year} Term 2`, `${year} Term 3`];
      const validRows: SHSRowData[] = [];

      termKeys.forEach(term => {
        const rows = fullData[term] || [];
        rows.forEach(row => {
          if (row.subjectCode.trim() !== '' && row.grade.trim() !== '') {
            validRows.push(row);
          }
        });
      });

      let totalGradePoints = validRows.reduce((sum, r) => sum + parseFloat(r.grade), 0);
      let totalSubjects = validRows.length;
      let hasLowerThan85 = validRows.some(r => parseFloat(r.grade) < 85.00);

      if (strictGradesMode) {
        if (year === "Grade 11" && peStats.hasMidterm) {
          totalGradePoints += peStats.midtermPE;
          totalSubjects += 1;
          if (peStats.midtermPE < 85.00) {
            hasLowerThan85 = true;
          }
        } else if (year === "Grade 12" && peStats.hasEndterm) {
          totalGradePoints += peStats.endtermPE;
          totalSubjects += 1;
          if (peStats.endtermPE < 85.00) {
            hasLowerThan85 = true;
          }
        }
      }

      if (totalSubjects === 0) {
        stats[year] = { average: 0, eligible: "No data", award: "None", hasLowerThan85: false, totalSubjects: 0 };
        return;
      }

      const average = totalGradePoints / totalSubjects;
      let award = "None";
      let eligible = "No";

      if (hasLowerThan85) {
        eligible = "No, has grade lower than 85.00";
      } else if (average >= 88.00) {
        eligible = "Yes";
        if (average >= 97.00) award = "With Highest Honors";
        else if (average >= 93.00) award = "With High Honors";
        else award = "With Honors";
      } else {
        eligible = "No, average below 88.00";
      }

      stats[year] = { average, eligible, award, hasLowerThan85, totalSubjects };
    });

    return stats;
  }, [fullData, strictGradesMode, peStats]);

  // Full Mode Overall Summary
  const fullSummary = React.useMemo(() => {
    const activeYears = Object.keys(fullStats).filter(year => fullStats[year].totalSubjects > 0);
    if (activeYears.length === 0) return { overallAverage: "0.00", overallAward: "None", reason: "No subjects entered" };

    let overallAverage = 0;
    if (strictGradesMode) {
      let totalGradePointsAll = 0;
      let totalSubjectsAll = 0;

      // Sum all G11 and G12 subjects
      Object.entries(fullData).forEach(([termKey, rows]) => {
        if (rows && Array.isArray(rows)) {
          rows.forEach(row => {
            if (row.subjectCode.trim() !== '' && row.grade.trim() !== '') {
              totalGradePointsAll += parseFloat(row.grade);
              totalSubjectsAll += 1;
            }
          });
        }
      });

      // Add PE if active
      if (peStats.hasPE) {
        totalGradePointsAll += peStats.finalPE;
        totalSubjectsAll += 1;
      }

      overallAverage = totalSubjectsAll > 0 ? (totalGradePointsAll / totalSubjectsAll) : 0;
    } else {
      // Overall SHS average is calculated as the simple average of Grade 11 average and Grade 12 average
      const sum = activeYears.reduce((acc, year) => acc + fullStats[year].average, 0);
      overallAverage = sum / activeYears.length;
    }

    let hasAnyLowerThan85 = false;

    // Check subjects in tables
    Object.entries(fullData).forEach(([termKey, rows]) => {
      if (rows && Array.isArray(rows)) {
        rows.forEach(row => {
          if (row.subjectCode.trim() !== '' && row.grade.trim() !== '') {
            if (parseFloat(row.grade) < 85.00) {
              hasAnyLowerThan85 = true;
            }
          }
        });
      }
    });

    if (strictGradesMode) {
      if (peStats.hasPE && peStats.finalPE < 85.00) {
        hasAnyLowerThan85 = true;
      }
    } else {
      hasAnyLowerThan85 = activeYears.some(year => fullStats[year].hasLowerThan85);
    }

    let overallAward = "None";
    let reason = "";

    if (hasAnyLowerThan85) {
      reason = "Has subject grade below 85.00";
    } else if (overallAverage >= 88.00) {
      if (overallAverage >= 97.00) overallAward = "With Highest Honors";
      else if (overallAverage >= 93.00) overallAward = "With High Honors";
      else overallAward = "With Honors";
    } else {
      reason = "Overall General Average below 88.00";
    }

    return {
      overallAverage: overallAverage.toFixed(2),
      overallAward,
      reason
    };
  }, [fullStats, fullData, strictGradesMode, peStats]);

  const summary = liteMode ? liteSummary : fullSummary;
  const currentStats = liteMode ? liteStats : fullStats;

  return (
    <div className="min-h-screen bg-background">
      <Header title="SHS Grades Calculator" backHref="/" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Calculator className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-normal text-foreground mb-4">SHS Grades Calculator</h1>
          <p className="text-muted-foreground text-lg">
            <AnimatePresence mode="wait">
              <motion.span
                key={liteMode ? "lite" : "full"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {liteMode ? (
                  <>Enter your general average for each term (3 terms per year)</>
                ) : (
                  <>
                    Enter subjects and grades for each term of Grade 11 & Grade 12 <br />
                    You can use the arrow keys on your keyboard for easier navigation ^^ <br />
                    (Click on any input box first, then navigate!)
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </p>

          {/* Toggles */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {/* Lite Mode Toggle */}
            <div className="flex items-center gap-2.5">
              <button
                role="checkbox"
                aria-checked={liteMode}
                onClick={() => {
                  if (!liteMode) {
                    setLiteMode(true);
                    setStrictGradesMode(false);
                  }
                }}
                className={`
                  relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center
                  rounded border-2 transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                  ${liteMode
                    ? 'bg-foreground border-foreground'
                    : 'bg-background border-input hover:border-foreground/50'
                  }
                `}
              >
                {liteMode && (
                  <svg
                    className="h-3 w-3 text-background"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <label
                onClick={() => {
                  if (!liteMode) {
                    setLiteMode(true);
                    setStrictGradesMode(false);
                  }
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
              >
                <Zap className="h-3.5 w-3.5" />
                Lite Mode
              </label>
            </div>

            {/* Strict Grades Mode Toggle */}
            <div className="flex items-center gap-2.5">
              <button
                role="checkbox"
                aria-checked={strictGradesMode}
                onClick={() => {
                  if (!strictGradesMode) {
                    setStrictGradesMode(true);
                    setLiteMode(false);
                  }
                }}
                className={`
                  relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center
                  rounded border-2 transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                  ${strictGradesMode
                    ? 'bg-foreground border-foreground'
                    : 'bg-background border-input hover:border-foreground/50'
                  }
                `}
              >
                {strictGradesMode && (
                  <svg
                    className="h-3 w-3 text-background"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <label
                onClick={() => {
                  if (!strictGradesMode) {
                    setStrictGradesMode(true);
                    setLiteMode(false);
                  }
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
              >
                <Calculator className="h-3.5 w-3.5" />
                Strict Grades Mode
              </label>
            </div>
          </div>

          {/* Import JSON Button */}
          <div className="flex flex-col items-center gap-2 mt-3">
            <div className="flex items-center justify-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json,text/plain"
                onChange={handleJsonImport}
                className="hidden"
                id="json-import-input"
              />
              <button
                onClick={() => { setImportError(null); fileInputRef.current?.click(); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors px-3 py-1.5 border border-border rounded-md hover:bg-muted"
              >
                <Upload className="h-3.5 w-3.5" />
                Import Grades (JSON)
              </button>
            </div>
            {importError && (
              <div className="flex items-start gap-2 max-w-md text-left bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
                <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed flex-1">
                  {importError}{" "}
                  <a href="/faqs" className="underline font-medium hover:text-red-700 dark:hover:text-red-300">See the FAQ guide</a> for how to get the correct file.
                </p>
                <button onClick={() => setImportError(null)} className="text-red-400 hover:text-red-600 shrink-0 text-base leading-none">×</button>
              </div>
            )}
          </div>
        </div>

        {/* Overall Honors Summary Card */}
        <div className="flex flex-col items-center mb-10">
          <AnimatePresence mode="wait">
            <motion.div
              layout
              key={liteMode ? "lite-summary" : "full-summary"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-0 flex-wrap justify-center items-center p-6 rounded-xl border bg-card/50 shadow-sm"
            >
              <div className="flex flex-col items-center px-8 py-2 border-r border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Overall General Average</p>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {summary.overallAverage}%
                </p>
              </div>
              <div className="flex flex-col items-center px-8 py-2">
                <p className="text-sm text-muted-foreground mb-1">Graduation Honors Eligibility</p>
                <p className={cn(
                  "text-3xl font-bold tracking-tight",
                  summary.overallAward !== "None" ? "text-primary" : "text-muted-foreground/70"
                )}>
                  {summary.overallAward}
                </p>
                {summary.overallAward === "None" && summary.reason && (
                  <p className="text-xs text-red-500/80 mt-1 max-w-[200px] text-center leading-tight">
                    {summary.reason}
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          {liteMode && (
            <p className="text-xs text-amber-600/90 dark:text-amber-500/95 mt-3 max-w-md text-center leading-normal">
              <strong>Note:</strong> Lite Mode estimates your honors based on term averages. This calculation may not be fully accurate, as the actual honors eligibility is computed using the direct average of all individual subject final grades. Switch to <strong>Strict Grades Mode</strong> for a precise calculation.
            </p>
          )}
        </div>

        {liteMode && liteThresholdWarning && (
          <div className="flex justify-center mb-8">
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-500 rounded-lg p-4 max-w-xl text-sm leading-relaxed text-center">
              <strong>Threshold Nearing (±0.50):</strong> Your General Average is very close to an honors cutoff. Lite Mode averages term grades instead of individual subjects, so this result may be inaccurate. <strong>Check Strict Grades Mode</strong> and import your JSON grade report for a precise result.
            </div>
          </div>
        )}

        <hr className="mb-10 border-border/100" />

        {strictGradesMode && (
          <div className="flex justify-center mb-8">
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-500 rounded-lg p-4 max-w-xl text-sm leading-relaxed text-center">
              <strong>Strict Grades Mode is Active:</strong> Please do not include PE subjects in the Grade 11 or Grade 12 term tables below. Use the dedicated Physical Education section to input your PE grades as PE is considered one subject only.
            </div>
          </div>
        )}

        {strictGradesMode && (
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-semibold mb-6 text-center text-foreground">Physical Education (PE) Grades</h2>

            <div className="flex justify-center">
              <Card className="shadow-md w-full max-w-xl">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-6 text-center">
                    Enter your final grade for each PE course to compute your PE Final Grade.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* PE1 */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="pe-1" className="text-xs font-semibold text-muted-foreground uppercase">PE 1</label>
                      <Input
                        id="pe-1"
                        placeholder="85.00"
                        value={peGrades.pe1}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (/^\d*\.?\d*$/.test(val) && parseFloat(val) <= 100)) {
                            setPeGrades(prev => ({ ...prev, pe1: val }));
                          }
                        }}
                        type="text"
                        autoComplete="off"
                        className={cn(
                          parseFloat(peGrades.pe1) < 85 && parseFloat(peGrades.pe1) >= 0 && "border-red-500 text-red-500 bg-red-50 focus-visible:ring-red-500 dark:bg-red-950/20"
                        )}
                      />
                    </div>

                    {/* PE2 */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="pe-2" className="text-xs font-semibold text-muted-foreground uppercase">PE 2</label>
                      <Input
                        id="pe-2"
                        placeholder="85.00"
                        value={peGrades.pe2}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (/^\d*\.?\d*$/.test(val) && parseFloat(val) <= 100)) {
                            setPeGrades(prev => ({ ...prev, pe2: val }));
                          }
                        }}
                        type="text"
                        autoComplete="off"
                        className={cn(
                          parseFloat(peGrades.pe2) < 85 && parseFloat(peGrades.pe2) >= 0 && "border-red-500 text-red-500 bg-red-50 focus-visible:ring-red-500 dark:bg-red-950/20"
                        )}
                      />
                    </div>

                    {/* PE3 */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="pe-3" className="text-xs font-semibold text-muted-foreground uppercase">PE 3</label>
                      <Input
                        id="pe-3"
                        placeholder="85.00"
                        value={peGrades.pe3}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (/^\d*\.?\d*$/.test(val) && parseFloat(val) <= 100)) {
                            setPeGrades(prev => ({ ...prev, pe3: val }));
                          }
                        }}
                        type="text"
                        autoComplete="off"
                        className={cn(
                          parseFloat(peGrades.pe3) < 85 && parseFloat(peGrades.pe3) >= 0 && "border-red-500 text-red-500 bg-red-50 focus-visible:ring-red-500 dark:bg-red-950/20"
                        )}
                      />
                    </div>

                    {/* PE4 */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="pe-4" className="text-xs font-semibold text-muted-foreground uppercase">PE 4</label>
                      <Input
                        id="pe-4"
                        placeholder="85.00"
                        value={peGrades.pe4}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (/^\d*\.?\d*$/.test(val) && parseFloat(val) <= 100)) {
                            setPeGrades(prev => ({ ...prev, pe4: val }));
                          }
                        }}
                        type="text"
                        autoComplete="off"
                        className={cn(
                          parseFloat(peGrades.pe4) < 85 && parseFloat(peGrades.pe4) >= 0 && "border-red-500 text-red-500 bg-red-50 focus-visible:ring-red-500 dark:bg-red-950/20"
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t text-center text-sm font-semibold">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Midterm PE</p>
                      <p className="text-lg font-bold text-foreground">
                        {peStats.hasMidterm ? `${peStats.midtermPE.toFixed(2)}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Endterm PE</p>
                      <p className="text-lg font-bold text-foreground">
                        {peStats.hasEndterm ? `${peStats.endtermPE.toFixed(2)}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary mb-1">PE Final Grade</p>
                      <p className="text-lg font-bold text-primary">
                        {peStats.hasPE ? `${peStats.finalPE.toFixed(2)}%` : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <hr className="mt-12 border-border/100" />
          </motion.section>
        )}

        {/* Grades per Year Sections */}
        <div className="space-y-16">
          {["Grade 11", "Grade 12"].map((yearKey) => {
            const stats = currentStats[yearKey];
            const hasData = liteMode
              ? !!(liteData[yearKey].term1 || liteData[yearKey].term2 || liteData[yearKey].term3)
              : !!(stats && 'totalSubjects' in stats && (stats as any).totalSubjects > 0);

            return (
              <motion.section
                key={yearKey}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <h2 className="text-2xl font-semibold mb-6 text-center text-foreground">{yearKey}</h2>

                <AnimatePresence mode="wait">
                  {liteMode ? (
                    /* Lite Mode: 3 Term Averages inputs */
                    <motion.div
                      key="lite-view"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex justify-center"
                    >
                      <div className="rounded-lg border bg-card p-6 shadow-sm w-full max-w-xl">
                        <p className="text-sm font-medium text-foreground mb-4">
                          General Average per Term (%)
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          {[1, 2, 3].map(num => {
                            const termKey = `term${num}` as "term1" | "term2" | "term3";
                            return (
                              <SHSLiteTermRow
                                key={num}
                                termNum={num}
                                yearKey={yearKey}
                                gradeValue={liteData[yearKey]?.[termKey] || ""}
                                onGradeChange={v => handleLiteChange(yearKey, termKey, v)}
                                onKeyDown={handleLiteKeyDown}
                              />
                            );
                          })}
                        </div>

                        {/* Grade lower than 85 checkbox */}
                        <div className="flex items-center gap-2.5 mt-6 bg-muted/20 p-3 rounded-lg border border-border/50">
                          <input
                            id={`shs-lower-85-${yearKey}`}
                            type="checkbox"
                            checked={liteData[yearKey].hasLowerThan85}
                            onChange={e => setLiteData(prev => ({
                              ...prev,
                              [yearKey]: { ...prev[yearKey], hasLowerThan85: e.target.checked }
                            }))}
                            className="w-4 h-4 rounded border-input text-foreground focus:ring-ring cursor-pointer"
                          />
                          <label
                            htmlFor={`shs-lower-85-${yearKey}`}
                            className="text-xs text-muted-foreground cursor-pointer select-none leading-none"
                          >
                            Are any final subject grades lower than 85.00 in {yearKey}?
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* Full Mode: 3 Term Tables */
                    <motion.div
                      key="full-view"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid md:grid-cols-3 gap-4 justify-center"
                    >
                      <SHSTermTable
                        term={`${yearKey} Term 1`}
                        initialRows={fullData[`${yearKey} Term 1`]}
                        onChange={handleTermChange}
                        onEdge={handleEdge}
                      />
                      <SHSTermTable
                        term={`${yearKey} Term 2`}
                        initialRows={fullData[`${yearKey} Term 2`]}
                        onChange={handleTermChange}
                        onEdge={handleEdge}
                      />
                      <SHSTermTable
                        term={`${yearKey} Term 3`}
                        initialRows={fullData[`${yearKey} Term 3`]}
                        onChange={handleTermChange}
                        onEdge={handleEdge}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Yearly Stats Summary */}
                {hasData && stats && (
                  <div className="flex flex-col items-center mt-8">
                    <div className="flex flex-wrap justify-center gap-4">
                      <div className="rounded-lg border bg-card px-6 py-4 shadow-sm text-center min-w-[150px]">
                        <p className="text-sm text-muted-foreground mb-1">Yearly Average</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats.average.toFixed(2)}%
                        </p>
                      </div>
                      {yearKey === "Grade 11" && (
                        <div className="rounded-lg border bg-card px-6 py-4 shadow-sm text-center min-w-[200px]">
                          <p className="text-sm text-muted-foreground mb-1">With Academic Excellence</p>
                          <p className={cn(
                            "text-2xl font-bold",
                            stats.award !== "None" ? "text-primary" : "text-muted-foreground/70"
                          )}>
                            {stats.award !== "None" ? "Yes" : "No"}
                          </p>
                          {stats.award === "None" && (
                            <p className="text-xs text-red-500/80 mt-1 max-w-[180px] mx-auto leading-tight">
                              {stats.eligible}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {strictGradesMode && (
                      <p className="text-xs text-muted-foreground/75 mt-3 text-center">
                        * Note: In Strict Grades Mode, the graduation honors are computed using the direct average of all individual subject final grades. Year-level/term averages are for reference only.
                      </p>
                    )}
                  </div>
                )}

                {yearKey !== "Grade 12" && <hr className="my-12 border-border/100" />}
              </motion.section>
            );
          })}
        </div>


      </main>
      <Footer />
    </div>
  );
}
