// theme.ts
import { createTheme } from '@mui/material/styles';


const theme = createTheme({
  components: {
    MuiSelect: {
      styleOverrides: {
        icon: {

        },
        root: {

        },
        }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            border: 'none'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: 'none'
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 'bold',
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          '& .MuiTableSortLabel-root': {
            color: 'inherit',
            '&.Mui-active': {
              color: 'var(--highlight-color)',
              '& .MuiTableSortLabel-icon': {
                color: 'var(--highlight-color)',
              },
            },
            '&:hover': {
              color: 'var(--highlight-color)',
              '& .MuiTableSortLabel-icon': {
                color: 'var(--highlight-color)',
              },
            },
          },
        },
        body: {
          minWidth: '80px',
        }
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: 'rgba(0, 0, 0, 0.065)', // Background color for even rows
          },
          '&:nth-of-type(odd)': {
            backgroundColor: 'var(--secondary-color)', // Background color for even rows
          },
          '&:hover': {
            backgroundColor: 'var(--highlight-color)', // Hover color for all rows
          },
        },
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: 12,
    fontWeightRegular: "5px",
  },
});

export default theme;