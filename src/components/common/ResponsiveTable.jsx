import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { table } from '../../styles/common.js';

const compare = (a, b) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
};

/**
 * Table on tablets/desktops, stacked cards on phones.
 * columns: [{ key, label, render(row), primary?: boolean, align?, sortValue?(row) }]
 * Optional: pageSize (enables pagination), defaultSort ({ key, dir }).
 * Without those props it behaves exactly as before.
 */
export default function ResponsiveTable({ columns, rows, getKey = (row) => row.id, emptyText = 'No records found.', pageSize, defaultSort }) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('md'));
  const [sort, setSort] = useState(defaultSort || null);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(pageSize || 0);

  useEffect(() => { setPage(0); }, [rows.length, sort]);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => dir * compare(col.sortValue(a), col.sortValue(b)));
  }, [rows, sort, columns]);

  const visible = perPage ? sorted.slice(page * perPage, page * perPage + perPage) : sorted;
  const toggleSort = (key) => setSort((cur) => (cur?.key === key ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const pager = pageSize && rows.length > pageSize ? (
    <TablePagination
      component="div" count={rows.length} page={Math.min(page, Math.max(0, Math.ceil(rows.length / perPage) - 1))} rowsPerPage={perPage}
      onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
      rowsPerPageOptions={[...new Set([pageSize, 10, 25, 50])].sort((a, b) => a - b)}
    />
  ) : null;

  if (isPhone) {
    if (!rows.length) return <Typography variant="body2" sx={table.emptyCell}>{emptyText}</Typography>;
    const primary = columns.find((c) => c.primary) || columns[0];
    const rest = columns.filter((c) => c !== primary);
    return (
      <Box>
        <Box sx={table.mobileList}>
          {visible.map((row) => (
            <Box key={getKey(row)} sx={table.mobileCard}>
              <Box>{primary.render ? primary.render(row) : row[primary.key]}</Box>
              {rest.map((col) => (
                <Box key={col.key} sx={table.mobileRow}>
                  <Typography variant="caption" sx={table.mobileLabel}>{col.label}</Typography>
                  <Box textAlign="right" minWidth={0}>{col.render ? col.render(row) : row[col.key]}</Box>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
        {pager}
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer sx={table.wrap}>
        <Table sx={table.table}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align} sortDirection={sort?.key === col.key ? sort.dir : false}>
                  {col.sortValue ? (
                    <TableSortLabel active={sort?.key === col.key} direction={sort?.key === col.key ? sort.dir : 'asc'} onClick={() => toggleSort(col.key)}>
                      {col.label}
                    </TableSortLabel>
                  ) : col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length ? visible.map((row) => (
              <TableRow key={getKey(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align}>{col.render ? col.render(row) : row[col.key]}</TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={columns.length} sx={table.emptyCell}>{emptyText}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pager}
    </Box>
  );
}
