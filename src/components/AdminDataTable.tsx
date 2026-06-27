'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

type AdminDataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
};

export default function AdminDataTable<T extends { id: string | number }>({
  data,
  columns,
  emptyMessage = 'No hay registros para mostrar.'
}: AdminDataTableProps<T>) {
  return (
    <div className="overflow-x-auto w-full bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col, index) => (
                <TableHead key={String(col.key)} className="font-semibold text-slate-700 dark:text-slate-300">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((col) => (
                    <TableCell key={`${item.id}-${String(col.key)}`}>
                      {col.render
                        ? col.render(item[col.key], item)
                        : String(item[col.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
