import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { table } from '../../styles/common.js';

/**
 * Table on tablets/desktops, stacked cards on phones.
 * columns: [{ key, label, render(row), primary?: boolean, align? }]
 */
export default function ResponsiveTable({ columns, rows, getKey = (row) => row.id, emptyText = 'No records found.' }) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('md'));

  if (isPhone) {
    if (!rows.length) return <Typography variant="body2" sx={table.emptyCell}>{emptyText}</Typography>;
    const primary = columns.find((c) => c.primary) || columns[0];
    const rest = columns.filter((c) => c !== primary);
    return (
      <Box sx={table.mobileList}>
        {rows.map((row) => (
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
    );
  }

  return (
    <TableContainer sx={table.wrap}>
      <Table sx={table.table}>
        <TableHead>
          <TableRow>
            {columns.map((col) => <TableCell key={col.key} align={col.align}>{col.label}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length ? rows.map((row) => (
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
  );
}
