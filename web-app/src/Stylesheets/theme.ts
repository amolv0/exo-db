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
  },
  typography: {
    fontFamily: 'Proxima Nova, sans-serif',
  },
});

export default theme;